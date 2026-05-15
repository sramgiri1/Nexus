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
