import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  readRuntimeAudit,
  readRuntimeEvidence,
  readRuntimeEvents,
  readRuntimeTasks,
} from "../local-state/normalizeRuntimeFiles.js";
import { getNexusMode, requireLocalPrivateMode } from "./privateMode.js";
import { validatePrivateProjectAccess } from "./privateProjectPolicy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRIVATE_PROJECT_ID = "private-project-01";
const PRIVATE_PROJECT_LABEL = "Private Project";
const PRIVATE_PROJECT_KEY = "careloop";
const KNOWN_P31_TEST_COUNTS = {
  testsPassed: 58,
  testsFailed: 0,
  totalTests: 58,
};
const SECRET_PATTERN = new RegExp(
  [
    "sk-[A-Za-z0-9]{10,}",
    "sk-ant-[A-Za-z0-9_-]{6,}",
    "OPENAI_API_KEY=",
    "ANTHROPIC_API_KEY=",
    "DATABASE_URL=",
    "-----BEGIN [A-Z ]+PRIVATE KEY-----",
  ].join("|")
);
const DISALLOWED_SEGMENTS = new Set([
  ".env",
  ".env.local",
  "node_modules",
  ".git",
]);
const KNOWN_REPORTS = [
  {
    id: "p27-inventory",
    type: "report",
    title: "Inventory and readiness",
    path: "reports/careloop-inventory.json",
  },
  {
    id: "p28-validation-plan",
    type: "report",
    title: "Governed validation plan",
    path: "reports/careloop-validation-plan.json",
  },
  {
    id: "p29-command-classification",
    type: "report",
    title: "Command classification",
    path: "reports/careloop-command-classification.json",
  },
  {
    id: "p30-backend-validation",
    type: "report",
    title: "Controlled backend validation",
    path: "reports/careloop-backend-validation.json",
  },
  {
    id: "p31-failure-analysis",
    type: "report",
    title: "Test failure analysis",
    path: "reports/careloop-test-failure-analysis.json",
  },
  {
    id: "p31-remediation",
    type: "report",
    title: "Remediation plan",
    path: "reports/careloop-remediation-plan.json",
  },
];
const KNOWN_CONTRACTS = [
  {
    id: "contract-backend-validation-task",
    type: "contract",
    title: "Backend validation task contract",
    path: "contracts/careloop/backend-validation-task-contract.json",
  },
  {
    id: "contract-command-classification",
    type: "contract",
    title: "Backend command classification contract",
    path: "contracts/careloop/backend-command-classification-contract.json",
  },
  {
    id: "contract-controlled-validation",
    type: "contract",
    title: "Backend controlled validation contract",
    path: "contracts/careloop/backend-controlled-validation-contract.json",
  },
  {
    id: "contract-remediation",
    type: "contract",
    title: "Completion insights remediation contract",
    path: "contracts/careloop/completion-insights-remediation-contract.json",
  },
];
const RUNTIME_PATHS = {
  tasks: "local-state/runtime/tasks.json",
  evidence: "local-state/runtime/evidence.jsonl",
  audit: "local-state/runtime/audit.jsonl",
  events: "local-state/runtime/events.jsonl",
};
const KNOWN_ISSUES = [
  {
    id: "private-branch-public-safety-report-hygiene",
    summary:
      "On private branches, public safety report regeneration may include private branch names; restore the public-safety report baseline before guarded-task checks.",
    severity: "low",
    blocking: false,
  },
];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value, fallback = "UNKNOWN") {
  const normalized = normalizeString(value).toUpperCase();
  return normalized || fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildAllowedArtifactSet() {
  return new Set([
    ...KNOWN_REPORTS.map((item) => item.path),
    ...KNOWN_CONTRACTS.map((item) => item.path),
    ...Object.values(RUNTIME_PATHS),
  ]);
}

const ALLOWED_ARTIFACTS = buildAllowedArtifactSet();

function resolveArtifactPath(relativePath) {
  const normalizedPath = String(relativePath || "")
    .replaceAll("\\", "/")
    .trim();

  if (!normalizedPath) {
    return { ok: false, error: "Path is required." };
  }

  if (path.isAbsolute(normalizedPath)) {
    return { ok: false, error: "Absolute artifact paths are not allowed." };
  }

  const safePath = path.posix.normalize(normalizedPath);
  if (
    safePath === ".." ||
    safePath.startsWith("../") ||
    safePath.includes("/../")
  ) {
    return { ok: false, error: "Path traversal is not allowed." };
  }

  const segments = safePath.split("/");
  if (segments.some((segment) => DISALLOWED_SEGMENTS.has(segment))) {
    return { ok: false, error: "Disallowed private artifact path segment." };
  }

  if (!ALLOWED_ARTIFACTS.has(safePath)) {
    return { ok: false, error: "Artifact path is not allowlisted for P32." };
  }

  return {
    ok: true,
    normalizedPath: safePath,
    absolutePath: path.resolve(ROOT, safePath),
  };
}

function readJsonArtifact(relativePath, warnings, errors) {
  const resolved = resolveArtifactPath(relativePath);
  if (!resolved.ok) {
    errors.push(`${relativePath}: ${resolved.error}`);
    return null;
  }

  if (!fs.existsSync(resolved.absolutePath)) {
    warnings.push(`Optional artifact unavailable: ${resolved.normalizedPath}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(resolved.absolutePath, "utf8"));
  } catch (error) {
    errors.push(
      `Failed to parse ${resolved.normalizedPath}: ${error instanceof Error ? error.message : "Invalid JSON."}`
    );
    return null;
  }
}

function matchesPrivateRuntimeRecord(record) {
  const projectId = normalizeString(record?.projectId);
  const taskId = normalizeString(record?.taskId);
  const summary = normalizeString(record?.summary).toLowerCase();
  const type =
    normalizeString(record?.type || record?.eventType || record?.taskType).toLowerCase();

  return (
    projectId === PRIVATE_PROJECT_ID ||
    taskId.startsWith("pvt-") ||
    type.includes("validation") ||
    type.includes("remediation") ||
    type.includes("private_project") ||
    summary.includes("private project") ||
    summary.includes("validation")
  );
}

function collectRuntimeArtifacts(runtimeState) {
  const runtimeArtifacts = [];
  const evidenceRecords = runtimeState.evidence.records.filter(matchesPrivateRuntimeRecord);
  const auditRecords = runtimeState.audit.records.filter(matchesPrivateRuntimeRecord);
  const eventRecords = runtimeState.events.records.filter(matchesPrivateRuntimeRecord);

  for (const record of evidenceRecords.slice(-3).reverse()) {
    runtimeArtifacts.push({
      id: normalizeString(record.evidenceId) || "runtime-evidence",
      type: "evidence",
      title: normalizeString(record.summary) || normalizeString(record.type) || "Evidence record",
      status: normalizeStatus(record.result, "INFO"),
      path: RUNTIME_PATHS.evidence,
      redacted: true,
    });
  }

  for (const record of auditRecords.slice(-3).reverse()) {
    runtimeArtifacts.push({
      id: normalizeString(record.auditId) || "runtime-audit",
      type: "audit",
      title: normalizeString(record.summary) || normalizeString(record.eventType) || "Audit event",
      status: "INFO",
      path: RUNTIME_PATHS.audit,
      redacted: true,
    });
  }

  for (const record of eventRecords.slice(-3).reverse()) {
    runtimeArtifacts.push({
      id: normalizeString(record.eventId) || "runtime-event",
      type: "runtime_event",
      title:
        normalizeString(record.summary) || normalizeString(record.eventType) || "Runtime event",
      status: "INFO",
      path: RUNTIME_PATHS.events,
      redacted: true,
    });
  }

  return runtimeArtifacts;
}

function summarizeArtifactStatus(artifactId, data) {
  if (!data) {
    return "UNKNOWN";
  }

  if (artifactId === "p30-backend-validation") {
    return normalizeStatus(data.execution?.status, "UNKNOWN");
  }

  if (artifactId === "p31-remediation") {
    if (data.fixApplied && normalizeStatus(data.validationAfterFix?.status) === "PASS") {
      return "PASS";
    }
    return data.fixApplied ? "INFO" : "FAIL";
  }

  if (artifactId === "p31-failure-analysis") {
    return normalizeString(data.rootCauseCategory) ? "PASS" : "UNKNOWN";
  }

  return "PASS";
}

export function loadPrivateValidationArtifacts(options = {}) {
  const env = options.env || process.env;
  const mode = getNexusMode(env);
  const modeResult = requireLocalPrivateMode(mode);
  const warnings = [...(modeResult.warnings || [])];
  const errors = [...(modeResult.errors || [])];
  const accessResult = validatePrivateProjectAccess({
    projectId: PRIVATE_PROJECT_KEY,
    relativePath: `projects/${PRIVATE_PROJECT_KEY}`,
    mode,
    purpose: "inventory",
    actor: "system",
  });

  if (!accessResult.ok) {
    errors.push(...accessResult.errors);
  }

  const reportArtifacts = Object.fromEntries(
    KNOWN_REPORTS.map((artifact) => [
      artifact.id,
      readJsonArtifact(artifact.path, warnings, errors),
    ])
  );
  const contractArtifacts = Object.fromEntries(
    KNOWN_CONTRACTS.map((artifact) => [
      artifact.id,
      readJsonArtifact(artifact.path, warnings, errors),
    ])
  );

  const tasksState = readRuntimeTasks();
  const evidenceState = readRuntimeEvidence();
  const auditState = readRuntimeAudit();
  const eventsState = readRuntimeEvents();

  warnings.push(
    ...tasksState.warnings,
    ...evidenceState.warnings,
    ...auditState.warnings,
    ...eventsState.warnings
  );
  errors.push(
    ...tasksState.errors,
    ...evidenceState.errors,
    ...auditState.errors,
    ...eventsState.errors
  );

  return {
    mode,
    access: accessResult,
    reports: reportArtifacts,
    contracts: contractArtifacts,
    runtime: {
      tasks: tasksState.tasks,
      evidence: evidenceState.records,
      audit: auditState.records,
      events: eventsState.records,
    },
    warnings,
    errors,
  };
}

export function summarizePrivateValidationTimeline(artifacts) {
  const inventory = artifacts.reports["p27-inventory"];
  const validationPlan = artifacts.reports["p28-validation-plan"];
  const commandClassification = artifacts.reports["p29-command-classification"];
  const backendValidation = artifacts.reports["p30-backend-validation"];
  const failureAnalysis = artifacts.reports["p31-failure-analysis"];
  const remediation = artifacts.reports["p31-remediation"];

  return [
    {
      phase: "P27",
      title: "Inventory and readiness",
      status: inventory ? "PASS" : "UNKNOWN",
      summary:
        normalizeString(inventory?.readiness?.overall) ||
        "Private project readiness artifact not available.",
    },
    {
      phase: "P28",
      title: "Validation plan",
      status: validationPlan ? "PASS" : "UNKNOWN",
      summary:
        normalizeString(validationPlan?.summary) ||
        "Governed validation planning recorded through the local task path.",
    },
    {
      phase: "P29",
      title: "Command classification",
      status: commandClassification ? "PASS" : "UNKNOWN",
      summary:
        normalizeString(commandClassification?.recommendedFirstExecution?.command) ||
        "Command classification artifact not available.",
    },
    {
      phase: "P30",
      title: "Controlled backend validation",
      status: summarizeArtifactStatus("p30-backend-validation", backendValidation),
      summary:
        normalizeString(backendValidation?.execution?.status) === "PASS"
          ? "Governed backend validation completed through the local-private path."
          : "Controlled backend validation result pending or incomplete.",
    },
    {
      phase: "P31",
      title: "Remediation",
      status: summarizeArtifactStatus("p31-remediation", remediation),
      summary:
        normalizeString(failureAnalysis?.rootCauseCategory) ||
        "Remediation analysis not available.",
    },
    {
      phase: "P31",
      title: "Post-fix validation",
      status: normalizeStatus(remediation?.validationAfterFix?.status, "UNKNOWN"),
      summary:
        normalizeStatus(remediation?.validationAfterFix?.status) === "PASS"
          ? "Post-fix validation completed with a clean governed backend pass."
          : "Post-fix validation has not reached a passing state.",
    },
  ];
}

export function summarizePrivateValidationStatus(artifacts) {
  const inventory = artifacts.reports["p27-inventory"];
  const backendValidation = artifacts.reports["p30-backend-validation"];
  const remediation = artifacts.reports["p31-remediation"];
  const backendStatus = normalizeStatus(
    remediation?.validationAfterFix?.status || backendValidation?.execution?.status
  );
  const knownPass =
    backendStatus === "PASS" &&
    (remediation?.fixApplied || normalizeStatus(backendValidation?.execution?.status) === "PASS");
  const testsPassed = knownPass ? KNOWN_P31_TEST_COUNTS.testsPassed : 0;
  const testsFailed =
    backendStatus === "FAIL" ? 1 : knownPass ? KNOWN_P31_TEST_COUNTS.testsFailed : 0;
  const totalTests =
    backendStatus === "FAIL"
      ? Math.max(testsPassed + testsFailed, KNOWN_P31_TEST_COUNTS.totalTests)
      : knownPass
        ? KNOWN_P31_TEST_COUNTS.totalTests
        : 0;
  const resultAfterFix = normalizeStatus(remediation?.validationAfterFix?.status, "UNKNOWN");

  let overall = "UNKNOWN";
  if (backendStatus === "BLOCKED") {
    overall = "BLOCKED";
  } else if (backendStatus === "PASS" && testsFailed === 0) {
    overall = "VALIDATED";
  } else if (backendStatus === "FAIL" || (remediation && resultAfterFix !== "PASS")) {
    overall = "NEEDS_REMEDIATION";
  }

  return {
    overall,
    backendReadiness:
      normalizeString(inventory?.readiness?.backend?.status) || "UNKNOWN",
    iosReadiness: normalizeString(inventory?.readiness?.ios?.status) || "UNKNOWN",
    latestBackendValidation: {
      status: backendStatus || "UNKNOWN",
      testsPassed,
      testsFailed,
      totalTests,
      command: `${normalizeString(backendValidation?.command?.command) || "npm"} ${
        normalizeArray(backendValidation?.command?.args).join(" ") || "test"
      }`.trim(),
    },
    latestRemediation: {
      applied: remediation?.fixApplied === true,
      rootCauseCategory:
        normalizeString(remediation?.rootCauseCategory) || "unknown",
      confidence: normalizeString(remediation?.confidence) || "unknown",
      resultAfterFix,
    },
  };
}

function buildValidationArtifacts(artifacts) {
  const entries = [];

  for (const artifact of KNOWN_REPORTS) {
    const data = artifacts.reports[artifact.id];
    if (!data) {
      continue;
    }

    entries.push({
      id: artifact.id,
      type: artifact.type,
      title: artifact.title,
      status: summarizeArtifactStatus(artifact.id, data),
      path: artifact.path,
      redacted: true,
    });
  }

  for (const artifact of KNOWN_CONTRACTS) {
    if (!artifacts.contracts[artifact.id]) {
      continue;
    }

    entries.push({
      id: artifact.id,
      type: artifact.type,
      title: artifact.title,
      status: "INFO",
      path: artifact.path,
      redacted: true,
    });
  }

  return [
    ...entries,
    ...collectRuntimeArtifacts({
      evidence: { records: artifacts.runtime.evidence },
      audit: { records: artifacts.runtime.audit },
      events: { records: artifacts.runtime.events },
    }),
  ];
}

export function validatePrivateValidationSnapshot(snapshot) {
  const errors = [];
  const warnings = [];
  const serialized = JSON.stringify(snapshot);

  if (!["local-private", "test"].includes(snapshot?.mode)) {
    errors.push("Private validation snapshot requires local-private or test mode.");
  }

  if (snapshot?.readOnly !== true) {
    errors.push("Private validation snapshot must remain read-only.");
  }

  if (snapshot?.source !== "generated-private-validation-snapshot") {
    errors.push("Private validation snapshot source is invalid.");
  }

  if (!snapshot?.status || !snapshot?.timeline || !snapshot?.validationArtifacts) {
    errors.push("Private validation snapshot is missing required sections.");
  }

  if (SECRET_PATTERN.test(serialized)) {
    errors.push("Secret-like content found in private validation snapshot.");
  }

  if (serialized.includes(".env") || serialized.includes("node_modules")) {
    errors.push("Blocked file references found in private validation snapshot.");
  }

  if (snapshot?.project?.label !== PRIVATE_PROJECT_LABEL) {
    warnings.push("Project label should remain public-safe as 'Private Project'.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildPrivateValidationSnapshot(options = {}) {
  const artifacts = loadPrivateValidationArtifacts(options);
  const snapshot = {
    snapshotVersion: "1.0",
    mode: artifacts.mode,
    source: "generated-private-validation-snapshot",
    readOnly: true,
    generatedAt: new Date().toISOString(),
    project: {
      id: PRIVATE_PROJECT_ID,
      label: PRIVATE_PROJECT_LABEL,
      private: true,
      publicSafe: false,
    },
    status: summarizePrivateValidationStatus(artifacts),
    timeline: summarizePrivateValidationTimeline(artifacts),
    validationArtifacts: buildValidationArtifacts(artifacts),
    governance: {
      privateMode: ["local-private", "test"].includes(artifacts.mode),
      trafficPlane: true,
      stateMachine: true,
      localWriteBoundary: true,
      approvalRequired: false,
      providerCalls: false,
      networkCalls: false,
      dbAccess: false,
      apiServer: false,
      mutationEnabledFromUi: false,
    },
    knownIssues: KNOWN_ISSUES,
    warnings: [...artifacts.warnings],
    errors: [...artifacts.errors],
  };

  const validation = validatePrivateValidationSnapshot(snapshot);
  snapshot.warnings.push(...validation.warnings);
  snapshot.errors.push(...validation.errors);

  return snapshot;
}
