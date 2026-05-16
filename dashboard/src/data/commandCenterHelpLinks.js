export const COMMAND_CENTER_HELP_LINKS = {
  mission: {
    label: "Starting a Mission",
    docPath: "docs/usage/STARTING_A_MISSION.md",
    description: "Create a mission, generate a governed plan, and understand Mission Control.",
    routeKeys: ["mission"],
  },
  workspace: {
    label: "Command Center Guide",
    docPath: "docs/usage/COMMAND_CENTER_GUIDE.md",
    description: "Use tabs, scope controls, and workflow surfaces across Command Center.",
    routeKeys: ["workspace"],
  },
  tasks: {
    label: "Activating Tasks",
    docPath: "docs/usage/ACTIVATING_TASKS.md",
    description: "Understand planned, active, review, blocked, and completed task states.",
    routeKeys: ["tasks"],
  },
  workbench: {
    label: "Using Agent Workbench",
    docPath: "docs/usage/USING_AGENT_WORKBENCH.md",
    description: "Review activated task output, evidence, context, and decisions.",
    routeKeys: ["workbench"],
  },
  implementation: {
    label: "Controlled Implementation",
    docPath: "docs/usage/CONTROLLED_IMPLEMENTATION.md",
    description: "Inspect scoped implementation, validation, rollback, and developer details.",
    routeKeys: ["implementation"],
  },
  evidence: {
    label: "Understanding Evidence and Audit",
    docPath: "docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md",
    description: "Read evidence, audit, runtime, redaction, and future activity-log guidance.",
    routeKeys: ["evidence"],
  },
  liveapi: {
    label: "Running NEXUS Locally",
    docPath: "docs/usage/RUNNING_NEXUS_LOCALLY.md",
    description: "Start, inspect, and troubleshoot local NEXUS services.",
    routeKeys: ["liveapi"],
  },
  database: {
    label: "Command Center Guide",
    docPath: "docs/usage/COMMAND_CENTER_GUIDE.md",
    description: "Understand Durable State, file-backed posture, and DB-write-disabled guidance.",
    routeKeys: ["database"],
  },
  services: {
    label: "Running NEXUS Locally",
    docPath: "docs/usage/RUNNING_NEXUS_LOCALLY.md",
    description: "Use nexus:up, nexus:down, nexus:status, nexus:doctor, and Service Health.",
    routeKeys: ["services"],
  },
  safety: {
    label: "Demo Mode vs Private Mode",
    docPath: "docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md",
    description: "Understand public-safe, demo, local-private, and data-boundary rules.",
    routeKeys: ["safety"],
  },
  projects: {
    label: "Getting Started",
    docPath: "docs/usage/GETTING_STARTED.md",
    description: "Set up a project, create a mission, generate a plan, and activate work.",
    routeKeys: ["projects"],
  },
  roadmap: {
    label: "Command Center Guide",
    docPath: "docs/usage/COMMAND_CENTER_GUIDE.md",
    description: "Understand the difference between OS Roadmap and project progress.",
    routeKeys: ["roadmap"],
  },
  demo: {
    label: "Demo Mode vs Private Mode",
    docPath: "docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md",
    description: "Use Demo Mode safely and keep demo data separate from local-private work.",
    routeKeys: ["demo"],
  },
  docs: {
    label: "Docs & Guides",
    docPath: "docs/usage/README.md",
    description: "Navigate operator, codebase, and architecture documentation from Command Center.",
    routeKeys: ["docs"],
  },
  commandPalette: {
    label: "Command Center Guide",
    docPath: "docs/usage/COMMAND_CENTER_GUIDE.md",
    description: "Review governed command palette actions and disabled reason guidance.",
    routeKeys: ["mission"],
  },
  triggers: {
    label: "Trigger + Integration Gateway",
    docPath: "docs/architecture/TRIGGER_INTEGRATION_GATEWAY.md",
    description: "Review preview-only trigger and integration mappings without runtime execution.",
    routeKeys: ["triggers"],
  },
  apiBatch: {
    label: "API + Batch Execution Adapter",
    docPath: "docs/architecture/API_BATCH_EXECUTION_ADAPTER.md",
    description: "Review preview-only provider adapters, batch packaging, costs, and reconciliation.",
    routeKeys: ["apiBatch"],
  },
  troubleshooting: {
    label: "Troubleshooting",
    docPath: "docs/usage/TROUBLESHOOTING.md",
    description: "Recover from local boot, service, tab, no-project, and mode issues.",
    routeKeys: ["settings"],
  },
  faq: {
    label: "FAQ",
    docPath: "docs/usage/FAQ.md",
    description: "Answer common operator questions about current NEXUS capabilities.",
    routeKeys: ["docs"],
  },
};

export function getCommandCenterHelpLink(routeKey) {
  return COMMAND_CENTER_HELP_LINKS[routeKey] || {
    label: "Command Center Guide",
    docPath: "docs/usage/COMMAND_CENTER_GUIDE.md",
  };
}
