export const PROJECT_SELECTION_STORAGE_KEY = "nexus-selected-project";

export const PROJECT_SELECTION_OPTIONS = [
  {
    projectId: "",
    label: "No project selected",
    scope: "project",
    visibility: "local-private",
    localPrivateAllowed: true,
    demoOnly: false,
  },
  {
    projectId: "private-project-01",
    label: "Selected Project",
    scope: "project",
    visibility: "local-private",
    localPrivateAllowed: true,
    demoOnly: false,
  },
  {
    projectId: "nexus-os",
    label: "NEXUS OS",
    scope: "os",
    visibility: "internal",
    localPrivateAllowed: true,
    demoOnly: false,
  },
  {
    projectId: "demoapp",
    label: "Demo project entry",
    demoLabel: "DemoApp",
    scope: "demo",
    visibility: "demo",
    localPrivateAllowed: false,
    demoOnly: true,
  },
];

export function getProjectSelectionOptions(mode = "local-private") {
  return PROJECT_SELECTION_OPTIONS.map((option) => ({
    ...option,
    label: option.demoOnly && mode !== "demo" ? "Demo project entry" : option.demoLabel || option.label,
    disabled: option.demoOnly && mode !== "demo",
    disabledReason: option.demoOnly && mode !== "demo" ? "Available only in Demo Mode." : "",
  }));
}

export function resolveSelectedProject(projectId, mode = "local-private") {
  const options = getProjectSelectionOptions(mode);
  const selected = options.find((option) => option.projectId === projectId && !option.disabled);
  return selected || options.find((option) => option.projectId === "");
}
