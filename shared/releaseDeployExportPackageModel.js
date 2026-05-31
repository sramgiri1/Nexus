import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE = "P143.2";
export const RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_VERSION = "1.0";

export const RELEASE_DEPLOY_EXPORT_PACKAGE_SAFETY_FLAG_NAMES = Object.freeze([
  "releasePackageCreationAllowed",
  "deployStartAllowed",
  "rollbackExecutionAllowed",
  "exportExecutionAllowed",
  "packageBuildAllowed",
  "patchApplicationAllowed",
  "buildTestExecutionAllowed",
  "dbRuntimeWriteAllowed",
  "providerModelCallAllowed",
  "toolExecutionAllowed",
  "mcpStartupAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "networkCallAllowed",
  "spendAllowed",
  "rawPrivateIdsVisible",
  "rawInternalPayloadsVisible",
]);

const OWNER_CAPABILITY = "NEXUS Release Deploy Export Package Guard";
const DEFAULT_CREATED_AT = "2026-05-31T18:40:00.000Z";
const DISABLED_REASON = "P143.2 defines a read-only release, deploy, export, and package model. Release package creation, deploy start, rollback execution, export execution, package build, patch application, build/test execution, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(RELEASE_DEPLOY_EXPORT_PACKAGE_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
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
  return [...new Set(["reports/p1432-release-deploy-export-package-pipeline-report.md", ...asArray(extra)])];
}

function activityRefs(extra = []) {
  return [...new Set(["os-roadmap/phase-status.json#P143.2", ...asArray(extra)])];
}

function hasUnsafeIdentifier(value) {
  return /(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|release|deploy|export|package|rollback|artifact|provenance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(value));
}

function buildCostImpact() {
  return {
    estimatedUsd: 0,
    actualUsd: 0,
    providerSpendAllowed: false,
    networkCallsAllowed: false,
    exportJobsAllowed: false,
    packageJobsAllowed: false,
    deployJobsAllowed: false,
  };
}

function buildRedactionState(input = {}) {
  const redaction = summarizeRedaction({
    sourceScope: input.sourceScope || "NEXUS OS release deploy export package model",
    sourceSurface: input.sourceSurface || "P143.2 read-only shipping model",
    sampleValue: input.sampleValue || "display-safe labels only; no private IDs, credentials, storage URLs, or raw payloads",
  });
  return {
    redacted: true,
    redactionChecked: true,
    redactionChanged: redaction.changed,
    rawPrivateIdsVisible: false,
    rawInternalPayloadsVisible: false,
    credentialValuesVisible: false,
    storageUrlsVisible: false,
  };
}

