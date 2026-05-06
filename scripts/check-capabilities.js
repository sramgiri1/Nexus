import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, "reports", "capability-report.md");

const requiredDocs = [
  "docs/architecture/CAPABILITY_MODEL.md",
  "docs/architecture/CAPABILITY_REGISTRY.md",
  "docs/architecture/TOOL_AND_SKILL_GOVERNANCE.md",
];

const requiredFiles = [
  "capabilities/registry.json",
  "capabilities/schema.json",
  "policy/capability-policy.json",
];

const requiredFields = [
  "capabilityId",
  "name",
  "description",
  "ownerAgent",
  "allowedAgents",
  "agentGroups",
  "contractTypes",
  "taskTypes",
  "tools",
  "skills",
  "runtimes",
  "providers",
  "dataClassesAllowed",
  "approvalRequired",
  "approvalTypes",
  "evidenceRequired",
  "policies",
  "riskLevel",
  "blockingAllowed",
  "batchEligible",
  "mcpAllowed",
  "status",
];

const allowedAgents = new Set([
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
  "future_db_agent",
]);

const validRuntimes = new Set([
  "node-local",
  "linux-container",
  "macos-xcode",
  "provider-api",
  "batch-provider",
  "mcp-server",
  "human-approval",
]);

const validProviders = new Set([
  "direct_openai",
  "direct_anthropic",
  "openrouter",
  "local_ollama",
  "batch_openai",
  "batch_anthropic",
  "none",
]);

const validRiskLevels = new Set(["low", "medium", "high", "critical"]);
const validStatuses = new Set([
  "proposed",
  "reviewed",
  "approved",
  "enabled",
  "deprecated",
  "disabled",
]);

const checks = {
  requiredDocs: { pass: true, failures: [] },
  registryFiles: { pass: true, failures: [] },
  capabilityCount: { pass: true, failures: [] },
  requiredFields: { pass: true, failures: [] },
  references: { pass: true, failures: [] },
  batchRestrictions: { pass: true, failures: [] },
  secretRestrictions: { pass: true, failures: [] },
  approvalMcpRestrictions: { pass: true, failures: [] },
  criticalRestrictions: { pass: true, failures: [] },
  capabilityPolicy: { pass: true, failures: [] },
  docsContent: { pass: true, failures: [] },
  integrationConsistency: { pass: true, failures: [] },
  formattingReadability: { pass: true, failures: [] },
};

