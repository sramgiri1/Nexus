import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/domain-ownership-report.md");

const REQUIRED_DOCS = [
  "docs/architecture/DOMAIN_OWNERSHIP_POLICY.md",
  "docs/architecture/AGENT_AUTHORITY_MATRIX.md",
  "docs/architecture/HANDOFF_OWNERSHIP_MODEL.md",
  "docs/architecture/ESCALATION_AND_CONFLICT_RESOLUTION.md",
];

const REQUIRED_POLICIES = [
  "policy/domain-ownership-policy.json",
  "policy/authority-matrix.json",
  "policy/handoff-policy.json",
  "policy/escalation-policy.json",
];

const REQUIRED_AGENTS = [
  "nexus",
  "shepherd",
  "auditor",
  "sentinel",
  "warden",
  "atlas",
  "prism",
  "core",
  "swift",
  "pixel",
  "canvas",
  "forge",
  "stream",
  "synapse",
  "radar",
  "meridian",
  "relay",
  "beacon",
  "compass",
  "oracle",
];

const SOURCE_MODIFY_ALLOWED = new Set([
  "core",
  "swift",
  "pixel",
  "canvas",
  "forge",
  "stream",
  "synapse",
]);

const SENSITIVE_ACCESS_ALLOWED = new Set([
  "sentinel",
  "warden",
  "forge",
  "stream",
  "synapse",
  "relay",
  "oracle",
]);

const NEW_PHASE_FILES = [
  ...REQUIRED_DOCS,
  ...REQUIRED_POLICIES,
  "scripts/check-domain-ownership.js",
  "README.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/CAPABILITY_MODEL.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/SECURITY_BOUNDARY.md",
  "docs/architecture/COMMAND_CENTER_UI.md",
];

const BANNED_PROJECT_PATTERNS = [
  new RegExp(["Care", "Loop"].join("")),
  new RegExp(["care", "loop"].join("")),
  new RegExp(["care", "\\s", "loop"].join("")),
];

const SECRET_LEAK_PATTERNS = [
  new RegExp(`${["sk", "-"].join("")}[A-Za-z0-9]{10,}`),
  new RegExp(`${["sk", "-", "ant", "-"].join("")}[A-Za-z0-9_-]{6,}`),
  new RegExp(`${["OPENAI_API_KEY", "="].join("")}`),
  new RegExp(`${["ANTHROPIC_API_KEY", "="].join("")}`),
  new RegExp(`${["DATABASE_URL", "="].join("")}`),
  new RegExp(`-----${["BEGIN", " "].join("")}[A-Z ]+${["PRIVATE", " ", "KEY"].join("")}-----`),
];

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function getGitMetadata() {
  const metadata = {
    generatedAt: new Date().toISOString(),
    branch: "unknown",
    head: "unknown",
  };

  try {
    metadata.branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
    metadata.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
  } catch {
    // ignore git metadata failure
  }

  return metadata;
}

function ensureArrayIncludesAll(values, requiredValues) {
  return requiredValues.every((value) => values.includes(value));
}

function status(pass) {
  return pass ? "PASS" : "FAIL";
}

