import { classifyTaskScope } from "../scope-boundary/index.js";
import { getRegistryProject } from "../project-registry/index.js";
import { getAgentById } from "./agentRegistrySchema.js";
import { getCapabilityById } from "./capabilityRules.js";
import { getDataBoundaryForAgent } from "./dataBoundaryRules.js";
import { getPathBoundaryForAgent } from "./pathBoundaryRules.js";
import { getToolBoundaryForAgent } from "./toolBoundaryRules.js";
import { createBoundaryEnvelope, summarizeBoundaryEnvelope } from "./boundaryEnvelope.js";
import { validateBoundaryEnvelope } from "./boundaryValidator.js";

export const BOUNDARY_COMPILER_VERSION = "1.0";

export function compileAgentBoundary({
  agentId,
  projectId = "private-project-01",
  scope = "project",
  capabilityId,
  taskType = "metadata-preview",
} = {}) {
  const errors = [];
  const warnings = [];
  const agent = getAgentById(agentId);
  if (!agent) errors.push(`Unknown agent ${agentId}`);

  const project = getRegistryProject(projectId) || getRegistryProject("private-project-01");
  if (!project) errors.push(`Unknown project ${projectId}`);
  if (project?.demoOnly) warnings.push("Demo project envelopes are demo-only and must not be used for local-private runtime.");

  const pathBoundary = getPathBoundaryForAgent(agentId);
  const dataBoundary = getDataBoundaryForAgent(agentId);
  const toolBoundary = getToolBoundaryForAgent(agentId);
  const capability = capabilityId ? getCapabilityById(capabilityId) : null;
  if (capabilityId && !capability) warnings.push(`Capability ${capabilityId} is not cataloged.`);

  const scopeClassification = classifyTaskScope(
    {
      taskType,
      capabilityId,
      projectId: project?.projectId || projectId,
      targetPaths: pathBoundary.allowedPathPatterns,
      changeScope: scope,
    },
    { projectId: project?.projectId || projectId },
  );

  const envelope = createBoundaryEnvelope({
    agent: agent
      ? {
        agentId: agent.agentId,
        displayName: agent.displayName,
        role: agent.role,
        agentType: agent.agentType,
        status: agent.status,
      }
      : { agentId },
    project: {
      projectId: project?.projectId || projectId,
      label: project?.label || "Private Project",
      scope: project?.scope || scope,
      visibility: project?.visibility || "local-private",
      adapterId: project?.adapterId || "not-enabled",
    },
    scope: {
      requestedScope: scope,
      scopeType: scopeClassification.scopeType,
      changeType: scopeClassification.changeType,
      status: scopeClassification.status,
      warnings: scopeClassification.warnings || [],
    },
    task: {
      taskType,
      capabilityId,
      capabilityCategory: capability?.category || "unknown",
      capabilityRisk: capability?.risk || "unknown",
    },
    allowedCapabilities: agent?.allowedCapabilities || [],
    deniedCapabilities: agent?.forbiddenCapabilities || [],
    allowedPaths: pathBoundary.allowedPathPatterns,
    forbiddenPaths: pathBoundary.forbiddenPathPatterns,
    allowedTools: toolBoundary.allowedTools,
    forbiddenTools: toolBoundary.forbiddenTools,
    dataClassificationLimits: dataBoundary.allowedDataClassifications,
    costPolicy: agent?.costPolicy || { providerSpendAllowed: false },
    memoryPolicy: agent?.memoryPolicy || { persistentMemoryWriteAllowed: false },
    approvalsRequired: agent?.approvalRequirements || [],
    evidenceRequired: agent?.evidenceRequirements || [],
    warnings: [...warnings, ...(scopeClassification.warnings || [])],
    errors,
  });

  const validation = validateBoundaryEnvelope(envelope);
  envelope.warnings = [...new Set([...(envelope.warnings || []), ...validation.warnings])];
  envelope.errors = [...new Set([...(envelope.errors || []), ...validation.errors])];
  envelope.valid = envelope.errors.length === 0;
  return envelope;
}

export function buildBoundaryCompilerExamples() {
  return [
    compileAgentBoundary({ agentId: "CORE", projectId: "private-project-01", scope: "project", capabilityId: "implementation.scoped_patch", taskType: "implementation" }),
    compileAgentBoundary({ agentId: "SENTINEL", projectId: "private-project-01", scope: "project", capabilityId: "verification.qa_gate", taskType: "validation" }),
    compileAgentBoundary({ agentId: "WARDEN", projectId: "private-project-01", scope: "project", capabilityId: "security.privacy_review", taskType: "security-review" }),
    compileAgentBoundary({ agentId: "AUDITOR", projectId: "private-project-01", scope: "project", capabilityId: "verification.review_output", taskType: "review" }),
  ];
}

export function summarizeBoundaryCompiler(examples = buildBoundaryCompilerExamples()) {
  return {
    compilerVersion: BOUNDARY_COMPILER_VERSION,
    dryRunOnly: true,
    exampleCount: examples.length,
    validExamples: examples.filter((example) => example.valid).length,
    summaries: examples.map(summarizeBoundaryEnvelope),
  };
}
