import {
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES,
  buildEvidenceAuditObservabilityCostLedgerModel,
  validateEvidenceAuditObservabilityCostLedgerModel,
} from "./evidenceAuditObservabilityCostLedgerModel.js";
import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_PHASE = "P139.3";
export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_VERSION = "1.0";

export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_SAFETY_FLAG_NAMES = Object.freeze([
  ...EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES,
  "previewPersistsRecords",
  "previewExposesRawPayloads",
]);

const OWNER_CAPABILITY = "NEXUS Evidence Audit Observability Cost Ledger Preview";
const DISABLED_REASON = "P139.3 renders a local read-only evidence preview. Ledger writes, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, patch application, build/test execution, rollback execution, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

function normalizeRows(model = {}) {
  return (model.ledgerRecords || []).map((record, index) => ({
    rowKey: `preview-p139-${index + 1}`,
    label: record.displayLabel || `Ledger preview ${index + 1}`,
    currentState: "ready_for_operator_review_execution_blocked",
    evidenceLocation: (record.evidenceRefs || [])[0] || "reports/p1393-evidence-audit-observability-cost-ledger-report.md",
    auditLocation: (record.auditRefs || [])[0] || "reports/p1393-evidence-audit-observability-cost-ledger-report.md",
    activityLocation: (record.activityRefs || [])[0] || "reports/os-phase-status-report.md",
    observabilityLocation: (record.observabilityRefs || [])[0] || "observability/activitySchema.js",
    costImpact: "Zero spend preview",
    ownerCapability: record.ownerCapability || OWNER_CAPABILITY,
    nextAction: "Review this preview in P139.4 Command Center UX before any future persistence path.",
    disabledReason: record.disabledReason || DISABLED_REASON,
    ledgerWritesAllowed: false,
    dbRuntimeWritesAllowed: false,
    providerCallsAllowed: false,
    modelCallsAllowed: false,
    toolExecutionAllowed: false,
    agentDispatchAllowed: false,
    projectMutationAllowed: false,
    deployAllowed: false,
    releaseAllowed: false,
    exportAllowed: false,
    packageCreationAllowed: false,
    networkCallsAllowed: false,
    providerSpendAllowed: false,
    rawPrivateIdsVisible: false,
    rawPayloadsVisible: false,
  }));
}

function buildPreviewSections(rows = [], model = {}) {
  return [
    {
      sectionKey: "traceability-links",
      title: "Traceability Links",
      currentState: rows.length > 0 ? "preview_ready_execution_blocked" : "preview_needs_model",
      summary: "Display-safe evidence, audit, activity, and observability references are grouped for operator review.",
      rowKeys: rows.map((row) => row.rowKey),
      nextAction: "Route grouped traceability rows to P139.4 Command Center UX.",
      disabledReason: DISABLED_REASON,
    },
    {
      sectionKey: "safety-gates",
      title: "Safety Gates",
      currentState: "all_execution_blocked",
      summary: "Every write, execution, mutation, network, deploy, package, and spend authority remains blocked.",
      rowKeys: rows.map((row) => row.rowKey),
      nextAction: "Keep preview read-only until a later phase explicitly grants authority.",
      disabledReason: DISABLED_REASON,
    },
    {
      sectionKey: "cost-attribution",
      title: "Cost Attribution",
      currentState: model.costSummary?.actualUsd === 0 ? "zero_spend_preview" : "invalid_cost_state",
      summary: "Cost attribution is visible as zero-spend preview metadata only.",
      rowKeys: rows.map((row) => row.rowKey),
      nextAction: "Carry zero-spend cost metadata to P139.4 UX without enabling provider spend.",
      disabledReason: DISABLED_REASON,
    },
  ];
}

