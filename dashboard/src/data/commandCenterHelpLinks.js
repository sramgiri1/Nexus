export const COMMAND_CENTER_HELP_LINKS = {
  mission: {
    label: "Starting a Mission",
    docPath: "docs/usage/STARTING_A_MISSION.md",
  },
  workspace: {
    label: "Command Center Guide",
    docPath: "docs/usage/COMMAND_CENTER_GUIDE.md",
  },
  tasks: {
    label: "Activating Tasks",
    docPath: "docs/usage/ACTIVATING_TASKS.md",
  },
  workbench: {
    label: "Using Agent Workbench",
    docPath: "docs/usage/USING_AGENT_WORKBENCH.md",
  },
  implementation: {
    label: "Controlled Implementation",
    docPath: "docs/usage/CONTROLLED_IMPLEMENTATION.md",
  },
  evidence: {
    label: "Understanding Evidence and Audit",
    docPath: "docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md",
  },
  liveapi: {
    label: "Running NEXUS Locally",
    docPath: "docs/usage/RUNNING_NEXUS_LOCALLY.md",
  },
  services: {
    label: "Running NEXUS Locally",
    docPath: "docs/usage/RUNNING_NEXUS_LOCALLY.md",
  },
  demo: {
    label: "Demo Mode vs Private Mode",
    docPath: "docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md",
  },
};

export function getCommandCenterHelpLink(routeKey) {
  return COMMAND_CENTER_HELP_LINKS[routeKey] || {
    label: "Command Center Guide",
    docPath: "docs/usage/COMMAND_CENTER_GUIDE.md",
  };
}
