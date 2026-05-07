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
    return "dry_run_ready";
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

export function createDryRunStep(name, status, details = {}) {
  return {
    name: normalizeString(name),
    status: normalizeString(status) || "INFO",
    details,
  };
}

export function validateDryRunInput(input = {}) {
  const errors = [];
  const warnings = [];
  const projectId = normalizeProjectId(input.projectId);

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    errors.push("input must be an object.");
    return { valid: false, errors, warnings };
  }

  if (input.dryRun !== true) {
    errors.push("dryRun must be true.");
  }

  if (projectId !== "demoapp") {
    errors.push("projectId must be demoapp in local dry-run mode.");
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
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildDryRunExecutionContext(input = {}) {
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
        : ["Dry-run only. No real execution or gate pass is asserted."],
    requiredSkills: ensureArray(input.requiredSkills),
    riskLevel: normalizeString(input.riskLevel),
    blocking: input.blocking !== false,
    dependsOn: ensureArray(input.dependsOn),
    state: "dry_run_pending",
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
        reason: "Local orchestrator dry-run delegation.",
        capabilityId: normalizeString(input.capabilityId),
        timestamp: now,
      }),
    ],
    agent: {
      agentId: normalizeString(input.targetAgent),
      agentVersion: normalizeString(input.agentVersion) || "dry-run-1.0",
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
      dryRun: true,
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
  const evidenceClassification =
    normalizeString(input.dataClassification) === "secret"
      ? "restricted"
      : normalizeString(input.dataClassification) || "internal";

  return {
    task: {
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
      contractId: normalizeString(input.contractId) || "dry-run-contract",
      evidenceIds: [],
      auditEventIds: [],
      redacted: true,
    },
    audit: {
      eventType: "orchestrator_dry_run",
      actorId: targetAgent,
      actorType: "agent",
      projectId,
      taskId,
      capabilityId,
      policyDecisionId: trafficResult.decision.decisionId,
      summary: `Dry-run only: ${normalizeString(input.taskType)} evaluated as ${result}.`,
      redacted: true,
    },
    evidence: {
      type: "orchestrator_dry_run",
      projectId,
      taskId,
      agentId: targetAgent,
      capabilityId,
      result: result === "BLOCKED" ? "BLOCKED" : "INFO",
      summary:
        "Dry-run only evidence. No live provider call, tool execution, or gate pass was performed.",
      artifactPaths: ["reports/orchestrator-dry-run-report.md"],
      traceIds: [trafficResult.evidenceRecord.recordId],
      policyDecisionId: trafficResult.decision.decisionId,
      dataClassification: evidenceClassification,
      redacted: true,
    },
    runtimeEvent: {
      eventType: "orchestrator_dry_run",
      projectId,
      taskId,
      agentId: targetAgent,
      runtime:
        normalizeString(input.runtime) ||
        normalizeString(trafficResult.decision.runtime) ||
        "node-local",
      summary: `Dry-run only runtime event for ${normalizeString(
        input.taskType
      )}.`,
      redacted: true,
    },
  };
}

export function runLocalOrchestratorDryRun(input = {}) {
  const steps = [];
  const errors = [];
  const warnings = [];
  const validation = validateDryRunInput(input);

  steps.push(
    createDryRunStep("validate_input", validation.valid ? "PASS" : "FAIL", {
      dryRun: input.dryRun === true,
      projectId: normalizeString(input.projectId),
    })
  );

  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  if (!validation.valid) {
    return {
      ok: false,
      dryRun: true,
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
      },
    };
  }

  const executionContext = buildDryRunExecutionContext(input);
  const identityValidation = validateIdentityContext(
    executionContext.identityContext
  );

  steps.push(
    createDryRunStep("build_identity_context", identityValidation.valid ? "PASS" : "FAIL", {
      requestId: executionContext.requestId,
      sessionId: executionContext.identityContext.session.sessionId,
      agentId: executionContext.identityContext.agent.agentId,
    })
  );
  steps.push(
    createDryRunStep(
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
    createDryRunStep("build_traffic_request", "PASS", {
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
      dryRun: true,
    },
    outputForHash: {
      targetAgent: normalizeString(input.targetAgent),
      capabilityId: normalizeString(input.capabilityId),
    },
  });

  steps.push(
    createDryRunStep(
      "evaluate_traffic_plane",
      trafficResult.decision.result === "ALLOW" ||
        trafficResult.decision.result === "REDACT"
        ? "PASS"
        : trafficResult.decision.result === "REQUIRE_APPROVAL"
          ? "BLOCKED"
          : "FAIL",
      {
        decision: trafficResult.decision.result,
        reason: trafficResult.decision.reason,
      }
    )
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

  const localWrites = [
    {
      label: "task",
      ...writeLocalStateEvent({
        type: "task",
        record: localWriteRecords.task,
        identityContext: executionContext.identityContext,
        policyDecision: trafficResult.decision,
        dryRun: true,
      }),
      dryRun: true,
    },
    {
      label: "audit",
      ...writeLocalStateEvent({
        type: "audit",
        record: localWriteRecords.audit,
        identityContext: executionContext.identityContext,
        policyDecision: trafficResult.decision,
        dryRun: true,
      }),
      dryRun: true,
    },
    {
      label: "evidence",
      ...writeLocalStateEvent({
        type: "evidence",
        record: localWriteRecords.evidence,
        identityContext: executionContext.identityContext,
        policyDecision: trafficResult.decision,
        dryRun: true,
      }),
      dryRun: true,
    },
    {
      label: "runtime_event",
      ...writeLocalStateEvent({
        type: "runtime_event",
        record: localWriteRecords.runtimeEvent,
        identityContext: executionContext.identityContext,
        policyDecision: trafficResult.decision,
        dryRun: true,
      }),
      dryRun: true,
    },
  ];

  for (const write of localWrites) {
    steps.push(
      createDryRunStep(
        `simulate_local_${write.label}_write`,
        write.ok ? "PASS" : "FAIL",
        {
          path: write.path,
          written: write.written,
          dryRun: true,
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
    createDryRunStep("finalize_result", result === "FAIL" ? "FAIL" : "PASS", {
      result,
      dryRun: true,
      releaseClaim: "dry_run_only",
    })
  );

  return {
    ok: result !== "FAIL",
    dryRun: true,
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
    },
  };
}
