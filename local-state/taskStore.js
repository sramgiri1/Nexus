import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRepoRoot, readJsonSafe } from "./safeFileReader.js";
import { LOCAL_TASKS_FILE } from "./schema.js";
import {
  assertNoPrivateProjectReference,
  assertNoSecretLikeContent,
  assertWritePathAllowed,
  sanitizeRecord,
} from "./writeGuards.js";
import { appendAuditEvent, validateAuditEvent } from "./appendAuditEvent.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((entry) => normalizeString(entry)).filter(Boolean))];
}

function getTasksPath() {
  return path.join(getRepoRoot(), LOCAL_TASKS_FILE);
}

function createDefaultTasksDocument() {
  return {
    version: "1.0",
    source: "local-runtime-prototype",
    tasks: [],
  };
}

function buildTask(task = {}) {
  const sanitized = sanitizeRecord(task);
  const createdAt = normalizeString(sanitized.createdAt) || new Date().toISOString();

  return {
    taskId: normalizeString(sanitized.taskId) || randomUUID(),
    projectId: normalizeString(sanitized.projectId),
    sourceAgent: normalizeString(sanitized.sourceAgent),
    targetAgent: normalizeString(sanitized.targetAgent),
    taskType: normalizeString(sanitized.taskType),
    objective: normalizeString(sanitized.objective),
    state: normalizeString(sanitized.state) || "queued",
    riskLevel: normalizeString(sanitized.riskLevel) || "medium",
    blocking: Boolean(sanitized.blocking),
    dependsOn: normalizeStringArray(sanitized.dependsOn),
    capabilityId: normalizeString(sanitized.capabilityId),
    contractId: normalizeString(sanitized.contractId),
    evidenceIds: normalizeStringArray(sanitized.evidenceIds),
    auditEventIds: normalizeStringArray(sanitized.auditEventIds),
    createdAt,
    updatedAt: normalizeString(sanitized.updatedAt) || createdAt,
    redacted: true,
  };
}

function validateTasksDocument(tasksDocument = {}) {
  const errors = [];
  const warnings = [];
  const taskEntries = Array.isArray(tasksDocument.tasks) ? tasksDocument.tasks : [];
  const normalizedTasks = [];
  const document = {
    version: normalizeString(tasksDocument.version) || "1.0",
    source:
      normalizeString(tasksDocument.source) || "local-runtime-prototype",
    tasks: normalizedTasks,
  };

  if (!Array.isArray(tasksDocument.tasks)) {
    errors.push("tasks must be an array.");
  }

  for (const task of taskEntries) {
    const validation = validateTask(task);
    normalizedTasks.push(validation.record);
    if (!validation.valid) {
      errors.push(
        ...validation.errors.map((error) => `${validation.record.taskId}: ${error}`)
      );
    }
  }

  const secretCheck = assertNoSecretLikeContent(document);
  const privateCheck = assertNoPrivateProjectReference(document);
  errors.push(...secretCheck.errors, ...privateCheck.errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    document,
  };
}

export function validateTask(task = {}) {
  const errors = [];
  const warnings = [];
  const record = buildTask(task);

  for (const fieldName of [
    "projectId",
    "sourceAgent",
    "targetAgent",
    "taskType",
    "objective",
    "state",
    "riskLevel",
  ]) {
    if (!normalizeString(record[fieldName])) {
      errors.push(`${fieldName} is required.`);
    }
  }

  if (record.redacted !== true) {
    errors.push("redacted must be true.");
  }

  const secretCheck = assertNoSecretLikeContent(record);
  const privateCheck = assertNoPrivateProjectReference(record);
  errors.push(...secretCheck.errors, ...privateCheck.errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    record,
  };
}

export function readTasks() {
  const pathCheck = assertWritePathAllowed(LOCAL_TASKS_FILE);
  if (!pathCheck.ok) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      document: createDefaultTasksDocument(),
      errors: pathCheck.errors,
      warnings: [],
    };
  }

  const result = readJsonSafe(LOCAL_TASKS_FILE);
  if (!result.ok) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      document: createDefaultTasksDocument(),
      errors: [result.error],
      warnings: [],
    };
  }

  const validation = validateTasksDocument(result.data);
  return {
    ok: validation.valid,
    path: LOCAL_TASKS_FILE,
    document: validation.document,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}

export function writeTasks(tasksDocument = {}) {
  const pathCheck = assertWritePathAllowed(LOCAL_TASKS_FILE);
  const validation = validateTasksDocument(tasksDocument);
  const errors = [...pathCheck.errors, ...validation.errors];

  if (errors.length > 0) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      document: validation.document,
      errors,
      warnings: validation.warnings,
    };
  }

  fs.writeFileSync(
    getTasksPath(),
    `${JSON.stringify(validation.document, null, 2)}\n`,
    "utf8"
  );

  return {
    ok: true,
    path: LOCAL_TASKS_FILE,
    document: validation.document,
    errors: [],
    warnings: validation.warnings,
  };
}

