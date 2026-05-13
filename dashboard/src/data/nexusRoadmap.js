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
    phase: "P41.6.1",
    label: "Unified NEXUS Local Boot Foundation",
    status: "COMPLETE",
    detail: "Service manifest, nexus:status, and nexus:doctor define the local boot foundation without process orchestration.",
  },
  {
    phase: "P41.6.2",
    label: "Unified NEXUS Local Boot Process Manager",
    status: "COMPLETE",
    detail: "nexus:up and nexus:down manage localhost-only services and tracked runtime state.",
  },
  {
    phase: "P41.6.3",
    label: "Command Center Service Health UX",
    status: "COMPLETE",
    detail: "Command Center now shows service cards, doctor findings, and operator guidance for local boot workflows.",
  },
  {
    phase: "P41.6.4",
    label: "NEXUS Command Palette + Simple Operator Actions",
    status: "PLANNED",
    detail: "Command palette and basic operator actions are planned once Service Health UX is in place.",
  },
  {
    phase: "P42",
    label: "DB-backed Command Center + Live Refresh",
    status: "PLANNED",
    detail: "Switch Command Center reads to durable live refresh once DB writes are intentionally enabled.",
  },
];
