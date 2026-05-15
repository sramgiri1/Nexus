export const BOUNDARY_ENVELOPE_VERSION = "1.0";

export function createBoundaryEnvelope(input) {
  const now = new Date().toISOString();
  return {
    envelopeVersion: BOUNDARY_ENVELOPE_VERSION,
    phase: "P45.4",
    generatedAt: now,
    dryRun: true,
    runtimeEnforcementEnabled: false,
    toolDispatchEnabled: false,
    providerCallsEnabled: false,
    dbWritesEnabled: false,
    agent: input.agent,
    project: input.project,
    scope: input.scope,
    task: input.task,
    allowedCapabilities: input.allowedCapabilities,
    deniedCapabilities: input.deniedCapabilities,
    allowedPaths: input.allowedPaths,
    forbiddenPaths: input.forbiddenPaths,
    allowedTools: input.allowedTools,
    forbiddenTools: input.forbiddenTools,
    dataClassificationLimits: input.dataClassificationLimits,
    costPolicy: input.costPolicy,
    memoryPolicy: input.memoryPolicy,
    approvalsRequired: input.approvalsRequired,
    evidenceRequired: input.evidenceRequired,
    warnings: input.warnings || [],
    errors: input.errors || [],
  };
}

export function summarizeBoundaryEnvelope(envelope) {
  return {
    agentId: envelope.agent?.agentId,
    projectId: envelope.project?.projectId,
    scopeType: envelope.scope?.scopeType,
    capabilityId: envelope.task?.capabilityId,
    dryRun: envelope.dryRun === true,
    allowedCapabilityCount: envelope.allowedCapabilities?.length || 0,
    forbiddenPathCount: envelope.forbiddenPaths?.length || 0,
    approvalCount: envelope.approvalsRequired?.length || 0,
    evidenceCount: envelope.evidenceRequired?.length || 0,
    hasErrors: (envelope.errors || []).length > 0,
  };
}
