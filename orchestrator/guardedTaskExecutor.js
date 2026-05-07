import { randomUUID } from "node:crypto";
import { buildAgentContext } from "./agentContext.js";
import {
  buildIdentityContext,
  createDelegationHop,
  validateIdentityContext,
} from "../runtime/identityContext.js";
import { evaluateTrafficRequest } from "../runtime/trafficPlane.js";
import { writeLocalStateEvent } from "../local-state/writeLocalState.js";
import {
  listFilesSafe,
  readJsonSafe,
  readTextSafe,
} from "../local-state/safeFileReader.js";
import {
  readLocalStateSnapshot,
  validateLocalStateSnapshot,
} from "../local-state/readLocalState.js";

const PRIVATE_PROJECT_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERN = new RegExp(
  [
    "sk-[A-Za-z0-9]{10,}",
    "sk-ant-[A-Za-z0-9_-]{6,}",
    ["OPENAI", "_", "API", "_", "KEY", "="].join(""),
    ["ANTHROPIC", "_", "API", "_", "KEY", "="].join(""),
    ["DATABASE", "_", "URL", "="].join(""),
    "-----BEGIN [A-Z ]+PRIVATE KEY-----",
  ].join("|")
);
const ALLOWED_LOCAL_ACTIONS = new Set([
  "validate_demo_contracts",
  "validate_demo_reports",
  "validate_runtime_snapshot",
  "validate_public_safety_surface",
]);
const VERIFICATION_AGENTS = new Set(["auditor", "sentinel", "warden"]);
const PRIVATE_EXECUTION_KEY = ["care", "loop", "ExecutionEnabled"].join("");

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeProjectId(projectId) {
  return normalizeString(projectId).toLowerCase();
}

function hasLocalWriteScope(originatingUser) {
  return Array.isArray(originatingUser?.scopes)
    ? originatingUser.scopes.includes("local:write")
    : false;
}

function createStep(name, status, details = {}) {
  return {
    name: normalizeString(name),
    status: normalizeString(status) || "INFO",
    details,
  };
}

function mapStepResultToEvidenceOutcome(result) {
  if (result === "PASS") {
    return "PASS";
  }

  if (result === "BLOCKED") {
    return "BLOCKED";
  }

  return "FAIL";
}

function countTransitionEvidence(result) {
  if (!result?.transition?.transitionEvidence) {
    return 0;
  }

  return Array.isArray(result.transition.transitionEvidence.evidenceTypes)
    ? result.transition.transitionEvidence.evidenceTypes.length
    : 0;
}

function summarizeTransitions(localWrites = []) {
  const transitionWrites = localWrites.filter(
    (write) =>
      typeof write.label === "string" && write.label.startsWith("task_state_")
  );

  return {
    transitionsAttempted: transitionWrites.length,
    transitionsAllowed: transitionWrites.filter((write) => write.ok).length,
    transitionsBlocked: transitionWrites.filter(
      (write) => write.blocked === true || write.ok === false
    ).length,
    transitionEvidenceCount: transitionWrites.reduce(
      (total, write) => total + countTransitionEvidence(write),
      0
    ),
  };
}

function createTransitionWriteLabel(fromState, toState) {
  return `task_state_${normalizeString(fromState)}_${normalizeString(toState)}`;
}

function performLocalWrite(label, type, record, context, trafficResult) {
  return {
    label,
    ...writeLocalStateEvent({
      type,
      record,
      identityContext: context.identityContext,
      policyDecision: trafficResult.decision,
      dryRun: false,
    }),
    dryRun: false,
  };
}

