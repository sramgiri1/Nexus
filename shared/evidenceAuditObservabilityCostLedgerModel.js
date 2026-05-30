import { createCostLedgerRecord, summarizeCostLedger, validateCostLedgerRecord } from "../cost-center/costLedgerSchema.js";
import { createActivityEvent, validateActivityEvent } from "../observability/activitySchema.js";
import { createEvidenceRecord, verifyEvidenceRecord } from "../runtime/evidenceRecord.js";
import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE = "P139.2";
export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION = "1.0";

export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES = Object.freeze([
  "ledgerWritesAllowed",
  "dbRuntimeWritesAllowed",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "mcpServerStartupAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "patchApplicationAllowed",
  "buildExecutionAllowed",
  "testExecutionAllowed",
  "rollbackExecutionAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "rawPrivateIdsVisible",
  "rawLedgerPayloadVisible",
  "rawJsonVisible",
  "rawLogsVisible",
  "rawPolicyDumpsVisible",
]);

const OWNER_CAPABILITY = "NEXUS Evidence Audit Observability Cost Ledger Guard";
const DEFAULT_INTENT = "Founder wants NEXUS to keep every future business build action traceable through evidence, audit, observability, and cost references.";
const DISABLED_REASON = "P139.2 defines a read-only ledger model. Ledger writes, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, patch application, build/test execution, rollback execution, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
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

function buildPolicyDecision() {
  return {
    decision: "RECORD_ONLY",
    executionAllowed: false,
    approvalRequiredBeforeWrite: true,
    disabledReason: DISABLED_REASON,
  };
}

function buildEvidenceLink(intent, createdAt) {
  const policyDecision = buildPolicyDecision();
  const evidenceRecord = createEvidenceRecord({
    recordId: "record-p139-ledger-model",
    createdAt,
    identityContext: {
      session: { sessionId: "session-p139-ledger-model" },
      originatingUser: { userId: "operator" },
      agent: {
        agentId: "NEXUS Ledger Guard",
        agentVersion: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION,
      },
      request: { taskId: "p139-ledger-model", projectId: "" },
      contextVersion: "1.0",
    },
    trafficRequest: {
      agentId: "NEXUS Ledger Guard",
      capabilityId: "evidence-audit-observability-cost-ledger-model",
      actionType: "ledger_model_preview",
      runtime: "local-model-only",
      provider: "",
      metadata: { taskId: "p139-ledger-model", projectId: "" },
    },
    policyDecision,
    inputForHash: { intent, phase: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE },
    outputForHash: { status: "model_ready_execution_blocked" },
  });
  const validation = verifyEvidenceRecord(evidenceRecord);
  return {
    evidenceRecord,
    validation,
    evidenceRefs: [
      "reports/p1392-evidence-audit-observability-cost-ledger-report.md",
      "reports/p1391-evidence-audit-observability-cost-ledger-report.md",
    ],
  };
}

function buildActivityLink(createdAt) {
  const activityEvent = createActivityEvent({
    activityId: "act_p139ledger",
    correlationId: "corr_p139ledger",
    timestamp: createdAt,
    level: "audit",
    category: "evidence",
    eventType: "audit_event_created",
    scope: "NEXUS_OS_CHANGE",
    mode: "public-safe",
    source: "checker",
    status: "blocked",
    decision: "REQUIRE_APPROVAL",
    summary: "P139.2 ledger model links evidence, audit, observability, and cost references without writing runtime state.",
    dataClassification: "internal",
    redacted: true,
    evidenceIds: ["record-p139-ledger-model"],
    auditIds: ["audit-p139-ledger-model"],
    relatedIds: ["cost-p139-ledger-model"],
    cost: {
      estimatedUsd: 0,
      actualUsd: 0,
      tokensIn: 0,
      tokensOut: 0,
    },
    metadata: {
      phase: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE,
      writesAllowed: false,
      providerSpendAllowed: false,
    },
  });
  return {
    activityEvent,
    validation: validateActivityEvent(activityEvent),
    activityRefs: ["reports/os-phase-status-report.md"],
    auditRefs: ["reports/p1392-evidence-audit-observability-cost-ledger-report.md"],
    observabilityRefs: ["observability/activitySchema.js", "observability/activityTypes.js"],
  };
}

