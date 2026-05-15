import phaseIndex from "../../../os-roadmap/nexus-phases.json" with { type: "json" };
import phaseStatus from "../../../os-roadmap/phase-status.json" with { type: "json" };

const STATUS_LABELS = {
  planned: "Planned",
  in_progress: "In Progress",
  complete: "Complete",
  blocked: "Blocked",
  skipped: "Skipped",
};

const STATUS_TONES = {
  planned: "planned",
  in_progress: "current",
  complete: "pass",
  blocked: "fail",
  skipped: "disabled",
};

const statusById = new Map(
  (phaseStatus?.phases || []).map((entry) => [entry.phaseId, entry]),
);

function buildRoadmapPhase(entry) {
  const statusEntry = statusById.get(entry.phaseId) || {};
  const status = statusEntry.status || entry.defaultStatus || "planned";

  return {
    ...entry,
    ...statusEntry,
    phase: entry.phaseId,
    label: entry.title,
    detail: statusEntry.summary || entry.summary || "",
    status,
    statusLabel: STATUS_LABELS[status] || status,
    tone: STATUS_TONES[status] || "disabled",
    isCurrent: false,
    isComplete: status === "complete",
    isPlanned: status === "planned",
    isBlocked: status === "blocked",
  };
}

const roadmapPhases = (phaseIndex?.phases || [])
  .map(buildRoadmapPhase)
  .filter((entry) => entry.track === "NEXUS_OS")
  .sort((a, b) => (a.order || 0) - (b.order || 0));

const currentInProgressPhase = roadmapPhases.find((entry) => entry.phase === phaseStatus?.currentPhase)
  || roadmapPhases.find((entry) => entry.status === "in_progress");

export const NEXUS_CURRENT_OS_PHASE = currentInProgressPhase || null;

export const NEXUS_ROADMAP_PHASES = roadmapPhases.map((entry) => {
  if (entry.phase === NEXUS_CURRENT_OS_PHASE?.phase) {
    return {
      ...entry,
      isCurrent: true,
      tone: entry.status === "complete" ? "current" : entry.tone,
      statusLabel: entry.status === "complete" ? "Current / Complete" : entry.statusLabel,
    };
  }
  return entry;
});

export const NEXUS_PREVIOUS_COMPLETED_PHASE = [...NEXUS_ROADMAP_PHASES]
  .filter(
    (entry) => entry.status === "complete"
  )
  .at(-1);

export const NEXUS_NEXT_OS_PHASE = NEXUS_ROADMAP_PHASES.find((entry) => entry.phase === phaseStatus?.nextPhase)
  || NEXUS_ROADMAP_PHASES.find(
    (entry) => (entry.order || 0) > (NEXUS_CURRENT_OS_PHASE?.order || 0) && entry.status === "planned",
  )
  || NEXUS_ROADMAP_PHASES.find((entry) => entry.status === "planned");

export const NEXUS_IN_PROGRESS_OS_PHASES = NEXUS_ROADMAP_PHASES.filter(
  (entry) => entry.status === "in_progress",
);

export const NEXUS_COMPLETED_OS_PHASES = NEXUS_ROADMAP_PHASES.filter(
  (entry) => entry.status === "complete",
);

export const NEXUS_PLANNED_OS_PHASES = NEXUS_ROADMAP_PHASES.filter(
  (entry) => entry.status === "planned",
);

export const NEXUS_BLOCKED_OS_PHASES = NEXUS_ROADMAP_PHASES.filter(
  (entry) => entry.status === "blocked",
);

export const NEXUS_OS_OPEN_GAPS = [
  {
    priority: "Now",
    title: "Prepare P43 scope-boundary and project packaging safety",
    detail:
      "Use the completed P42 registry foundation to define safe package boundaries before adapters or project mutation expand.",
  },
  {
    priority: "Next",
    title: "Keep project adapters disabled until boundary policy is explicit",
    detail:
      "Project profiles, stack profiles, onboarding plans, selector state, and capability matrix remain metadata-only until P43/P44 safety gates are complete.",
  },
  {
    priority: "Later",
    title: "Keep runtime, provider, and DB-primary work intentionally gated",
    detail:
      "Worker runtime, governed provider dispatch, and DB-backed runtime primary remain planned phases rather than partial operator surfaces.",
  },
];

export const NEXUS_OS_ROADMAP_META = {
  track: phaseIndex?.track || "NEXUS_OS",
  currentPhase: NEXUS_CURRENT_OS_PHASE,
  previousCompletedPhase: NEXUS_PREVIOUS_COMPLETED_PHASE,
  nextPhase: NEXUS_NEXT_OS_PHASE,
  completedCount: NEXUS_COMPLETED_OS_PHASES.length,
  plannedCount: NEXUS_PLANNED_OS_PHASES.length,
  blockedCount: NEXUS_BLOCKED_OS_PHASES.length,
};