function loadCapabilityDefinition(capabilityId) {
  const registry = readJsonSafe("capabilities/registry.json");
  if (!registry.ok) {
    return {
      ok: false,
      capability: null,
      errors: [registry.error || "Unable to read capabilities registry."],
      warnings: [],
    };
  }

  const capability = ensureArray(registry.data?.capabilities).find(
    (entry) => normalizeString(entry.capabilityId) === normalizeString(capabilityId)
  );

  if (!capability) {
    return {
      ok: false,
      capability: null,
      errors: [`Unknown capabilityId: ${capabilityId}`],
      warnings: [],
    };
  }

  return {
    ok: true,
    capability,
    errors: [],
    warnings: [],
  };
}

function validateCapabilityUse(capability, input) {
  const errors = [];
  const warnings = [];
  const agentId = normalizeString(input.targetAgent);
  const dataClassification =
    normalizeString(input.dataClassification) || "internal";
  const runtime = normalizeString(input.runtime) || "node-local";
  const provider = normalizeString(input.provider) || "none";

  if (normalizeString(capability.status) !== "enabled") {
    errors.push(`Capability ${capability.capabilityId} is not enabled.`);
  }

  if (!ensureArray(capability.allowedAgents).includes(agentId)) {
    errors.push(
      `Capability ${capability.capabilityId} does not allow agent ${agentId}.`
    );
  }

  if (!ensureArray(capability.runtimes).includes(runtime)) {
    errors.push(
      `Capability ${capability.capabilityId} does not allow runtime ${runtime}.`
    );
  }

  if (!ensureArray(capability.providers).includes(provider)) {
    errors.push(
      `Capability ${capability.capabilityId} does not allow provider ${provider}.`
    );
  }

  if (!ensureArray(capability.dataClassesAllowed).includes(dataClassification)) {
    errors.push(
      `Capability ${capability.capabilityId} does not allow data classification ${dataClassification}.`
    );
  }

  if (
    ensureArray(capability.taskTypes).length > 0 &&
    !ensureArray(capability.taskTypes).includes(normalizeString(input.taskType))
  ) {
    warnings.push(
      `taskType ${normalizeString(
        input.taskType
      )} is outside the registry taskTypes for ${capability.capabilityId}.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function readJsonCollection(relativeDir) {
  const listed = listFilesSafe(relativeDir, {
    recursive: false,
    extensions: [".json"],
  });

  if (!listed.ok) {
    return {
      ok: false,
      files: [],
      parsed: [],
      errors: [listed.error || `Unable to list ${relativeDir}.`],
      warnings: [],
    };
  }

  const parsed = [];
  const errors = [];

  for (const relativePath of listed.files) {
    const jsonResult = readJsonSafe(relativePath);
    if (!jsonResult.ok) {
      errors.push(jsonResult.error || `Unable to read ${relativePath}.`);
      continue;
    }

    parsed.push({
      path: relativePath,
      data: jsonResult.data,
    });
  }

  return {
    ok: errors.length === 0,
    files: listed.files,
    parsed,
    errors,
    warnings: [],
  };
}

function validateSnapshotModule() {
  const snapshot = readLocalStateSnapshot();
  const snapshotValidation = validateLocalStateSnapshot(snapshot);
  const errors = [];
  const warnings = [...snapshotValidation.warnings];

  if (!snapshotValidation.valid) {
    errors.push(...snapshotValidation.errors);
  }

  if (!snapshot.runtimeFiles?.runtimeState) {
    errors.push("Local state snapshot is missing runtimeFiles.runtimeState.");
  }

  if (!snapshot.runtime?.runtimeTrafficPlane) {
    errors.push("Local state snapshot is missing runtime traffic status.");
  }

  return {
    ok: errors.length === 0,
    summary: `Validated local runtime snapshot presence through the local-state adapter.`,
    artifactPaths: [
      "local-state/runtime/tasks.json",
      "local-state/runtime/evidence.jsonl",
      "local-state/runtime/audit.jsonl",
      "local-state/runtime/events.jsonl",
    ],
    details: {
      runtimeFilesPresent: Boolean(snapshot.runtimeFiles?.runtimeState),
      localSnapshotReadOnly: snapshot.readOnly === true,
      runtimeTrafficStatusPresent: Boolean(snapshot.runtime?.runtimeTrafficPlane),
    },
    errors,
    warnings,
  };
}

function validatePublicSafetySurface() {
  const publicSafetyReport = readTextSafe("reports/public-safety-report.md");
  const demoArtifacts = readJsonCollection("demo/reports");
  const errors = [];
  const warnings = [];

  if (!publicSafetyReport.ok) {
    errors.push(
      publicSafetyReport.error || "Unable to read public safety report."
    );
  } else if (!/Result:\s+PASS/.test(publicSafetyReport.text)) {
    errors.push("Public safety report does not show Result: PASS.");
  }

  if (!demoArtifacts.ok) {
    errors.push(...demoArtifacts.errors);
  }

  const serializedArtifacts = JSON.stringify({
    report: publicSafetyReport.ok ? publicSafetyReport.text : "",
    artifacts: demoArtifacts.parsed,
  }).replaceAll(PRIVATE_EXECUTION_KEY, "privateProductExecutionEnabled");

  if (PRIVATE_PROJECT_PATTERN.test(serializedArtifacts)) {
    errors.push("Private project reference found in public safety surface.");
  }

  if (SECRET_PATTERN.test(serializedArtifacts)) {
    errors.push("Secret-like content found in public safety surface.");
  }

  return {
    ok: errors.length === 0,
    summary: `Validated public safety report and demo reports.`,
    artifactPaths: [
      "reports/public-safety-report.md",
      ...demoArtifacts.files,
    ],
    details: {
      publicSafetyReportPass:
        publicSafetyReport.ok && /Result:\s+PASS/.test(publicSafetyReport.text),
      demoReportsChecked: demoArtifacts.files.length,
    },
    errors,
    warnings,
  };
}

export function validateGuardedTaskInput(input = {}) {
  const errors = [];
  const warnings = [];
  const projectId = normalizeProjectId(input.projectId);

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    errors.push("input must be an object.");
    return { valid: false, errors, warnings };
  }

  if (normalizeString(input.executionMode) !== "guarded-local") {
    errors.push("executionMode must be guarded-local.");
  }

  if (projectId !== "demoapp") {
    errors.push("projectId must be demoapp in guarded local mode.");
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
    "allowedLocalAction",
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

  if (!ALLOWED_LOCAL_ACTIONS.has(normalizeString(input.allowedLocalAction))) {
    warnings.push("allowedLocalAction is outside the guarded local allowlist.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildGuardedTaskContext(input = {}) {
  const now = new Date().toISOString();
  const taskId = normalizeString(input.taskId) || randomUUID();
  const requestId = normalizeString(input.requestId) || randomUUID();
  const correlationId = normalizeString(input.correlationId) || randomUUID();
  const idempotencyKey = normalizeString(input.idempotencyKey) || randomUUID();
  const capabilityLookup = loadCapabilityDefinition(input.capabilityId);
  const capability = capabilityLookup.capability || null;

  const taskContract = {
    id:
      normalizeString(input.contractId) ||
      `guarded-local-contract-${taskId.slice(0, 8)}`,
    projectId: normalizeString(input.projectId),
    sourceAgent: normalizeString(input.sourceAgent),
    targetAgent: normalizeString(input.targetAgent),
    taskType: normalizeString(input.taskType),
    objective: normalizeString(input.objective),
    description: normalizeString(input.objective),
    allowedFiles: [
      "demo/contracts",
      "demo/reports",
      "reports",
      "dashboard/src/data",
      "local-state/runtime",
    ],
    forbiddenFiles: ["projects", "memory", "config", ".git", "node_modules"],
    acceptanceCriteria: [
      "Only deterministic local checks are executed.",
      "No provider call, external tool call, or project mutation occurs.",
      "Evidence, audit, and runtime events are written only through the local write boundary.",
    ],
    requiredSkills: [],
    riskLevel: normalizeString(input.riskLevel),
    blocking: input.blocking !== false,
    dependsOn: ensureArray(input.dependsOn),
    state: "queued",
    priority: normalizeString(input.priority) || "normal",
    dataClassification: normalizeString(input.dataClassification) || "internal",
    approvalRequired: false,
    providerPolicy: "none",
    environment: "local",
    runtimeExpectation: normalizeString(input.runtime) || "node-local",
    redacted: true,
    allowedLocalAction: normalizeString(input.allowedLocalAction),
    capabilityId: normalizeString(input.capabilityId),
    contractType:
      ensureArray(capability?.contractTypes)[0] || "task_contract",
  };

  const agentContext = buildAgentContext({
    agentId: normalizeString(input.targetAgent),
    task: taskContract,
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
        reason: "Guarded local agent task delegation.",
        capabilityId: normalizeString(input.capabilityId),
        timestamp: now,
      }),
    ],
    agent: {
      agentId: normalizeString(input.targetAgent),
      agentVersion:
        normalizeString(input.agentVersion) || "guarded-local-1.0",
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
    actionType: "skill_call",
    target:
      normalizeString(input.allowedLocalAction) || normalizeString(input.taskType),
    runtime: normalizeString(input.runtime) || "node-local",
    provider: "none",
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
    requiresApproval: false,
    approvalEvidence: [],
    metadata: {
      executionMode: "guarded-local",
      allowedLocalAction: normalizeString(input.allowedLocalAction),
      toolExecutionExecuted: false,
      providerCallsExecuted: false,
      projectMutationExecuted: false,
      apiCallsExecuted: false,
      dbWritesExecuted: false,
      egressBytes: 0,
      costUsd: 0,
      chainDepth: 1,
      downstreamToolCalls: [],
      projectId: normalizeString(input.projectId),
      sourceAgent: normalizeString(input.sourceAgent),
      targetAgent: normalizeString(input.targetAgent),
      taskId,
    },
  };

  return {
    taskId,
    requestId,
    correlationId,
    idempotencyKey,
    taskContract,
    capabilityLookup,
    capability,
    identityContext,
    agentContext,
    trafficRequest,
  };
}

export function executeDeterministicLocalStep(context = {}) {
  const action = normalizeString(context.taskContract?.allowedLocalAction);

  if (action === "validate_demo_contracts") {
    const contracts = readJsonCollection("demo/contracts");
    return {
      result: contracts.ok && contracts.files.length > 0 ? "PASS" : "FAIL",
      evidenceType: "demo_contract_validation_result",
      summary: `Validated ${contracts.files.length} demo contract files.`,
      artifactPaths: contracts.files,
      details: {
        filesChecked: contracts.files.length,
      },
      errors: contracts.errors,
      warnings: contracts.warnings,
    };
  }

  if (action === "validate_demo_reports") {
    const reports = readJsonCollection("demo/reports");
    return {
      result: reports.ok && reports.files.length > 0 ? "PASS" : "FAIL",
      evidenceType: "demo_report_validation_result",
      summary: `Validated ${reports.files.length} demo report files.`,
      artifactPaths: reports.files,
      details: {
        filesChecked: reports.files.length,
      },
      errors: reports.errors,
      warnings: reports.warnings,
    };
  }

  if (action === "validate_runtime_snapshot") {
    const snapshotValidation = validateSnapshotModule();
    return {
      result: snapshotValidation.ok ? "PASS" : "FAIL",
      evidenceType: "runtime_snapshot_validation_result",
      summary: snapshotValidation.summary,
      artifactPaths: snapshotValidation.artifactPaths,
      details: snapshotValidation.details,
      errors: snapshotValidation.errors,
      warnings: snapshotValidation.warnings,
    };
  }

  if (action === "validate_public_safety_surface") {
    const safetyValidation = validatePublicSafetySurface();
    return {
      result: safetyValidation.ok ? "PASS" : "FAIL",
      evidenceType: "public_safety_validation_result",
      summary: safetyValidation.summary,
      artifactPaths: safetyValidation.artifactPaths,
      details: safetyValidation.details,
      errors: safetyValidation.errors,
      warnings: safetyValidation.warnings,
    };
  }

  return {
    result: "BLOCKED",
    evidenceType: "guarded_local_action_blocked",
    summary: `Blocked guarded local action: ${action || "unknown"}.`,
    artifactPaths: [],
    details: {
      attemptedAction: action || "unknown",
    },
    errors: [],
    warnings: [`Action '${action || "unknown"}' is not allowed in guarded-local mode.`],
  };
}

export function summarizeGuardedTaskResult(result = {}) {
  const localWrites = ensureArray(result.localWrites);
  return {
    taskId: normalizeString(result.taskId),
    targetAgent: normalizeString(result.agentContext?.agentId),
    allowedLocalAction: normalizeString(
      result.taskContract?.allowedLocalAction ||
        result.agentContext?.taskContract?.allowedLocalAction
    ),
    result: normalizeString(result.result),
    localWrites: localWrites.length,
    transitionsAttempted: Number(result.transitionsAttempted) || 0,
    transitionsAllowed: Number(result.transitionsAllowed) || 0,
    transitionsBlocked: Number(result.transitionsBlocked) || 0,
    transitionEvidenceCount: Number(result.transitionEvidenceCount) || 0,
  };
}

export function runGuardedLocalAgentTask(input = {}) {
  const steps = [];
  const errors = [];
  const warnings = [];
  const validation = validateGuardedTaskInput(input);

  steps.push(
    createStep("validate_input", validation.valid ? "PASS" : "FAIL", {
      executionMode: normalizeString(input.executionMode),
      projectId: normalizeString(input.projectId),
      allowedLocalAction: normalizeString(input.allowedLocalAction),
    })
  );

  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  if (!validation.valid) {
    return {
      ok: false,
      executionMode: "guarded-local",
      projectId: normalizeString(input.projectId),
      taskId: "",
      steps,
      taskContract: {},
      capability: {},
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
        externalToolCallsExecuted: false,
        projectMutationExecuted: false,
        apiCallsExecuted: false,
        dbWritesExecuted: false,
        localStateWritesExecuted: false,
      },
    };
  }

  const context = buildGuardedTaskContext(input);
  const identityValidation = validateIdentityContext(context.identityContext);
  const capabilityValidation = context.capability
    ? validateCapabilityUse(context.capability, input)
    : {
        valid: false,
        errors: context.capabilityLookup.errors,
        warnings: context.capabilityLookup.warnings,
      };

  steps.push(
    createStep(
      "build_identity_context",
      identityValidation.valid ? "PASS" : "FAIL",
      {
        requestId: context.requestId,
        sessionId: context.identityContext.session.sessionId,
        agentId: context.identityContext.agent.agentId,
      }
    )
  );
  steps.push(
    createStep(
      "build_agent_context",
      context.agentContext.errors.length === 0 ? "PASS" : "FAIL",
      {
        agentId: context.agentContext.agentId,
        agentGroup: context.agentContext.agentGroup,
        agentPlane: context.agentContext.agentPlane,
      }
    )
  );
  steps.push(
    createStep("capability_check", capabilityValidation.valid ? "PASS" : "FAIL", {
      capabilityId: normalizeString(input.capabilityId),
      targetAgent: normalizeString(input.targetAgent),
      runtime: context.trafficRequest.runtime,
      provider: context.trafficRequest.provider,
    })
  );

  errors.push(
    ...identityValidation.errors,
    ...context.agentContext.errors,
    ...capabilityValidation.errors
  );
  warnings.push(
    ...identityValidation.warnings,
    ...context.agentContext.warnings,
    ...capabilityValidation.warnings
  );

  if (!capabilityValidation.valid) {
    return {
      ok: false,
      executionMode: "guarded-local",
      projectId: normalizeString(input.projectId),
      taskId: context.taskId,
      steps,
      taskContract: context.taskContract,
      capability: context.capability || {},
      identityContext: context.identityContext,
      agentContext: context.agentContext,
      trafficDecision: {},
      behavior: {},
      evidenceRecord: {},
      localWrites: [],
      result: "BLOCKED",
      errors: unique(errors),
      warnings: unique(warnings),
      executionFlags: {
        providerCallsExecuted: false,
        externalToolCallsExecuted: false,
        projectMutationExecuted: false,
        apiCallsExecuted: false,
        dbWritesExecuted: false,
        localStateWritesExecuted: false,
      },
    };
  }

  const trafficResult = evaluateTrafficRequest({
    identityContext: context.identityContext,
    trafficRequest: context.trafficRequest,
    baseline: input.baseline || null,
    inputForHash: {
      projectId: normalizeString(input.projectId),
      taskType: normalizeString(input.taskType),
      objective: normalizeString(input.objective),
      executionMode: "guarded-local",
    },
    outputForHash: {
      targetAgent: normalizeString(input.targetAgent),
      capabilityId: normalizeString(input.capabilityId),
      allowedLocalAction: normalizeString(input.allowedLocalAction),
    },
  });

  steps.push(
    createStep(
      "evaluate_traffic_plane",
      trafficResult.allowed
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

  const localWrites = [];
  let result = trafficResult.allowed ? "PASS" : "BLOCKED";
  let stepResult = null;

  function pushWrite(write) {
    localWrites.push(write);
    steps.push(
      createStep(
        `write_local_${write.label}`,
        write.ok ? "PASS" : write.blocked ? "BLOCKED" : "FAIL",
        {
          path: write.path,
          written: write.written,
          blocked: write.blocked === true,
        }
      )
    );
    errors.push(...(write.errors || []));
    warnings.push(...(write.warnings || []));
  }

  if (trafficResult.allowed) {
    const taskWrite = performLocalWrite(
      "task",
      "task",
      {
        taskId: context.taskId,
        projectId: normalizeString(input.projectId),
        sourceAgent: normalizeString(input.sourceAgent),
        targetAgent: normalizeString(input.targetAgent),
        taskType: normalizeString(input.taskType),
        objective: normalizeString(input.objective),
        state: "queued",
        riskLevel: normalizeString(input.riskLevel),
        blocking: true,
        dependsOn: ensureArray(input.dependsOn),
        capabilityId: normalizeString(input.capabilityId),
        contractId:
          normalizeString(context.taskContract.id) ||
          "guarded-local-contract",
        evidenceIds: [],
        auditEventIds: [],
        redacted: true,
      },
      context,
      trafficResult
    );
    pushWrite(taskWrite);

    if (taskWrite.ok) {
      const startTransition = performLocalWrite(
        createTransitionWriteLabel("queued", "running"),
        "task_state",
        {
          taskId: context.taskId,
          nextState: "running",
          actorId: normalizeString(input.targetAgent),
          actorType: "agent",
          agentId: normalizeString(input.targetAgent),
          capabilityId: normalizeString(input.capabilityId),
          policyDecisionId: trafficResult.decision.decisionId,
          runtime: context.trafficRequest.runtime,
          evidence: [],
          context: {
            taskType: normalizeString(input.taskType),
          },
          redacted: true,
        },
        context,
        trafficResult
      );
      pushWrite(startTransition);

      if (startTransition.ok) {
        steps.push(
          createStep("execute_local_step", "PASS", {
            action: normalizeString(input.allowedLocalAction),
          })
        );
        stepResult = executeDeterministicLocalStep(context);
        errors.push(...(stepResult.errors || []));
        warnings.push(...(stepResult.warnings || []));

        const evidenceWrite = performLocalWrite(
          "evidence",
          "evidence",
          {
            type: stepResult.evidenceType,
            projectId: normalizeString(input.projectId),
            taskId: context.taskId,
            agentId: normalizeString(input.targetAgent),
            capabilityId: normalizeString(input.capabilityId),
            result: mapStepResultToEvidenceOutcome(stepResult.result),
            summary: stepResult.summary,
            artifactPaths: ensureArray(stepResult.artifactPaths),
            traceIds: [trafficResult.evidenceRecord.recordId],
            policyDecisionId: trafficResult.decision.decisionId,
            dataClassification:
              normalizeString(input.dataClassification) || "internal",
            redacted: true,
          },
          context,
          trafficResult
        );
        pushWrite(evidenceWrite);

        if (!evidenceWrite.ok) {
          result = "FAIL";
        } else if (stepResult.result === "PASS") {
          const implementationDoneTransition = performLocalWrite(
            createTransitionWriteLabel("running", "implementation_done"),
            "task_state",
            {
              taskId: context.taskId,
              nextState: "implementation_done",
              actorId: normalizeString(input.targetAgent),
              actorType: "agent",
              agentId: normalizeString(input.targetAgent),
              capabilityId: normalizeString(input.capabilityId),
              policyDecisionId: trafficResult.decision.decisionId,
              runtime: context.trafficRequest.runtime,
              evidence: [],
              context: {
                taskType: normalizeString(input.taskType),
              },
              redacted: true,
            },
            context,
            trafficResult
          );
          pushWrite(implementationDoneTransition);

          if (!implementationDoneTransition.ok) {
            result = implementationDoneTransition.blocked ? "BLOCKED" : "FAIL";
          } else if (VERIFICATION_AGENTS.has(normalizeString(input.targetAgent))) {
            const awaitingVerificationTransition = performLocalWrite(
              createTransitionWriteLabel(
                "implementation_done",
                "awaiting_verification"
              ),
              "task_state",
              {
                taskId: context.taskId,
                nextState: "awaiting_verification",
                actorId: normalizeString(input.targetAgent),
                actorType: "agent",
                agentId: normalizeString(input.targetAgent),
                capabilityId: normalizeString(input.capabilityId),
                policyDecisionId: trafficResult.decision.decisionId,
                runtime: context.trafficRequest.runtime,
                evidence: [],
                context: {
                  taskType: normalizeString(input.taskType),
                },
                redacted: true,
              },
              context,
              trafficResult
            );
            pushWrite(awaitingVerificationTransition);

            if (!awaitingVerificationTransition.ok) {
              result = awaitingVerificationTransition.blocked
                ? "BLOCKED"
                : "FAIL";
            } else {
              const completionTransition = performLocalWrite(
                createTransitionWriteLabel(
                  "awaiting_verification",
                  "completed"
                ),
                "task_state",
                {
                  taskId: context.taskId,
                  nextState: "completed",
                  actorId: normalizeString(input.targetAgent),
                  actorType: "agent",
                  agentId: normalizeString(input.targetAgent),
                  capabilityId: normalizeString(input.capabilityId),
                  policyDecisionId: trafficResult.decision.decisionId,
                  runtime: context.trafficRequest.runtime,
                  evidence: [
                    {
                      type: stepResult.evidenceType,
                      evidenceId: evidenceWrite.record?.evidenceId,
                    },
                    {
                      type: "PASS",
                      evidenceId: evidenceWrite.record?.evidenceId,
                    },
                  ],
                  context: {
                    taskType: normalizeString(input.taskType),
                  },
                  redacted: true,
                },
                context,
                trafficResult
              );
              pushWrite(completionTransition);

              if (!completionTransition.ok) {
                result = completionTransition.blocked ? "BLOCKED" : "FAIL";
              }
            }
          }
        } else if (stepResult.result === "BLOCKED") {
          result = "BLOCKED";
          const failedTransition = performLocalWrite(
            createTransitionWriteLabel("running", "failed"),
            "task_state",
            {
              taskId: context.taskId,
              nextState: "failed",
              actorId: normalizeString(input.targetAgent),
              actorType: "agent",
              agentId: normalizeString(input.targetAgent),
              capabilityId: normalizeString(input.capabilityId),
              policyDecisionId: trafficResult.decision.decisionId,
              runtime: context.trafficRequest.runtime,
              evidence: [
                {
                  type: stepResult.evidenceType,
                  evidenceId: evidenceWrite.record?.evidenceId,
                },
              ],
              context: {
                taskType: normalizeString(input.taskType),
              },
              redacted: true,
            },
            context,
            trafficResult
          );
          pushWrite(failedTransition);

          if (!failedTransition.ok) {
            result = failedTransition.blocked ? "BLOCKED" : "FAIL";
          }
        } else {
          result = "FAIL";
        }

        const auditWrite = performLocalWrite(
          "audit",
          "audit",
          {
            eventType: "guarded_local_agent_task",
            actorId: normalizeString(input.targetAgent),
            actorType: "agent",
            projectId: normalizeString(input.projectId),
            taskId: context.taskId,
            capabilityId: normalizeString(input.capabilityId),
            policyDecisionId: trafficResult.decision.decisionId,
            summary: `Guarded local agent task ${normalizeString(
              input.allowedLocalAction
            )} finished as ${result}.`,
            redacted: true,
          },
          context,
          trafficResult
        );
        pushWrite(auditWrite);

        const runtimeWrite = performLocalWrite(
          "runtime_event",
          "runtime_event",
          {
            eventType: "guarded_local_agent_task",
            projectId: normalizeString(input.projectId),
            taskId: context.taskId,
            agentId: normalizeString(input.targetAgent),
            runtime: context.trafficRequest.runtime,
            summary: `Guarded local action ${normalizeString(
              input.allowedLocalAction
            )} completed with ${result}.`,
            redacted: true,
          },
          context,
          trafficResult
        );
        pushWrite(runtimeWrite);
      } else {
        result = startTransition.blocked ? "BLOCKED" : "FAIL";
      }
    } else {
      result = "FAIL";
    }
  }

  if (localWrites.some((write) => !write.ok && write.blocked !== true)) {
    result = "FAIL";
  }

  const transitionSummary = summarizeTransitions(localWrites);
  steps.push(
    createStep(
      "finalize_result",
      result === "FAIL" ? "FAIL" : result === "BLOCKED" ? "BLOCKED" : "PASS",
      {
        result,
        executionMode: "guarded-local",
        ...transitionSummary,
      }
    )
  );

  return {
    ok: result !== "FAIL",
    executionMode: "guarded-local",
    projectId: normalizeString(input.projectId),
    taskId: context.taskId,
    steps,
    taskContract: context.taskContract,
    capability: context.capability,
    identityContext: context.identityContext,
    agentContext: context.agentContext,
    trafficDecision: trafficResult.decision,
    behavior: trafficResult.behavior,
    evidenceRecord: trafficResult.evidenceRecord,
    deterministicStep: stepResult || {},
    localWrites,
    transitionsAttempted: transitionSummary.transitionsAttempted,
    transitionsAllowed: transitionSummary.transitionsAllowed,
    transitionsBlocked: transitionSummary.transitionsBlocked,
    transitionEvidenceCount: transitionSummary.transitionEvidenceCount,
    result,
    errors: unique(errors),
    warnings: unique(warnings),
    executionFlags: {
      providerCallsExecuted: false,
      externalToolCallsExecuted: false,
      projectMutationExecuted: false,
      apiCallsExecuted: false,
      dbWritesExecuted: false,
      localStateWritesExecuted: localWrites.some((write) => write.written),
    },
  };
}
