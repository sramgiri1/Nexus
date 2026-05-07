import { randomUUID } from "node:crypto";
import { buildAgentContext } from "./agentContext.js";
import {
  buildIdentityContext,
  createDelegationHop,
  validateIdentityContext,
} from "../runtime/identityContext.js";
import { evaluateTrafficRequest } from "../runtime/trafficPlane.js";
import { writeLocalStateEvent } from "../local-state/writeLocalState.js";

const PRIVATE_PROJECT_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function mapDecisionToResult(decisionResult) {
  if (decisionResult === "REQUIRE_APPROVAL") {
    return "REQUIRE_APPROVAL";
  }

  if (decisionResult === "DENY" || decisionResult === "ESCALATE") {
    return "BLOCKED";
  }

  if (decisionResult === "ALLOW" || decisionResult === "REDACT") {
    return "PASS";
  }

  return "FAIL";
}

function taskStateForResult(result) {
  if (result === "PASS") {
    return "local_recorded";
  }

  if (result === "REQUIRE_APPROVAL") {
    return "approval_required";
  }

  if (result === "BLOCKED") {
    return "blocked";
  }

  return "failed";
}

function normalizeProjectId(projectId) {
  return normalizeString(projectId).toLowerCase();
}

function hasLocalWriteScope(originatingUser) {
  return Array.isArray(originatingUser?.scopes)
    ? originatingUser.scopes.includes("local:write")
    : false;
}

function isSecurityBlockedDecision(decision = {}) {
  const serialized = [
    normalizeString(decision.reason).toLowerCase(),
    ...ensureArray(decision.blockedBy).map((entry) =>
      normalizeString(entry).toLowerCase()
    ),
  ].join(" ");

  return /secret|security|data-classification/.test(serialized);
}

function performLocalWrite(label, type, record, executionContext, trafficResult) {
  return {
    label,
    ...writeLocalStateEvent({
      type,
      record,
      identityContext: executionContext.identityContext,
      policyDecision: trafficResult.decision,
      dryRun: false,
    }),
    dryRun: false,
  };
}

export function createControlledExecutionStep(name, status, details = {}) {
  return {
    name: normalizeString(name),
    status: normalizeString(status) || "INFO",
    details,
  };
}

