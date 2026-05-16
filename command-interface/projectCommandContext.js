export function buildProjectCommandContext(options = {}) {
  const selectedProjectLabel = options.selectedProjectLabel || "Selected Project";
  const hasSelectedProject = options.hasSelectedProject !== false;
  return {
    mode: options.mode || "local-private",
    defaultScope: options.defaultScope || "project",
    selectedProjectId: hasSelectedProject ? options.selectedProjectId || "selected-project-ref" : "",
    selectedProjectLabel: hasSelectedProject ? selectedProjectLabel : "No project selected",
    selectedProject: hasSelectedProject ? selectedProjectLabel : "",
    projectRegistryStatus: options.projectRegistryStatus || "metadata_only",
    commandCenterVariant: "full",
    previewOnly: true,
  };
}
