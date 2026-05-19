import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const P74_2_REQUIRED_FIELDS = Object.freeze([
  "telemetryContractId",
  "signalType",
  "sourceSurface",
  "metricFamily",
  "aggregationWindow",
  "redactionState",
  "telemetryExportAllowed",
  "rawLogExposureAllowed",
  "rawJsonDumpAllowed",
  "rawPolicyDumpAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "authMutationAllowed",
  "providerSpendAllowed",
  "displayFields",
  "blockedOperations",
  "disabledReason",
  "blockers",
  "forbiddenFiles",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "db/**",
  "prisma/**",
  "migrations/**",
  "providers/**",
  "tools/**",
  "worker-runtime/**",
  "deploy/**",
  "release/**",
  "auth/**",
  "users/**",
  "rbac/**",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createTelemetryEventContract(input = {}) {
  const redaction = summarizeRedaction({
    signalType: input.signalType || "runtime_health",
    sourceSurface: input.sourceSurface || "Command Center readiness",
    sampleValue: input.sampleValue || "aggregated_count_only",
  });

  return {
    telemetryContractId: input.telemetryContractId || "telemetry-event-contract-preview",
    signalType: input.signalType || "runtime_health",
    sourceSurface: input.sourceSurface || "Command Center readiness",
    metricFamily: input.metricFamily || "runtime_metrics",
    aggregationWindow: input.aggregationWindow || "local_preview_window",
    redactionState: redaction.changed ? "redacted" : "redaction_checked",
    telemetryExportAllowed: false,
    rawLogExposureAllowed: false,
    rawJsonDumpAllowed: false,
    rawPolicyDumpAllowed: false,
    dbWritesAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    authMutationAllowed: false,
    providerSpendAllowed: false,
    displayFields: [
      "signal type",
      "source surface",
      "metric family",
      "aggregation window",
      "redaction state",
      "telemetry export state",
      "next action",
      "disabled reason",
    ],
    blockedOperations: [
      "External telemetry export",
      "Raw log streaming",
      "Raw JSON dumps",
      "Raw policy dumps",
      "DB telemetry writes",
      "Network telemetry calls",
    ],
    disabledReason: "P74.2 records telemetry event contracts only; external telemetry export, raw log streaming, DB writes, and network telemetry calls remain disabled.",
    blockers: [
      "External telemetry exporters are disabled.",
      "Raw logs, raw JSON dumps, and raw policy dumps are disabled.",
      "DB writes and project mutation are disabled.",
      "Provider/tool/worker execution and network calls are disabled.",
      "Deploy, release, export, package, auth mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p742-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P74.2"])],
    costImpact: "No telemetry exporter calls, network calls, provider calls, DB service calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.observabilityTelemetryPreview",
    nextAction: input.nextAction || "Route this telemetry event contract through P74.3 SLO objective catalog.",
    commandCenterVisible: true,
  };
}

export function validateTelemetryEventContract(contract = {}) {
  const errors = [];
  for (const field of P74_2_REQUIRED_FIELDS) {
    if (!(field in contract)) errors.push(`missing ${field}`);
  }
  if (contract.telemetryExportAllowed !== false || contract.rawLogExposureAllowed !== false) errors.push("telemetry export and raw log exposure must be false");
  if (contract.rawJsonDumpAllowed !== false || contract.rawPolicyDumpAllowed !== false) errors.push("raw JSON and policy dumps must be false");
  if (contract.projectMutationAllowed !== false || contract.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (contract.providerDispatchAllowed !== false || contract.toolExecutionAllowed !== false || contract.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (contract.networkCallsAllowed !== false || contract.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (contract.deployExecutionAllowed !== false || contract.releaseExecutionAllowed !== false || contract.exportExecutionAllowed !== false || contract.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (contract.authMutationAllowed !== false) errors.push("auth mutation must be false");
  if (!Array.isArray(contract.blockedOperations) || contract.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!Array.isArray(contract.blockers) || contract.blockers.length < 5) errors.push("blockers must be visible");
  if (!Array.isArray(contract.forbiddenFiles) || !contract.forbiddenFiles.includes("projects/**") || !contract.forbiddenFiles.includes("db/**") || !contract.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!contract.disabledReason || /export now|stream logs|send telemetry|write metrics|execute now/i.test(contract.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(contract.evidenceRefs) || contract.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(contract.activityRefs) || contract.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildTelemetryEventContractEnvelope(input = {}) {
  const contract = createTelemetryEventContract(input);
  return createPassResult({
    phase: "P74.2",
    mode: "preview-only",
    source: "observability/p74-2-placeholder.js",
    summary: "Telemetry event contract recorded without enabling exporters, raw logs, DB writes, or network calls.",
    data: { contract },
    evidence: contract.evidenceRefs,
  });
}

export const P74_2_SAMPLE_CONTRACTS = Object.freeze([
  createTelemetryEventContract({
    evidenceRefs: ["reports/p742-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P74.2"],
  }),
]);
