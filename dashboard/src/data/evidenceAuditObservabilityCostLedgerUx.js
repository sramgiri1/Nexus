import { buildEvidenceAuditObservabilityCostLedgerUxProjection } from "../../../shared/evidenceAuditObservabilityCostLedgerUxProjection.js";

export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PHASE = "P139.4";
export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_VERSION = "1.0";

const DEFAULT_PREVIEW = buildEvidenceAuditObservabilityCostLedgerUxProjection();

function toDisplayState(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildSummaryRows(data = {}) {
  const source = data.sourceModel || {};
  const summary = data.previewSummary || {};
  return [
    { label: "What changed", value: "Evidence, audit, activity, observability, and cost links are visible in Command Center." },
    { label: "Current state", value: toDisplayState(data.currentState || "preview ready execution blocked") },
    { label: "Next action", value: data.nextAction || "Review the ledger preview before any future persistence path." },
    { label: "Owner", value: data.ownerCapability || "NEXUS Evidence Audit Observability Cost Ledger Preview" },
    { label: "Evidence", value: "Ledger preview evidence report" },
    { label: "Activity", value: "OS phase status report" },
    { label: "Cost impact", value: data.costImpact || "Zero spend preview" },
    { label: "Source model", value: `Ledger model, ${source.recordCount || 0} records, ${summary.rowCount || 0} display rows` },
  ];
}

function buildPreviewCards(data = {}) {
  const source = data.sourceModel || {};
  const summary = data.previewSummary || {};
  return [
    {
      label: "Trace rows",
      value: `${summary.rowCount || 0}`,
      tone: "teal",
      detail: "Display-safe rows connect evidence, audit, activity, observability, and cost references.",
    },
    {
      label: "Blocked rows",
      value: `${summary.blockedRowCount || 0}`,
      tone: "amber",
      detail: "Every row remains read-only; ledger writes and execution stay disabled.",
    },
    {
      label: "Reference links",
      value: `${(source.evidenceRefCount || 0) + (source.auditRefCount || 0) + (source.activityRefCount || 0) + (source.observabilityRefCount || 0)}`,
      tone: "teal",
      detail: "References are display locations only, not raw records or private IDs.",
    },
    {
      label: "Spend",
      value: summary.zeroSpend ? "Zero" : "Review",
      tone: summary.zeroSpend ? "green" : "amber",
      detail: "No provider/model calls, network calls, deploy, package creation, or provider spend.",
    },
  ];
}

function buildTraceRows(data = {}) {
  return (data.previewRows || []).map((row) => ({
    label: row.label,
    currentState: toDisplayState(row.currentState),
    ownerCapability: row.ownerCapability,
    evidenceLocation: "Ledger preview evidence report",
    auditLocation: "Audit summary report",
    activityLocation: "OS activity status report",
    observabilityLocation: "Activity schema reference",
    costImpact: row.costImpact,
    nextAction: row.nextAction,
    disabledReason: row.disabledReason,
  }));
}

function buildSafetyRows(data = {}) {
  const safety = data.previewSafety || {};
  return [
    { label: "Ledger writes", value: safety.writesLedger ? "Enabled" : "Blocked" },
    { label: "DB/runtime writes", value: safety.writesDb || safety.writesRuntime ? "Enabled" : "Blocked" },
    { label: "Provider/model calls", value: safety.callsProviders || safety.callsModels ? "Enabled" : "Blocked" },
    { label: "Tool or worker execution", value: safety.executesTools ? "Enabled" : "Blocked" },
    { label: "Agent dispatch", value: safety.dispatchesAgents ? "Enabled" : "Blocked" },
    { label: "Project mutation", value: safety.mutatesProjects ? "Enabled" : "Blocked" },
    { label: "Network or spend", value: safety.usesNetwork || safety.spendsBudget ? "Enabled" : "Blocked" },
    { label: "Raw records", value: safety.exposesRawPayloads ? "Visible" : "Hidden" },
  ];
}

export function buildEvidenceAuditObservabilityCostLedgerUxViewModel(input = {}) {
  const previewEnvelope = input.previewEnvelope || DEFAULT_PREVIEW;
  const rawData = previewEnvelope.data || previewEnvelope;
  const data = {
    ...rawData,
    sourceModel: rawData.sourceModel || rawData.sourcePreview?.sourceModel,
    previewSummary: rawData.previewSummary || rawData.sourcePreview?.previewSummary,
  };
  const traceRows = buildTraceRows(data);
  const sectionRows = (data.previewSections || []).map((section) => ({
    title: section.title,
    currentState: toDisplayState(section.currentState),
    summary: section.summary,
    nextAction: section.nextAction,
    disabledReason: section.disabledReason,
  }));

  return {
    phase: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PHASE,
    version: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_VERSION,
    currentState: "command_center_ledger_preview_ready_execution_blocked",
    previewOnly: true,
    readOnly: true,
    localOnly: true,
    sourcePreview: {
      phase: previewEnvelope.phase,
      status: previewEnvelope.status,
      source: previewEnvelope.source,
      sourceModel: data.sourceModel || data.sourcePreview?.sourceModel,
      previewSummary: data.previewSummary || data.sourcePreview?.previewSummary,
    },
    summaryRows: buildSummaryRows(data),
    previewCards: buildPreviewCards(data),
    traceRows,
    sectionRows,
    safetyRows: buildSafetyRows(data),
    disabledActions: [
      { label: "Write ledger", reason: "Ledger persistence is not enabled in P139.4." },
      { label: "Write DB/runtime", reason: "DB/runtime writes remain blocked." },
      { label: "Dispatch agent", reason: "Agent dispatch remains blocked until a later explicit phase." },
      { label: "Call provider", reason: "Provider/model calls and spend remain blocked." },
    ],
    surfacePlacements: [
      { surface: "Observability", placement: "Ledger tab and overview card" },
      { surface: "Evidence", placement: "Evidence summary card" },
      { surface: "Cost Center", placement: "Ledger tab" },
      { surface: "Business Build", placement: "Founder work context card" },
      { surface: "Agent Flow", placement: "Agent lane traceability card" },
    ],
    ownerCapability: data.ownerCapability || "NEXUS Evidence Audit Observability Cost Ledger Preview",
    evidenceLocation: "Ledger UX report",
    activityLocation: "OS phase status report",
    costImpact: data.costImpact || "Zero-spend local preview only.",
    nextAction: "Use this read-only preview to review traceability before coverage hardening.",
    disabledReason: data.disabledReason || "P139.4 renders Command Center UX only; writes and execution remain blocked.",
    blockers: data.blockers || [],
  };
}

export const evidenceAuditObservabilityCostLedgerUxViewModel =
  buildEvidenceAuditObservabilityCostLedgerUxViewModel();