export function buildEvidenceAuditObservabilityCostLedgerPreview(input = {}) {
  const sourceModel = input.model || buildEvidenceAuditObservabilityCostLedgerModel(input);
  const sourceValidation = validateEvidenceAuditObservabilityCostLedgerModel(sourceModel);
  const modeGuard = buildModeGuardResult(input.mode || "public-safe", ["public-safe", "test", "local-private"]);
  const previewRows = sourceValidation.valid ? normalizeRows(sourceModel) : [];
  const previewSections = buildPreviewSections(previewRows, sourceModel);
  const previewReady = sourceValidation.valid && previewRows.length >= 3 && previewSections.length === 3;
  const safetyFlags = blockedSafetyFlags();
  const redactionSummary = summarizeRedaction({ previewRows, previewSections });

  return createPassResult({
    phase: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_PHASE,
    mode: "evidence-audit-observability-cost-ledger-preview",
    source: "shared/evidenceAuditObservabilityCostLedgerPreview.js",
    summary: "P139.3 safe evidence preview is assembled locally from the P139.2 ledger model while persistence and execution remain blocked.",
    data: {
      schemaVersion: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_VERSION,
      currentState: previewReady
        ? "ledger_evidence_preview_ready_execution_blocked"
        : "ledger_evidence_preview_needs_valid_model",
      previewMode: "read-only-local-evidence-preview",
      previewOnly: true,
      readOnly: true,
      localOnly: true,
      commandCenterVisible: true,
      sourceModel: {
        phase: sourceModel.phase,
        version: sourceModel.version,
        currentState: sourceModel.currentState,
        recordCount: sourceModel.ledgerSummary?.recordCount || 0,
        evidenceRefCount: sourceModel.ledgerSummary?.evidenceRefCount || 0,
        auditRefCount: sourceModel.ledgerSummary?.auditRefCount || 0,
        activityRefCount: sourceModel.ledgerSummary?.activityRefCount || 0,
        observabilityRefCount: sourceModel.ledgerSummary?.observabilityRefCount || 0,
        writeCandidateCount: sourceModel.ledgerSummary?.writeCandidateCount || 0,
        providerSpendCandidateCount: sourceModel.ledgerSummary?.providerSpendCandidateCount || 0,
      },
      sourceModelValidation: sourceValidation.valid ? "valid" : "invalid",
      modeGuard,
      previewSummary: {
        sectionCount: previewSections.length,
        rowCount: previewRows.length,
        blockedRowCount: previewRows.filter((row) => row.ledgerWritesAllowed === false).length,
        zeroSpend: sourceModel.costSummary?.estimatedUsd === 0 && sourceModel.costSummary?.actualUsd === 0,
        readyForCommandCenterUx: previewReady,
      },
      previewSections,
      previewRows,
      allowedLocalOperations: [
        "render display-safe preview rows",
        "review evidence and audit locations",
        "review activity and observability locations",
        "review zero-spend cost attribution",
      ],
      forbiddenOperations: [
        "write ledger records",
        "write DB/runtime records",
        "call providers or models",
        "execute tools or workers",
        "dispatch agents",
        "mutate projects",
        "deploy, release, export, or package",
        "use network calls or provider spend",
      ],
      evidenceRefs: [
        "reports/p1393-evidence-audit-observability-cost-ledger-report.md",
        ...(sourceModel.evidenceRefs || []),
      ],
      auditRefs: sourceModel.auditRefs || [],
      activityRefs: sourceModel.activityRefs || [],
      observabilityRefs: sourceModel.observabilityRefs || [],
      costImpact: "Zero-spend local preview only. No provider/model calls, network calls, deploy, package creation, or provider spend.",
      disabledReason: DISABLED_REASON,
      ownerCapability: OWNER_CAPABILITY,
      nextAction: "Route this safe preview to P139.4 Observability Command Center UX without persisting ledger records.",
      blockers: [
        "Ledger persistence remains blocked.",
        "DB/runtime writes remain blocked.",
        "Provider/model calls, tool execution, MCP startup, and agent dispatch remain blocked.",
        "Project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
      ],
      redaction: {
        changed: redactionSummary.changed,
        redactionCount: redactionSummary.redactionCount,
      },
      previewSafety: {
        rendersInMemoryOnly: true,
        writesLedger: false,
        writesDb: false,
        writesRuntime: false,
        mutatesProjects: false,
        dispatchesAgents: false,
        callsProviders: false,
        callsModels: false,
        executesTools: false,
        startsMcpServers: false,
        usesNetwork: false,
        deploysReleasesExportsPackages: false,
        spendsBudget: false,
        exposesRawPayloads: false,
      },
      safetyFlags,
      ...safetyFlags,
    },
    evidence: [
      "reports/p1393-evidence-audit-observability-cost-ledger-report.md",
      "reports/p1392-evidence-audit-observability-cost-ledger-report.md",
    ],
    warnings: [
      "P139.3 is a local read-only preview only and does not persist evidence, audit, observability, or cost ledger records.",
    ],
  });
}