function buildCostLink(createdAt) {
  const costRecord = createCostLedgerRecord({
    costRecordId: "cost-p139-ledger-model",
    eventType: "cost_estimate_created",
    sourceType: "os_phase",
    sourceId: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE,
    phaseId: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE,
    correlationId: "corr-p139-ledger",
    currency: "USD",
    estimatedUsd: 0,
    actualUsd: 0,
    estimatedTokens: 0,
    actualTokens: 0,
    decision: "RECORD_ONLY",
    status: "preview",
    dataClassification: "internal",
    redacted: true,
    createdAt,
    metadata: {
      scope: "P139.2 read-only ledger model",
      providerSpendAllowed: false,
      liveCostWritesAllowed: false,
    },
  });
  return {
    costRecord,
    validation: validateCostLedgerRecord(costRecord),
    costAttribution: {
      mode: "record-only-preview",
      estimatedUsd: costRecord.estimatedUsd,
      actualUsd: costRecord.actualUsd,
      estimatedTokens: costRecord.estimatedTokens,
      actualTokens: costRecord.actualTokens,
      providerSpendAllowed: false,
      liveCostWriteAllowed: false,
    },
  };
}

export function buildEvidenceAuditObservabilityCostLedgerRecord(input = {}) {
  const createdAt = normalizeText(input.createdAt, new Date().toISOString());
  const intent = normalizeText(input.intent || input.founderIdeaSummary, DEFAULT_INTENT);
  const evidenceLink = input.evidenceLink || buildEvidenceLink(intent, createdAt);
  const activityLink = input.activityLink || buildActivityLink(createdAt);
  const costLink = input.costLink || buildCostLink(createdAt);
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  const label = normalizeText(input.label, "Evidence, audit, observability, and cost model link");
  const ledgerType = normalizeText(input.ledgerType, "unified_trace");
  const policyDecision = buildPolicyDecision();

  return {
    ledgerRecordId: normalizeText(input.ledgerRecordId, `ledger-p139-${sequence}`),
    schemaVersion: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION,
    phase: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE,
    ledgerType,
    displayLabel: label,
    displaySummary: normalizeText(
      input.displaySummary,
      "Read-only ledger model record for future enterprise traceability."
    ),
    actionRef: {
      actionLabel: normalizeText(input.actionLabel, "Model traceability for future business build action"),
      actionType: normalizeText(input.actionType, "ledger_model_preview"),
      runnableNow: false,
      mutationAllowed: false,
      writeAllowed: false,
    },
    actorRef: {
      ownerCapability: OWNER_CAPABILITY,
      agentLabel: "NEXUS Ledger Guard",
      rawAgentIdVisible: false,
    },
    projectScope: {
      scopeLabel: "NEXUS OS model metadata only",
      projectMutationAllowed: false,
      privateProjectIdVisible: false,
      rawPathVisible: false,
    },
    evidenceRefs: asArray(input.evidenceRefs).length ? asArray(input.evidenceRefs) : [...evidenceLink.evidenceRefs],
    auditRefs: asArray(input.auditRefs).length ? asArray(input.auditRefs) : [...activityLink.auditRefs],
    activityRefs: asArray(input.activityRefs).length ? asArray(input.activityRefs) : [...activityLink.activityRefs],
    observabilityRefs: asArray(input.observabilityRefs).length
      ? asArray(input.observabilityRefs)
      : [...activityLink.observabilityRefs],
    evidenceRecord: {
      recordId: evidenceLink.evidenceRecord.recordId,
      recordHash: evidenceLink.evidenceRecord.recordHash,
      redacted: evidenceLink.evidenceRecord.redacted,
      valid: evidenceLink.validation.valid,
      warnings: evidenceLink.validation.warnings,
    },
    activityEvent: {
      activityId: activityLink.activityEvent.activityId,
      correlationId: activityLink.activityEvent.correlationId,
      category: activityLink.activityEvent.category,
      eventType: activityLink.activityEvent.eventType,
      status: activityLink.activityEvent.status,
      decision: activityLink.activityEvent.decision,
      redacted: activityLink.activityEvent.redacted,
      valid: activityLink.validation.ok,
    },
    costAttribution: { ...costLink.costAttribution },
    redactionState: {
      redacted: true,
      privateRawIdsVisible: false,
      rawLedgerPayloadVisible: false,
      rawJsonVisible: false,
      rawLogsVisible: false,
      rawPolicyDumpsVisible: false,
    },
    policyDecision,
    ownerCapability: OWNER_CAPABILITY,
    disabledReason: DISABLED_REASON,
    nextAction: "Route the read-only ledger model to P139.3 evidence preview before any persistence or live write path.",
    createdAt,
  };
}

