import { randomUUID } from "node:crypto";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter((item) => item !== undefined) : [];
}

export function createDelegationHop(input = {}) {
  return {
    hopId: normalizeString(input.hopId) || randomUUID(),
    from: normalizeString(input.from),
    to: normalizeString(input.to),
    reason: normalizeString(input.reason),
    capabilityId: normalizeString(input.capabilityId),
    timestamp: normalizeString(input.timestamp) || new Date().toISOString(),
  };
}

export function buildIdentityContext(input = {}) {
  const originatingUser = input.originatingUser || {};
  const session = input.session || {};
  const agent = input.agent || {};
  const request = input.request || {};

  return {
    originatingUser: {
      userId: normalizeString(originatingUser.userId),
      role: normalizeString(originatingUser.role),
      authType: normalizeString(originatingUser.authType) || "local",
      scopes: normalizeArray(originatingUser.scopes),
    },
    session: {
      sessionId: normalizeString(session.sessionId),
      source: normalizeString(session.source) || "cli",
      startedAt: normalizeString(session.startedAt) || new Date().toISOString(),
    },
    delegationChain: normalizeArray(input.delegationChain).map((hop) =>
      createDelegationHop(hop)
    ),
    agent: {
      agentId: normalizeString(agent.agentId),
      agentVersion: normalizeString(agent.agentVersion) || "unknown",
      agentGroup: normalizeString(agent.agentGroup),
      agentPlane: normalizeString(agent.agentPlane),
    },
    request: {
      requestId: normalizeString(request.requestId) || randomUUID(),
      taskId: normalizeString(request.taskId),
      projectId: normalizeString(request.projectId),
      correlationId: normalizeString(request.correlationId),
      idempotencyKey: normalizeString(request.idempotencyKey),
    },
    contextVersion: normalizeString(input.contextVersion) || "1.0",
  };
}

export function validateIdentityContext(context = {}) {
  const errors = [];
  const warnings = [];

  const user = context.originatingUser || {};
  const session = context.session || {};
  const agent = context.agent || {};
  const request = context.request || {};
  const delegationChain = context.delegationChain;

  if (!normalizeString(user.userId)) {
    errors.push("missing_originating_user");
  }

  if (!normalizeString(session.sessionId)) {
    errors.push("missing_session_id");
  }

  if (!normalizeString(agent.agentId)) {
    errors.push("missing_agent_id");
  }

  if (!normalizeString(request.requestId)) {
    errors.push("missing_request_id");
  }

  if (!Array.isArray(delegationChain)) {
    errors.push("invalid_delegation_chain");
  } else if (
    delegationChain.some(
      (hop) =>
        !normalizeString(hop?.hopId) ||
        !normalizeString(hop?.from) ||
        !normalizeString(hop?.to) ||
        !normalizeString(hop?.reason) ||
        !normalizeString(hop?.capabilityId) ||
        !normalizeString(hop?.timestamp)
    )
  ) {
    errors.push("invalid_delegation_chain");
  }

  if (!normalizeString(user.role)) {
    warnings.push("missing_role");
  }

  if (!Array.isArray(user.scopes) || user.scopes.length === 0) {
    warnings.push("missing_scopes");
  }

  if (Array.isArray(delegationChain) && delegationChain.length === 0) {
    warnings.push("empty_delegation_chain");
  }

  if (user.authType === "demo" || session.source === "demo") {
    warnings.push("demo_identity");
  }

  if (user.authType === "system" && session.source !== "demo" && session.source !== "test") {
    warnings.push("system_auth_requires_originating_user_review");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