export function buildReleaseGate(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    gateRef: normalizeText(input.gateRef, displayRef("release-gate", sequence)),
    schemaVersion: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_VERSION,
    phase: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE,
    displayName: normalizeText(input.displayName, "Release readiness gate"),
    stage: normalizeText(input.stage, "release_review"),
    currentState: normalizeText(input.currentState, "blocked_until_approval"),
    approvalRequired: true,
    executionAllowed: false,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route this gate to P143.3 preview before any release package authority is considered."),
    blockers: [
      "Release package creation remains blocked.",
      "Project mutation and package build authority remain blocked.",
      ...asArray(input.blockers),
    ],
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateReleaseGate(gate = {}) {
  const errors = [];
  for (const field of ["gateRef", "displayName", "stage", "currentState", "approvalRequired", "executionAllowed", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "costImpact", "authorityFlags"]) {
    if (!(field in gate)) errors.push(`${field} is required`);
  }
  if (gate.phase !== RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE) errors.push("phase must be P143.2");
  if (gate.approvalRequired !== true) errors.push("approvalRequired must remain true");
  if (gate.executionAllowed !== false) errors.push("executionAllowed must remain false");
  if (!Array.isArray(gate.blockers) || gate.blockers.length === 0) errors.push("blockers are required");
  if (Object.values(gate.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (!/remain blocked/i.test(gate.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (hasUnsafeIdentifier(gate)) errors.push("release gate must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildDeployTarget(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    targetRef: normalizeText(input.targetRef, displayRef("deploy-target", sequence)),
    schemaVersion: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_VERSION,
    phase: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE,
    displayName: normalizeText(input.displayName, "Deploy target posture"),
    environment: normalizeText(input.environment, "review_environment"),
    currentState: normalizeText(input.currentState, "not_deployable"),
    deployAllowed: false,
    rollbackAllowed: false,
    requiresApproval: true,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route this target to P143.3 preview without starting deployment or rollback."),
    blockers: [
      "Deploy start authority remains blocked.",
      "Rollback execution remains blocked.",
      ...asArray(input.blockers),
    ],
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    redactionState: buildRedactionState(input),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateDeployTarget(target = {}) {
  const errors = [];
  for (const field of ["targetRef", "displayName", "environment", "currentState", "deployAllowed", "rollbackAllowed", "requiresApproval", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in target)) errors.push(`${field} is required`);
  }
  if (target.phase !== RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE) errors.push("phase must be P143.2");
  if (target.deployAllowed !== false || target.rollbackAllowed !== false) errors.push("deploy and rollback authority must remain false");
  if (target.requiresApproval !== true) errors.push("requiresApproval must remain true");
  if (target.redactionState?.rawPrivateIdsVisible !== false || target.redactionState?.rawInternalPayloadsVisible !== false) errors.push("redaction state must hide raw internals");
  if (Object.values(target.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(target)) errors.push("deploy target must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildExportPackageArtifact(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    artifactRef: normalizeText(input.artifactRef, displayRef("shipping-artifact", sequence)),
    schemaVersion: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_VERSION,
    phase: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE,
    displayName: normalizeText(input.displayName, "Package artifact posture"),
    artifactType: normalizeText(input.artifactType, "release_package_review"),
    creationAllowed: false,
    exportAllowed: false,
    includesPrivateData: false,
    provenanceRequired: true,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route this artifact to P143.3 preview without building or exporting it."),
    blockers: [
      "Package build authority remains blocked.",
      "Export execution remains blocked.",
      ...asArray(input.blockers),
    ],
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    redactionState: buildRedactionState(input),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateExportPackageArtifact(artifact = {}) {
  const errors = [];
  for (const field of ["artifactRef", "displayName", "artifactType", "creationAllowed", "exportAllowed", "includesPrivateData", "provenanceRequired", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in artifact)) errors.push(`${field} is required`);
  }
  if (artifact.phase !== RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE) errors.push("phase must be P143.2");
  if (artifact.creationAllowed !== false || artifact.exportAllowed !== false) errors.push("creation and export authority must remain false");
  if (artifact.includesPrivateData !== false) errors.push("artifact must not include private data");
  if (artifact.provenanceRequired !== true) errors.push("provenanceRequired must remain true");
  if (Object.values(artifact.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(artifact)) errors.push("artifact must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildProvenanceRecord(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    provenanceRef: normalizeText(input.provenanceRef, displayRef("provenance-record", sequence)),
    schemaVersion: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_VERSION,
    phase: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE,
    displayName: normalizeText(input.displayName, "Provenance record posture"),
    captureState: normalizeText(input.captureState, "metadata_review_only"),
    rawPayloadExposureAllowed: false,
    signingAllowed: false,
    exportAllowed: false,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route provenance metadata to P143.3 preview without signing or export."),
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    redactionState: buildRedactionState(input),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateProvenanceRecord(record = {}) {
  const errors = [];
  for (const field of ["provenanceRef", "displayName", "captureState", "rawPayloadExposureAllowed", "signingAllowed", "exportAllowed", "ownerCapability", "disabledReason", "nextAction", "evidenceRefs", "activityRefs", "redactionState", "costImpact", "authorityFlags"]) {
    if (!(field in record)) errors.push(`${field} is required`);
  }
  if (record.phase !== RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE) errors.push("phase must be P143.2");
  for (const field of ["rawPayloadExposureAllowed", "signingAllowed", "exportAllowed"]) {
    if (record[field] !== false) errors.push(`${field} must remain false`);
  }
  if (record.redactionState?.rawInternalPayloadsVisible !== false) errors.push("provenance must hide raw payloads");
  if (Object.values(record.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(record)) errors.push("provenance must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildRollbackPlan(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  return {
    rollbackRef: normalizeText(input.rollbackRef, displayRef("rollback-plan", sequence)),
    schemaVersion: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_VERSION,
    phase: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE,
    displayName: normalizeText(input.displayName, "Rollback plan posture"),
    rollbackType: normalizeText(input.rollbackType, "release_review_rollback"),
    previewAllowed: true,
    executionAllowed: false,
    requiresApproval: true,
    ownerCapability: normalizeText(input.ownerCapability, OWNER_CAPABILITY),
    disabledReason: DISABLED_REASON,
    nextAction: normalizeText(input.nextAction, "Route this rollback plan to P143.3 preview without execution."),
    blockers: [
      "Rollback executor remains blocked.",
      "Deploy mitigation authority remains blocked.",
      ...asArray(input.blockers),
    ],
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    costImpact: buildCostImpact(),
    authorityFlags: blockedSafetyFlags(),
  };
}

export function validateRollbackPlan(plan = {}) {
  const errors = [];
  for (const field of ["rollbackRef", "displayName", "rollbackType", "previewAllowed", "executionAllowed", "requiresApproval", "ownerCapability", "disabledReason", "nextAction", "blockers", "evidenceRefs", "activityRefs", "costImpact", "authorityFlags"]) {
    if (!(field in plan)) errors.push(`${field} is required`);
  }
  if (plan.phase !== RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE) errors.push("phase must be P143.2");
  if (plan.previewAllowed !== true) errors.push("previewAllowed must remain true");
  if (plan.executionAllowed !== false) errors.push("executionAllowed must remain false");
  if (plan.requiresApproval !== true) errors.push("requiresApproval must remain true");
  if (Object.values(plan.authorityFlags || {}).some((value) => value !== false)) errors.push("all authority flags must remain false");
  if (hasUnsafeIdentifier(plan)) errors.push("rollback plan must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildReleaseDeployExportPackageModel(input = {}) {
  const createdAt = normalizeText(input.createdAt, DEFAULT_CREATED_AT);
  const modeGuard = buildModeGuardResult(input.mode || "public-safe", ["public-safe", "test", "local-private"]);
  const releaseGates = input.releaseGates || [
    buildReleaseGate({ sequence: 1, displayName: "Founder PRD release gate", stage: "prd_release_review" }),
    buildReleaseGate({ sequence: 2, displayName: "Agent workstream release gate", stage: "agent_workstream_review" }),
    buildReleaseGate({ sequence: 3, displayName: "Validation evidence release gate", stage: "validation_review" }),
  ];
  const deployTargets = input.deployTargets || [
    buildDeployTarget({ sequence: 1, displayName: "Local review environment", environment: "local_review" }),
    buildDeployTarget({ sequence: 2, displayName: "Operator approval environment", environment: "operator_review" }),
  ];
  const exportPackages = input.exportPackages || [
    buildExportPackageArtifact({ sequence: 1, displayName: "PRD package review", artifactType: "prd_package_review" }),
    buildExportPackageArtifact({ sequence: 2, displayName: "Validation evidence package review", artifactType: "evidence_package_review" }),
    buildExportPackageArtifact({ sequence: 3, displayName: "Founder handoff package review", artifactType: "handoff_package_review" }),
  ];
  const provenanceRecords = input.provenanceRecords || [
    buildProvenanceRecord({ sequence: 1, displayName: "Source provenance posture", captureState: "source_metadata_review" }),
    buildProvenanceRecord({ sequence: 2, displayName: "Validation provenance posture", captureState: "validation_metadata_review" }),
  ];
  const rollbackPlans = input.rollbackPlans || [
    buildRollbackPlan({ sequence: 1, displayName: "Release rollback review", rollbackType: "release_review" }),
    buildRollbackPlan({ sequence: 2, displayName: "Deploy rollback review", rollbackType: "deploy_review" }),
  ];
  const safetyFlags = blockedSafetyFlags();
  const redaction = summarizeRedaction({
    releaseGates,
    deployTargets,
    exportPackages,
    provenanceRecords,
    rollbackPlans,
  });

  return {
    phase: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE,
    schemaVersion: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_VERSION,
    mode: "read-only-release-deploy-export-package-model",
    modelOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    currentState: "release_model_ready_authority_blocked",
    modeGuard,
    ownerCapability: OWNER_CAPABILITY,
    releaseGates,
    deployTargets,
    exportPackages,
    provenanceRecords,
    rollbackPlans,
    readinessSummary: {
      releaseGateCount: releaseGates.length,
      deployTargetCount: deployTargets.length,
      exportPackageCount: exportPackages.length,
      provenanceRecordCount: provenanceRecords.length,
      rollbackPlanCount: rollbackPlans.length,
      runnableActionCount: 0,
      deployCandidateCount: 0,
      exportCandidateCount: 0,
      packageCandidateCount: 0,
      rollbackExecutionCandidateCount: 0,
      providerSpendCandidateCount: 0,
      nextAction: "Route P143.2 model output to P143.3 deploy/export/package preview.",
    },
    blockers: [
      "Release package creation, package build, and export execution remain blocked.",
      "Deploy start and rollback execution remain blocked.",
      "Patch application, build/test execution, DB/runtime writes, and project mutation remain blocked.",
      "Provider/model calls, tool execution, MCP startup, agent dispatch, network calls, and spend remain blocked.",
    ],
    disabledReason: DISABLED_REASON,
    nextAction: "Route the read-only model to P143.3 preview before any shipping authority is considered.",
    evidenceRefs: evidenceRefs(input.evidenceRefs),
    activityRefs: activityRefs(input.activityRefs),
    costImpact: buildCostImpact(),
    redaction: {
      changed: redaction.changed,
      redactionCount: redaction.redactionCount,
      rawPrivateIdsVisible: false,
      rawInternalPayloadsVisible: false,
      credentialValuesVisible: false,
      storageUrlsVisible: false,
    },
    safetyFlags,
    ...safetyFlags,
    createdAt,
  };
}

export function validateReleaseDeployExportPackageModel(model = {}) {
  const errors = [];
  if (model.phase !== RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE) errors.push("phase must be P143.2");
  if (model.schemaVersion !== RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_VERSION) errors.push("schemaVersion must be 1.0");
  if (model.mode !== "read-only-release-deploy-export-package-model") errors.push("mode must be read-only-release-deploy-export-package-model");
  if (model.modelOnly !== true || model.readOnly !== true || model.localOnly !== true) errors.push("model must remain local read-only metadata");
  if (model.commandCenterVisible !== false) errors.push("P143.2 model must not render directly in Command Center");
  if (!model.modeGuard?.ok) errors.push("mode guard must pass");
  if (!Array.isArray(model.releaseGates) || model.releaseGates.length < 3) errors.push("at least three release gates are required");
  if (!Array.isArray(model.deployTargets) || model.deployTargets.length < 2) errors.push("at least two deploy targets are required");
  if (!Array.isArray(model.exportPackages) || model.exportPackages.length < 3) errors.push("at least three export package artifacts are required");
  if (!Array.isArray(model.provenanceRecords) || model.provenanceRecords.length < 2) errors.push("at least two provenance records are required");
  if (!Array.isArray(model.rollbackPlans) || model.rollbackPlans.length < 2) errors.push("at least two rollback plans are required");

  for (const gate of model.releaseGates || []) {
    const validation = validateReleaseGate(gate);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${gate.gateRef || "release gate"}: ${error}`));
  }
  for (const target of model.deployTargets || []) {
    const validation = validateDeployTarget(target);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${target.targetRef || "deploy target"}: ${error}`));
  }
  for (const artifact of model.exportPackages || []) {
    const validation = validateExportPackageArtifact(artifact);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${artifact.artifactRef || "artifact"}: ${error}`));
  }
  for (const record of model.provenanceRecords || []) {
    const validation = validateProvenanceRecord(record);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${record.provenanceRef || "provenance"}: ${error}`));
  }
  for (const plan of model.rollbackPlans || []) {
    const validation = validateRollbackPlan(plan);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${plan.rollbackRef || "rollback"}: ${error}`));
  }

  if (model.readinessSummary?.runnableActionCount !== 0 || model.readinessSummary?.deployCandidateCount !== 0 || model.readinessSummary?.exportCandidateCount !== 0 || model.readinessSummary?.packageCandidateCount !== 0 || model.readinessSummary?.rollbackExecutionCandidateCount !== 0 || model.readinessSummary?.providerSpendCandidateCount !== 0) errors.push("readiness summary must keep runnable, deploy, export, package, rollback, and spend candidates at zero");
  if (!Array.isArray(model.blockers) || model.blockers.length < 4) errors.push("blockers must summarize blocked authority");
  if (!Array.isArray(model.evidenceRefs) || model.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(model.activityRefs) || model.activityRefs.length === 0) errors.push("activityRefs are required");
  if (model.costImpact?.estimatedUsd !== 0 || model.costImpact?.actualUsd !== 0 || model.costImpact?.providerSpendAllowed !== false || model.costImpact?.networkCallsAllowed !== false) errors.push("cost impact must remain zero-spend and local-only");
  if (model.redaction?.rawPrivateIdsVisible !== false || model.redaction?.rawInternalPayloadsVisible !== false || model.redaction?.credentialValuesVisible !== false || model.redaction?.storageUrlsVisible !== false) errors.push("redaction must hide raw internals, credential values, and storage URLs");
  for (const flag of RELEASE_DEPLOY_EXPORT_PACKAGE_SAFETY_FLAG_NAMES) {
    if (model[flag] !== false) errors.push(`${flag} must be false`);
    if (model.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (!/remain blocked/i.test(model.disabledReason || "")) errors.push("disabledReason must explain blocked authority");
  if (!/without|before/i.test(model.nextAction || "")) errors.push("nextAction must route forward without authority");
  if (hasUnsafeIdentifier(model)) errors.push("model must not expose raw private identifiers");
  const serialized = JSON.stringify(model);
  if (/create release now|create package now|start deploy now|deploy now|run rollback now|rollback now|run export now|export now|package now|apply patch now|run build now|run tests now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(serialized)) errors.push("model must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw release payload|raw deploy payload|raw export payload|raw package payload|raw provenance payload/i.test(serialized)) errors.push("model must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

export function buildReleaseDeployExportPackageEnvelope(input = {}) {
  const model = input.model || buildReleaseDeployExportPackageModel(input);
  const validation = validateReleaseDeployExportPackageModel(model);
  const envelope = createPassResult({
    phase: RELEASE_DEPLOY_EXPORT_PACKAGE_MODEL_PHASE,
    mode: "read-only-release-deploy-export-package-model",
    source: "shared/releaseDeployExportPackageModel.js",
    summary: validation.valid
      ? "P143.2 read-only release, deploy, export, and package model is valid; shipping authority remains blocked."
      : "P143.2 read-only release, deploy, export, and package model is invalid.",
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
