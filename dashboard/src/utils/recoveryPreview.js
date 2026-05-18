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
  },
  {
    label: "Replay",
    reason: "Replay is disabled; P63.5 shows inspection data only.",
  },
  {
    label: "Resume",
    reason: "Resume is disabled; preview plans do not run AI or tools.",
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
    emptyState: {
      title: "No recovery snapshots available",
      body: "Run the P63 snapshot and recovery checkers to regenerate redacted preview metadata.",
    },
  };
}