function safeGit(cmd) {
  try {
    return execSync(cmd, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function addFailure(bucket, message) {
  checks[bucket].pass = false;
  checks[bucket].failures.push(message);
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function requirePhrase(bucket, text, label, regex) {
  if (!regex.test(text)) {
    addFailure(bucket, `missing phrase: ${label}`);
  }
}

function checkLineLengths(bucket, relPath) {
  const lines = readText(relPath).split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.length > 1000) {
      addFailure(
        bucket,
        `${relPath}:${index + 1} exceeds 1000 characters (${line.length})`
      );
    }
  });
}

for (const relPath of requiredDocs) {
  if (!exists(relPath)) {
    addFailure("requiredDocs", `missing doc: ${relPath}`);
  }
}

for (const relPath of requiredFiles) {
  if (!exists(relPath)) {
    addFailure("registryFiles", `missing file: ${relPath}`);
    continue;
  }

  try {
    readJson(relPath);
  } catch (error) {
    addFailure("registryFiles", `${relPath} failed JSON parse: ${error.message}`);
  }
}

let capabilityDocs = "";
let registry = null;
let schema = null;
let capabilityPolicy = null;

if (checks.requiredDocs.pass) {
  capabilityDocs = requiredDocs.map(readText).join("\n\n");
}

if (checks.registryFiles.pass) {
  registry = readJson("capabilities/registry.json");
  schema = readJson("capabilities/schema.json");
  capabilityPolicy = readJson("policy/capability-policy.json");
}

const capabilityList = Array.isArray(registry?.capabilities) ? registry.capabilities : [];

if (!Array.isArray(registry?.capabilities)) {
  addFailure("registryFiles", "capabilities/registry.json is missing capabilities array");
}

if (!schema || typeof schema !== "object") {
  addFailure("registryFiles", "capabilities/schema.json did not parse to an object");
}

if (capabilityList.length < 25) {
  addFailure("capabilityCount", `registry contains ${capabilityList.length} capabilities`);
}

for (const capability of capabilityList) {
  const id = capability.capabilityId || "<missing capabilityId>";

  for (const field of requiredFields) {
    if (!(field in capability)) {
      addFailure("requiredFields", `${id} missing required field ${field}`);
    }
  }

  if (!capability.capabilityId || !String(capability.capabilityId).trim()) {
    addFailure("requiredFields", `${id} has empty capabilityId`);
  }

  if (!capability.ownerAgent || !String(capability.ownerAgent).trim()) {
    addFailure("requiredFields", `${id} has empty ownerAgent`);
  }

  if (!Array.isArray(capability.allowedAgents) || capability.allowedAgents.length === 0) {
    addFailure("requiredFields", `${id} has empty allowedAgents`);
  }

  if (!Array.isArray(capability.runtimes) || capability.runtimes.length === 0) {
    addFailure("requiredFields", `${id} has empty runtimes`);
  }

  if (
    !Array.isArray(capability.dataClassesAllowed) ||
    capability.dataClassesAllowed.length === 0
  ) {
    addFailure("requiredFields", `${id} has empty dataClassesAllowed`);
  }

  if (
    !Array.isArray(capability.evidenceRequired) ||
    capability.evidenceRequired.length === 0
  ) {
    addFailure("requiredFields", `${id} has empty evidenceRequired`);
  }

  if (!validRiskLevels.has(capability.riskLevel)) {
    addFailure("requiredFields", `${id} has invalid riskLevel ${capability.riskLevel}`);
  }

  if (!validStatuses.has(capability.status)) {
    addFailure("requiredFields", `${id} has invalid status ${capability.status}`);
  }

  if (!allowedAgents.has(capability.ownerAgent)) {
    addFailure("references", `${id} references unknown ownerAgent ${capability.ownerAgent}`);
  }

  for (const agentId of capability.allowedAgents || []) {
    if (!allowedAgents.has(agentId)) {
      addFailure("references", `${id} references unknown allowed agent ${agentId}`);
    }
  }

  for (const runtime of capability.runtimes || []) {
    if (!validRuntimes.has(runtime)) {
      addFailure("references", `${id} has invalid runtime ${runtime}`);
    }
  }

  for (const provider of capability.providers || []) {
    if (!validProviders.has(provider)) {
      addFailure("references", `${id} has invalid provider ${provider}`);
    }
  }

  if (capability.batchEligible) {
    const combined = [
      capability.capabilityId,
      capability.name,
      capability.description,
      ...(capability.taskTypes || []),
    ]
      .join(" ")
      .toLowerCase();

    for (const blockedTerm of [
      "release",
      "verification_gate",
      "verification gate",
      "deploy",
      "secret",
      "migration",
      "security_blocker",
      "destructive",
    ]) {
      if (combined.includes(blockedTerm)) {
        addFailure(
          "batchRestrictions",
          `${id} is batchEligible but matches blocked term ${blockedTerm}`
        );
      }
    }
  }

  if ((capability.dataClassesAllowed || []).includes("secret")) {
    const secretMetadataCapability =
      capability.capabilityId.includes("secret_metadata") ||
      capability.capabilityId.includes("secret.metadata");

    if (!secretMetadataCapability) {
      addFailure(
        "secretRestrictions",
        `${id} allows secret data class without being a secret metadata capability`
      );
    }

    for (const runtime of capability.runtimes || []) {
      if (["provider-api", "batch-provider", "mcp-server"].includes(runtime)) {
        addFailure(
          "secretRestrictions",
          `${id} allows secret data class on restricted runtime ${runtime}`
        );
      }
    }
  }

  if (capability.approvalRequired && !(capability.policies || []).includes("approval-policy")) {
    addFailure(
      "approvalMcpRestrictions",
      `${id} requires approval but does not include approval-policy`
    );
  }

  if (capability.mcpAllowed && !(capability.policies || []).includes("mcp-security-policy")) {
    addFailure(
      "approvalMcpRestrictions",
      `${id} allows MCP but does not include mcp-security-policy`
    );
  }

  const allowsSensitiveProviderData =
    (capability.runtimes || []).includes("provider-api") &&
    (capability.dataClassesAllowed || []).some((item) =>
      ["confidential", "restricted"].includes(item)
    );

  if (allowsSensitiveProviderData && (capability.providers || []).includes("openrouter")) {
    addFailure(
      "secretRestrictions",
      `${id} allows confidential or restricted provider data but includes openrouter`
    );
  }

  if (capability.riskLevel === "critical") {
    const meetsCriticalRule =
      capability.approvalRequired === true ||
      (capability.runtimes || []).includes("human-approval") ||
      (capability.evidenceRequired || []).some((item) =>
        ["gate_evidence", "release_contract", "approval_result"].includes(item)
      );

    if (!meetsCriticalRule) {
      addFailure(
        "criticalRestrictions",
        `${id} is critical without approval, human-approval runtime, or critical evidence`
      );
    }
  }
}

if (capabilityPolicy) {
  const expected = [
    ["defaultCapabilityAccess", "deny"],
    ["requireCapabilityForToolUse", true],
    ["requireCapabilityForSkillUse", true],
    ["requireCapabilityForProviderUse", true],
    ["requireCapabilityForMcpUse", true],
    ["requireDataClassification", true],
    ["batchCannotPassGates", true],
    ["mcpDefaultAllowed", false],
    ["auditRequired", true],
  ];

  for (const [field, value] of expected) {
    if (capabilityPolicy[field] !== value) {
      addFailure("capabilityPolicy", `${field} is not ${JSON.stringify(value)}`);
    }
  }
}

if (capabilityDocs) {
  for (const [label, regex] of [
    ["agents", /\bagents?\b/i],
    ["contracts", /\bcontracts?\b/i],
    ["tools", /\btools?\b/i],
    ["skills", /\bskills?\b/i],
    ["runtimes", /\bruntimes?\b/i],
    ["providers", /\bproviders?\b/i],
    ["approvals", /\bapprovals?\b/i],
    ["evidence", /\bevidence\b/i],
    ["data classification", /data classification/i],
    ["policies", /\bpolicies\b/i],
    ["MCP", /\bMCP\b/i],
    ["batch", /\bbatch\b/i],
    ["OpenRouter", /OpenRouter/i],
    ["governor", /\bgovernor\b/i],
    ["state machine", /state machine/i],
  ]) {
    requirePhrase("docsContent", capabilityDocs, label, regex);
  }
}

for (const relPath of [
  "policy/security-boundary-policy.json",
  "policy/data-classification-policy.json",
  "policy/approval-policy.json",
  "docs/architecture/EXECUTION_RUNTIME_ARCHITECTURE.md",
  "policy/reliability-policy.json",
  "orchestrator/agentContext.js",
  "docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md",
]) {
  if (!exists(relPath)) {
    addFailure("integrationConsistency", `missing dependency: ${relPath}`);
  }
}

if (exists("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md")) {
  const prototypeDoc = readText("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md");
  if (!/static/i.test(prototypeDoc)) {
    addFailure("integrationConsistency", "Command Center prototype doc does not mention static prototype");
  }
}

if (exists("docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md")) {
  const dbDoc = readText("docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md");
  if (!/JSON remains source of truth/i.test(dbDoc) || !/DB mirror mode/i.test(dbDoc)) {
    addFailure(
      "integrationConsistency",
      "NEXUS_DATABASE_ARCHITECTURE.md does not clearly retain JSON primary and DB mirror path"
    );
  }
}

for (const relPath of [
  ...requiredDocs,
  ...requiredFiles,
  "reports/capability-report.md",
  "README.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/SECURITY_BOUNDARY.md",
  "docs/architecture/EXECUTION_RUNTIME_ARCHITECTURE.md",
  "scripts/check-capabilities.js",
]) {
  if (exists(relPath)) {
    checkLineLengths("formattingReadability", relPath);
  }
}

const branch = safeGit("git branch --show-current");
const commit = safeGit("git rev-parse --short HEAD");
const timestamp = new Date().toISOString();
const passed = Object.values(checks).every((item) => item.pass);

const report = `# Capability Registry Report

## Metadata

- Generated at: ${timestamp}
- Validation branch: ${branch}
- Validation HEAD: ${commit}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Summary

- Capabilities checked: ${capabilityList.length}
- Schema file: capabilities/schema.json
- Registry file: capabilities/registry.json

## Check Results

- Required docs: ${statusLabel(checks.requiredDocs.pass)}
- Registry files: ${statusLabel(checks.registryFiles.pass)}
- Capability count: ${statusLabel(checks.capabilityCount.pass)}
- Required fields: ${statusLabel(checks.requiredFields.pass)}
- Agent/runtime/provider references: ${statusLabel(checks.references.pass)}
- Batch restrictions: ${statusLabel(checks.batchRestrictions.pass)}
- Secret/data restrictions: ${statusLabel(checks.secretRestrictions.pass)}
- Approval/MCP restrictions: ${statusLabel(checks.approvalMcpRestrictions.pass)}
- Critical capability restrictions: ${statusLabel(checks.criticalRestrictions.pass)}
- Capability policy: ${statusLabel(checks.capabilityPolicy.pass)}
- Docs content: ${statusLabel(checks.docsContent.pass)}
- Integration consistency: ${statusLabel(checks.integrationConsistency.pass)}
- Formatting/readability: ${statusLabel(checks.formattingReadability.pass)}

## Failures

${Object.entries(checks)
  .flatMap(([label, bucket]) =>
    bucket.failures.map((failure) => `- ${label}: ${failure}`)
  )
  .join("\n") || "- none"}

## Result

- ${passed ? "PASS" : "FAIL"}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log("NEXUS Capability Registry Check");
console.log("===============================");
console.log("");
console.log(`Required docs: ${statusLabel(checks.requiredDocs.pass)}`);
console.log(`Registry files: ${statusLabel(checks.registryFiles.pass)}`);
console.log(`Capability count: ${statusLabel(checks.capabilityCount.pass)}`);
console.log(`Required fields: ${statusLabel(checks.requiredFields.pass)}`);
console.log(
  `Agent/runtime/provider references: ${statusLabel(checks.references.pass)}`
);
console.log(`Batch restrictions: ${statusLabel(checks.batchRestrictions.pass)}`);
console.log(
  `Secret/data restrictions: ${statusLabel(checks.secretRestrictions.pass)}`
);
console.log(
  `Approval/MCP restrictions: ${statusLabel(checks.approvalMcpRestrictions.pass)}`
);
console.log(
  `Critical capability restrictions: ${statusLabel(checks.criticalRestrictions.pass)}`
);
console.log(`Capability policy: ${statusLabel(checks.capabilityPolicy.pass)}`);
console.log(`Docs content: ${statusLabel(checks.docsContent.pass)}`);
console.log(
  `Integration consistency: ${statusLabel(checks.integrationConsistency.pass)}`
);
console.log(
  `Formatting/readability: ${statusLabel(checks.formattingReadability.pass)}`
);
console.log("");

const allFailures = Object.entries(checks).flatMap(([label, bucket]) =>
  bucket.failures.map((failure) => `${label}: ${failure}`)
);

if (allFailures.length) {
  console.log("Failures:");
  for (const failure of allFailures) {
    console.log(`- ${failure}`);
  }
  console.log("");
}

console.log(`Result: ${passed ? "PASS" : "FAIL"}`);

process.exit(passed ? 0 : 1);
