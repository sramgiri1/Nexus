import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(
  repoRoot,
  "reports",
  "observability-evals-artifacts-report.md"
);

const requiredDocs = [
  "docs/architecture/OBSERVABILITY_MODEL.md",
  "docs/architecture/TRACE_MODEL.md",
  "docs/architecture/EVALS_MODEL.md",
  "docs/architecture/ARTIFACT_REGISTRY.md",
  "docs/architecture/EVIDENCE_LINEAGE.md",
  "docs/architecture/TELEMETRY_MODEL.md",
];

const requiredPolicies = [
  "policy/observability-policy.json",
  "policy/evals-policy.json",
  "policy/artifact-policy.json",
  "policy/telemetry-policy.json",
];

const requiredScenarios = [
  "evals/scenarios/agent_self_completion_block.json",
  "evals/scenarios/batch_cannot_pass_gate.json",
  "evals/scenarios/release_requires_gate_evidence.json",
  "evals/scenarios/restricted_data_blocks_provider.json",
  "evals/scenarios/xcode_requires_macos_runtime.json",
  "evals/scenarios/approval_required_for_deploy.json",
  "evals/scenarios/capability_required_for_tool_use.json",
  "evals/scenarios/stuck_task_requires_recovery.json",
];

const validEvalCategories = new Set([
  "agent_authority",
  "verification_gate",
  "batch_policy",
  "data_protection",
  "provider_security",
  "runtime_routing",
  "approval_workflow",
  "capability_policy",
  "reliability",
  "release_control",
]);

