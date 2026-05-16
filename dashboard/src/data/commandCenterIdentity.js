const FULL_COMMAND_CENTER_VARIANT = "full";

export function normalizeDisplayProject(project) {
  if (!project || project.disabled || project.demoOnly) return null;
  if (project.scope === "os") {
    return {
      projectId: project.projectId,
      displayName: "NEXUS OS",
      scope: "os",
    };
  }
  return {
    projectId: project.projectId,
    displayName: project.label || "Selected Project",
    scope: project.scope || "project",
  };
}

export function getNoProjectGuidance() {
  return {
    title: "No project selected",
    steps: [
      "Create or import a project",
      "Add a project profile",
      "Define stack and test commands",
      "Create a mission",
      "Generate a plan",
      "Activate the first task",
    ],
    actions: [
      { label: "Create Project", enabled: false, disabledReason: "Requires project onboarding action" },
      { label: "Import Existing Project", enabled: false, disabledReason: "Requires project onboarding action" },
      { label: "Open Project Registry", enabled: true, route: "/command-center/projects" },
      { label: "Read Getting Started", enabled: true, route: "/command-center/docs" },
    ],
  };
}

export function isDemoTextAllowed(route, context = {}) {
  return context.commandCenterVariant === "demo"
    || context.demoMode === true
    || route === "/command-center/demo"
    || route === "demo";
}

export function resolveCommandCenterIdentity(context = {}, projectRegistry = [], options = {}) {
  const routeScope = context.scope || options.scope || "project";
  const demoMode = context.demoMode === true || options.demoMode === true;
  const selectedProject = normalizeDisplayProject(context.selectedProject);
  const hasProject = routeScope === "project" && Boolean(selectedProject) && selectedProject.scope !== "os";

  if (routeScope === "os" || selectedProject?.scope === "os") {
    return {
      scope: "os",
      commandCenterVariant: FULL_COMMAND_CENTER_VARIANT,
      selectedProjectId: null,
      selectedProjectDisplayName: null,
      workspaceId: "default",
      demoMode,
      title: "NEXUS OS",
      subtitle: "Platform operations, service posture, roadmap, docs, and governance.",
      primaryContextLabel: "NEXUS OS",
      secondaryContext: ["Portfolio-ready", "Project operations separate"],
      noProjectSelected: false,
      projectRegistry,
    };
  }

  if (routeScope === "portfolio") {
    return {
      scope: "portfolio",
      commandCenterVariant: FULL_COMMAND_CENTER_VARIANT,
      selectedProjectId: selectedProject?.projectId || null,
      selectedProjectDisplayName: selectedProject?.displayName || null,
      workspaceId: "default",
      demoMode,
      title: "Portfolio",
      subtitle: "Multi-project operating surface. Project Registry runtime is planned.",
      primaryContextLabel: "Portfolio",
      secondaryContext: selectedProject ? [`Selected project: ${selectedProject.displayName}`] : ["No project selected"],
      noProjectSelected: false,
      projectRegistry,
    };
  }

  if (hasProject) {
    return {
      scope: "project",
      commandCenterVariant: FULL_COMMAND_CENTER_VARIANT,
      selectedProjectId: selectedProject.projectId,
      selectedProjectDisplayName: selectedProject.displayName,
      workspaceId: "default",
      demoMode,
      title: selectedProject.displayName,
      subtitle: "Selected project operations and governed workflow context.",
      primaryContextLabel: selectedProject.displayName,
      secondaryContext: ["Project scope", "Mode is secondary"],
      noProjectSelected: false,
      projectRegistry,
    };
  }

  return {
    scope: "project",
    commandCenterVariant: FULL_COMMAND_CENTER_VARIANT,
    selectedProjectId: null,
    selectedProjectDisplayName: null,
    workspaceId: "default",
    demoMode,
    title: "No project selected",
    subtitle: "Select or create a project to unlock project operations.",
    primaryContextLabel: "No project selected",
    secondaryContext: ["NEXUS OS remains available", "Portfolio shell remains available"],
    noProjectSelected: true,
    noProjectGuidance: getNoProjectGuidance(),
    projectRegistry,
  };
}
