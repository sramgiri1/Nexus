import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import { summarizeRedaction } from "./redaction.js";
import {
  ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES,
  ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
  buildAdminOperationsRuntimeSettingsModel,
  validateAdminOperationsRuntimeSettingsModel,
} from "./adminOperationsRuntimeSettingsModel.js";

export const ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE = "P142.3";
export const ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_VERSION = "1.0";

export const ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_SAFETY_FLAG_NAMES = Object.freeze([
  ...ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES,
  "dryRunExecutable",
  "dryRunHasExecutableCommand",
  "settingMutationPayloadPrepared",
  "featureTogglePayloadPrepared",
  "maintenanceExecutionPayloadPrepared",
  "maintenanceSchedulePayloadPrepared",
  "runtimeWritePayloadPrepared",
  "auditExportPayloadPrepared",
]);

const SOURCE_MODEL_PHASE = "P142.2";
const OWNER_CAPABILITY = "NEXUS Admin Operations Dry Run Guard";
const DISABLED_REASON = "P142.3 is a non-runnable admin operations dry run. Settings mutation, feature toggles, feature rollouts, maintenance execution, maintenance scheduling, runtime state mutation, DB/runtime writes, audit export, log content exposure, state content exposure, credential handling, secret value reads, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";

function zeroSafetyFlags() {
  return Object.fromEntries(ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

function asArray(value = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map((entry) => String(entry));
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function text(value, fallback) {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function costImpact() {
  return {
    estimatedUsd: 0,
    actualUsd: 0,
    providerSpendAllowed: false,
    networkCallsAllowed: false,
    deployJobsAllowed: false,
    exportJobsAllowed: false,
    packageJobsAllowed: false,
  };
}

function candidateCounts() {
  return {
    settingMutationCandidates: 0,
    featureToggleCandidates: 0,
    featureRolloutCandidates: 0,
    maintenanceExecutionCandidates: 0,
    maintenanceScheduleCandidates: 0,
    runtimeWriteCandidates: 0,
    auditExportCandidates: 0,
    providerCallCandidates: 0,
    modelCallCandidates: 0,
    toolExecutionCandidates: 0,
    mcpStartupCandidates: 0,
    agentDispatchCandidates: 0,
    projectMutationCandidates: 0,
    deployCandidates: 0,
    releaseCandidates: 0,
    exportCandidates: 0,
    packageCandidates: 0,
    networkCallCandidates: 0,
    providerSpendCandidates: 0,
  };
}

function defaultNextAction(category) {
  if (category === "setting") return "Review the blocked setting intent in P142.4 UX before any future authority phase considers mutation.";
  if (category === "featureGate") return "Review the blocked feature gate intent in P142.4 UX before any future authority phase considers toggles or rollout.";
  if (category === "maintenance") return "Review the blocked maintenance intent in P142.4 UX before any future authority phase considers scheduling or execution.";
  if (category === "runtimeState") return "Review the blocked runtime state intent in P142.4 UX before any future authority phase considers DB/runtime writes.";
  return "Review the blocked audit intent in P142.4 UX before any future authority phase considers audit export or raw log access.";
}

function rowRef(category, index) {
  return `admin-dry-run-${category}-${index + 1}`;
}

function sourceRefFor(category, item, index) {
  if (category === "setting") return item.settingRef || rowRef(category, index);
  if (category === "featureGate") return item.gateRef || rowRef(category, index);
  if (category === "maintenance") return item.controlRef || rowRef(category, index);
  if (category === "runtimeState") return item.stateRef || rowRef(category, index);
  return item.auditRef || rowRef(category, index);
}

export function buildAdminOperationDryRunRow(input = {}) {
  const category = text(input.category, "setting");
  const sourceItem = input.sourceItem || {};
  const index = Number.isFinite(Number(input.index)) ? Number(input.index) : 0;
  const sourceRef = text(input.sourceRef, sourceRefFor(category, sourceItem, index));
  const flags = zeroSafetyFlags();

  return {
    dryRunRef: text(input.dryRunRef, rowRef(category, index)),
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE,
    sourceModelPhase: SOURCE_MODEL_PHASE,
    sourceModelVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
    category,
    sourceRef,
    displayName: text(input.displayName, sourceItem.displayName || "Admin operation dry run"),
    currentState: text(input.currentState, sourceItem.currentState || sourceItem.captureState || sourceItem.healthState || "blocked"),
    dryRunState: "blocked",
    dryRunOnly: true,
    nonRunnable: true,
    localOnly: true,
    ownerCapability: text(input.ownerCapability, OWNER_CAPABILITY),
    requestedIntent: text(input.requestedIntent, `Preview ${category} posture without live authority.`),
    disabledReason: DISABLED_REASON,
    nextAction: text(input.nextAction, sourceItem.nextAction || defaultNextAction(category)),
    blockers: [
      ...asArray(sourceItem.blockers),
      "Dry run has no executable command or payload.",
      "All write, execution, export, provider, agent, project, deploy, package, network, and spend authority remains blocked.",
    ],
    evidenceRefs: [...new Set(["reports/p1423-admin-operations-runtime-settings-report.md", ...asArray(sourceItem.evidenceRefs)])],
    activityRefs: [...new Set(["os-roadmap/phase-status.json#P142.3", ...asArray(sourceItem.activityRefs)])],
    auditRefs: ["OS Roadmap > P142.3", "Activity Log > Admin Operations Dry Run"],
    costImpact: costImpact(),
    candidateCounts: candidateCounts(),
    settingMutationPayload: null,
    featureTogglePayload: null,
    maintenanceExecutionPayload: null,
    runtimeWritePayload: null,
    auditExportPayload: null,
    executableCommand: null,
    safetyFlags: flags,
    ...flags,
  };
}

export function validateAdminOperationDryRunRow(row = {}) {
  const errors = [];
  for (const field of ["dryRunRef", "phase", "sourceModelPhase", "category", "sourceRef", "displayName", "currentState", "dryRunState", "dryRunOnly", "nonRunnable", "localOnly", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "auditRefs", "costImpact", "candidateCounts", "safetyFlags"]) {
    if (!(field in row)) errors.push(`${field} is required`);
  }
  if (row.phase !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE) errors.push("phase must be P142.3");
  if (row.sourceModelPhase !== SOURCE_MODEL_PHASE) errors.push("sourceModelPhase must be P142.2");
  if (row.sourceModelVersion !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION) errors.push("sourceModelVersion must match P142.2 model version");
  if (row.dryRunState !== "blocked") errors.push("dryRunState must remain blocked");
  if (row.dryRunOnly !== true || row.nonRunnable !== true || row.localOnly !== true) errors.push("row must remain local non-runnable dry run");
  if (!Array.isArray(row.blockers) || row.blockers.length < 2) errors.push("blockers must explain blocked authority");
  if (!Array.isArray(row.evidenceRefs) || !row.evidenceRefs.includes("reports/p1423-admin-operations-runtime-settings-report.md")) errors.push("P142.3 evidence ref is required");
  if (!Array.isArray(row.auditRefs) || !row.auditRefs.includes("OS Roadmap > P142.3")) errors.push("P142.3 audit ref is required");
  for (const field of ["settingMutationPayload", "featureTogglePayload", "maintenanceExecutionPayload", "runtimeWritePayload", "auditExportPayload", "executableCommand"]) {
    if (row[field] !== null) errors.push(`${field} must remain null`);
  }
  if (Object.values(row.candidateCounts || {}).some((value) => value !== 0)) errors.push("candidate counts must remain zero");
  if (Object.values(row.safetyFlags || {}).some((value) => value !== false)) errors.push("safety flags must remain false");
  for (const flag of ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_SAFETY_FLAG_NAMES) {
    if (row[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (row.costImpact?.estimatedUsd !== 0 || row.costImpact?.actualUsd !== 0 || row.costImpact?.providerSpendAllowed !== false || row.costImpact?.networkCallsAllowed !== false) errors.push("cost impact must remain zero-spend");
  const serialized = JSON.stringify(row);
  if (/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("dry-run row must not expose raw private identifiers");
  if (/apply setting now|save setting now|toggle feature now|roll out now|run maintenance now|schedule maintenance now|export audit now|view raw logs now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(serialized)) errors.push("dry-run row must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw admin payload|raw runtime payload|raw setting payload|raw feature payload/i.test(serialized)) errors.push("dry-run row must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

function buildRows(model) {
  return [
    ...(model.settings || []).map((sourceItem, index) => buildAdminOperationDryRunRow({ category: "setting", sourceItem, index })),
    ...(model.featureGates || []).map((sourceItem, index) => buildAdminOperationDryRunRow({ category: "featureGate", sourceItem, index })),
    ...(model.maintenanceControls || []).map((sourceItem, index) => buildAdminOperationDryRunRow({ category: "maintenance", sourceItem, index })),
    ...(model.runtimeStates || []).map((sourceItem, index) => buildAdminOperationDryRunRow({ category: "runtimeState", sourceItem, index })),
    ...(model.auditSurfaces || []).map((sourceItem, index) => buildAdminOperationDryRunRow({ category: "audit", sourceItem, index })),
  ];
}

export function buildAdminOperationsRuntimeSettingsDryRun(input = {}) {
  const sourceModel = input.sourceModel || buildAdminOperationsRuntimeSettingsModel(input);
  const sourceValidation = validateAdminOperationsRuntimeSettingsModel(sourceModel);
  const dryRunRows = sourceValidation.valid ? buildRows(sourceModel) : [];
  const flags = zeroSafetyFlags();
  const redaction = summarizeRedaction({
    sourceScope: "NEXUS OS admin operations runtime settings dry run",
    sourceSurface: "P142.3 non-runnable admin dry run",
    sampleValue: "display-safe dry-run rows only; no raw IDs, credentials, secret values, state content, log content, or executable payloads",
  });

  return {
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE,
    schemaVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_VERSION,
    sourceModelPhase: SOURCE_MODEL_PHASE,
    sourceModelVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
    sourceModelValidation: sourceValidation.valid ? "valid" : "invalid",
    sourceModelErrors: [...sourceValidation.errors],
    mode: "admin-operations-runtime-settings-dry-run",
    dryRunOnly: true,
    nonRunnable: true,
    localOnly: true,
    commandCenterVisible: false,
    currentState: "admin_dry_run_ready_execution_blocked",
    ownerCapability: OWNER_CAPABILITY,
    disabledReason: DISABLED_REASON,
    nextAction: "Route this non-runnable dry run to P142.4 Command Center UX before any future admin authority phase is considered.",
    dryRunRows,
    dryRunRowCount: dryRunRows.length,
    blockedDryRunRowCount: dryRunRows.length,
    executableDryRunRowCount: 0,
    blockedActions: [
      "Settings mutation is blocked.",
      "Feature toggles and rollouts are blocked.",
      "Maintenance execution and scheduling are blocked.",
      "Runtime DB writes and runtime state mutation are blocked.",
      "Audit export, log content exposure, and state content exposure are blocked.",
      "Credential handling, secret reads, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend are blocked.",
    ],
    blockers: [
      ...asArray(sourceModel.blockers),
      "P142.3 creates no executable command.",
      "P142.3 creates no write, export, provider, tool, agent, project, deploy, release, package, network, or spend payload.",
    ],
    evidenceRefs: [...new Set(["reports/p1423-admin-operations-runtime-settings-report.md", ...asArray(sourceModel.evidenceRefs)])],
    activityRefs: [...new Set(["os-roadmap/phase-status.json#P142.3", ...asArray(sourceModel.activityRefs)])],
    auditRefs: ["OS Roadmap > P142.3", "Activity Log > Admin Operations Dry Run"],
    costImpact: costImpact(),
    candidateCounts: candidateCounts(),
    settingMutationPayload: null,
    featureTogglePayload: null,
    maintenanceExecutionPayload: null,
    runtimeWritePayload: null,
    auditExportPayload: null,
    executableCommand: null,
    redaction: {
      changed: redaction.changed,
      redactionCount: redaction.redactionCount,
      rawPrivateIdsVisible: false,
      rawInternalPayloadsVisible: false,
      rawStateExposureAllowed: false,
      rawLogExposureAllowed: false,
      credentialValuesVisible: false,
    },
    safetyFlags: flags,
    ...flags,
  };
}

export function validateAdminOperationsRuntimeSettingsDryRun(dryRun = {}) {
  const errors = [];
  if (dryRun.phase !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE) errors.push("phase must be P142.3");
  if (dryRun.schemaVersion !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_VERSION) errors.push("schemaVersion must be 1.0");
  if (dryRun.sourceModelPhase !== SOURCE_MODEL_PHASE) errors.push("sourceModelPhase must be P142.2");
  if (dryRun.sourceModelVersion !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION) errors.push("sourceModelVersion must match P142.2 model version");
  if (dryRun.sourceModelValidation !== "valid" || dryRun.sourceModelErrors?.length !== 0) errors.push("source model must validate");
  if (dryRun.mode !== "admin-operations-runtime-settings-dry-run") errors.push("mode must be admin-operations-runtime-settings-dry-run");
  if (dryRun.dryRunOnly !== true || dryRun.nonRunnable !== true || dryRun.localOnly !== true) errors.push("dry run must remain local and non-runnable");
  if (dryRun.commandCenterVisible !== false) errors.push("P142.3 dry run must not render directly in Command Center");
  if (!Array.isArray(dryRun.dryRunRows) || dryRun.dryRunRows.length < 10) errors.push("dryRunRows must include model settings, gates, maintenance, runtime state, and audit surfaces");
  for (const row of dryRun.dryRunRows || []) {
    const validation = validateAdminOperationDryRunRow(row);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${row.dryRunRef || "dry-run row"}: ${error}`));
  }
  if (dryRun.dryRunRowCount !== dryRun.dryRunRows?.length || dryRun.blockedDryRunRowCount !== dryRun.dryRunRows?.length || dryRun.executableDryRunRowCount !== 0) errors.push("dry-run row counts must remain blocked and non-executable");
  if (!Array.isArray(dryRun.blockedActions) || dryRun.blockedActions.length < 6) errors.push("blockedActions must summarize blocked authority");
  if (!Array.isArray(dryRun.blockers) || dryRun.blockers.length < 4) errors.push("blockers must summarize blocked authority");
  if (!Array.isArray(dryRun.evidenceRefs) || !dryRun.evidenceRefs.includes("reports/p1423-admin-operations-runtime-settings-report.md")) errors.push("P142.3 evidence ref is required");
  if (!Array.isArray(dryRun.auditRefs) || !dryRun.auditRefs.includes("OS Roadmap > P142.3")) errors.push("P142.3 audit ref is required");
  for (const field of ["settingMutationPayload", "featureTogglePayload", "maintenanceExecutionPayload", "runtimeWritePayload", "auditExportPayload", "executableCommand"]) {
    if (dryRun[field] !== null) errors.push(`${field} must remain null`);
  }
  if (Object.values(dryRun.candidateCounts || {}).some((value) => value !== 0)) errors.push("candidate counts must remain zero");
  if (dryRun.costImpact?.estimatedUsd !== 0 || dryRun.costImpact?.actualUsd !== 0 || dryRun.costImpact?.providerSpendAllowed !== false || dryRun.costImpact?.networkCallsAllowed !== false) errors.push("cost impact must remain zero-spend");
  if (dryRun.redaction?.rawPrivateIdsVisible !== false || dryRun.redaction?.rawInternalPayloadsVisible !== false || dryRun.redaction?.credentialValuesVisible !== false || dryRun.redaction?.rawStateExposureAllowed !== false || dryRun.redaction?.rawLogExposureAllowed !== false) errors.push("redaction must hide raw internals");
  if (Object.values(dryRun.safetyFlags || {}).some((value) => value !== false)) errors.push("safety flags must remain false");
  for (const flag of ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_SAFETY_FLAG_NAMES) {
    if (dryRun[flag] !== false) errors.push(`${flag} must be false`);
  }
  const serialized = JSON.stringify(dryRun);
  if (/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("dry run must not expose raw private identifiers");
  if (/apply setting now|save setting now|toggle feature now|roll out now|run maintenance now|schedule maintenance now|export audit now|view raw logs now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(serialized)) errors.push("dry run must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw admin payload|raw runtime payload|raw setting payload|raw feature payload/i.test(serialized)) errors.push("dry run must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

export function buildAdminOperationsRuntimeSettingsDryRunEnvelope(input = {}) {
  const dryRun = input.dryRun || buildAdminOperationsRuntimeSettingsDryRun(input);
  const validation = validateAdminOperationsRuntimeSettingsDryRun(dryRun);
  const envelope = createPassResult({
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE,
    mode: "admin-operations-runtime-settings-dry-run",
    source: "shared/adminOperationsRuntimeSettingsDryRun.js",
    summary: validation.valid
      ? "P142.3 admin operations dry run is valid and non-runnable; mutation and execution remain blocked."
      : "P142.3 admin operations dry run is invalid.",
    data: { dryRun },
    warnings: validation.valid ? [] : validation.errors,
    evidence: dryRun.evidenceRefs || [],
  });
  const envelopeValidation = validateResultEnvelope(envelope);
  return {
    ...envelope,
    ok: validation.valid && envelopeValidation.valid,
    status: validation.valid && envelopeValidation.valid ? "PASS" : "FAIL",
    errors: [...validation.errors, ...envelopeValidation.errors],
    envelopeValid: envelopeValidation.valid,
    envelopeErrors: envelopeValidation.errors,
  };
}