export function addTask(task = {}) {
  const currentState = readTasks();
  const validation = validateTask(task);
  const errors = [...currentState.errors, ...validation.errors];

  if (!currentState.ok && currentState.errors.length > 0) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      document: currentState.document,
      record: validation.record,
      errors,
      warnings: [...currentState.warnings, ...validation.warnings],
    };
  }

  if (!validation.valid) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      document: currentState.document,
      record: validation.record,
      errors,
      warnings: validation.warnings,
    };
  }

  const nextDocument = {
    ...currentState.document,
    tasks: [...currentState.document.tasks, validation.record],
  };

  const writeResult = writeTasks(nextDocument);
  return {
    ok: writeResult.ok,
    path: LOCAL_TASKS_FILE,
    document: writeResult.document,
    record: validation.record,
    errors: writeResult.errors,
    warnings: writeResult.warnings,
  };
}

export function getTaskById(taskId) {
  const currentState = readTasks();
  if (!currentState.ok) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: null,
      errors: currentState.errors,
      warnings: currentState.warnings,
    };
  }

  const normalizedTaskId = normalizeString(taskId);
  const record = currentState.document.tasks.find(
    (task) => task.taskId === normalizedTaskId
  );

  if (!normalizedTaskId || !record) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: null,
      errors: ["taskId was not found in the local task store."],
      warnings: [],
    };
  }

  return {
    ok: true,
    path: LOCAL_TASKS_FILE,
    record,
    errors: [],
    warnings: [],
  };
}

export function updateTaskState(taskId, nextState, metadata = {}) {
  // Low-level helper only. Callers should prefer writeLocalStateEvent(type:
  // "task_state") so state-machine validation runs before this write occurs.
  const currentState = readTasks();
  if (!currentState.ok) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: {},
      errors: currentState.errors,
      warnings: currentState.warnings,
    };
  }

  const normalizedTaskId = normalizeString(taskId);
  const normalizedNextState = normalizeString(nextState);
  const taskIndex = currentState.document.tasks.findIndex(
    (task) => task.taskId === normalizedTaskId
  );

  if (!normalizedTaskId || taskIndex === -1) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: {},
      errors: ["taskId was not found in the local task store."],
      warnings: [],
    };
  }

  if (!normalizedNextState) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: {},
      errors: ["nextState is required."],
      warnings: [],
    };
  }

  const existingTask = currentState.document.tasks[taskIndex];
  const auditValidation = validateAuditEvent({
    eventType: normalizeString(metadata.eventType) || "task_state_changed",
    actorId:
      normalizeString(metadata.actorId) ||
      normalizeString(metadata.targetAgent) ||
      existingTask.targetAgent ||
      "system",
    actorType: normalizeString(metadata.actorType) || "agent",
    projectId: existingTask.projectId,
    taskId: existingTask.taskId,
    capabilityId:
      normalizeString(metadata.capabilityId) || existingTask.capabilityId,
    policyDecisionId: normalizeString(metadata.policyDecisionId),
    summary:
      normalizeString(metadata.summary) ||
      `Task ${existingTask.taskId} state changed from ${existingTask.state} to ${normalizedNextState}.`,
    previousState:
      normalizeString(metadata.previousState) || existingTask.state,
    nextState: normalizeString(metadata.nextState) || normalizedNextState,
    createdAt: normalizeString(metadata.createdAt),
    redacted: true,
  });

  if (!auditValidation.valid) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: auditValidation.record,
      errors: auditValidation.errors,
      warnings: auditValidation.warnings,
    };
  }

  const updatedTaskValidation = validateTask({
    ...existingTask,
    state: normalizedNextState,
    updatedAt: auditValidation.record.createdAt,
    evidenceIds: [
      ...normalizeStringArray(existingTask.evidenceIds),
      ...normalizeStringArray(metadata.evidenceIds),
    ],
    auditEventIds: [
      ...normalizeStringArray(existingTask.auditEventIds),
      auditValidation.record.auditId,
    ],
  });

  if (!updatedTaskValidation.valid) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: updatedTaskValidation.record,
      errors: updatedTaskValidation.errors,
      warnings: updatedTaskValidation.warnings,
    };
  }

  const previousDocument = `${JSON.stringify(currentState.document, null, 2)}\n`;
  const nextDocument = {
    ...currentState.document,
    tasks: [...currentState.document.tasks],
  };
  nextDocument.tasks[taskIndex] = updatedTaskValidation.record;

  const writeResult = writeTasks(nextDocument);
  if (!writeResult.ok) {
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: updatedTaskValidation.record,
      errors: writeResult.errors,
      warnings: writeResult.warnings,
    };
  }

  const auditResult = appendAuditEvent(auditValidation.record);
  if (!auditResult.ok) {
    fs.writeFileSync(getTasksPath(), previousDocument, "utf8");
    return {
      ok: false,
      path: LOCAL_TASKS_FILE,
      record: updatedTaskValidation.record,
      errors: auditResult.errors,
      warnings: auditResult.warnings,
    };
  }

  return {
    ok: true,
    path: LOCAL_TASKS_FILE,
    document: writeResult.document,
    record: updatedTaskValidation.record,
    previousState: existingTask.state,
    nextState: normalizedNextState,
    audit: auditResult.record,
    errors: [],
    warnings: [],
  };
}
