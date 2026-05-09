/**
 * workspace/index.js
 * NEXUS Agentic Workspace — P36-LOCAL
 *
 * Public API for the agentic workspace module.
 */

export { getWorkflowTemplates, getWorkflowTemplateById, validateWorkflowTemplates } from "./workflowTemplates.js";
export { recommendWorkflows, getNextBestAction, buildWorkspaceSummary } from "./workflowRecommendations.js";
