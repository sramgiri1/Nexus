import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE = "P142.2";
export const ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION = "1.0";

export const ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES = Object.freeze([
  "settingsMutationAllowed",
  "featureToggleAllowed",
  "featureRolloutAllowed",
  "maintenanceExecutionAllowed",
  "maintenanceSchedulingAllowed",
  "runtimeDbWriteAllowed",
  "runtimeStateMutationAllowed",
  "rawStateExposureAllowed",
  "rawLogExposureAllowed",
  "auditExportAllowed",
  "credentialHandlingAllowed",
  "secretValueReadAllowed",
  "providerModelCallAllowed",
  "toolExecutionAllowed",
  "mcpStartupAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageAllowed",
  "networkCallAllowed",
  "providerSpendAllowed",
  "rawPrivateIdsVisible",
  "rawInternalPayloadsVisible",
]);

const OWNER_CAPABILITY = "NEXUS Admin Operations Runtime Settings Guard";
const DEFAULT_CREATED_AT = "2026-05-31T12:10:00.000Z";
const DISABLED_REASON = "P142.2 defines a read-only admin operations settings model. Settings mutation, feature toggles, feature rollouts, maintenance execution, maintenance scheduling, runtime state mutation, DB/runtime writes, audit export, raw log exposure, raw state exposure, credential handling, secret value reads, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