export function validateEvidenceAuditObservabilityCostLedgerRecord(record = {}) {
  const errors = [];
  if (record.schemaVersion !== EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION) errors.push("schemaVersion must be 1.0");
  if (record.phase !== EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE) errors.push("phase must be P139.2");
  for (const field of [
    "ledgerRecordId",
    "ledgerType",
    "displayLabel",
    "displaySummary",
    "actionRef",
    "actorRef",
    "projectScope",
    "evidenceRefs",
    "auditRefs",
    "activityRefs",
    "observabilityRefs",
    "costAttribution",
    "redactionState",
    "policyDecision",
    "ownerCapability",
    "disabledReason",
    "nextAction",
    "createdAt",
  ]) {
    if (!(field in record)) errors.push(`${field} missing`);
  }
  if (record.actionRef?.runnableNow !== false || record.actionRef?.mutationAllowed !== false || record.actionRef?.writeAllowed !== false) errors.push("actionRef must remain non-runnable and non-writable");
  if (record.actorRef?.rawAgentIdVisible !== false) errors.push("actorRef must hide raw agent IDs");
  if (record.projectScope?.projectMutationAllowed !== false || record.projectScope?.privateProjectIdVisible !== false || record.projectScope?.rawPathVisible !== false) errors.push("projectScope must block mutation and hide raw paths");
  for (const field of ["evidenceRefs", "auditRefs", "activityRefs", "observabilityRefs"]) {
    if (!Array.isArray(record[field]) || record[field].length === 0) errors.push(`${field} must be a non-empty array`);
  }
  if (record.costAttribution?.estimatedUsd !== 0 || record.costAttribution?.actualUsd !== 0 || record.costAttribution?.providerSpendAllowed !== false || record.costAttribution?.liveCostWriteAllowed !== false) errors.push("costAttribution must remain zero-spend and non-writable");
  if (record.redactionState?.redacted !== true || record.redactionState?.privateRawIdsVisible !== false || record.redactionState?.rawLedgerPayloadVisible !== false || record.redactionState?.rawJsonVisible !== false || record.redactionState?.rawLogsVisible !== false || record.redactionState?.rawPolicyDumpsVisible !== false) errors.push("redactionState must remain display-safe");
  if (record.policyDecision?.decision !== "RECORD_ONLY" || record.policyDecision?.executionAllowed !== false || record.policyDecision?.approvalRequiredBeforeWrite !== true) errors.push("policyDecision must remain record-only and blocked");
  if (record.evidenceRecord?.redacted !== true || record.evidenceRecord?.valid !== true) errors.push("evidenceRecord summary must be valid and redacted");
  if (record.activityEvent?.redacted !== true || record.activityEvent?.valid !== true) errors.push("activityEvent summary must be valid and redacted");
  if (!record.disabledReason || !/remain blocked/i.test(record.disabledReason)) errors.push("disabledReason must explain blocked execution");
  return { valid: errors.length === 0, errors };
}