export function validateControlledExecutionInput(input = {}) {
  const errors = [];
  const warnings = [];
  const projectId = normalizeProjectId(input.projectId);

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    errors.push("input must be an object.");
    return { valid: false, errors, warnings };
  }

  if (normalizeString(input.executionMode) !== "controlled-local") {
    errors.push("executionMode must be controlled-local.");
  }

  if (input.allowLocalWrites !== true) {
    errors.push("allowLocalWrites must be true.");
  }

  if (projectId !== "demoapp") {
    errors.push("projectId must be demoapp in controlled local mode.");
  }

  if (PRIVATE_PROJECT_PATTERN.test(JSON.stringify(input))) {
    errors.push("private project references are not allowed.");
  }

  for (const fieldName of [
    "projectId",
    "taskType",
    "objective",
    "sourceAgent",
    "targetAgent",
    "capabilityId",
    "riskLevel",
    "dataClassification",
  ]) {
    if (!normalizeString(input[fieldName])) {
      errors.push(`${fieldName} is required.`);
    }
  }

  if (!input.originatingUser || typeof input.originatingUser !== "object") {
    errors.push("originatingUser is required.");
  }

  if (!Array.isArray(input.originatingUser?.scopes)) {
    warnings.push("originatingUser.scopes should be an array.");
  } else if (!hasLocalWriteScope(input.originatingUser)) {
    warnings.push("originatingUser.scopes should include local:write.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildControlledExecutionContext(input = {}) {
  const now = new Date().toISOString();
  const taskId = normalizeString(input.taskId) || randomUUID();
  const requestId = normalizeString(input.requestId) || randomUUID();
  const correlationId = normalizeString(input.correlationId) || randomUUID();
  const idempotencyKey = normalizeString(input.idempotencyKey) || randomUUID();

  const taskForAgentContext = {
    projectId: normalizeString(input.projectId),
    sourceAgent: normalizeString(input.sourceAgent),
    targetAgent: normalizeString(input.targetAgent),
    taskType: normalizeString(input.taskType),
    objective: normalizeString(input.objective),
    description: normalizeString(input.objective),
    allowedFiles: ensureArray(input.allowedFiles),
    forbiddenFiles: ensureArray(input.forbiddenFiles),
    acceptanceCriteria:
      ensureArray(input.acceptanceCriteria).length > 0
        ? ensureArray(input.acceptanceCriteria)
        : [
            "Controlled local execution records runtime metadata only.",
            "No provider call, tool call, or project mutation is performed.",
          ],
    requiredSkills: ensureArray(input.requiredSkills),
    riskLevel: normalizeString(input.riskLevel),
    blocking: input.blocking !== false,
    dependsOn: ensureArray(input.dependsOn),
    state: "local_execution_pending",
    priority: normalizeString(input.priority) || "normal",
    dataClassification: normalizeString(input.dataClassification),
    approvalRequired: input.requiresApproval === true,
    providerPolicy: normalizeString(input.providerPolicy),
    environment: normalizeString(input.environment),
    runtimeExpectation: normalizeString(input.runtime) || "node-local",
    redacted: true,
  };

  const agentContext = buildAgentContext({
    agentId: normalizeString(input.targetAgent),
    task: taskForAgentContext,
  });

  const identityContext = buildIdentityContext({
    originatingUser: input.originatingUser,
    session: {
      sessionId: normalizeString(input.sessionId) || randomUUID(),
      source: normalizeString(input.sessionSource) || "demo",
      startedAt: now,
    },
    delegationChain: [
      createDelegationHop({
        from: normalizeString(input.sourceAgent),
        to: normalizeString(input.targetAgent),
        reason: "Controlled local execution delegation.",
        capabilityId: normalizeString(input.capabilityId),
        timestamp: now,
      }),
    ],
    agent: {
      agentId: normalizeString(input.targetAgent),
      agentVersion:
        normalizeString(input.agentVersion) || "controlled-local-1.0",
      agentGroup: agentContext.agentGroup,
      agentPlane: agentContext.agentPlane,
    },
    request: {
      requestId,
      taskId,
      projectId: normalizeString(input.projectId),
      correlationId,
      idempotencyKey,
    },
    contextVersion: "1.0",
  });

  const trafficRequest = {
    identityContext,
    capabilityId: normalizeString(input.capabilityId),
    agentId: normalizeString(input.targetAgent),
    actionType: normalizeString(input.actionType) || "runtime_call",
    target: normalizeString(input.target) || normalizeString(input.taskType),
    runtime: normalizeString(input.runtime) || "node-local",
    provider: normalizeString(input.provider) || "none",
    dataClassification:
      normalizeString(input.dataClassification) || "internal",
    promptClassification:
      normalizeString(input.promptClassification) ||
      normalizeString(input.dataClassification) ||
      "internal",
    responseExpectedClass:
      normalizeString(input.responseExpectedClass) ||
      normalizeString(input.dataClassification) ||
      "internal",
    riskLevel: normalizeString(input.riskLevel) || "medium",
    requiresApproval: input.requiresApproval === true,
    approvalEvidence: ensureArray(input.approvalEvidence),
    metadata: {
      executionMode: "controlled-local",
      localStateWritesPlanned: true,
      intent:
        normalizeString(input.intent) || normalizeString(input.taskType),
      operation:
        normalizeString(input.operation) || normalizeString(input.taskType),
      actionCategory:
        normalizeString(input.actionCategory) ||
        normalizeString(input.taskType),
      requestedAction:
        normalizeString(input.requestedAction) ||
        normalizeString(input.target) ||
        normalizeString(input.taskType),
      taskId,
      projectId: normalizeString(input.projectId),
      sourceAgent: normalizeString(input.sourceAgent),
      targetAgent: normalizeString(input.targetAgent),
      retrievedContextClassification:
        normalizeString(input.retrievedContextClassification) ||
        normalizeString(input.dataClassification) ||
        "internal",
      chainDepth: Number.isFinite(input.chainDepth) ? input.chainDepth : 1,
      egressBytes: 0,
      costUsd: 0,
      toolExecutionExecuted: false,
      providerCallsExecuted: false,
      projectMutationExecuted: false,
      apiCallsExecuted: false,
      dbWritesExecuted: false,
      downstreamToolCalls: [],
    },
  };

  return {
    taskId,
    requestId,
    correlationId,
    idempotencyKey,
    identityContext,
    agentContext,
    trafficRequest,
  };
}

function buildLocalWriteRecords(input, executionContext, trafficResult, result) {
  const projectId = normalizeString(input.projectId);
  const taskId = normalizeString(executionContext.taskId);
  const capabilityId = normalizeString(input.capabilityId);
  const targetAgent = normalizeString(input.targetAgent);
  const correlationId = normalizeString(executionContext.correlationId);
  const dataClassification = normalizeString(input.dataClassification);
  const evidenceClassification =
    dataClassification === "secret"
      ? "restricted"
      : dataClassification || "internal";

  return {
    task: {
      taskId,
      projectId,
      sourceAgent: normalizeString(input.sourceAgent),
      targetAgent,
      taskType: normalizeString(input.taskType),
      objective: normalizeString(input.objective),
      state: taskStateForResult(result),
      riskLevel: normalizeString(input.riskLevel),
      blocking: input.blocking !== false,
      dependsOn: ensureArray(input.dependsOn),
      capabilityId,
      contractId:
        normalizeString(input.contractId) || "controlled-local-contract",
      evidenceIds: [],
      auditEventIds: [],
      redacted: true,
    },
    audit: {
      eventType: "controlled_local_execution",
      actorId: targetAgent,
      actorType: "agent",
      projectId,
      taskId,
      capabilityId,
      policyDecisionId: trafficResult.decision.decisionId,
      summary: `Controlled local execution recorded ${normalizeString(
        input.taskType
      )} as ${result} for correlation ${correlationId}.`,
      redacted: true,
    },
    evidence: {
      type: "controlled_local_execution",
      projectId,
      taskId,
      agentId: targetAgent,
      capabilityId,
      result: result === "PASS" ? "PASS" : "INFO",
      summary:
        "Controlled local execution evidence. No provider call, tool execution, or project mutation was performed.",
      artifactPaths: ["reports/controlled-local-execution-report.md"],
      traceIds: [trafficResult.evidenceRecord.recordId],
      policyDecisionId: trafficResult.decision.decisionId,
      dataClassification: evidenceClassification,
      redacted: true,
    },
    runtimeEvent: {
      eventType: "controlled_local_execution",
      projectId,
      taskId,
      agentId: targetAgent,
      runtime:
        normalizeString(input.runtime) ||
        normalizeString(trafficResult.decision.runtime) ||
        "node-local",
      summary: `Controlled local runtime record for ${normalizeString(
        input.taskType
      )} with correlation ${correlationId}.`,
      redacted: true,
    },
    approval: {
      type: "controlled_local_execution",
      requestedBy: targetAgent,
      projectId,
      taskId,
      riskLevel: normalizeString(input.riskLevel),
      decision: "requested",
      summary: `Approval requested before controlled local execution may proceed for ${normalizeString(
        input.taskType
      )}.`,
      redacted: true,
    },
    incident: {
      type: "controlled_local_execution_block",
      severity: normalizeString(input.riskLevel) || "high",
      projectId,
      taskId,
      summary: `Blocked controlled local execution for ${normalizeString(
        input.taskType
      )}: ${normalizeString(trafficResult.decision.reason)}`,
      status: "open",
      redacted: true,
    },
  };
}

export function runControlledLocalExecution(input = {}) {
  const steps = [];
  const errors = [];
  const warnings = [];
  const validation = validateControlledExecutionInput(input);

  steps.push(
    createControlledExecutionStep(
      "validate_input",
      validation.valid ? "PASS" : "FAIL",
      {
        executionMode: normalizeString(input.executionMode),
        allowLocalWrites: input.allowLocalWrites === true,
        projectId: normalizeString(input.projectId),
      }
    )
  );

  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  if (!validation.valid) {
    return {
      ok: false,
      executionMode: "controlled-local",
      projectId: normalizeString(input.projectId),
      taskId: "",
      steps,
      identityContext: {},
      agentContext: {},
      trafficDecision: {},
      behavior: {},
      evidenceRecord: {},
      localWrites: [],
      result: "FAIL",
      errors: unique(errors),
      warnings: unique(warnings),
      executionFlags: {
        providerCallsExecuted: false,
        toolCallsExecuted: false,
        projectMutationExecuted: false,
        apiCallsExecuted: false,
        dbWritesExecuted: false,
        localStateWritesExecuted: false,
      },
    };
  }

  const executionContext = buildControlledExecutionContext(input);
  const identityValidation = validateIdentityContext(
    executionContext.identityContext
  );

  steps.push(
    createControlledExecutionStep(
      "build_identity_context",
      identityValidation.valid ? "PASS" : "FAIL",
      {
        requestId: executionContext.requestId,
        sessionId: executionContext.identityContext.session.sessionId,
        agentId: executionContext.identityContext.agent.agentId,
      }
    )
  );
  steps.push(
    createControlledExecutionStep(
      "build_agent_context",
      executionContext.agentContext.errors.length === 0 ? "PASS" : "FAIL",
      {
        agentId: executionContext.agentContext.agentId,
        agentGroup: executionContext.agentContext.agentGroup,
        agentPlane: executionContext.agentContext.agentPlane,
      }
    )
  );
  steps.push(
    createControlledExecutionStep("build_traffic_request", "PASS", {
      actionType: executionContext.trafficRequest.actionType,
      runtime: executionContext.trafficRequest.runtime,
      provider: executionContext.trafficRequest.provider,
    })
  );

  errors.push(...identityValidation.errors, ...executionContext.agentContext.errors);
  warnings.push(
    ...identityValidation.warnings,
    ...executionContext.agentContext.warnings
  );

  const trafficResult = evaluateTrafficRequest({
    identityContext: executionContext.identityContext,
    trafficRequest: executionContext.trafficRequest,
    baseline: input.baseline || null,
    inputForHash: {
      projectId: normalizeString(input.projectId),
      taskType: normalizeString(input.taskType),
      objective: normalizeString(input.objective),
      executionMode: "controlled-local",
    },
    outputForHash: {
      targetAgent: normalizeString(input.targetAgent),
      capabilityId: normalizeString(input.capabilityId),
    },
  });

  const trafficStepStatus =
    trafficResult.decision.result === "ALLOW" ||
    trafficResult.decision.result === "REDACT"
      ? "PASS"
      : trafficResult.decision.result === "REQUIRE_APPROVAL"
        ? "BLOCKED"
        : "FAIL";

  steps.push(
    createControlledExecutionStep("evaluate_traffic_plane", trafficStepStatus, {
      decision: trafficResult.decision.result,
      reason: trafficResult.decision.reason,
    })
  );

  errors.push(...trafficResult.errors);
  warnings.push(...trafficResult.warnings);

  let result = mapDecisionToResult(trafficResult.decision.result);
  const localWriteRecords = buildLocalWriteRecords(
    input,
    executionContext,
    trafficResult,
    result
  );
  const localWrites = [];

  if (result === "BLOCKED") {
    localWrites.push(
      performLocalWrite(
        "audit",
        "audit",
        localWriteRecords.audit,
        executionContext,
        trafficResult
      )
    );

    if (isSecurityBlockedDecision(trafficResult.decision)) {
      localWrites.push(
        performLocalWrite(
          "incident",
          "incident",
          localWriteRecords.incident,
          executionContext,
          trafficResult
        )
      );
    }
  } else if (result === "REQUIRE_APPROVAL") {
    localWrites.push(
      performLocalWrite(
        "task",
        "task",
        localWriteRecords.task,
        executionContext,
        trafficResult
      )
    );
    localWrites.push(
      performLocalWrite(
        "audit",
        "audit",
        localWriteRecords.audit,
        executionContext,
        trafficResult
      )
    );
    localWrites.push(
      performLocalWrite(
        "approval",
        "approval",
        localWriteRecords.approval,
        executionContext,
        trafficResult
      )
    );
  } else if (result === "PASS") {
    localWrites.push(
      performLocalWrite(
        "task",
        "task",
        localWriteRecords.task,
        executionContext,
        trafficResult
      )
    );
    localWrites.push(
      performLocalWrite(
        "audit",
        "audit",
        localWriteRecords.audit,
        executionContext,
        trafficResult
      )
    );
    localWrites.push(
      performLocalWrite(
        "evidence",
        "evidence",
        localWriteRecords.evidence,
        executionContext,
        trafficResult
      )
    );
    localWrites.push(
      performLocalWrite(
        "runtime_event",
        "runtime_event",
        localWriteRecords.runtimeEvent,
        executionContext,
        trafficResult
      )
    );
  }

  for (const write of localWrites) {
    steps.push(
      createControlledExecutionStep(
        `write_local_${write.label}`,
        write.ok ? "PASS" : "FAIL",
        {
          path: write.path,
          written: write.written,
          dryRun: false,
        }
      )
    );

    errors.push(...(write.errors || []));
    warnings.push(...(write.warnings || []));
  }

  if (localWrites.some((write) => !write.ok)) {
    result = "FAIL";
  }

  steps.push(
    createControlledExecutionStep(
      "finalize_result",
      result === "FAIL" ? "FAIL" : "PASS",
      {
        result,
        executionMode: "controlled-local",
      }
    )
  );

  return {
    ok: result !== "FAIL",
    executionMode: "controlled-local",
    projectId: normalizeString(input.projectId),
    taskId: executionContext.taskId,
    steps,
    identityContext: executionContext.identityContext,
    agentContext: executionContext.agentContext,
    trafficDecision: trafficResult.decision,
    behavior: trafficResult.behavior,
    evidenceRecord: trafficResult.evidenceRecord,
    localWrites,
    result,
    errors: unique(errors),
    warnings: unique(warnings),
    executionFlags: {
      providerCallsExecuted: false,
      toolCallsExecuted: false,
      projectMutationExecuted: false,
      apiCallsExecuted: false,
      dbWritesExecuted: false,
      localStateWritesExecuted: localWrites.some((write) => write.written),
    },
  };
}
