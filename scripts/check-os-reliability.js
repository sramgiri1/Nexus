import fs from "fs";
import path from "path";
import { execSync, spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, "reports", "os-reliability-report.md");

const requiredDocs = [
  "docs/architecture/OS_RELIABILITY.md",
  "docs/architecture/DURABLE_EXECUTION_MODEL.md",
  "docs/architecture/TASK_LEASE_AND_HEARTBEAT_MODEL.md",
  "docs/architecture/RETRY_AND_DEAD_LETTER_MODEL.md",
  "docs/architecture/RECOVERY_AND_ROLLBACK_MODEL.md",
  "docs/architecture/INCIDENT_RESPONSE_MODEL.md",
];

const requiredPolicies = [
  "policy/reliability-policy.json",
  "policy/retry-policy.json",
  "policy/incident-policy.json",
];

const checks = {
  requiredDocs: { pass: true, failures: [] },
  requiredPolicies: { pass: true, failures: [] },
  reliabilityArchitecture: { pass: true, failures: [] },
  durableExecution: { pass: true, failures: [] },
  leaseHeartbeatModel: { pass: true, failures: [] },
  retryDlqModel: { pass: true, failures: [] },
  recoveryRollbackModel: { pass: true, failures: [] },
  incidentResponse: { pass: true, failures: [] },
  policyValidation: { pass: true, failures: [] },
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

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function addFailure(bucket, message) {
  checks[bucket].pass = false;
  checks[bucket].failures.push(message);
}

function requirePhrase(bucket, text, label, regex) {
  if (!regex.test(text)) {
    addFailure(bucket, `missing phrase: ${label}`);
  }
}

function regexLine(relPath, line) {
  return relPath.endsWith(".json") && /"regex"\s*:\s*"/.test(line);
}

for (const relPath of requiredDocs) {
  if (!exists(relPath)) {
    addFailure("requiredDocs", `missing doc: ${relPath}`);
  }
}

for (const relPath of requiredPolicies) {
  if (!exists(relPath)) {
    addFailure("requiredPolicies", `missing policy: ${relPath}`);
    continue;
  }

  try {
    readJson(relPath);
  } catch (error) {
    addFailure("requiredPolicies", `${relPath} failed JSON parse: ${error.message}`);
  }
}

let osReliabilityDoc = "";
let durableExecutionDoc = "";
let leaseDoc = "";
let retryDoc = "";
let recoveryDoc = "";
let incidentDoc = "";
let reliabilityPolicy = null;
let retryPolicy = null;
let incidentPolicy = null;

if (checks.requiredDocs.pass) {
  osReliabilityDoc = readText("docs/architecture/OS_RELIABILITY.md");
  durableExecutionDoc = readText("docs/architecture/DURABLE_EXECUTION_MODEL.md");
  leaseDoc = readText("docs/architecture/TASK_LEASE_AND_HEARTBEAT_MODEL.md");
  retryDoc = readText("docs/architecture/RETRY_AND_DEAD_LETTER_MODEL.md");
  recoveryDoc = readText("docs/architecture/RECOVERY_AND_ROLLBACK_MODEL.md");
  incidentDoc = readText("docs/architecture/INCIDENT_RESPONSE_MODEL.md");
}

if (checks.requiredPolicies.pass) {
  reliabilityPolicy = readJson("policy/reliability-policy.json");
  retryPolicy = readJson("policy/retry-policy.json");
  incidentPolicy = readJson("policy/incident-policy.json");
}

if (osReliabilityDoc) {
  for (const [label, regex] of [
    ["leases", /\bleases?\b/i],
    ["heartbeats", /\bheartbeats?\b/i],
    ["retries", /\bretries?\b/i],
    ["idempotency", /\bidempotency\b/i],
    ["dead-letter", /dead[- ]letter/i],
    ["recovery", /\brecovery\b/i],
    ["rollback", /\brollback\b/i],
    ["incidents", /\bincidents?\b/i],
    ["audit", /\baudit\b/i],
    ["evidence", /\bevidence\b/i],
  ]) {
    requirePhrase("reliabilityArchitecture", osReliabilityDoc, label, regex);
  }
}

if (durableExecutionDoc) {
  for (const [label, regex] of [
    ["idempotencyKey", /idempotencyKey/],
    ["leaseOwner", /leaseOwner/],
    ["leaseUntil", /leaseUntil/],
    ["heartbeatAt", /heartbeatAt/],
    ["attempt", /\battempt\b/i],
    ["maxAttempts", /maxAttempts/],
    ["failureClass", /failureClass/],
    ["append-only transitions", /append[- ]only/i],
  ]) {
    requirePhrase("durableExecution", durableExecutionDoc, label, regex);
  }
}

if (leaseDoc) {
  for (const [label, regex] of [
    ["leaseId", /leaseId/],
    ["leaseOwner", /leaseOwner/],
    ["workerInstanceId", /workerInstanceId/],
    ["heartbeat", /\bheartbeat\b/i],
    ["lease expiry", /lease expires|lease expiry/i],
    ["reclaim rules", /reclaim/i],
    ["stuck task detection", /stuck task detection/i],
  ]) {
    requirePhrase("leaseHeartbeatModel", leaseDoc, label, regex);
  }
}

if (retryDoc) {
  for (const [label, regex] of [
    ["transient_failure", /transient_failure/],
    ["provider_failure", /provider_failure/],
    ["verification_failure", /verification_failure/],
    ["policy_block", /policy_block/],
    ["secret_or_security_failure", /secret_or_security_failure/],
    ["data_protection_failure", /data_protection_failure/],
    ["max attempts", /max attempts/i],
    ["exponential backoff", /exponential backoff/i],
    ["dead-letter queue", /dead[- ]letter queue/i],
    ["auto-heal limits", /auto[- ]heal limits/i],
  ]) {
    requirePhrase("retryDlqModel", retryDoc, label, regex);
  }
}

if (recoveryDoc) {
  for (const [label, regex] of [
    ["rollback plan", /rollback plan/i],
    ["approval", /\bapproval\b/i],
    ["compensating action", /compensating action/i],
    ["batch reconciliation", /batch reconciliation/i],
    ["audit history", /audit history/i],
    ["final state rollback rules", /final state/i],
  ]) {
    requirePhrase("recoveryRollbackModel", recoveryDoc, label, regex);
  }
}

if (incidentDoc) {
  for (const [label, regex] of [
    ["SEV0", /\bSEV0\b/],
    ["SEV1", /\bSEV1\b/],
    ["SEV2", /\bSEV2\b/],
    ["SEV3", /\bSEV3\b/],
    ["secret exposure", /secret exposure/i],
    ["raw personal data sent to LLM/batch", /raw personal data sent to LLM|raw personal data sent to .*batch/i],
    ["stuck batch reconciliation", /stuck batch reconciliation/i],
    ["runaway cost", /runaway cost/i],
    ["worker heartbeat expired", /heartbeat expired/i],
    ["release blocking", /block release|release.*severity/i],
  ]) {
    requirePhrase("incidentResponse", incidentDoc, label, regex);
  }
}

if (reliabilityPolicy) {
  if (reliabilityPolicy.durableExecutionRequired !== true) {
    addFailure("policyValidation", "durableExecutionRequired is not true");
  }
  if (reliabilityPolicy.leaseRequiredForRunning !== true) {
    addFailure("policyValidation", "leaseRequiredForRunning is not true");
  }
  if (reliabilityPolicy.heartbeatRequired !== true) {
    addFailure("policyValidation", "heartbeatRequired is not true");
  }
  if (reliabilityPolicy.stateTransitionsAppendOnly !== true) {
    addFailure("policyValidation", "stateTransitionsAppendOnly is not true");
  }
  if (!(reliabilityPolicy.maxAutoHealAttempts <= 2)) {
    addFailure("policyValidation", "maxAutoHealAttempts must be <= 2");
  }
}

if (retryPolicy) {
  if (!Array.isArray(retryPolicy.retryableClasses) || retryPolicy.retryableClasses.length === 0) {
    addFailure("policyValidation", "retryableClasses missing or empty");
  }
  if (!Array.isArray(retryPolicy.nonRetryableClasses) || retryPolicy.nonRetryableClasses.length === 0) {
    addFailure("policyValidation", "nonRetryableClasses missing or empty");
  }
}

if (incidentPolicy) {
  if (!Array.isArray(incidentPolicy.severityLevels) || incidentPolicy.severityLevels.length === 0) {
    addFailure("policyValidation", "severityLevels missing or empty");
  }
  if (!Array.isArray(incidentPolicy.requiredRunbooks) || incidentPolicy.requiredRunbooks.length === 0) {
    addFailure("policyValidation", "requiredRunbooks missing or empty");
  }
}

for (const relPath of [
  "docs/architecture/SECURITY_BOUNDARY.md",
  "policy/data-classification-policy.json",
  "docs/architecture/EXECUTION_RUNTIME_ARCHITECTURE.md",
  "docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md",
  "docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md",
]) {
  if (!exists(relPath)) {
    addFailure("integrationConsistency", `missing integration file: ${relPath}`);
  }
}

if (exists("docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md")) {
  const dbDoc = readText("docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md");
  if (!/JSON Primary/i.test(dbDoc) || !/DB Mirror Mode/i.test(dbDoc) || !/DB Primary Mode/i.test(dbDoc)) {
    addFailure("integrationConsistency", "DB architecture no longer documents JSON primary then DB mirror and DB primary later");
  }
}

if (exists("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md")) {
  const prototypeDoc = readText("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md");
  if (!/static mock data only/i.test(prototypeDoc) && !/uses mock data only/i.test(prototypeDoc)) {
    addFailure("integrationConsistency", "Command Center prototype is no longer documented as static");
  }
}

const formattingFiles = [
  ...requiredDocs,
  ...requiredPolicies,
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md",
  "docs/architecture/EXECUTION_RUNTIME_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "README.md",
  "scripts/check-os-reliability.js",
];

for (const relPath of formattingFiles.filter(exists)) {
  const text = readText(relPath);
  const lines = text.split(/\r?\n/);

  if (relPath.endsWith(".js")) {
    const result = spawnSync(process.execPath, ["--check", relPath], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    if (result.status !== 0) {
      addFailure(
        "formattingReadability",
        `${relPath} failed syntax check: ${(result.stderr || result.stdout || "syntax check failed").trim()}`
      );
    }
  }

  if (relPath.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (error) {
      addFailure("formattingReadability", `${relPath} failed JSON parse: ${error.message}`);
    }
  }

  lines.forEach((line, index) => {
    if (line.length > 1000 && !regexLine(relPath, line)) {
      addFailure("formattingReadability", `${relPath}:${index + 1} exceeds 1000 characters`);
    }
  });
}

const overallPass = Object.values(checks).every((check) => check.pass);
const branch = safeGit("git branch --show-current");
const commit = safeGit("git rev-parse --short HEAD");
const timestamp = new Date().toISOString();

const failures = Object.entries(checks).flatMap(([name, check]) =>
  check.failures.map((failure) => `${name}: ${failure}`)
);

const report = `# OS Reliability Report

## Metadata

- Generated at: ${timestamp}
- Validation branch: ${branch}
- Validation HEAD: ${commit}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- Required docs: ${statusLabel(checks.requiredDocs.pass)}
- Required policies: ${statusLabel(checks.requiredPolicies.pass)}
- Reliability architecture: ${statusLabel(checks.reliabilityArchitecture.pass)}
- Durable execution: ${statusLabel(checks.durableExecution.pass)}
- Lease/heartbeat model: ${statusLabel(checks.leaseHeartbeatModel.pass)}
- Retry/DLQ model: ${statusLabel(checks.retryDlqModel.pass)}
- Recovery/rollback model: ${statusLabel(checks.recoveryRollbackModel.pass)}
- Incident response: ${statusLabel(checks.incidentResponse.pass)}
- Policy validation: ${statusLabel(checks.policyValidation.pass)}
- Integration consistency: ${statusLabel(checks.integrationConsistency.pass)}
- Formatting/readability: ${statusLabel(checks.formattingReadability.pass)}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- none"}

## Result

- ${overallPass ? "PASS" : "FAIL"}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log("NEXUS OS Reliability Check");
console.log("==========================");
console.log("");
console.log(`Required docs: ${statusLabel(checks.requiredDocs.pass)}`);
console.log(`Required policies: ${statusLabel(checks.requiredPolicies.pass)}`);
console.log(`Reliability architecture: ${statusLabel(checks.reliabilityArchitecture.pass)}`);
console.log(`Durable execution: ${statusLabel(checks.durableExecution.pass)}`);
console.log(`Lease/heartbeat model: ${statusLabel(checks.leaseHeartbeatModel.pass)}`);
console.log(`Retry/DLQ model: ${statusLabel(checks.retryDlqModel.pass)}`);
console.log(`Recovery/rollback model: ${statusLabel(checks.recoveryRollbackModel.pass)}`);
console.log(`Incident response: ${statusLabel(checks.incidentResponse.pass)}`);
console.log(`Policy validation: ${statusLabel(checks.policyValidation.pass)}`);
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
