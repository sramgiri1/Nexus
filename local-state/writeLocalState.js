import { validateIdentityContext } from "../runtime/identityContext.js";
import { appendAuditEvent, validateAuditEvent } from "./appendAuditEvent.js";
import { appendEvidence, validateEvidence } from "./appendEvidence.js";
import {
  appendApprovalRecord,
  appendIncidentRecord,
  appendRuntimeEvent,
} from "./stateStore.js";
import {
  addTask,
  getTaskById,
  updateTaskState,
  validateTask,
} from "./taskStore.js";
import { validateLocalTaskTransition } from "./stateTransitionGuard.js";
import {
  LOCAL_APPROVALS_FILE,
  LOCAL_AUDIT_FILE,
  LOCAL_EVENTS_FILE,
  LOCAL_EVIDENCE_FILE,
  LOCAL_INCIDENTS_FILE,
  LOCAL_TASKS_FILE,
} from "./schema.js";
import {
  assertNoPrivateProjectReference,
  assertNoSecretLikeContent,
  sanitizeRecord,
} from "./writeGuards.js";

const ALLOWED_TYPES = new Set([
  "task",
  "task_state",
  "evidence",
  "audit",
  "runtime_event",
  "approval",
  "incident",
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function validatePolicyDecision(policyDecision) {
  const errors = [];
  const warnings = [];

  if (policyDecision === undefined) {
    return { valid: true, errors, warnings };
  }

  if (!policyDecision || typeof policyDecision !== "object") {
    errors.push("policyDecision must be an object when provided.");
    return { valid: false, errors, warnings };
  }

  if (!normalizeString(policyDecision.result)) {
    warnings.push("policyDecision.result is missing.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

function getWritePath(type) {
  switch (type) {
    case "task":
    case "task_state":
      return LOCAL_TASKS_FILE;
    case "evidence":
      return LOCAL_EVIDENCE_FILE;
    case "audit":
      return LOCAL_AUDIT_FILE;
    case "runtime_event":
      return LOCAL_EVENTS_FILE;
    case "approval":
      return LOCAL_APPROVALS_FILE;
    case "incident":
      return LOCAL_INCIDENTS_FILE;
    default:
      return "";
  }
}

function validateRoute(type, record) {
  switch (type) {
    case "task":
      return validateTask(record);
    case "task_state":
      return {
        valid: Boolean(
          normalizeString(record.taskId) &&
            normalizeString(record.nextState || record.state)
        ),
        errors:
          normalizeString(record.taskId) &&
          normalizeString(record.nextState || record.state)
            ? []
            : ["task_state requires taskId and nextState."],
        warnings: [],
        record,
      };
    case "evidence":
      return validateEvidence(record);
    case "audit":
      return validateAuditEvent(record);
    case "runtime_event":
      return {
        valid: Boolean(normalizeString(record.eventType)),
        errors: normalizeString(record.eventType)
          ? []
          : ["runtime_event requires eventType."],
        warnings: [],
        record,
      };
    case "approval":
      return {
        valid: Boolean(
          normalizeString(record.type) && normalizeString(record.requestedBy)
        ),
        errors:
          normalizeString(record.type) && normalizeString(record.requestedBy)
            ? []
            : ["approval requires type and requestedBy."],
        warnings: [],
        record,
      };
    case "incident":
      return {
        valid: Boolean(
          normalizeString(record.type) && normalizeString(record.severity)
        ),
        errors:
          normalizeString(record.type) && normalizeString(record.severity)
            ? []
            : ["incident requires type and severity."],
        warnings: [],
        record,
      };
    default:
      return {
        valid: false,
        errors: [`Unsupported local write type: ${type}`],
        warnings: [],
        record,
      };
  }
}

function buildTransitionInput(taskRecord, writeRecord) {
  return {
    entityType: "task",
    entityId: taskRecord.taskId,
    fromState: taskRecord.state,
    toState:
      normalizeString(writeRecord.nextState) || normalizeString(writeRecord.state),
    actor:
      normalizeString(writeRecord.actorId) ||
      normalizeString(writeRecord.actor) ||
      normalizeString(writeRecord.targetAgent),
    agentId:
      normalizeString(writeRecord.agentId) ||
      normalizeString(taskRecord.targetAgent),
    projectId: taskRecord.projectId,
    taskId: taskRecord.taskId,
    reason: normalizeString(writeRecord.reason),
    evidence: ensureArray(writeRecord.evidence),
    context: {
      taskType: taskRecord.taskType,
      ...((writeRecord.context &&
        typeof writeRecord.context === "object" &&
        writeRecord.context) ||
        {}),
    },
  };
}

function buildBlockedTransitionAuditRecord(taskRecord, writeRecord, transition) {
  return {
    eventType: "task_state_transition_blocked",
    actorId:
      normalizeString(writeRecord.actorId) ||
      normalizeString(writeRecord.actor) ||
      normalizeString(writeRecord.agentId) ||
      normalizeString(taskRecord?.targetAgent) ||
      "system",
    actorType: normalizeString(writeRecord.actorType) || "agent",
    projectId:
      normalizeString(writeRecord.projectId) ||
      normalizeString(taskRecord?.projectId),
    taskId:
      normalizeString(writeRecord.taskId) || normalizeString(taskRecord?.taskId),
    capabilityId:
      normalizeString(writeRecord.capabilityId) ||
      normalizeString(taskRecord?.capabilityId),
    policyDecisionId: normalizeString(writeRecord.policyDecisionId),
    summary:
      normalizeString(writeRecord.summary) ||
      `Blocked task transition ${normalizeString(
        transition.transitionEvidence?.fromState
      )} -> ${normalizeString(
        transition.transitionEvidence?.toState
      )}: ${normalizeString(transition.reason)}`,
    previousState: normalizeString(transition.transitionEvidence?.fromState),
    nextState: normalizeString(transition.transitionEvidence?.toState),
    redacted: true,
  };
}

function shouldCreateTransitionIncident(transition) {
  const serialized = JSON.stringify({
    reason: transition.reason,
    errors: transition.errors,
  }).toLowerCase();

  return /security|secret|policy|restricted|confidential/.test(serialized);
}

function validateTaskStateTransition(record, warnings = []) {
  const taskLookup = getTaskById(record.taskId);
  if (!taskLookup.ok) {
    return {
      ok: false,
      taskLookup,
      transition: null,
      warnings: [...warnings, ...taskLookup.warnings],
      errors: taskLookup.errors,
    };
  }

  const transition = validateLocalTaskTransition(
    buildTransitionInput(taskLookup.record, record)
  );

  return {
    ok: transition.allowed,
    taskLookup,
    transition,
    warnings: [...warnings, ...transition.warnings],
    errors: transition.allowed ? [] : transition.errors,
  };
}

export function validateLocalWrite(input = {}) {
  const type = normalizeString(input.type);
  const record =
    input.record &&
    typeof input.record === "object" &&
    !Array.isArray(input.record)
      ? sanitizeRecord(input.record)
      : {};
  const errors = [];
  const warnings = [];

  if (!ALLOWED_TYPES.has(type)) {
    errors.push(
      "type must be one of task, task_state, evidence, audit, runtime_event, approval, or incident."
    );
  }

  if (
    !input.record ||
    typeof input.record !== "object" ||
    Array.isArray(input.record)
  ) {
    errors.push("record must be an object.");
  }

  if (input.identityContext !== undefined) {
    const identityValidation = validateIdentityContext(input.identityContext);
    errors.push(
      ...identityValidation.errors.map((error) => `identityContext: ${error}`)
    );
    warnings.push(
      ...identityValidation.warnings.map(
        (warning) => `identityContext: ${warning}`
      )
    );
  }

  const policyValidation = validatePolicyDecision(input.policyDecision);
  errors.push(
    ...policyValidation.errors.map((error) => `policyDecision: ${error}`)
  );
  warnings.push(
    ...policyValidation.warnings.map((warning) => `policyDecision: ${warning}`)
  );

  const secretCheck = assertNoSecretLikeContent(record);
  const privateCheck = assertNoPrivateProjectReference(record);
  errors.push(...secretCheck.errors, ...privateCheck.errors);

  const routeValidation = validateRoute(type, record);
  errors.push(...routeValidation.errors);
  warnings.push(...routeValidation.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    record,
  };
}

export function writeLocalStateEvent(input = {}) {
  const type = normalizeString(input.type);
  const validation = validateLocalWrite(input);
  const path = getWritePath(type);

  if (!validation.valid) {
    return {
      ok: false,
      blocked: false,
      type,
      written: false,
      path,
      record: validation.record,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  if (type === "task_state") {
    const transitionCheck = validateTaskStateTransition(
      validation.record,
      validation.warnings
    );

    if (!transitionCheck.taskLookup?.ok) {
      return {
        ok: false,
        blocked: false,
        type,
        written: false,
        path,
        record: validation.record,
        errors: transitionCheck.errors,
        warnings: transitionCheck.warnings,
      };
    }

    if (input.dryRun) {
      return {
        ok: transitionCheck.ok,
        blocked: !transitionCheck.ok,
        type,
        written: false,
        path,
        record: validation.record,
        transition: transitionCheck.transition,
        errors: transitionCheck.errors,
        warnings: transitionCheck.warnings,
      };
    }

    if (!transitionCheck.ok) {
      const auditResult = appendAuditEvent(
        buildBlockedTransitionAuditRecord(
          transitionCheck.taskLookup.record,
          validation.record,
          transitionCheck.transition
        )
      );

      let incidentResult = null;
      if (shouldCreateTransitionIncident(transitionCheck.transition)) {
        incidentResult = appendIncidentRecord({
          type: "task_state_transition_blocked",
          severity: normalizeString(validation.record.riskLevel) || "high",
          projectId: transitionCheck.taskLookup.record.projectId,
          taskId: transitionCheck.taskLookup.record.taskId,
          summary: `Blocked local task transition ${normalizeString(
            transitionCheck.transition.transitionEvidence?.fromState
          )} -> ${normalizeString(
            transitionCheck.transition.transitionEvidence?.toState
          )}: ${normalizeString(transitionCheck.transition.reason)}`,
          status: "open",
          redacted: true,
        });
      }

      return {
        ok: false,
        blocked: true,
        type,
        written: false,
        path,
        record: validation.record,
        transition: transitionCheck.transition,
        audit: auditResult.record,
        incident: incidentResult?.record || null,
        errors: [
          ...transitionCheck.errors,
          ...(auditResult.ok ? [] : auditResult.errors),
          ...(incidentResult?.ok === false ? incidentResult.errors : []),
        ],
        warnings: [
          ...transitionCheck.warnings,
          ...(auditResult.ok ? [] : auditResult.warnings),
          ...(incidentResult?.ok === false ? incidentResult.warnings : []),
        ],
        reason: transitionCheck.transition.reason,
      };
    }

    const nextState =
      normalizeString(validation.record.nextState) ||
      normalizeString(validation.record.state);
    const previousState = transitionCheck.taskLookup.record.state;
    const updateResult = updateTaskState(validation.record.taskId, nextState, {
      ...validation.record,
      previousState,
      nextState,
    });

    if (!updateResult.ok) {
      return {
        ok: false,
        blocked: false,
        type,
        written: false,
        path,
        record: validation.record,
        transition: transitionCheck.transition,
        errors: updateResult.errors,
        warnings: [...transitionCheck.warnings, ...updateResult.warnings],
      };
    }

    const runtimeEvent = appendRuntimeEvent({
      eventType: "task_state_transition",
      projectId: transitionCheck.taskLookup.record.projectId,
      taskId: transitionCheck.taskLookup.record.taskId,
      agentId:
        normalizeString(validation.record.agentId) ||
        normalizeString(transitionCheck.taskLookup.record.targetAgent),
      runtime: normalizeString(validation.record.runtime) || "node-local",
      summary: `Local task transition ${previousState} -> ${nextState} recorded for ${transitionCheck.taskLookup.record.taskId}.`,
      redacted: true,
    });

    return {
      ok: updateResult.ok && runtimeEvent.ok,
      blocked: false,
      type,
      written: updateResult.ok,
      path,
      record: updateResult.record,
      transition: transitionCheck.transition,
      audit: updateResult.audit,
      runtimeEvent: runtimeEvent.record,
      errors: [
        ...updateResult.errors,
        ...(runtimeEvent.ok ? [] : runtimeEvent.errors),
      ],
      warnings: [
        ...transitionCheck.warnings,
        ...updateResult.warnings,
        ...(runtimeEvent.ok ? [] : runtimeEvent.warnings),
      ],
    };
  }

  if (input.dryRun) {
    return {
      ok: true,
      blocked: false,
      type,
      written: false,
      path,
      record: validation.record,
      errors: [],
      warnings: validation.warnings,
    };
  }

  let result;
  switch (type) {
    case "task":
      result = addTask(validation.record);
      break;
    case "evidence":
      result = appendEvidence(validation.record);
      break;
    case "audit":
      result = appendAuditEvent(validation.record);
      break;
    case "runtime_event":
      result = appendRuntimeEvent(validation.record);
      break;
    case "approval":
      result = appendApprovalRecord(validation.record);
      break;
    case "incident":
      result = appendIncidentRecord(validation.record);
      break;
    default:
      result = {
        ok: false,
        path,
        record: validation.record,
        errors: [`Unsupported local write type: ${type}`],
        warnings: [],
      };
  }

  return {
    ok: result.ok,
    blocked: result.blocked === true,
    type,
    written: Boolean(result.ok),
    path: result.path || path,
    record: result.record || validation.record,
    transition: result.transition,
    errors: result.errors || [],
    warnings: [...validation.warnings, ...(result.warnings || [])],
  };
}
