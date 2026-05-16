import { COMMAND_SCOPES, isProjectRequiredIntent } from "./commandIntentTypes.js";

function mentionsOs(text = "") {
  return /\b(nexus os|os roadmap|platform|system status)\b/i.test(text);
}

function mentionsPortfolio(text = "") {
  return /\b(portfolio|all projects|across projects)\b/i.test(text);
}

export function resolveCommandScope(input = {}, context = {}) {
  const commandText = input.commandText || "";
  if (mentionsOs(commandText)) return { scope: "os", reason: "Command references NEXUS OS/platform scope." };
  if (mentionsPortfolio(commandText)) return { scope: "portfolio", reason: "Command references portfolio scope." };
  if (COMMAND_SCOPES.includes(input.scope)) return { scope: input.scope, reason: "Scope supplied by command context." };
  return { scope: context.defaultScope || "project", reason: "Using selected Command Center scope." };
}

export function resolveCommandProject(input = {}, projectRegistry = {}) {
  const selected = projectRegistry.selectedProject || projectRegistry.selectedProjectLabel
    ? {
        projectId: projectRegistry.selectedProjectId || "selected-project-ref",
        displayName: projectRegistry.selectedProjectLabel || projectRegistry.selectedProject || "Selected Project",
        selected: true,
      }
    : null;

  if (input.projectId) {
    return {
      projectId: input.projectId,
      displayName: projectRegistry.projectDisplayName || "Selected Project",
      selected: true,
    };
  }

  if (selected) return selected;

  return {
    projectId: "",
    displayName: "No project selected",
    selected: false,
    missingPrerequisite: "Select or create a project first.",
  };
}

export function buildCommandContextPacket(input = {}, context = {}) {
  const scopeResolution = resolveCommandScope(input, context);
  const project = resolveCommandProject(input, context.projectRegistry || context);
  const missingPrerequisites = [];
  if (
    scopeResolution.scope === "project"
    && isProjectRequiredIntent(input.intentType)
    && !project.selected
  ) {
    missingPrerequisites.push("Select or create a project first.");
  }
  return {
    packetVersion: "1.0",
    phase: "P62.2",
    scope: scopeResolution.scope,
    scopeReason: scopeResolution.reason,
    projectId: project.projectId,
    projectDisplayName: project.displayName,
    selectedProjectState: project.selected ? "selected" : "no_project_selected",
    missingPrerequisites,
    mode: input.mode || context.mode || "local-private",
    previewOnly: true,
    redacted: true,
  };
}

export function validateCommandContextPacket(packet = {}) {
  const errors = [];
  if (!COMMAND_SCOPES.includes(packet.scope)) errors.push("scope is invalid");
  if (!packet.projectDisplayName) errors.push("projectDisplayName is required");
  if (!["selected", "no_project_selected"].includes(packet.selectedProjectState)) {
    errors.push("selectedProjectState is invalid");
  }
  if (!Array.isArray(packet.missingPrerequisites)) errors.push("missingPrerequisites must be an array");
  if (packet.previewOnly !== true) errors.push("previewOnly must be true");
  if (packet.redacted !== true) errors.push("redacted must be true");
  if (packet.projectDisplayName === "DemoApp" || packet.projectId === "DemoApp") {
    errors.push("DemoApp must not be used in full Command Center context packets");
  }
  return { valid: errors.length === 0, errors };
}
