export const RECOVERY_ROUTE_ID = "recovery";

const SNAPSHOT_PREVIEWS = [
  {
    title: "Recovery preview snapshot",
    timestamp: "2026-05-18T10:00:00.000Z",
    scope: "NEXUS OS",
    redaction: "Internal redacted",
    retention: "Short lived",
    recoveryPosture: "Inspect only",
    ownerAgent: "NEXUS recovery",
    ownerCapability: "AI snapshot recovery",
    evidenceLocation: "reports/ai-snapshot-store-report.md",
    activityLocation: "Command Center activity log",
    traceContext: "Snapshot store preview",
    blockers: ["Recovery execution is not enabled in P63.5."],
    nextAction: "Inspect redacted snapshot details.",
    costImpact: "No provider calls; local preview only.",
  },
  {
    title: "Phase evidence snapshot",
    timestamp: "2026-04-01T10:00:00.000Z",
    scope: "NEXUS OS",
    redaction: "Internal redacted",
    retention: "Phase evidence",
    recoveryPosture: "Resume plan available",
    ownerAgent: "NEXUS recovery",
    ownerCapability: "Recovery point classifier",
    evidenceLocation: "reports/ai-recovery-point-model-report.md",
    activityLocation: "OS phase status report",
    traceContext: "Recovery point model",
    blockers: ["Resume remains preview-only.", "Tool and provider dispatch stay disabled."],
    nextAction: "Review resume plan preview.",
    costImpact: "No runtime spend; preview is static local metadata.",
  },
  {
    title: "Final validation snapshot",
    timestamp: "2026-05-18T11:00:00.000Z",
    scope: "NEXUS OS",
    redaction: "Internal redacted",
    retention: "Final validation",
    recoveryPosture: "Not recoverable",
    ownerAgent: "NEXUS recovery",
    ownerCapability: "Final validation review",
    evidenceLocation: "docs/architecture/P63_AI_INTERACTION_SNAPSHOT_RECOVERY_PLAN.md",
    activityLocation: "OS roadmap",
    traceContext: "Final validation evidence",
    blockers: ["Final validation snapshots are inspection-only."],
    nextAction: "Inspect recovery point.",
    costImpact: "No provider calls; no execution state restored.",
  },
];

const DISABLED_ACTIONS = [
  {
    label: "Restore",
    reason: "Restore is disabled until a later phase explicitly approves recovery execution.",
    requiredContext: ["Approved restore execution phase"],
    missingContext: ["Approved restore execution phase"],
    nextSafeAction: "Inspect snapshot details; restore remains unavailable.",
  },
  {
    label: "Replay",
    reason: "Replay is disabled; preview requires evidence summary and a later approved execution phase.",
    requiredContext: ["Redacted snapshot metadata", "Recovery point posture", "Evidence summary", "Approved replay execution phase"],
    missingContext: ["Evidence summary", "Approved replay execution phase"],
    nextSafeAction: "Review missing replay context; execution remains unavailable.",
  },
  {
    label: "Resume",
    reason: "Resume is disabled; preview requires recovery chain review and a later approved execution phase.",
    requiredContext: ["Redacted snapshot metadata", "Recovery point chain", "Blocked action review", "Approved resume execution phase"],
    missingContext: ["Blocked action review", "Approved resume execution phase"],
    nextSafeAction: "Review missing resume context; execution remains unavailable.",
  },
];

const SELF_HEALING_READINESS = [
  {
    title: "Self-Healing Failure Loop",
    stateLabel: "Preview only",
    failureClass: "Transient failure",
    currentState: "Gate review ready",
    proposedRecovery: "Bounded recovery preview with approval, cost, and loop guards.",
    blocker: "Recovery execution, automatic retry, source mutation, project mutation, provider/tool execution, DB writes, deploy, and provider spend remain disabled.",
    disabledReason: "P66.5 is display-only. No repair action can run from Command Center.",
    ownerCapability: "Runtime reliability",
    evidenceLocation: "reports/p66-healing-safety-gate-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider spend; review metadata only.",
    nextAction: "Review the healing gate report before tests and final validation.",
  },
  {
    title: "Blocked Recovery Proposal",
    stateLabel: "Blocked",
    failureClass: "Secret or security failure",
    currentState: "Human review required",
    proposedRecovery: "Escalate security review and require redaction or rotation evidence.",
    blocker: "Security, policy, data protection, verification, contract, and state-transition failures cannot auto-heal.",
    disabledReason: "Self-healing remains blocked until an explicit later phase allows governed recovery execution.",
    ownerCapability: "Security governance",
    evidenceLocation: "reports/p66-failure-classification-report.md",
    activityLocation: "reports/p66-recovery-plan-preview-report.md",
    costImpact: "No runtime spend.",
    nextAction: "Keep the blocked failure visible and collect remediation evidence.",
  },
];

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function buildRecoveryPreviewViewModel() {
  const snapshots = SNAPSHOT_PREVIEWS.map((snapshot, index) => ({
    ...snapshot,
    listKey: `recovery-preview-${index + 1}`,
    timestampLabel: formatTimestamp(snapshot.timestamp),
  }));

  return {
    routeId: RECOVERY_ROUTE_ID,
    pageTitle: "Recovery",
    currentState: "Inspection-only recovery preview is available.",
    nextAction: "Review redacted snapshots and disabled action reasons before P63.6 preview planning.",
    blockers: [
      "Restore, replay, and resume execution are disabled.",
      "Provider dispatch, tool dispatch, project mutation, DB writes, and deploy actions are disabled.",
    ],
    ownerAgent: "NEXUS recovery",
    ownerCapability: "AI interaction snapshot recovery",
    evidenceLocation: "reports/command-center-recovery-ux-report.md",
    costImpact: "No provider calls or runtime execution cost.",
    snapshots,
    selectedSnapshot: snapshots[0] || null,
    disabledActions: DISABLED_ACTIONS,
    selfHealingReadiness: SELF_HEALING_READINESS,
    emptyState: {
      title: "No recovery snapshots available",
      body: "Run the P63 snapshot and recovery checkers to regenerate redacted preview metadata.",
    },
  };
}