export function buildEvidenceAuditObservabilityCostLedgerModel(input = {}) {
  const intent = normalizeText(input.intent || input.founderIdeaSummary, DEFAULT_INTENT);
  const createdAt = normalizeText(input.createdAt, new Date().toISOString());
  const modeGuard = buildModeGuardResult(input.mode || "public-safe", ["public-safe", "test", "local-private"]);
  const evidenceLink = buildEvidenceLink(intent, createdAt);
  const activityLink = buildActivityLink(createdAt);
  const costLink = buildCostLink(createdAt);
  const ledgerRecords = [
    buildEvidenceAuditObservabilityCostLedgerRecord({
      sequence: 1,
      ledgerRecordId: "ledger-p139-evidence",
      ledgerType: "evidence_audit_link",
      label: "Evidence and audit link",
      displaySummary: "Connects future action evidence to audit references without writing runtime state.",
      actionLabel: "Capture future evidence and audit reference",
      actionType: "evidence_audit_reference_model",
      evidenceLink,
      activityLink,
      costLink,
      createdAt,
    }),
    buildEvidenceAuditObservabilityCostLedgerRecord({
      sequence: 2,
      ledgerRecordId: "ledger-p139-observability",
      ledgerType: "observability_activity_link",
      label: "Activity and observability link",
      displaySummary: "Connects future activity and observability references while keeping log content summarized.",
      actionLabel: "Capture future activity and observability reference",
      actionType: "activity_observability_reference_model",
      evidenceLink,
      activityLink,
      costLink,
      createdAt,
    }),
    buildEvidenceAuditObservabilityCostLedgerRecord({
      sequence: 3,
      ledgerRecordId: "ledger-p139-cost",
      ledgerType: "cost_attribution_link",
      label: "Cost attribution link",
      displaySummary: "Connects future cost attribution to zero-spend preview records before spend is allowed.",
      actionLabel: "Capture future cost attribution reference",
      actionType: "cost_attribution_reference_model",
      evidenceLink,
      activityLink,
      costLink,
      createdAt,
    }),
  ];
  const costLedgerRecords = [costLink.costRecord];
  const redactionSummary = summarizeRedaction({
    ledgerRecords,
    costLedgerRecords,
    evidenceRecord: evidenceLink.evidenceRecord,
    activityEvent: activityLink.activityEvent,
  });
  const safetyFlags = blockedSafetyFlags();

  return {
    phase: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE,
    version: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION,
    mode: "evidence-audit-observability-cost-ledger-model",
    modelOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: true,
    currentState: "ledger_model_ready_writes_blocked",
    modeGuard,
    intentSummary: intent,
    ledgerRecords,
    ledgerSummary: {
      recordCount: ledgerRecords.length,
      evidenceRefCount: ledgerRecords.reduce((total, record) => total + record.evidenceRefs.length, 0),
      auditRefCount: ledgerRecords.reduce((total, record) => total + record.auditRefs.length, 0),
      activityRefCount: ledgerRecords.reduce((total, record) => total + record.activityRefs.length, 0),
      observabilityRefCount: ledgerRecords.reduce((total, record) => total + record.observabilityRefs.length, 0),
      writeCandidateCount: 0,
      runtimeWriteCandidateCount: 0,
      providerSpendCandidateCount: 0,
      allRecordsRedacted: ledgerRecords.every((record) => record.redactionState.redacted === true),
    },
    evidenceRefs: [...new Set(ledgerRecords.flatMap((record) => record.evidenceRefs))],
    auditRefs: [...new Set(ledgerRecords.flatMap((record) => record.auditRefs))],
    activityRefs: [...new Set(ledgerRecords.flatMap((record) => record.activityRefs))],
    observabilityRefs: [...new Set(ledgerRecords.flatMap((record) => record.observabilityRefs))],
    costLedgerRecords,
    costSummary: summarizeCostLedger(costLedgerRecords),
    evidenceRecordValidation: evidenceLink.validation,
    activityEventValidation: activityLink.validation,
    costRecordValidation: costLink.validation,
    ownerAgentCapability: OWNER_CAPABILITY,
    nextAction: "Route this read-only ledger model to P139.3 evidence preview without persisting ledger records.",
    blockers: [
      "Ledger persistence is not enabled.",
      "DB/runtime writes remain blocked.",
      "Provider/model calls, tool execution, MCP startup, and agent dispatch remain blocked.",
      "Project mutation, patch application, build/test execution, and rollback execution remain blocked.",
      "Deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    disabledReason: DISABLED_REASON,
    costImpact: "Zero-spend read-only ledger model. It reuses cost schema records with zero estimated and actual spend.",
    redaction: {
      changed: redactionSummary.changed,
      redactionCount: redactionSummary.redactionCount,
    },
    safetyFlags,
    ...safetyFlags,
  };
}

export function validateEvidenceAuditObservabilityCostLedgerModel(model = {}) {
  const errors = [];
  if (model.phase !== EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE) errors.push("phase must be P139.2");
  if (model.version !== EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_VERSION) errors.push("version must be 1.0");
  if (model.mode !== "evidence-audit-observability-cost-ledger-model") errors.push("mode must be evidence-audit-observability-cost-ledger-model");
  if (model.modelOnly !== true || model.readOnly !== true || model.localOnly !== true) errors.push("model must remain local read-only metadata");
  if (model.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  if (!Array.isArray(model.ledgerRecords) || model.ledgerRecords.length < 3) errors.push("ledgerRecords must include evidence, observability, and cost links");
  for (const record of model.ledgerRecords || []) {
    const validation = validateEvidenceAuditObservabilityCostLedgerRecord(record);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${record.ledgerRecordId || "record"}: ${error}`));
  }
  if (model.ledgerSummary?.recordCount !== model.ledgerRecords?.length) errors.push("ledgerSummary recordCount mismatch");
  if (model.ledgerSummary?.writeCandidateCount !== 0 || model.ledgerSummary?.runtimeWriteCandidateCount !== 0 || model.ledgerSummary?.providerSpendCandidateCount !== 0) errors.push("ledgerSummary must keep writes and spend at zero candidates");
  if (model.ledgerSummary?.allRecordsRedacted !== true) errors.push("ledgerSummary must confirm redaction");
  for (const field of ["evidenceRefs", "auditRefs", "activityRefs", "observabilityRefs", "costLedgerRecords", "blockers"]) {
    if (!Array.isArray(model[field]) || model[field].length === 0) errors.push(`${field} must be a non-empty array`);
  }
  if (model.evidenceRecordValidation?.valid !== true) errors.push("evidence record validation must pass");
  if (model.activityEventValidation?.ok !== true) errors.push("activity event validation must pass");
  if (model.costRecordValidation?.valid !== true) errors.push("cost record validation must pass");
  if (model.costSummary?.estimatedUsd !== 0 || model.costSummary?.actualUsd !== 0) errors.push("cost summary must stay zero-spend");
  for (const record of model.costLedgerRecords || []) {
    const validation = validateCostLedgerRecord(record);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `cost: ${error}`));
  }
  if (!model.ownerAgentCapability || !model.nextAction || !model.disabledReason || !model.costImpact) errors.push("operator-facing summary fields are required");
  if (!/without persisting/i.test(model.nextAction)) errors.push("nextAction must route to preview without persistence");
  if (!/Zero-spend/i.test(model.costImpact)) errors.push("costImpact must say zero-spend");
  if (typeof model.redaction?.changed !== "boolean" || typeof model.redaction?.redactionCount !== "number") errors.push("redaction summary is required");
  for (const flag of EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES) {
    if (model[flag] !== false) errors.push(`${flag} must be false`);
    if (model.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }

  const serialized = JSON.stringify(model);
  if (/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|ledger)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("model must not expose raw private IDs");
  if (/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|call provider now|dispatch agent now|mutate project now|apply patch now|run build now|run tests now|deploy now|release now|export now|package now|spend now/i.test(serialized)) errors.push("model must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw registry dump|raw ledger payload/i.test(serialized)) errors.push("model must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}

export function buildEvidenceAuditObservabilityCostLedgerEnvelope(input = {}) {
  const model = input.model || buildEvidenceAuditObservabilityCostLedgerModel(input);
  const validation = validateEvidenceAuditObservabilityCostLedgerModel(model);
  const result = createPassResult({
    phase: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PHASE,
    mode: "evidence-audit-observability-cost-ledger-model",
    source: "shared/evidenceAuditObservabilityCostLedgerModel.js",
    summary: validation.valid
      ? "P139.2 read-only ledger model is valid; persistence and execution remain blocked."
      : "P139.2 read-only ledger model is invalid.",
    data: model,
    errors: validation.errors,
    evidence: model.evidenceRefs || [],
  });
  const envelopeValidation = validateResultEnvelope(result);
  if (!validation.valid || !envelopeValidation.valid) {
    return {
      ...result,
      ok: false,
      status: "FAIL",
      errors: [...validation.errors, ...envelopeValidation.errors],
    };
  }
  return result;
}
