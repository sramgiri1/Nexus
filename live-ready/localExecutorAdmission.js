import { createPassResult } from "../shared/resultEnvelope.js";
import { buildLocalActivationRequestModel } from "./localActivationRequestModel.js";

export const P88_LOCAL_EXECUTOR_ADMISSION_PHASE = "P88.3";

const RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "activationAllowed",
  "executionAllowed",
]);

const REQUIRED_EVIDENCE = Object.freeze([
  "operatorApproval",
  "activationRequestRecord",
  "controlledLocalExecutionPolicy",
  "guardedTaskExecutionPolicy",
  "scopedTaskContract",
  "readOnlyPreflight",
  "rollbackPlan",
  "postRunReviewPlan",
  "activityEvidence",
  "costEvidence",
  "validationCommands",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function admissionKey(requestKey = "") {
  return `local-executor-admission-${String(requestKey).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;
}

function buildAdmission(request = {}) {
  return {
    admissionKey: admissionKey(request.requestKey),
    label: request.label,
    ownerCapability: request.ownerCapability,
    sourceRequestKey: request.requestKey,
    executorState: "admission_defined_executor_blocked",
    executorCanRun: false,
    allowedFutureOperations: [
      "read-only preflight validation",
      "local execution policy eligibility check",
      "post-run review packet preparation",
    ],
    forbiddenOperations: request.forbiddenOperations || [],
    requiredEvidence: [...REQUIRED_EVIDENCE],
    missingEvidence: [
      "controlledLocalExecutionPolicyReview",
      "guardedTaskExecutionPolicyReview",
      "operatorApproval",
      "executorRuntimeLock",
      "postRunReviewPlan",
    ],
    rollbackRequired: true,
    postRunReviewRequired: true,
    nextAction: "Implement P88.4 Command Center UX for the blocked executor admission state before any runtime wiring.",
    disabledReason:
      "P88.3 defines executor admission only. The local executor cannot run and no agent, tool, worker, provider, file, DB, network, deploy, package, or spend action is enabled.",
    validationCommands: [
      "npm run check:p883-local-executor-admission",
      "npm run check:p882-local-activation-request-model",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: ["reports/p883-local-executor-admission-report.md", ...(request.evidenceRefs || [])],
    activityLocation: request.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarize(admissions) {
  return admissions.reduce((acc, admission) => {
    acc[admission.executorState] = (acc[admission.executorState] || 0) + 1;
    return acc;
  }, {});
}

export function buildLocalExecutorAdmission(input = {}) {
  const requestModel = input.requestModel || buildLocalActivationRequestModel(input);
  const admissions = (requestModel.data?.requests || []).map(buildAdmission);

  return createPassResult({
    phase: P88_LOCAL_EXECUTOR_ADMISSION_PHASE,
    mode: "local-executor-admission",
    source: "live-ready/localExecutorAdmission.js",
    summary: "Local executor admission records are defined; no executor is wired or run.",
    data: {
      schemaVersion: "1.0",
      currentState: "local_executor_admission_ready_blocked",
      readinessLabel: "Executor admission blocked",
      executorMode: "local-only-admission",
      admissionCount: admissions.length,
      admissionSummary: summarize(admissions),
      admissions,
      requestModelPhase: requestModel.phase,
      nextAction: "Implement P88.4 Command Center UX for scoped activation and executor admission state.",
      blockers: ["operatorApproval", "executorRuntimeLock", "controlledLocalExecutionPolicyReview", "postRunReviewPlan"],
      disabledReason:
        "P88.3 is executor admission only. Provider/model calls, agent dispatch, tool execution, worker execution, local executor runs, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Local Executor Governance",
      evidenceRefs: [
        "reports/p883-local-executor-admission-report.md",
        "reports/p882-local-activation-request-model-report.md",
        "reports/controlled-local-execution-report.md",
        "reports/guarded-task-execution-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, worker runtime, deploy, package creation, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p883-local-executor-admission-report.md",
      "contracts/os-roadmap/p88-execution-contracts.json",
    ],
    warnings: ["P88.3 is admission-only. It does not import, wire, or run an executor."],
  });
}

export function validateLocalExecutorAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P88_LOCAL_EXECUTOR_ADMISSION_PHASE) errors.push("phase must be P88.3");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "executorMode", "admissionCount", "admissions", "requestModelPhase", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (data.executorMode !== "local-only-admission") errors.push("executorMode must stay local-only-admission");
  if (!Array.isArray(data.admissions) || data.admissions.length !== 3) errors.push("admissions must cover three activation requests");
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const admission of data.admissions || []) {
    for (const field of ["admissionKey", "label", "ownerCapability", "sourceRequestKey", "executorState", "executorCanRun", "allowedFutureOperations", "forbiddenOperations", "requiredEvidence", "missingEvidence", "rollbackRequired", "postRunReviewRequired", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in admission)) errors.push(`${admission.label || "admission"}.${field} missing`);
    }
    if (admission.executorState !== "admission_defined_executor_blocked") errors.push(`${admission.label}.executorState must stay blocked`);
    if (admission.executorCanRun !== false) errors.push(`${admission.label}.executorCanRun must be false`);
    if (admission.rollbackRequired !== true || admission.postRunReviewRequired !== true) errors.push(`${admission.label}.rollback and review must be required`);
    if (!Array.isArray(admission.requiredEvidence) || admission.requiredEvidence.length !== REQUIRED_EVIDENCE.length) errors.push(`${admission.label}.requiredEvidence incomplete`);
    for (const flag of RUNTIME_FLAGS) {
      if (admission[flag] !== false) errors.push(`${admission.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("local executor admission must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("local executor admission must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
