import { validateIdentityContext } from "../runtime/identityContext.js";
import { appendAuditEvent, validateAuditEvent } from "./appendAuditEvent.js";
import { appendEvidence, validateEvidence } from "./appendEvidence.js";
import {
  appendApprovalRecord,
  appendIncidentRecord,
  appendRuntimeEvent,
} from "./stateStore.js";
import { addTask, updateTaskState, validateTask } from "./taskStore.js";
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

  if (!input.record || typeof input.record !== "object" || Array.isArray(input.record)) {
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
  errors.push(...policyValidation.errors.map((error) => `policyDecision: ${error}`));
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
      type,
      written: false,
      path,
      record: validation.record,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  if (input.dryRun) {
    return {
      ok: true,
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
    case "task_state":
      result = updateTaskState(
        validation.record.taskId,
        validation.record.nextState || validation.record.state,
        validation.record
      );
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
    type,
    written: Boolean(result.ok),
    path: result.path || path,
    record: result.record || validation.record,
    errors: result.errors || [],
    warnings: [...validation.warnings, ...(result.warnings || [])],
  };
}