export function validateEvidenceAuditObservabilityCostLedgerPreview(envelope = {}) {
  const errors = [];
  const envelopeValidation = validateResultEnvelope(envelope);
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors);
  const data = envelope.data || {};
  if (envelope.phase !== EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_PHASE) errors.push("phase must be P139.3");
  for (const field of [
    "schemaVersion",
    "currentState",
    "previewMode",
    "previewOnly",
    "readOnly",
    "localOnly",
    "commandCenterVisible",
    "sourceModel",
    "sourceModelValidation",
    "previewSummary",
    "previewSections",
    "previewRows",
    "allowedLocalOperations",
    "forbiddenOperations",
    "evidenceRefs",
    "auditRefs",
    "activityRefs",
    "observabilityRefs",
    "costImpact",
    "disabledReason",
    "ownerCapability",
    "nextAction",
    "blockers",
    "previewSafety",
    "safetyFlags",
  ]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.schemaVersion !== EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_VERSION) errors.push("schemaVersion must be 1.0");
  if (data.previewMode !== "read-only-local-evidence-preview") errors.push("previewMode must remain read-only-local-evidence-preview");
  if (data.previewOnly !== true || data.readOnly !== true || data.localOnly !== true) errors.push("preview must remain local read-only metadata");
  if (data.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  if (data.sourceModel?.phase !== "P139.2" || data.sourceModelValidation !== "valid") errors.push("preview must reuse a valid P139.2 source model");
  if (!Array.isArray(data.previewRows) || data.previewRows.length < 3) errors.push("previewRows must include at least three rows");
  if (!Array.isArray(data.previewSections) || data.previewSections.length !== 3) errors.push("previewSections must include three sections");
  if (data.previewSummary?.rowCount !== data.previewRows?.length) errors.push("previewSummary rowCount mismatch");
  if (data.previewSummary?.blockedRowCount !== data.previewRows?.length) errors.push("all preview rows must remain blocked");
  if (data.previewSummary?.zeroSpend !== true) errors.push("previewSummary must confirm zero spend");
  for (const row of data.previewRows || []) {
    for (const flag of [
      "ledgerWritesAllowed",
      "dbRuntimeWritesAllowed",
      "providerCallsAllowed",
      "modelCallsAllowed",
      "toolExecutionAllowed",
      "agentDispatchAllowed",
      "projectMutationAllowed",
      "deployAllowed",
      "releaseAllowed",
      "exportAllowed",
      "packageCreationAllowed",
      "networkCallsAllowed",
      "providerSpendAllowed",
      "rawPrivateIdsVisible",
      "rawPayloadsVisible",
    ]) {
      if (row[flag] !== false) errors.push(`${row.rowKey}.${flag} must be false`);
    }
    if (!row.label || !row.currentState || !row.nextAction || !row.disabledReason || !row.ownerCapability) {
      errors.push(`${row.rowKey} missing operator fields`);
    }
  }
  for (const field of ["evidenceRefs", "auditRefs", "activityRefs", "observabilityRefs", "allowedLocalOperations", "forbiddenOperations", "blockers"]) {
    if (!Array.isArray(data[field]) || data[field].length === 0) errors.push(`${field} must be a non-empty array`);
  }
  for (const flag of [
    "writesLedger",
    "writesDb",
    "writesRuntime",
    "mutatesProjects",
    "dispatchesAgents",
    "callsProviders",
    "callsModels",
    "executesTools",
    "startsMcpServers",
    "usesNetwork",
    "deploysReleasesExportsPackages",
    "spendsBudget",
    "exposesRawPayloads",
  ]) {
    if (data.previewSafety?.[flag] !== false) errors.push(`previewSafety.${flag} must be false`);
  }
  if (data.previewSafety?.rendersInMemoryOnly !== true) errors.push("previewSafety.rendersInMemoryOnly must be true");
  for (const flag of EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_SAFETY_FLAG_NAMES) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.safetyFlags?.[flag] !== false) errors.push(`safetyFlags.${flag} must be false`);
  }
  if (!/without persisting/i.test(data.nextAction || "")) errors.push("nextAction must route to UX without persistence");
  if (!/Zero-spend/i.test(data.costImpact || "")) errors.push("costImpact must state zero-spend");
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|ledger)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized)) errors.push("preview must not expose raw private IDs");
  if (/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|call provider now|dispatch agent now|mutate project now|apply patch now|run build now|run tests now|deploy now|release now|export now|package now|spend now/i.test(serialized)) errors.push("preview must not expose fake runnable actions");
  if (/raw json|raw logs|raw policy dump|raw registry dump|raw ledger payload/i.test(serialized)) errors.push("preview must not expose raw dumps");
  return { valid: errors.length === 0, errors };
}
