import fs from "fs";
import path from "path";
import { execSync, spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, "reports", "security-boundary-report.md");

const requiredDocs = [
  "docs/architecture/SECURITY_BOUNDARY.md",
  "docs/architecture/RUNTIME_SANDBOX_MODEL.md",
  "docs/architecture/NETWORK_SECURITY_MODEL.md",
  "docs/architecture/SECRET_BOUNDARY.md",
  "docs/architecture/MCP_SECURITY_MODEL.md",
  "docs/architecture/HUMAN_APPROVAL_WORKFLOW.md",
  "docs/architecture/PROVIDER_SECURITY_MODEL.md",
];

const requiredPolicies = [
  "policy/security-boundary-policy.json",
  "policy/network-policy.json",
  "policy/secret-boundary-policy.json",
  "policy/mcp-security-policy.json",
  "policy/approval-policy.json",
];

const formattingFiles = [
  ...requiredDocs,
  ...requiredPolicies,
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_API_ARCHITECTURE.md",
  "docs/architecture/EXECUTION_RUNTIME_ARCHITECTURE.md",
  "docs/architecture/DATA_PROTECTION_AND_PII.md",
  "README.md",
  "scripts/check-security-boundary.js",
];

const checks = {
  requiredDocs: { pass: true, failures: [] },
  requiredPolicies: { pass: true, failures: [] },
  securityBoundary: { pass: true, failures: [] },
  runtimeSandbox: { pass: true, failures: [] },
  networkPolicy: { pass: true, failures: [] },
  secretBoundary: { pass: true, failures: [] },
  mcpSecurity: { pass: true, failures: [] },
  approvalWorkflow: { pass: true, failures: [] },
  providerSecurity: { pass: true, failures: [] },
  integrationConsistency: { pass: true, failures: [] },
  formattingReadability: { pass: true, failures: [], warnings: [] },
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

function ensurePhrases(target, text, phrases, label) {
  for (const phrase of phrases) {
    if (!phrase.regex.test(text)) {
      target.pass = false;
      target.failures.push(`${label} missing phrase: ${phrase.label}`);
    }
  }
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function regexLine(relPath, line) {
  return relPath.endsWith(".json") && /"regex"\s*:\s*"/.test(line);
}

for (const relPath of requiredDocs) {
  if (!exists(relPath)) {
    checks.requiredDocs.pass = false;
    checks.requiredDocs.failures.push(`missing doc: ${relPath}`);
  }
}

for (const relPath of requiredPolicies) {
  if (!exists(relPath)) {
    checks.requiredPolicies.pass = false;
    checks.requiredPolicies.failures.push(`missing policy: ${relPath}`);
    continue;
  }

  try {
    readJson(relPath);
  } catch (error) {
    checks.requiredPolicies.pass = false;
    checks.requiredPolicies.failures.push(`${relPath} failed JSON parse: ${error.message}`);
  }
}

let securityDoc = "";
let sandboxDoc = "";
let providerDoc = "";
let networkPolicy = null;
let secretPolicy = null;
let mcpPolicy = null;
let approvalPolicy = null;

if (checks.requiredDocs.pass) {
  securityDoc = readText("docs/architecture/SECURITY_BOUNDARY.md");
  sandboxDoc = readText("docs/architecture/RUNTIME_SANDBOX_MODEL.md");
  providerDoc = readText("docs/architecture/PROVIDER_SECURITY_MODEL.md");
}

if (checks.requiredPolicies.pass) {
  networkPolicy = readJson("policy/network-policy.json");
  secretPolicy = readJson("policy/secret-boundary-policy.json");
  mcpPolicy = readJson("policy/mcp-security-policy.json");
  approvalPolicy = readJson("policy/approval-policy.json");
}

if (securityDoc) {
  ensurePhrases(
    checks.securityBoundary,
    securityDoc,
    [
      { label: "governor", regex: /\bgovernor\b/i },
      { label: "contracts", regex: /\bcontracts?\b/i },
      { label: "state machine", regex: /state machine/i },
      { label: "audit", regex: /\baudit\b/i },
      { label: "secrets", regex: /\bsecrets?\b/i },
      { label: "network", regex: /\bnetwork\b/i },
      { label: "MCP", regex: /\bMCP\b/i },
      { label: "provider", regex: /\bprovider\b/i },
      { label: "approval", regex: /\bapproval\b/i },
      { label: "data classification", regex: /data classification/i },
      { label: "batch", regex: /\bbatch\b/i },
      { label: "OpenRouter", regex: /OpenRouter/i },
    ],
    "SECURITY_BOUNDARY.md"
  );
}

if (sandboxDoc) {
  ensurePhrases(
    checks.runtimeSandbox,
    sandboxDoc,
    [
      { label: "node-local", regex: /node-local/i },
      { label: "linux-container", regex: /linux-container/i },
      { label: "macos-xcode", regex: /macos-xcode/i },
      { label: "provider-api", regex: /provider-api/i },
      { label: "batch-provider", regex: /batch-provider/i },
      { label: "mcp-server", regex: /mcp-server/i },
      { label: "human-approval", regex: /human-approval/i },
      { label: "timeout", regex: /\btimeout\b/i },
      { label: "command allowlist", regex: /command allowlist/i },
      { label: "path allowlist", regex: /path allowlist/i },
    ],
    "RUNTIME_SANDBOX_MODEL.md"
  );
}

if (networkPolicy) {
  if (networkPolicy.defaultEgress !== "deny") {
    checks.networkPolicy.pass = false;
    checks.networkPolicy.failures.push("defaultEgress is not deny");
  }

  const openRouterClasses = networkPolicy.openRouterAllowedDataClasses || [];
  const exactOpenRouter =
    Array.isArray(openRouterClasses) &&
    openRouterClasses.length === 2 &&
    openRouterClasses.includes("public") &&
    openRouterClasses.includes("internal");

  if (!exactOpenRouter) {
    checks.networkPolicy.pass = false;
    checks.networkPolicy.failures.push("OpenRouter allowed classes are not limited to public/internal");
  }

  if (!networkPolicy.blockedDestinations?.includes("unknown_domains")) {
    checks.networkPolicy.pass = false;
    checks.networkPolicy.failures.push("unknown domains are not blocked");
  }

  for (const action of ["new_mcp_server", "new_provider", "new_webhook"]) {
    if (!networkPolicy.approvalRequiredNetworkActions?.includes(action)) {
      checks.networkPolicy.pass = false;
      checks.networkPolicy.failures.push(`approvalRequiredNetworkActions missing ${action}`);
    }
  }
}

if (secretPolicy) {
  if (secretPolicy.rawSecretExposure !== "deny") {
    checks.secretBoundary.pass = false;
    checks.secretBoundary.failures.push("rawSecretExposure is not deny");
  }

  for (const operation of ["log_secret", "send_to_llm", "send_to_batch", "commit_secret"]) {
    if (!secretPolicy.blockedSecretOperations?.includes(operation)) {
      checks.secretBoundary.pass = false;
      checks.secretBoundary.failures.push(`blockedSecretOperations missing ${operation}`);
    }
  }

  for (const step of ["model_context", "batch_queue", "log_write", "evidence_persist", "ui_response"]) {
    if (!secretPolicy.scanBefore?.includes(step)) {
      checks.secretBoundary.pass = false;
      checks.secretBoundary.failures.push(`scanBefore missing ${step}`);
    }
  }
}

if (mcpPolicy) {
  if (mcpPolicy.defaultMcpAccess !== "deny") {
    checks.mcpSecurity.pass = false;
    checks.mcpSecurity.failures.push("defaultMcpAccess is not deny");
  }

  for (const state of ["proposed", "security_reviewed", "approved", "enabled", "disabled"]) {
    if (!mcpPolicy.lifecycleStates?.includes(state)) {
      checks.mcpSecurity.pass = false;
      checks.mcpSecurity.failures.push(`lifecycleStates missing ${state}`);
    }
  }

  for (const field of [
    "serverId",
    "purpose",
    "owner",
    "allowedAgents",
    "allowedTools",
    "dataClassesAllowed",
    "riskLevel",
  ]) {
    if (!mcpPolicy.requiredRegistrationFields?.includes(field)) {
      checks.mcpSecurity.pass = false;
      checks.mcpSecurity.failures.push(`requiredRegistrationFields missing ${field}`);
    }
  }

  if (mcpPolicy.auditRequired !== true) {
    checks.mcpSecurity.pass = false;
    checks.mcpSecurity.failures.push("auditRequired is not true");
  }
}

if (approvalPolicy) {
  if (approvalPolicy.selfApprovalAllowed !== false) {
    checks.approvalWorkflow.pass = false;
    checks.approvalWorkflow.failures.push("selfApprovalAllowed is not false");
  }

  if (approvalPolicy.approvalExpiryRequired !== true) {
    checks.approvalWorkflow.pass = false;
    checks.approvalWorkflow.failures.push("approvalExpiryRequired is not true");
  }

  for (const action of [
    "deploy",
    "secrets_env_change",
    "migration",
    "production_data_access",
    "new_mcp_server",
    "new_provider",
    "failed_gate_waiver",
  ]) {
    if (!approvalPolicy.approvalRequiredActions?.includes(action)) {
      checks.approvalWorkflow.pass = false;
      checks.approvalWorkflow.failures.push(`approvalRequiredActions missing ${action}`);
    }
  }
}

if (providerDoc) {
  ensurePhrases(
    checks.providerSecurity,
    providerDoc,
    [
      {
        label: "no fallback on safety/budget/permission/secret/verification failure",
        regex: /no fallback on safety, budget, permission, secret, or verification failures/i,
      },
      { label: "OpenRouter low-risk/public-internal only", regex: /OpenRouter is low-risk only by default/i },
      { label: "batch non-blocking only", regex: /batch providers are non-blocking only by default/i },
      { label: "local model not safe for secrets", regex: /local model does not mean safe for secrets/i },
      { label: "classify/redact/scan before provider send", regex: /classify, redact, and scan before send/i },
    ],
    "PROVIDER_SECURITY_MODEL.md"
  );
}

const integrationFiles = [
  "policy/data-classification-policy.json",
  "security/pii-patterns.json",
  "policy/database-access-policy.json",
];

for (const relPath of integrationFiles) {
  if (!exists(relPath)) {
    checks.integrationConsistency.pass = false;
    checks.integrationConsistency.failures.push(`missing integration file: ${relPath}`);
  }
}

if (exists("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md")) {
  const commandCenterDoc = readText("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md");
  if (!/static mock data only/i.test(commandCenterDoc) && !/uses mock data only/i.test(commandCenterDoc)) {
    checks.integrationConsistency.pass = false;
    checks.integrationConsistency.failures.push("Command Center prototype is not documented as static");
  }
} else {
  checks.integrationConsistency.pass = false;
  checks.integrationConsistency.failures.push("missing docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md");
}

if (exists("docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md")) {
  const dbDoc = readText("docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md");
  if (!/Obsidian is not runtime memory/i.test(dbDoc)) {
    checks.integrationConsistency.pass = false;
    checks.integrationConsistency.failures.push("DB architecture no longer documents Obsidian as non-runtime memory");
  }
} else {
  checks.integrationConsistency.pass = false;
  checks.integrationConsistency.failures.push("missing docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md");
}

for (const relPath of formattingFiles.filter(exists)) {
  const text = readText(relPath);
  const lines = text.split(/\r?\n/);

  if (relPath.endsWith(".js")) {
    const result = spawnSync(process.execPath, ["--check", relPath], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    if (result.status !== 0) {
      checks.formattingReadability.pass = false;
      const detail = (result.stderr || result.stdout || "syntax check failed").trim();
      checks.formattingReadability.failures.push(`${relPath} failed syntax check: ${detail}`);
    }
  }

  if (relPath.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (error) {
      checks.formattingReadability.pass = false;
      checks.formattingReadability.failures.push(`${relPath} failed JSON parse: ${error.message}`);
    }
  }

  lines.forEach((line, index) => {
    const length = line.length;
    const label = `${relPath}:${index + 1}:${length}`;

    if (length > 300) {
      checks.formattingReadability.warnings.push(label);
    }

    if (length > 1000 && !regexLine(relPath, line)) {
      checks.formattingReadability.pass = false;
      checks.formattingReadability.failures.push(`${label} exceeds 1000 characters`);
    }
  });
}

const branch = safeGit("git branch --show-current");
const commit = safeGit("git rev-parse --short HEAD");
const timestamp = new Date().toISOString();
const overallPass = Object.values(checks).every((check) => check.pass);

const failures = Object.entries(checks)
  .flatMap(([name, check]) => check.failures.map((failure) => `${name}: ${failure}`));

const report = `# Security Boundary Report

## Metadata

- Generated at: ${timestamp}
- Validation branch: ${branch}
- Validation HEAD: ${commit}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- Required docs: ${statusLabel(checks.requiredDocs.pass)}
- Required policies: ${statusLabel(checks.requiredPolicies.pass)}
- Security boundary: ${statusLabel(checks.securityBoundary.pass)}
- Runtime sandbox: ${statusLabel(checks.runtimeSandbox.pass)}
- Network policy: ${statusLabel(checks.networkPolicy.pass)}
- Secret boundary: ${statusLabel(checks.secretBoundary.pass)}
- MCP security: ${statusLabel(checks.mcpSecurity.pass)}
- Approval workflow: ${statusLabel(checks.approvalWorkflow.pass)}
- Provider security: ${statusLabel(checks.providerSecurity.pass)}
- Integration consistency: ${statusLabel(checks.integrationConsistency.pass)}
- Formatting/readability: ${statusLabel(checks.formattingReadability.pass)}

## Formatting Warnings

${checks.formattingReadability.warnings.length
    ? checks.formattingReadability.warnings.map((warning) => `- ${warning}`).join("\n")
    : "- none"}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- none"}

## Result

- ${overallPass ? "PASS" : "FAIL"}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log("NEXUS Security Boundary Check");
console.log("=============================");
console.log("");
console.log(`Required docs: ${statusLabel(checks.requiredDocs.pass)}`);
console.log(`Required policies: ${statusLabel(checks.requiredPolicies.pass)}`);
console.log(`Security boundary: ${statusLabel(checks.securityBoundary.pass)}`);
console.log(`Runtime sandbox: ${statusLabel(checks.runtimeSandbox.pass)}`);
console.log(`Network policy: ${statusLabel(checks.networkPolicy.pass)}`);
console.log(`Secret boundary: ${statusLabel(checks.secretBoundary.pass)}`);
console.log(`MCP security: ${statusLabel(checks.mcpSecurity.pass)}`);
console.log(`Approval workflow: ${statusLabel(checks.approvalWorkflow.pass)}`);
console.log(`Provider security: ${statusLabel(checks.providerSecurity.pass)}`);
console.log(`Integration consistency: ${statusLabel(checks.integrationConsistency.pass)}`);
console.log(`Formatting/readability: ${statusLabel(checks.formattingReadability.pass)}`);
console.log("");

if (failures.length) {
  console.log("Failures:");
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  console.log("");
}

console.log(`Result: ${overallPass ? "PASS" : "FAIL"}`);

process.exit(overallPass ? 0 : 1);
