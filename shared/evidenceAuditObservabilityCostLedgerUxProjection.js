export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_PHASE = "P139.4";
export const EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_VERSION = "1.0";

const OWNER_CAPABILITY = "NEXUS Evidence Audit Observability Cost Ledger Preview";
const DISABLED_REASON = "Command Center renders display-safe traceability only. Ledger writes, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";

const PREVIEW_ROWS = Object.freeze([
  {
    label: "Founder work trace",
    currentState: "ready_for_operator_review_execution_blocked",
    evidenceLocation: "Ledger preview evidence report",
    auditLocation: "Audit summary report",
    activityLocation: "OS activity status report",
    observabilityLocation: "Activity schema reference",
    costImpact: "Zero spend preview",
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Review traceability before any future persistence path.",
    disabledReason: DISABLED_REASON,
  },
  {
    label: "Agent work trace",
    currentState: "ready_for_operator_review_execution_blocked",
    evidenceLocation: "Ledger preview evidence report",
    auditLocation: "Audit summary report",
    activityLocation: "OS activity status report",
    observabilityLocation: "Activity schema reference",
    costImpact: "Zero spend preview",
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Review agent lane evidence before any future dispatch path.",
    disabledReason: DISABLED_REASON,
  },
  {
    label: "Cost attribution trace",
    currentState: "ready_for_operator_review_execution_blocked",
    evidenceLocation: "Ledger preview evidence report",
    auditLocation: "Audit summary report",
    activityLocation: "OS activity status report",
    observabilityLocation: "Activity schema reference",
    costImpact: "Zero spend preview",
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Review zero-spend attribution before any future provider spend path.",
    disabledReason: DISABLED_REASON,
  },
]);

const PREVIEW_SECTIONS = Object.freeze([
  {
    title: "Traceability Links",
    currentState: "preview_ready_execution_blocked",
    summary: "Display-safe evidence, audit, activity, and observability references are grouped for operator review.",
    nextAction: "Review grouped traceability rows in Command Center.",
    disabledReason: DISABLED_REASON,
  },
  {
    title: "Safety Gates",
    currentState: "all_execution_blocked",
    summary: "Every write, execution, mutation, network, deploy, package, and spend authority remains blocked.",
    nextAction: "Keep preview read-only until a later phase explicitly grants authority.",
    disabledReason: DISABLED_REASON,
  },
  {
    title: "Cost Attribution",
    currentState: "zero_spend_preview",
    summary: "Cost attribution is visible as zero-spend preview metadata only.",
    nextAction: "Review zero-spend cost metadata without enabling provider spend.",
    disabledReason: DISABLED_REASON,
  },
]);

export function buildEvidenceAuditObservabilityCostLedgerUxProjection() {
  return {
    phase: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_PHASE,
    version: EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_VERSION,
    previewOnly: true,
    readOnly: true,
    localOnly: true,
    commandCenterVisible: true,
    sourcePreview: {
      phase: "Evidence preview",
      status: "PASS",
      sourceModel: {
        currentState: "ledger model ready",
        recordCount: PREVIEW_ROWS.length,
        evidenceRefCount: PREVIEW_ROWS.length,
        auditRefCount: PREVIEW_ROWS.length,
        activityRefCount: PREVIEW_ROWS.length,
        observabilityRefCount: PREVIEW_ROWS.length,
        writeCandidateCount: 0,
        providerSpendCandidateCount: 0,
      },
      previewSummary: {
        sectionCount: PREVIEW_SECTIONS.length,
        rowCount: PREVIEW_ROWS.length,
        blockedRowCount: PREVIEW_ROWS.length,
        zeroSpend: true,
        readyForCommandCenterUx: true,
      },
    },
    previewRows: PREVIEW_ROWS.map((row) => ({ ...row })),
    previewSections: PREVIEW_SECTIONS.map((section) => ({ ...section })),
    ownerCapability: OWNER_CAPABILITY,
    evidenceLocation: "Ledger UX report",
    activityLocation: "OS phase status report",
    costImpact: "Zero-spend local preview only. No provider/model calls, network calls, deploy, package creation, or provider spend.",
    nextAction: "Use this read-only preview to review traceability before coverage hardening.",
    disabledReason: DISABLED_REASON,
    blockers: [
      "Ledger persistence remains blocked.",
      "DB/runtime writes remain blocked.",
      "Provider/model calls, tool execution, and agent dispatch remain blocked.",
      "Project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    ],
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
      usesNetwork: false,
      deploysReleasesExportsPackages: false,
      spendsBudget: false,
      exposesRawPayloads: false,
    },
  };
}
