import { buildProviderGovernanceDryRun } from "../../../shared/providerGovernanceDryRun.js";

const dryRun = buildProviderGovernanceDryRun({
  requestedCapability: "Founder feasibility provider decision",
  providerCategory: "model-assisted founder analysis",
  toolCategory: "governed analysis tooling",
});

function countByLane(rows) {
  return rows.reduce((acc, row) => {
    acc[row.lane] = (acc[row.lane] || 0) + 1;
    return acc;
  }, {});
}

const laneCounts = countByLane(dryRun.decisionRows);

export const providerGovernanceSummary = {
  phase: "P136.4",
  sourcePhase: dryRun.phase,
  sourceModelPhase: dryRun.sourceModelPhase,
  dryRunRows: dryRun.decisionRowCount,
  executableRows: dryRun.executableDecisionRowCount,
  approvalNeeds: dryRun.approvalNeedCount,
  estimatedUsd: dryRun.budgetImpact.estimatedUsd,
  providerRows: laneCounts["provider eligibility"] || 0,
  modelRows: laneCounts["model access"] || 0,
  toolRows: laneCounts["tool contract"] || 0,
};

export const providerGovernanceReadiness = {
  routeId: "provider-governance-readiness",
  pageTitle: "Provider Governance",
  whatChanged: "P136.3 dry-run evidence is now visible in Command Center as a review-only provider, model, tool, approval, evidence, activity, and cost posture.",
  currentState: "P136.3 dry run is ready for review; execution is disabled.",
  nextAction: "Review blockers and approval needs before P136.5 aggregates tests and checker coverage.",
  ownerAgent: "WARDEN",
  ownerCapability: dryRun.ownerCapability,
  evidenceLocation: "reports/p1364-provider-governance-command-center-ux-report.md",
  activityLocation: "Activity Log > Provider Governance",
  costImpact: dryRun.costImpact,
  disabledReason: "Execution disabled: provider/model calls, credential value access, tool execution, MCP startup, approval writes, budget spend, DB/runtime writes, agent dispatch, project mutation, deploy, release, export, package, network calls, and provider spend remain blocked.",
  summaryCards: [
    { label: "Source dry run", value: dryRun.phase, tone: "teal", detail: "P136.3 decision packet is summarized for operators." },
    { label: "Decision rows", value: String(providerGovernanceSummary.dryRunRows), tone: "amber", detail: "Provider, model, and tool lanes are reviewed without execution." },
    { label: "Executable rows", value: String(providerGovernanceSummary.executableRows), tone: "disabled", detail: "No executable provider, model, or tool rows exist." },
    { label: "Approval needs", value: String(providerGovernanceSummary.approvalNeeds), tone: "amber", detail: "Approval needs are visible but cannot be written." },
    { label: "Estimated spend", value: "$0", tone: "pass", detail: "Budget impact remains estimate-only with no spend authority." },
    { label: "Provider payloads", value: "None", tone: "disabled", detail: "No provider or tool payload is prepared." },
  ],
  stateRows: [
    { label: "Credential values", state: "Hidden", detail: "Only metadata posture is visible; credential values are not readable." },
    { label: "Provider/model calls", state: "Blocked", detail: "Provider and model calls remain unavailable." },
    { label: "Tool execution", state: "Blocked", detail: "Tool contracts are summarized, but tools cannot run." },
    { label: "Approval writes", state: "Blocked", detail: "Approval needs are review-only and are not persisted." },
    { label: "Budget spend", state: "Blocked", detail: "Spend stays at zero-authority." },
    { label: "DB/runtime writes", state: "Blocked", detail: "No database or runtime mutation is enabled." },
  ],
  decisionRows: [
    {
      label: "Provider eligibility",
      count: providerGovernanceSummary.providerRows,
      currentState: "Blocked",
      detail: "Provider credential metadata can be reviewed, but provider calls and credential value access stay disabled.",
      nextAction: "Keep provider setup as review-only until secret, budget, and approval authority is explicitly scoped.",
    },
    {
      label: "Model access",
      count: providerGovernanceSummary.modelRows,
      currentState: "Blocked",
      detail: "Founder feasibility, PRD assistance, and agent planning cannot call models from this phase.",
      nextAction: "Use local planning evidence until a future provider authority phase is approved.",
    },
    {
      label: "Tool contract",
      count: providerGovernanceSummary.toolRows,
      currentState: "Blocked",
      detail: "Tool permission metadata is visible without preparing tool payloads or execution commands.",
      nextAction: "Keep tool execution blocked until runtime admission and approval gates exist.",
    },
  ],
  approvalRows: dryRun.approvalNeeds.map((row) => ({
    label: row.label,
    currentState: "Review only",
    approvalRequired: row.approvalRequired ? "Required later" : "Not required",
    disabledReason: row.disabledReason,
    nextAction: row.nextAction,
  })),
  costRows: [
    { label: "Budget mode", value: "Estimate-only", detail: dryRun.budgetImpact.disabledReason },
    { label: "Budget rows reviewed", value: String(dryRun.budgetImpact.budgetRowsReviewed), detail: "Budget rows are summarized without writing ledgers." },
    { label: "Estimated spend", value: "$0", detail: "Provider spend remains disabled." },
    { label: "Provider dispatch", value: "Blocked", detail: "Provider dispatch is not available from this page." },
    { label: "Worker execution", value: "Blocked", detail: "Worker execution is not connected to provider governance." },
  ],
  evidenceRows: [
    { label: "P136.3 dry run", location: "reports/p1363-provider-dry-run-report.md", detail: "Source dry-run evidence." },
    { label: "P136.4 UX report", location: "reports/p1364-provider-governance-command-center-ux-report.md", detail: "Command Center route evidence." },
    { label: "OS Roadmap", location: "OS Roadmap > P136.4", detail: "Phase status and next subphase." },
    { label: "Activity", location: "Activity Log > Provider Governance", detail: "Founder-visible activity label." },
  ],
  blockerRows: dryRun.blockedReasons.slice(0, 6).map((reason) => ({ reason })),
  safetyRows: [
    { label: "Provider payload prepared", value: dryRun.providerPayload === null ? "No" : "Unexpected" },
    { label: "Tool payload prepared", value: dryRun.toolPayload === null ? "No" : "Unexpected" },
    { label: "Executable command", value: dryRun.executableCommand === null ? "None" : "Unexpected" },
    { label: "Provider calls", value: dryRun.safetyFlags.providerCallsAllowed ? "Allowed" : "Blocked" },
    { label: "Model calls", value: dryRun.safetyFlags.modelCallsAllowed ? "Allowed" : "Blocked" },
    { label: "Tool execution", value: dryRun.safetyFlags.toolExecutionAllowed ? "Allowed" : "Blocked" },
    { label: "Project mutation", value: dryRun.safetyFlags.projectMutationAllowed ? "Allowed" : "Blocked" },
    { label: "Provider spend", value: dryRun.safetyFlags.providerSpendAllowed ? "Allowed" : "Blocked" },
  ],
};