function checkLongLines(relativePath) {
  const text = readFile(relativePath);
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

function main() {
  const failures = [];
  const metadata = getGitMetadata();

  const docsPass = REQUIRED_DOCS.every((file) => {
    const ok = exists(file);
    if (!ok) failures.push(`Missing required doc: ${file}`);
    return ok;
  });

  const policiesPass = REQUIRED_POLICIES.every((file) => {
    const ok = exists(file);
    if (!ok) failures.push(`Missing required policy: ${file}`);
    return ok;
  });

  let domainPolicy = null;
  let authorityMatrix = null;
  let handoffPolicy = null;
  let escalationPolicy = null;

  try {
    domainPolicy = readJson("policy/domain-ownership-policy.json");
    authorityMatrix = readJson("policy/authority-matrix.json");
    handoffPolicy = readJson("policy/handoff-policy.json");
    escalationPolicy = readJson("policy/escalation-policy.json");
  } catch (error) {
    failures.push(`Policy JSON parse failure: ${error.message}`);
  }

  const agents = authorityMatrix?.agents || [];
  const agentIds = agents.map((entry) => entry.agentId);
  const agentCountPass =
    agents.length === REQUIRED_AGENTS.length &&
    ensureArrayIncludesAll(agentIds, REQUIRED_AGENTS);
  if (!agentCountPass) {
    failures.push("Authority matrix does not include all 20 required agents.");
  }

  const onlyNexusMayRelease = agents.every((entry) =>
    entry.agentId === "nexus" ? entry.mayRelease === true : entry.mayRelease === false
  );
  const shepherdMayPlan = agents.find((entry) => entry.agentId === "shepherd")?.mayPlan === true;
  const verifiersMayVerify = ["auditor", "sentinel", "warden"].every(
    (agentId) => agents.find((entry) => entry.agentId === agentId)?.mayVerify === true
  );
  const verifyAgentsNoSource = ["auditor", "sentinel", "warden"].every(
    (agentId) => agents.find((entry) => entry.agentId === agentId)?.mayModifySource === false
  );
  const sourceModifyPass = agents.every((entry) =>
    entry.mayModifySource ? SOURCE_MODIFY_ALLOWED.has(entry.agentId) : true
  );
  const strategyGrowthObservabilityNoSource = [
    "radar",
    "meridian",
    "relay",
    "beacon",
    "compass",
    "oracle",
  ].every((agentId) => agents.find((entry) => entry.agentId === agentId)?.mayModifySource === false);
  const noAgentApproves = agents.every((entry) => entry.mayApprove === false);
  const sensitiveAccessPass = agents.every((entry) =>
    entry.mayAccessSensitiveData ? SENSITIVE_ACCESS_ALLOWED.has(entry.agentId) : true
  );
  const authorityMatrixPass =
    onlyNexusMayRelease &&
    shepherdMayPlan &&
    verifiersMayVerify &&
    verifyAgentsNoSource &&
    sourceModifyPass &&
    strategyGrowthObservabilityNoSource &&
    noAgentApproves &&
    sensitiveAccessPass;
  if (!authorityMatrixPass) {
    failures.push("Authority matrix rules are not satisfied.");
  }

  const domainOwnersPass =
    domainPolicy?.releaseOwner === "nexus" &&
    domainPolicy?.planningOwner === "shepherd" &&
    ensureArrayIncludesAll(domainPolicy?.verificationOwners || [], [
      "auditor",
      "sentinel",
      "warden",
    ]) &&
    domainPolicy?.ownershipRequired === true &&
    domainPolicy?.evidenceRequiredForCompletion === true &&
    domainPolicy?.contractsRequiredForHandoff === true;
  if (!domainOwnersPass) {
    failures.push("Domain ownership policy core ownership fields are invalid.");
  }

  const handoffPolicyPass =
    handoffPolicy?.contractsRequired === true &&
    ensureArrayIncludesAll(handoffPolicy?.requiredFields || [], [
      "sourceAgent",
      "targetAgent",
      "projectId",
      "objective",
      "acceptanceCriteria",
      "riskLevel",
      "escalationOwner",
    ]) &&
    ensureArrayIncludesAll(handoffPolicy?.forbiddenHandoffPatterns || [], [
      "someone fix this",
      "mark complete",
      "pass gate without evidence",
      "deploy without approval",
    ]);
  if (!handoffPolicyPass) {
    failures.push("Handoff policy fields or forbidden patterns are invalid.");
  }

  const escalationPolicyPass =
    escalationPolicy?.releaseBlockedOnUnresolvedEscalation === true &&
    escalationPolicy?.securityWinsByDefault === true &&
    escalationPolicy?.auditRequired === true &&
    ensureArrayIncludesAll(escalationPolicy?.escalationTypes || [], [
      "missing_contract",
      "ambiguous_owner",
      "missing_evidence",
      "failed_gate",
      "policy_block",
      "approval_required",
      "data_classification_missing",
      "capability_missing",
      "release_blocker",
    ]);
  if (!escalationPolicyPass) {
    failures.push("Escalation policy does not satisfy required safety rules.");
  }

  const ownershipDoc = exists(REQUIRED_DOCS[0]) ? readFile(REQUIRED_DOCS[0]).toLowerCase() : "";
  const matrixDoc = exists(REQUIRED_DOCS[1]) ? readFile(REQUIRED_DOCS[1]).toLowerCase() : "";
  const handoffDoc = exists(REQUIRED_DOCS[2]) ? readFile(REQUIRED_DOCS[2]).toLowerCase() : "";
  const escalationDoc = exists(REQUIRED_DOCS[3]) ? readFile(REQUIRED_DOCS[3]).toLowerCase() : "";

  const docsContentPass =
    ownershipDoc.includes("teams own domains") &&
    ownershipDoc.includes("agents own tasks") &&
    ownershipDoc.includes("skills own procedures") &&
    ownershipDoc.includes("hooks own enforcement") &&
    ownershipDoc.includes("contracts own handoffs") &&
    ownershipDoc.includes("state machines own truth") &&
    ownershipDoc.includes("capabilities own authority") &&
    ownershipDoc.includes("evidence owns proof") &&
    ownershipDoc.includes("nexus owns final decision authority") &&
    REQUIRED_AGENTS.every((agentId) => matrixDoc.includes(agentId)) &&
    handoffDoc.includes("handoffs are contracts") &&
    escalationDoc.includes("security, data protection, and governor boundaries win by default") &&
    escalationDoc.includes("release remains blocked");
  if (!docsContentPass) {
    failures.push("Domain ownership docs are missing required content.");
  }

  const integrationConsistencyPass = [
    "capabilities/registry.json",
    "policy/security-boundary-policy.json",
    "policy/reliability-policy.json",
    "policy/observability-policy.json",
    "docs/architecture/DEMO_SHOWCASE_MODE.md",
    "scripts/check-public-safety.js",
  ].every(exists);
  if (!integrationConsistencyPass) {
    failures.push("Integration consistency checks failed.");
  }

  const publicSafetyPass = NEW_PHASE_FILES.every((file) => {
    if (!exists(file)) return false;
    if (file === "docs/PRIVATE_PROJECT_BOUNDARY.md") return true;
    const text = readFile(file);
    return (
      BANNED_PROJECT_PATTERNS.every((pattern) => !pattern.test(text)) &&
      SECRET_LEAK_PATTERNS.every((pattern) => !pattern.test(text))
    );
  });
  if (!publicSafetyPass) {
    failures.push("Public safety or secret leakage check failed for Phase 14 files.");
  }

  const formattingFailures = NEW_PHASE_FILES.flatMap((file) => (exists(file) ? checkLongLines(file) : []));
  const reportTemplate = [
    "# NEXUS Domain Ownership Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
  ];
  const formattingPass = formattingFailures.length === 0;
  if (!formattingPass) {
    failures.push("Formatting/readability failure: one or more Phase 14 files exceed 1000 characters on a line.");
  }

  const pass = failures.length === 0;
  const lines = [
    ...reportTemplate,
    `Required docs: ${status(docsPass)}`,
    `Required policies: ${status(policiesPass)}`,
    `Authority matrix: ${status(agentCountPass && authorityMatrixPass)}`,
    `Domain owners: ${status(domainOwnersPass)}`,
    `Handoff policy: ${status(handoffPolicyPass)}`,
    `Escalation policy: ${status(escalationPolicyPass)}`,
    `Docs content: ${status(docsContentPass)}`,
    `Integration consistency: ${status(integrationConsistencyPass)}`,
    `Public safety: ${status(publicSafetyPass)}`,
    `Formatting/readability: ${status(formattingPass)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((failure) => `- ${failure}`) : ["- None"]),
    "",
    "## Long line failures",
    "",
    ...(formattingFailures.length ? formattingFailures.map((item) => `- ${item}`) : ["- None"]),
    "",
    `Result: ${status(pass)}`,
  ];

  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`);

  process.stdout.write("NEXUS Domain Ownership Check\n============================\n\n");
  process.stdout.write(`Required docs: ${status(docsPass)}\n`);
  process.stdout.write(`Required policies: ${status(policiesPass)}\n`);
  process.stdout.write(`Authority matrix: ${status(agentCountPass && authorityMatrixPass)}\n`);
  process.stdout.write(`Domain owners: ${status(domainOwnersPass)}\n`);
  process.stdout.write(`Handoff policy: ${status(handoffPolicyPass)}\n`);
  process.stdout.write(`Escalation policy: ${status(escalationPolicyPass)}\n`);
  process.stdout.write(`Docs content: ${status(docsContentPass)}\n`);
  process.stdout.write(`Integration consistency: ${status(integrationConsistencyPass)}\n`);
  process.stdout.write(`Public safety: ${status(publicSafetyPass)}\n`);
  process.stdout.write(`Formatting/readability: ${status(formattingPass)}\n\n`);
  process.stdout.write(`Result: ${status(pass)}\n`);
  process.exit(pass ? 0 : 1);
}

main();
