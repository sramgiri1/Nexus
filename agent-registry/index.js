export {
  AGENT_REGISTRY_SCHEMA_VERSION,
  NEXUS_AGENT_REGISTRY,
  REQUIRED_AGENT_FIELDS,
  getAgentById,
  getAgentRegistry,
  validateAgentEntry,
  validateAgentRegistry,
} from "./agentRegistrySchema.js";

export {
  AGENT_STATUSES,
  AGENT_TYPES,
  CAPABILITY_CATEGORIES,
  CHANGE_SCOPES,
  DATA_CLASSIFICATIONS,
} from "./agentTypes.js";

export {
  CAPABILITIES,
  CAPABILITY_RULE_VERSION,
  FORBIDDEN_RUNTIME_CAPABILITIES,
  getCapabilityById,
  validateCapabilityCatalog,
  validateCapabilityId,
} from "./capabilityRules.js";

export {
  AGENT_CAPABILITY_MATRIX_VERSION,
  buildAgentCapabilityMatrix,
  summarizeAgentCapabilityMatrix,
  validateSeparationOfDuties,
} from "./agentCapabilityMatrix.js";

export {
  AGENT_BOUNDARY_MODEL_VERSION,
  APPROVAL_BOUNDARY_RULES,
  PROJECT_SCOPE_BOUNDARIES,
  buildAgentBoundaryModel,
  validateAgentBoundaryModel,
} from "./agentBoundaryModel.js";

export {
  AGENT_PATH_BOUNDARIES,
  GLOBAL_FORBIDDEN_PATH_PATTERNS,
  getPathBoundaryForAgent,
} from "./pathBoundaryRules.js";

export {
  AGENT_DATA_BOUNDARIES,
  DATA_CLASSIFICATION_ORDER,
  FORBIDDEN_DATA_REFERENCES,
  getDataBoundaryForAgent,
} from "./dataBoundaryRules.js";

export {
  TOOL_BOUNDARIES,
  getToolBoundaryForAgent,
} from "./toolBoundaryRules.js";

export {
  BOUNDARY_COMPILER_VERSION,
  buildBoundaryCompilerExamples,
  compileAgentBoundary,
  summarizeBoundaryCompiler,
} from "./boundaryCompiler.js";

export {
  BOUNDARY_ENVELOPE_VERSION,
  createBoundaryEnvelope,
  summarizeBoundaryEnvelope,
} from "./boundaryEnvelope.js";

export { validateBoundaryEnvelope } from "./boundaryValidator.js";
