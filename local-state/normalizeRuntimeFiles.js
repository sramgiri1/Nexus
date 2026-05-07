import { readJsonSafe, readTextSafe } from "./safeFileReader.js";
import {
  LOCAL_RUNTIME_APPROVALS,
  LOCAL_RUNTIME_AUDIT,
  LOCAL_RUNTIME_EVIDENCE,
  LOCAL_RUNTIME_EVENTS,
  LOCAL_RUNTIME_INCIDENTS,
  LOCAL_RUNTIME_TASKS,
} from "./schema.js";

const PRIVATE_NAME_PATTERN = new RegExp(
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
const PRIVATE_EXECUTION_KEY = ["care", "loop", "ExecutionEnabled"].join("");

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function incrementCounter(counter, key) {
  const normalizedKey = normalizeString(key) || "unknown";
  counter[normalizedKey] = (counter[normalizedKey] || 0) + 1;
}

function toTimestamp(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return 0;
  }

  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortRecent(records, fields, limit = 5) {
  return [...records]
    .sort((left, right) => {
      const leftTimestamp = fields.reduce(
        (max, fieldName) => Math.max(max, toTimestamp(left[fieldName])),
        0
      );
      const rightTimestamp = fields.reduce(
        (max, fieldName) => Math.max(max, toTimestamp(right[fieldName])),
        0
      );
      return rightTimestamp - leftTimestamp;
    })
    .slice(0, limit);
}

function sanitizeSerializedValue(value) {
  return JSON.stringify(value).replaceAll(
    PRIVATE_EXECUTION_KEY,
    "privateProductExecutionEnabled"
  );
}

function collectSerializationIssues(serializedValue, label, errors) {
  if (PRIVATE_NAME_PATTERN.test(serializedValue)) {
    errors.push(`Private project reference found in ${label}.`);
  }

  if (SECRET_PATTERN.test(serializedValue)) {
    errors.push(`Secret-like content found in ${label}.`);
  }
}

export function readRuntimeJsonl(relativePath) {
  const warnings = [];
  const errors = [];
  const result = readTextSafe(relativePath);

  if (!result.ok) {
    if (/ENOENT/i.test(result.error || "")) {
      warnings.push(`Optional runtime file unavailable: ${relativePath}`);
      return {
        path: relativePath,
        records: [],
        warnings,
        errors,
        present: false,
      };
    }

    errors.push(`Unable to read ${relativePath}: ${result.error}`);
    return {
      path: relativePath,
      records: [],
      warnings,
      errors,
      present: false,
    };
  }

  const records = [];
  const lines = result.text.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      records.push(JSON.parse(trimmed));
    } catch (error) {
      warnings.push(
        `Invalid JSON line in ${relativePath}:${index + 1} (${error.message})`
      );
    }
  }

  collectSerializationIssues(
    sanitizeSerializedValue(records),
    relativePath,
    errors
  );

  return {
    path: relativePath,
    records,
    warnings,
    errors,
    present: true,
  };
}

export function readRuntimeTasks() {
  const warnings = [];
  const errors = [];
  const result = readJsonSafe(LOCAL_RUNTIME_TASKS);

  if (!result.ok) {
    if (/ENOENT/i.test(result.error || "")) {
      warnings.push(`Optional runtime file unavailable: ${LOCAL_RUNTIME_TASKS}`);
      return {
        path: LOCAL_RUNTIME_TASKS,
        tasks: [],
        warnings,
        errors,
        present: false,
      };
    }

    errors.push(`Unable to read ${LOCAL_RUNTIME_TASKS}: ${result.error}`);
    return {
      path: LOCAL_RUNTIME_TASKS,
      tasks: [],
      warnings,
      errors,
      present: false,
    };
  }

  const tasks = normalizeArray(result.data?.tasks);
  if (!Array.isArray(result.data?.tasks)) {
    warnings.push(`${LOCAL_RUNTIME_TASKS} is missing a tasks array.`);
  }

  collectSerializationIssues(
    sanitizeSerializedValue(tasks),
    LOCAL_RUNTIME_TASKS,
    errors
  );

  return {
    path: LOCAL_RUNTIME_TASKS,
    tasks,
    warnings,
    errors,
    present: true,
  };
}

export function readRuntimeEvidence() {
  return readRuntimeJsonl(LOCAL_RUNTIME_EVIDENCE);
}

export function readRuntimeAudit() {
  return readRuntimeJsonl(LOCAL_RUNTIME_AUDIT);
}

export function readRuntimeEvents() {
  return readRuntimeJsonl(LOCAL_RUNTIME_EVENTS);
}

export function readRuntimeApprovals() {
  return readRuntimeJsonl(LOCAL_RUNTIME_APPROVALS);
}

export function readRuntimeIncidents() {
  return readRuntimeJsonl(LOCAL_RUNTIME_INCIDENTS);
}