function normalizeText(value = "", fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function asArray(value = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function displayRef(prefix, sequence) {
  return `${prefix}-${Number.isFinite(Number(sequence)) ? Number(sequence) : 1}`;
}

function evidenceRefs(extra = []) {
  return [...new Set(["reports/p1422-admin-operations-runtime-settings-report.md", ...asArray(extra)])];
}

function activityRefs(extra = []) {
  return [...new Set(["os-roadmap/phase-status.json#P142.2", ...asArray(extra)])];
}

function hasUnsafeIdentifier(value) {
  return /(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(value));
}

function buildRedactionState(input = {}) {
  const redaction = summarizeRedaction({
    sourceScope: input.sourceScope || "NEXUS OS admin operations runtime settings",
    sourceSurface: input.sourceSurface || "P142.2 read-only settings model",
    sampleValue: input.sampleValue || "display-safe labels only; no private IDs, credentials, secret values, raw state, or raw logs",
  });
  return {
    redacted: true,
    redactionChecked: true,
    redactionChanged: redaction.changed,
    rawPrivateIdsVisible: false,
    rawInternalPayloadsVisible: false,
    rawStateExposureAllowed: false,
    rawLogExposureAllowed: false,
    credentialValuesVisible: false,
  };
}

function buildCostImpact() {
  return {
    estimatedUsd: 0,
    actualUsd: 0,
    providerSpendAllowed: false,
    networkCallsAllowed: false,
    exportJobsAllowed: false,
    packageJobsAllowed: false,
  };
}

export function buildAdminSettingsPolicy(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    settingRef: normalizeText(input.settingRef, displayRef("admin-setting", sequence)),
    schemaVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE,
    displayName: normalizeText(input.displayName, "Admin operations posture"),
    category: normalizeText(input.category, "operations"),
    currentState: normalizeText(input.currentState, "read_only_review"),
    allowedValues: asArray(input.allowedValues).length ? asArray(input.allowedValues) : ["review_only", "blocked"],
    mutationAllowed: false,
    requiresApproval: true,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route this read-only setting to P142.3 dry run before any settings mutation authority."),
    blockers: [
      "Settings write APIs are not enabled.",
      "Runtime DB writes and state mutation remain blocked.",
      ...asArray(input.blockers),
    ],
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateAdminSettingsPolicy(policy = {}) {
  const errors = [];
  for (const field of ["settingRef", "displayName", "category", "currentState", "allowedValues", "mutationAllowed", "requiresApproval", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "costImpact", "authorityFlags"]) {
    if (!(field in policy)) errors.push(`${field} is required`);
  }
  if (policy.phase !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE) errors.push("phase must be P142.2");
  if (!Array.isArray(policy.allowedValues) || policy.allowedValues.length === 0) errors.push("allowedValues are required");
  if (policy.mutationAllowed !== false) errors.push("mutationAllowed must remain false");
  if (policy.requiresApproval !== true) errors.push("requiresApproval must remain true");
  if (!Array.isArray(policy.blockers) || policy.blockers.length === 0) errors.push("blockers are required");
  if (!Array.isArray(policy.evidenceRefs) || policy.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(policy.activityRefs) || policy.activityRefs.length === 0) errors.push("activityRefs are required");
  if (Object.values(policy.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (!/remain blocked/i.test(policy.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (hasUnsafeIdentifier(policy)) errors.push("policy must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildAdminFeatureGate(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    gateRef: normalizeText(input.gateRef, displayRef("feature-gate", sequence)),
    schemaVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE,
    displayName: normalizeText(input.displayName, "Feature gate posture"),
    scope: normalizeText(input.scope, "NEXUS OS"),
    currentState: normalizeText(input.currentState, "blocked"),
    toggleAllowed: false,
    rolloutAllowed: false,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    blockers: [
      "Feature toggle writes are not enabled.",
      "Feature rollout authority remains blocked.",
      ...asArray(input.blockers),
    ],
    nextAction: normalizeText(input.nextAction, "Route this gate to P142.3 dry run without toggling or rollout."),
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateAdminFeatureGate(gate = {}) {
  const errors = [];
  for (const field of ["gateRef", "displayName", "scope", "currentState", "toggleAllowed", "rolloutAllowed", "ownerCapability", "disabledReason", "blockers", "nextAction", "evidenceRefs", "activityRefs", "costImpact", "authorityFlags"]) {
    if (!(field in gate)) errors.push(`${field} is required`);
  }
  if (gate.phase !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE) errors.push("phase must be P142.2");
  if (gate.toggleAllowed !== false || gate.rolloutAllowed !== false) errors.push("toggle and rollout authority must remain false");
  if (!Array.isArray(gate.blockers) || gate.blockers.length === 0) errors.push("blockers are required");
  if (Object.values(gate.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(gate)) errors.push("gate must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildAdminMaintenanceControl(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    controlRef: normalizeText(input.controlRef, displayRef("maintenance-control", sequence)),
    schemaVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE,
    displayName: normalizeText(input.displayName, "Maintenance control posture"),
    operationType: normalizeText(input.operationType, "runtime_maintenance_review"),
    currentState: normalizeText(input.currentState, "review_only"),
    executionAllowed: false,
    scheduleAllowed: false,
    requiresApproval: true,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route this maintenance control to P142.3 dry run without execution or scheduling."),
    blockers: [
      "Maintenance executor is not enabled.",
      "Maintenance scheduling remains blocked.",
      ...asArray(input.blockers),
    ],
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateAdminMaintenanceControl(control = {}) {
  const errors = [];
  for (const field of ["controlRef", "displayName", "operationType", "currentState", "executionAllowed", "scheduleAllowed", "requiresApproval", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "costImpact", "authorityFlags"]) {
    if (!(field in control)) errors.push(`${field} is required`);
  }
  if (control.phase !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE) errors.push("phase must be P142.2");
  if (control.executionAllowed !== false || control.scheduleAllowed !== false) errors.push("maintenance execution and scheduling must remain false");
  if (control.requiresApproval !== true) errors.push("requiresApproval must remain true");
  if (Object.values(control.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(control)) errors.push("control must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildRuntimeOperationalState(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    stateRef: normalizeText(input.stateRef, displayRef("runtime-state", sequence)),
    schemaVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE,
    displayName: normalizeText(input.displayName, "Runtime operational state posture"),
    runtimeArea: normalizeText(input.runtimeArea, "command_center"),
    healthState: normalizeText(input.healthState, "display_safe"),
    lastCheckedLabel: normalizeText(input.lastCheckedLabel, "validation report refresh"),
    rawStateExposureAllowed: false,
    rawLogExposureAllowed: false,
    dbWriteAllowed: false,
    runtimeStateMutationAllowed: false,
    providerCallAllowed: false,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    blockers: [
      "Runtime state writers are not enabled.",
      "Raw state and raw log exposure remain blocked.",
      ...asArray(input.blockers),
    ],
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    redactionState: buildRedactionState(input),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateRuntimeOperationalState(state = {}) {
  const errors = [];
  for (const field of ["stateRef", "displayName", "runtimeArea", "healthState", "lastCheckedLabel", "rawStateExposureAllowed", "rawLogExposureAllowed", "dbWriteAllowed", "runtimeStateMutationAllowed", "providerCallAllowed", "ownerCapability", "disabledReason", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in state)) errors.push(`${field} is required`);
  }
  if (state.phase !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE) errors.push("phase must be P142.2");
  for (const field of ["rawStateExposureAllowed", "rawLogExposureAllowed", "dbWriteAllowed", "runtimeStateMutationAllowed", "providerCallAllowed"]) {
    if (state[field] !== false) errors.push(`${field} must remain false`);
  }
  if (state.redactionState?.rawPrivateIdsVisible !== false || state.redactionState?.rawStateExposureAllowed !== false || state.redactionState?.rawLogExposureAllowed !== false) errors.push("redaction state must hide raw internals");
  if (Object.values(state.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(state)) errors.push("state must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildAdminAuditSurface(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    auditRef: normalizeText(input.auditRef, displayRef("admin-audit", sequence)),
    schemaVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE,
    displayName: normalizeText(input.displayName, "Admin audit posture"),
    eventClass: normalizeText(input.eventClass, "admin_operations_review"),
    captureState: normalizeText(input.captureState, "display_only"),
    rawLogExposureAllowed: false,
    exportAllowed: false,
    retentionPolicyRef: normalizeText(input.retentionPolicyRef, "display-safe-retention-policy-reference"),
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route this audit surface to P142.3 dry run without audit export or raw log access."),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateAdminAuditSurface(audit = {}) {
  const errors = [];
  for (const field of ["auditRef", "displayName", "eventClass", "captureState", "rawLogExposureAllowed", "exportAllowed", "retentionPolicyRef", "ownerCapability", "evidenceRefs", "activityRefs", "disabledReason", "nextAction", "costImpact", "authorityFlags"]) {
    if (!(field in audit)) errors.push(`${field} is required`);
  }
  if (audit.phase !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE) errors.push("phase must be P142.2");
  if (audit.rawLogExposureAllowed !== false || audit.exportAllowed !== false) errors.push("audit export and raw log exposure must remain false");
  if (!Array.isArray(audit.evidenceRefs) || audit.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (Object.values(audit.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(audit)) errors.push("audit must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildAdminOperationsRuntimeSettingsModel(input = {}) {
  const createdAt = normalizeText(input.createdAt, DEFAULT_CREATED_AT);
  const modeGuard = buildModeGuardResult(input.mode || "public-safe", ["public-safe", "test", "local-private"]);
  const settings = input.settings || [
    buildAdminSettingsPolicy({ sequence: 1, displayName: "Command Center admin posture", category: "command_center" }),
    buildAdminSettingsPolicy({ sequence: 2, displayName: "Runtime governance posture", category: "runtime_governance" }),
    buildAdminSettingsPolicy({ sequence: 3, displayName: "Evidence retention posture", category: "evidence_retention" }),
  ];
  const featureGates = input.featureGates || [
    buildAdminFeatureGate({ sequence: 1, displayName: "Live execution unlock gate", scope: "runtime authority" }),
    buildAdminFeatureGate({ sequence: 2, displayName: "Provider access gate", scope: "provider authority" }),
    buildAdminFeatureGate({ sequence: 3, displayName: "Project mutation gate", scope: "workspace authority" }),
  ];
  const maintenanceControls = input.maintenanceControls || [
    buildAdminMaintenanceControl({ sequence: 1, displayName: "Runtime health maintenance", operationType: "runtime_health_review" }),
    buildAdminMaintenanceControl({ sequence: 2, displayName: "Evidence retention maintenance", operationType: "retention_review" }),
  ];
  const runtimeStates = input.runtimeStates || [
    buildRuntimeOperationalState({ sequence: 1, displayName: "Command Center runtime state", runtimeArea: "command_center" }),
    buildRuntimeOperationalState({ sequence: 2, displayName: "Agent orchestration runtime state", runtimeArea: "agent_orchestration" }),
  ];
  const auditSurfaces = input.auditSurfaces || [
    buildAdminAuditSurface({ sequence: 1, displayName: "Settings review audit surface", eventClass: "settings_review" }),
    buildAdminAuditSurface({ sequence: 2, displayName: "Maintenance review audit surface", eventClass: "maintenance_review" }),
  ];
  const safetyFlags = blockedSafetyFlags();
  const redaction = summarizeRedaction({
    settings,
    featureGates,
    maintenanceControls,
    runtimeStates,
    auditSurfaces,
  });

  return {
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE,
    schemaVersion: ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
    mode: "read-only-admin-operations-settings-model",
    modelOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    currentState: "settings_model_ready_runtime_blocked",
    modeGuard,
    ownerCapability: OWNER_CAPABILITY,
    settings,
    featureGates,
    maintenanceControls,
    runtimeStates,
    auditSurfaces,
    readinessSummary: {
      settingCount: settings.length,
      featureGateCount: featureGates.length,
      maintenanceControlCount: maintenanceControls.length,
      runtimeStateCount: runtimeStates.length,
      auditSurfaceCount: auditSurfaces.length,
      runnableActionCount: 0,
      mutationCandidateCount: 0,
      writeCandidateCount: 0,
      exportCandidateCount: 0,
      providerSpendCandidateCount: 0,
      nextAction: "Route P142.2 model output to P142.3 admin dry run.",
    },
    blockers: [
      "Settings mutation, feature toggles, and feature rollouts remain blocked.",
      "Maintenance execution and scheduling remain blocked.",
      "Runtime DB writes, runtime state mutation, raw state exposure, and log content exposure remain blocked.",
      "Credential handling, secret reads, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    disabledReason: DISABLED_REASON,
    nextAction: "Route the read-only settings model to P142.3 dry run before any admin operation is considered.",
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    costImpact: buildCostImpact(),
    redaction: {
      changed: redaction.changed,
      redactionCount: redaction.redactionCount,
      rawPrivateIdsVisible: false,
      rawInternalPayloadsVisible: false,
      credentialValuesVisible: false,
    },
    safetyFlags,
    ...safetyFlags,
    createdAt,
  };
}

export function validateAdminOperationsRuntimeSettingsModel(model = {}) {
  const errors = [];
  if (model.phase !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE) errors.push("phase must be P142.2");
  if (model.schemaVersion !== ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION) errors.push("schemaVersion must be 1.0");
  if (model.mode !== "read-only-admin-operations-settings-model") errors.push("mode must be read-only-admin-operations-settings-model");
  if (model.modelOnly !== true || model.readOnly !== true || model.localOnly !== true) errors.push("model must remain local read-only metadata");
  if (model.commandCenterVisible !== false) errors.push("P142.2 model must not render directly in Command Center");
  if (!model.modeGuard?.ok) errors.push("mode guard must pass");
  if (!Array.isArray(model.settings) || model.settings.length < 3) errors.push("at least three settings are required");
  if (!Array.isArray(model.featureGates) || model.featureGates.length < 3) errors.push("at least three feature gates are required");
  if (!Array.isArray(model.maintenanceControls) || model.maintenanceControls.length < 2) errors.push("at least two maintenance controls are required");
  if (!Array.isArray(model.runtimeStates) || model.runtimeStates.length < 2) errors.push("at least two runtime states are required");
  if (!Array.isArray(model.auditSurfaces) || model.auditSurfaces.length < 2) errors.push("at least two audit surfaces are required");

  for (const policy of model.settings || []) {
    const validation = validateAdminSettingsPolicy(policy);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${policy.settingRef || "setting"}: ${error}`));
  }
  for (const gate of model.featureGates || []) {
    const validation = validateAdminFeatureGate(gate);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${gate.gateRef || "gate"}: ${error}`));
  }
  for (const control of model.maintenanceControls || []) {
    const validation = validateAdminMaintenanceControl(control);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${control.controlRef || "maintenance"}: ${error}`));
  }
  for (const state of model.runtimeStates || []) {
    const validation = validateRuntimeOperationalState(state);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${state.stateRef || "state"}: ${error}`));
  }
  for (const audit of model.auditSurfaces || []) {
    const validation = validateAdminAuditSurface(audit);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${audit.auditRef || "audit"}: ${error}`));
  }

  if (model.readinessSummary?.runnableActionCount !== 0 || model.readinessSummary?.mutationCandidateCount !== 0 || model.readinessSummary?.writeCandidateCount !== 0 || model.readinessSummary?.exportCandidateCount !== 0 || model.readinessSummary?.providerSpendCandidateCount !== 0) errors.push("readiness summary must keep runnable, mutation, write, export, and spend candidates at zero");
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) errors.push("blockers must summarize blocked authority");
  if (!Array.isArray(model.evidenceRefs) || model.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(model.activityRefs) || model.activityRefs.length === 0) errors.push("activityRefs are required");
  if (model.costImpact?.estimatedUsd !== 0 || model.costImpact?.actualUsd !== 0 || model.costImpact?.providerSpendAllowed !== false || model.costImpact?.networkCallsAllowed !== false) errors.push("cost impact must remain zero-spend and local-only");
  if (model.redaction?.rawPrivateIdsVisible !== false || model.redaction?.rawInternalPayloadsVisible !== false || model.redaction?.credentialValuesVisible !== false) errors.push("redaction must hide raw internals and credential values");
  for (const flag of ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES) {
    if (model[flag] !== false) errors.push(`${flag} must be false`);
    if (model.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (!/remain blocked/i.test(model.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (!/without|before/i.test(model.nextAction || "")) errors.push("nextAction must route forward without authority");
  if (hasUnsafeIdentifier(model)) errors.push("model must not expose raw private identifiers");
  const serialized = JSON.stringify(model);
  if (/apply setting now|save setting now|toggle feature now|roll out now|run maintenance now|schedule maintenance now|export audit now|view raw logs now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(serialized)) errors.push("model must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw admin payload|raw runtime payload|raw setting payload|raw feature payload/i.test(serialized)) errors.push("model must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

export function buildAdminOperationsRuntimeSettingsEnvelope(input = {}) {
  const model = input.model || buildAdminOperationsRuntimeSettingsModel(input);
  const validation = validateAdminOperationsRuntimeSettingsModel(model);
  const envelope = createPassResult({
    phase: ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE,
    mode: "read-only-admin-operations-settings-model",
    source: "shared/adminOperationsRuntimeSettingsModel.js",
    summary: validation.valid
      ? "P142.2 read-only admin operations settings model is valid; mutation and execution remain blocked."
      : "P142.2 read-only admin operations settings model is invalid.",
    data: { model },
    warnings: validation.valid ? [] : validation.errors,
    evidence: model.evidenceRefs || [],
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