const checks = {
  requiredDocs: { pass: true, failures: [] },
  policies: { pass: true, failures: [] },
  evalScenarios: { pass: true, failures: [] },
  artifactRegistry: { pass: true, failures: [] },
  observabilityDocs: { pass: true, failures: [] },
  traceModel: { pass: true, failures: [] },
  evalsModel: { pass: true, failures: [] },
  artifactModel: { pass: true, failures: [] },
  evidenceLineage: { pass: true, failures: [] },
  telemetryModel: { pass: true, failures: [] },
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

for (const relPath of requiredPolicies) {
  if (!exists(relPath)) {
    addFailure("policies", `missing policy: ${relPath}`);
    continue;
  }

  try {
    readJson(relPath);
  } catch (error) {
    addFailure("policies", `${relPath} failed JSON parse: ${error.message}`);
  }
}

let observabilityDoc = "";
let traceDoc = "";
let evalsDoc = "";
let artifactDoc = "";
let lineageDoc = "";
let telemetryDoc = "";
let observabilityPolicy = null;
let evalsPolicy = null;
let artifactPolicy = null;
let telemetryPolicy = null;

if (checks.requiredDocs.pass) {
  observabilityDoc = readText("docs/architecture/OBSERVABILITY_MODEL.md");
  traceDoc = readText("docs/architecture/TRACE_MODEL.md");
  evalsDoc = readText("docs/architecture/EVALS_MODEL.md");
  artifactDoc = readText("docs/architecture/ARTIFACT_REGISTRY.md");
  lineageDoc = readText("docs/architecture/EVIDENCE_LINEAGE.md");
  telemetryDoc = readText("docs/architecture/TELEMETRY_MODEL.md");
}

if (checks.policies.pass) {
  observabilityPolicy = readJson("policy/observability-policy.json");
  evalsPolicy = readJson("policy/evals-policy.json");
  artifactPolicy = readJson("policy/artifact-policy.json");
  telemetryPolicy = readJson("policy/telemetry-policy.json");
}

for (const relPath of requiredScenarios) {
  if (!exists(relPath)) {
    addFailure("evalScenarios", `missing scenario: ${relPath}`);
    continue;
  }

  let scenario;

  try {
    scenario = readJson(relPath);
  } catch (error) {
    addFailure("evalScenarios", `${relPath} failed JSON parse: ${error.message}`);
    continue;
  }

  const text = JSON.stringify(scenario).toLowerCase();
  if (text.includes("careloop")) {
    addFailure("evalScenarios", `${relPath} mentions CareLoop`);
  }

  for (const field of [
    "scenarioId",
    "name",
    "description",
    "category",
    "input",
    "expected",
    "riskLevel",
    "tags",
  ]) {
    if (!(field in scenario)) {
      addFailure("evalScenarios", `${relPath} missing field ${field}`);
    }
  }

  if (!validEvalCategories.has(scenario.category)) {
    addFailure("evalScenarios", `${relPath} has invalid category ${scenario.category}`);
  }

  if (!scenario.expected || typeof scenario.expected !== "object") {
    addFailure("evalScenarios", `${relPath} missing expected object`);
  } else {
    if (!scenario.expected.result) {
      addFailure("evalScenarios", `${relPath} missing expected.result`);
    }
  }

  if (!scenario.riskLevel) {
    addFailure("evalScenarios", `${relPath} missing riskLevel`);
  }
}

const artifactRegistryPath = "artifacts/registry.example.json";
if (!exists(artifactRegistryPath)) {
  addFailure("artifactRegistry", `missing artifact registry example: ${artifactRegistryPath}`);
} else {
  try {
    const artifactRegistry = readJson(artifactRegistryPath);
    const artifacts = Array.isArray(artifactRegistry.artifacts)
      ? artifactRegistry.artifacts
      : [];

    if (artifacts.length < 8) {
      addFailure("artifactRegistry", `artifact registry contains ${artifacts.length} artifacts`);
    }

    for (const artifact of artifacts) {
      const id = artifact.artifactId || "<missing artifactId>";
      for (const field of [
        "artifactId",
        "type",
        "path",
        "hash",
        "dataClassification",
        "redacted",
        "retentionPolicy",
      ]) {
        if (!(field in artifact)) {
          addFailure("artifactRegistry", `${id} missing field ${field}`);
        }
      }

      if (JSON.stringify(artifact).toLowerCase().includes("careloop")) {
        addFailure("artifactRegistry", `${id} mentions CareLoop`);
      }

      if (artifact.dataClassification === "secret") {
        addFailure("artifactRegistry", `${id} uses forbidden secret data classification`);
      }
    }
  } catch (error) {
    addFailure("artifactRegistry", `${artifactRegistryPath} failed JSON parse: ${error.message}`);
  }
}

if (observabilityDoc) {
  for (const [label, regex] of [
    ["trace", /\btrace\b/i],
    ["evidence", /\bevidence\b/i],
    ["artifact", /\bartifact\b/i],
    ["telemetry", /\btelemetry\b/i],
    ["audit", /\baudit\b/i],
    ["release", /\brelease\b/i],
    ["capability", /\bcapability\b/i],
    ["policy", /\bpolicy\b/i],
    ["cost", /\bcost\b/i],
    ["safety", /\bsafety\b/i],
  ]) {
    requirePhrase("observabilityDocs", observabilityDoc, label, regex);
  }
}

if (traceDoc) {
  for (const [label, regex] of [
    ["traceId", /traceId/],
    ["spanId", /spanId/],
    ["parentSpanId", /parentSpanId/],
    ["taskId", /taskId/],
    ["agentId", /agentId/],
    ["capabilityId", /capabilityId/],
    ["evidenceIds", /evidenceIds/],
    ["artifactIds", /artifactIds/],
    ["dataClassification", /dataClassification/],
  ]) {
    requirePhrase("traceModel", traceDoc, label, regex);
  }
}

if (evalsDoc) {
  for (const [label, regex] of [
    ["offline", /\boffline\b/i],
    ["deterministic", /\bdeterministic\b/i],
    ["no secrets", /no secrets/i],
    ["batch cannot pass gates", /batch cannot pass gates/i],
    ["release requires gate evidence", /release.*gate evidence/i],
    ["restricted data blocked", /restricted data.*blocked/i],
    ["Xcode requires macOS", /Xcode.*macOS/i],
    ["capability required for tool use", /capability.*tool use/i],
  ]) {
    requirePhrase("evalsModel", evalsDoc, label, regex);
  }
}

if (artifactDoc) {
  for (const [label, regex] of [
    ["hash", /\bhash\b/i],
    ["retention", /\bretention\b/i],
    ["data classification", /data classification/i],
    ["large artifacts by reference", /large artifacts.*reference/i],
    ["restricted or secret handling", /restricted.*secret/i],
    ["object storage later", /object storage later/i],
  ]) {
    requirePhrase("artifactModel", artifactDoc, label, regex);
  }
}

if (lineageDoc) {
  for (const [label, regex] of [
    ["claim", /\bclaim\b/i],
    ["task", /\btask\b/i],
    ["skill", /\bskill\b/i],
    ["runtime", /\bruntime\b/i],
    ["artifact", /\bartifact\b/i],
    ["gate", /\bgate\b/i],
    ["release decision", /release decision/i],
  ]) {
    requirePhrase("evidenceLineage", lineageDoc, label, regex);
  }
}

if (telemetryDoc) {
  for (const [label, regex] of [
    ["cost", /\bcost\b/i],
    ["provider usage", /provider usage/i],
    ["agent metrics", /agent metrics/i],
    ["runtime metrics", /runtime metrics/i],
    ["gate metrics", /gate metrics/i],
    ["safety metrics", /safety metrics/i],
    ["eval metrics", /eval metrics/i],
  ]) {
    requirePhrase("telemetryModel", telemetryDoc, label, regex);
  }
}

if (observabilityPolicy) {
  if (observabilityPolicy.traceRequiredForTask !== true) {
    addFailure("policyValidation", "observability traceRequiredForTask is not true");
  }
}

if (evalsPolicy) {
  if (evalsPolicy.offlineByDefault !== true) {
    addFailure("policyValidation", "evals offlineByDefault is not true");
  }
  if (evalsPolicy.noSecretsInEvals !== true) {
    addFailure("policyValidation", "evals noSecretsInEvals is not true");
  }
  if (!(evalsPolicy.requiredScenarioCountMinimum >= 8)) {
    addFailure("policyValidation", "evals requiredScenarioCountMinimum is less than 8");
  }
}

if (artifactPolicy) {
  if (artifactPolicy.requireDataClassification !== true) {
    addFailure("policyValidation", "artifact requireDataClassification is not true");
  }
  if (artifactPolicy.secretNotAllowedInArtifacts !== true) {
    addFailure("policyValidation", "artifact secretNotAllowedInArtifacts is not true");
  }
}

if (telemetryPolicy) {
  if (telemetryPolicy.noRawSecrets !== true) {
    addFailure("policyValidation", "telemetry noRawSecrets is not true");
  }
  if (telemetryPolicy.costTrackingRequired !== true) {
    addFailure("policyValidation", "telemetry costTrackingRequired is not true");
  }
}

for (const relPath of [
  "capabilities/registry.json",
  "policy/reliability-policy.json",
  "policy/security-boundary-policy.json",
  "policy/data-classification-policy.json",
  "docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md",
]) {
  if (!exists(relPath)) {
    addFailure("integrationConsistency", `missing dependency: ${relPath}`);
  }
}

if (exists("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md")) {
  const prototypeDoc = readText("docs/architecture/COMMAND_CENTER_UI_PROTOTYPE.md");
  if (!/static/i.test(prototypeDoc)) {
    addFailure(
      "integrationConsistency",
      "Command Center prototype doc does not mention static prototype"
    );
  }
}

for (const relPath of [
  ...requiredDocs,
  ...requiredPolicies,
  ...requiredScenarios,
  "artifacts/registry.example.json",
  "artifacts/README.md",
  "reports/observability-evals-artifacts-report.md",
  "scripts/check-observability-evals-artifacts.js",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/CAPABILITY_MODEL.md",
  "docs/architecture/COMMAND_CENTER_UI.md",
  "README.md",
]) {
  if (exists(relPath)) {
    checkLineLengths("formattingReadability", relPath);
  }
}

const branch = safeGit("git branch --show-current");
const commit = safeGit("git rev-parse --short HEAD");
const timestamp = new Date().toISOString();
const passed = Object.values(checks).every((item) => item.pass);

const report = `# Observability / Evals / Artifacts Report

## Metadata

- Generated at: ${timestamp}
- Validation branch: ${branch}
- Validation HEAD: ${commit}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Summary

- Docs checked: ${requiredDocs.length}
- Policies checked: ${requiredPolicies.length}
- Eval scenarios checked: ${requiredScenarios.length}

## Check Results

- Required docs: ${statusLabel(checks.requiredDocs.pass)}
- Policies: ${statusLabel(checks.policies.pass)}
- Eval scenarios: ${statusLabel(checks.evalScenarios.pass)}
- Artifact registry: ${statusLabel(checks.artifactRegistry.pass)}
- Observability docs: ${statusLabel(checks.observabilityDocs.pass)}
- Trace model: ${statusLabel(checks.traceModel.pass)}
- Evals model: ${statusLabel(checks.evalsModel.pass)}
- Artifact model: ${statusLabel(checks.artifactModel.pass)}
- Evidence lineage: ${statusLabel(checks.evidenceLineage.pass)}
- Telemetry model: ${statusLabel(checks.telemetryModel.pass)}
- Policy validation: ${statusLabel(checks.policyValidation.pass)}
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

console.log("NEXUS Observability / Evals / Artifacts Check");
console.log("=============================================");
console.log("");
console.log(`Required docs: ${statusLabel(checks.requiredDocs.pass)}`);
console.log(`Policies: ${statusLabel(checks.policies.pass)}`);
console.log(`Eval scenarios: ${statusLabel(checks.evalScenarios.pass)}`);
console.log(`Artifact registry: ${statusLabel(checks.artifactRegistry.pass)}`);
console.log(`Observability docs: ${statusLabel(checks.observabilityDocs.pass)}`);
console.log(`Trace model: ${statusLabel(checks.traceModel.pass)}`);
console.log(`Evals model: ${statusLabel(checks.evalsModel.pass)}`);
console.log(`Artifact model: ${statusLabel(checks.artifactModel.pass)}`);
console.log(`Evidence lineage: ${statusLabel(checks.evidenceLineage.pass)}`);
console.log(`Telemetry model: ${statusLabel(checks.telemetryModel.pass)}`);
console.log(`Policy validation: ${statusLabel(checks.policyValidation.pass)}`);
console.log(
  `Integration consistency: ${statusLabel(checks.integrationConsistency.pass)}`
);
console.log(
  `Formatting/readability: ${statusLabel(checks.formattingReadability.pass)}`
);
console.log("");

const failures = Object.entries(checks).flatMap(([label, bucket]) =>
  bucket.failures.map((failure) => `${label}: ${failure}`)
);

if (failures.length) {
  console.log("Failures:");
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  console.log("");
}

console.log(`Result: ${passed ? "PASS" : "FAIL"}`);

process.exit(passed ? 0 : 1);