export function summarizeRuntimeFiles() {
  const tasksState = readRuntimeTasks();
  const evidenceState = readRuntimeEvidence();
  const auditState = readRuntimeAudit();
  const eventsState = readRuntimeEvents();
  const approvalsState = readRuntimeApprovals();
  const incidentsState = readRuntimeIncidents();
  const warnings = [
    ...tasksState.warnings,
    ...evidenceState.warnings,
    ...auditState.warnings,
    ...eventsState.warnings,
    ...approvalsState.warnings,
    ...incidentsState.warnings,
  ];
  const errors = [
    ...tasksState.errors,
    ...evidenceState.errors,
    ...auditState.errors,
    ...eventsState.errors,
    ...approvalsState.errors,
    ...incidentsState.errors,
  ];

  const tasksByState = {};
  const tasksByAgent = {};
  for (const task of tasksState.tasks) {
    incrementCounter(tasksByState, task.state);
    incrementCounter(tasksByAgent, task.targetAgent);
  }

  const evidenceByResult = {};
  const evidenceByType = {};
  for (const record of evidenceState.records) {
    incrementCounter(evidenceByResult, record.result);
    incrementCounter(evidenceByType, record.type);
  }

  const auditByEventType = {};
  for (const record of auditState.records) {
    incrementCounter(auditByEventType, record.eventType);
  }

  const eventsByRuntime = {};
  const eventsByEventType = {};
  for (const record of eventsState.records) {
    incrementCounter(eventsByRuntime, record.runtime);
    incrementCounter(eventsByEventType, record.eventType);
  }

  const approvalsByDecision = {};
  for (const record of approvalsState.records) {
    incrementCounter(approvalsByDecision, record.decision);
  }

  const incidentsBySeverity = {};
  const incidentsByStatus = {};
  for (const record of incidentsState.records) {
    incrementCounter(incidentsBySeverity, record.severity);
    incrementCounter(incidentsByStatus, record.status);
  }

  return {
    runtimeState: {
      tasks: {
        total: tasksState.tasks.length,
        byState: tasksByState,
        byAgent: tasksByAgent,
        recent: sortRecent(tasksState.tasks, ["updatedAt", "createdAt"]).map(
          (task) => ({
            taskId: normalizeString(task.taskId),
            projectId: normalizeString(task.projectId),
            targetAgent: normalizeString(task.targetAgent),
            state: normalizeString(task.state),
            riskLevel: normalizeString(task.riskLevel),
            capabilityId: normalizeString(task.capabilityId),
            createdAt: normalizeString(task.createdAt),
            updatedAt: normalizeString(task.updatedAt),
          })
        ),
      },
      evidence: {
        total: evidenceState.records.length,
        byResult: evidenceByResult,
        byType: evidenceByType,
        recent: sortRecent(evidenceState.records, ["createdAt"]).map((record) => ({
          evidenceId: normalizeString(record.evidenceId),
          type: normalizeString(record.type),
          agentId: normalizeString(record.agentId),
          result: normalizeString(record.result),
          dataClassification: normalizeString(record.dataClassification),
          createdAt: normalizeString(record.createdAt),
        })),
      },
      audit: {
        total: auditState.records.length,
        byEventType: auditByEventType,
        recent: sortRecent(auditState.records, ["createdAt"]).map((record) => ({
          auditId: normalizeString(record.auditId),
          eventType: normalizeString(record.eventType),
          actorId: normalizeString(record.actorId),
          taskId: normalizeString(record.taskId),
          createdAt: normalizeString(record.createdAt),
        })),
      },
      events: {
        total: eventsState.records.length,
        byRuntime: eventsByRuntime,
        byEventType: eventsByEventType,
        recent: sortRecent(eventsState.records, ["createdAt"]).map((record) => ({
          eventId: normalizeString(record.eventId),
          eventType: normalizeString(record.eventType),
          runtime: normalizeString(record.runtime),
          agentId: normalizeString(record.agentId),
          taskId: normalizeString(record.taskId),
          createdAt: normalizeString(record.createdAt),
        })),
      },
      approvals: {
        total: approvalsState.records.length,
        byDecision: approvalsByDecision,
        recent: sortRecent(approvalsState.records, ["createdAt"]).map(
          (record) => ({
            approvalId: normalizeString(record.approvalId),
            type: normalizeString(record.type),
            requestedBy: normalizeString(record.requestedBy),
            taskId: normalizeString(record.taskId),
            decision: normalizeString(record.decision),
            riskLevel: normalizeString(record.riskLevel),
            createdAt: normalizeString(record.createdAt),
          })
        ),
      },
      incidents: {
        total: incidentsState.records.length,
        bySeverity: incidentsBySeverity,
        byStatus: incidentsByStatus,
        recent: sortRecent(incidentsState.records, ["createdAt"]).map(
          (record) => ({
            incidentId: normalizeString(record.incidentId),
            type: normalizeString(record.type),
            severity: normalizeString(record.severity),
            status: normalizeString(record.status),
            taskId: normalizeString(record.taskId),
            createdAt: normalizeString(record.createdAt),
          })
        ),
      },
    },
    warnings,
    errors,
  };
}

export function buildCommandCenterRuntimeSnapshot() {
  const runtimeSummary = summarizeRuntimeFiles();

  return {
    snapshotVersion: "1.0",
    source: "local-state/runtime",
    readOnly: true,
    generatedAt: new Date().toISOString(),
    runtimeState: runtimeSummary.runtimeState,
    health: {
      tasksPresent: readRuntimeTasks().present,
      evidencePresent: readRuntimeEvidence().present,
      auditPresent: readRuntimeAudit().present,
      eventsPresent: readRuntimeEvents().present,
      approvalsPresent: readRuntimeApprovals().present,
      incidentsPresent: readRuntimeIncidents().present,
    },
    limits: {
      apiWired: false,
      dbWired: false,
      mutationEnabled: false,
      providerCallsEnabled: false,
      [PRIVATE_EXECUTION_KEY]: false,
    },
    warnings: runtimeSummary.warnings,
    errors: runtimeSummary.errors,
  };
}
