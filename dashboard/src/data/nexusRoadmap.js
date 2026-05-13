export const NEXUS_ROADMAP_PHASES = [
  {
    phase: "P37",
    label: "Task Activation + Agent Assignment from UI",
    status: "COMPLETE",
    detail: "Select task, activate it, place it in the runtime queue, and capture evidence.",
  },
  {
    phase: "P38",
    label: "Agent Workbench + Human Review Loop",
    status: "COMPLETE",
    detail: "Inspect activated tasks, review evidence, and capture human decisions.",
  },
  {
    phase: "P39",
    label: "First Controlled Implementation Workflow from UI",
    status: "COMPLETE",
    detail: "Scoped documentation-only implementation flow with evidence and rollback posture.",
  },
  {
    phase: "P40",
    label: "Live Local API Backend for Command Center",
    status: "COMPLETE",
    detail: "Real-time local API reads are available without DB or provider dispatch.",
  },
  {
    phase: "P41",
    label: "DB Foundation + Durable State",
    status: "COMPLETE",
    detail: "Schema, health, repository, and import planning exist while runtime remains file-backed.",
  },
  {
    phase: "P42",
    label: "DB-backed Command Center + Live Refresh",
    status: "PLANNED",
    detail: "Switch Command Center reads to durable live refresh once DB writes are intentionally enabled.",
  },
];
