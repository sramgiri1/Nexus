import { randomUUID } from "node:crypto";
import { appendAuditEvent } from "./appendAuditEvent.js";
import { appendEvidence } from "./appendEvidence.js";
import { readJsonl, appendApprovalRecord } from "./stateStore.js";
import {
  assertNoPrivateProjectReference,
  assertNoSecretLikeContent,
  sanitizeRecord,
} from "./writeGuards.js";

const APPROVAL_TYPES = new Set([
  "deploy",
  "secrets",
  "migration",
  "production_data_access",
  "high_risk",
  "state_transition",
  "other",
]);
const RISK_LEVELS = new Set(["medium", "high", "critical"]);
const DECISIONS = new Set(["requested", "approved", "rejected", "expired"]);
const DECISION_ACTIONS = new Set(["approved", "rejected", "expired"]);
const PRIVATE_PROJECT_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function normalizeApprovalType(value) {
  const normalized = normalizeString(value).toLowerCase();
  if (!normalized) return "other";
  if (APPROVAL_TYPES.has(normalized)) return normalized;
  if (normalized.includes("deploy")) return "deploy";
  if (normalized.includes("secret")) return "secrets";
  if (normalized.includes("migration")) return "migration";
  if (normalized.includes("production_data_access")) {
    return "production_data_access";
  }
  if (normalized.includes("state_transition")) return "state_transition";
  if (normalized.includes("risk")) return "high_risk";
  return "other";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildApprovalRequestRecord(record = {}) {
  const sanitized = sanitizeRecord(record);

  return {
    approvalId: normalizeString(sanitized.approvalId) || randomUUID(),
    requestedBy: normalizeString(sanitized.requestedBy),
    projectId: normalizeString(sanitized.projectId),
    taskId: normalizeString(sanitized.taskId),
    riskLevel: normalizeString(sanitized.riskLevel),
    reason:
      normalizeString(sanitized.reason) || normalizeString(sanitized.summary),
    evidence: ensureArray(sanitized.evidence),
    decision: "requested",
    expiresAt:
      normalizeString(sanitized.expiresAt) ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: normalizeString(sanitized.createdAt) || new Date().toISOString(),
    redacted: true,
    type: normalizeApprovalType(sanitized.type),
  };
}

function buildApprovalDecisionRecord(input = {}, existingApproval = {}) {
  const sanitized = sanitizeRecord(input);

  return {
    approvalId:
      normalizeString(sanitized.approvalId) ||
      normalizeString(existingApproval.approvalId),
    type: normalizeString(existingApproval.type),
    requestedBy: normalizeString(existingApproval.requestedBy),
    decidedBy: normalizeString(sanitized.decidedBy),
    projectId: normalizeString(existingApproval.projectId),
    taskId: normalizeString(existingApproval.taskId),
    riskLevel: normalizeString(existingApproval.riskLevel),
    reason: normalizeString(sanitized.reason),
    evidence: [],
    decision: normalizeString(sanitized.decision),
    expiresAt: normalizeString(existingApproval.expiresAt),
    createdAt: normalizeString(sanitized.createdAt) || new Date().toISOString(),
    redacted: true,
  };
}

export function validateApprovalRequest(record = {}) {
  const request = buildApprovalRequestRecord(record);
  const errors = [];
  const warnings = [];

  for (const fieldName of [
    "requestedBy",
    "projectId",
    "taskId",
    "riskLevel",
    "reason",
    "type",
  ]) {
    if (!normalizeString(request[fieldName])) {
      errors.push(`${fieldName} is required.`);
    }
  }

  if (request.projectId !== "demoapp") {
    errors.push("Approval requests are limited to demoapp.");
  }

  if (!RISK_LEVELS.has(request.riskLevel)) {
    errors.push("riskLevel must be medium, high, or critical.");
  }

  if (request.decision !== "requested") {
    errors.push("Approval requests must start with decision=requested.");
  }

  if (request.redacted !== true) {
    errors.push("redacted must be true.");
  }

  const secretCheck = assertNoSecretLikeContent(request);
  const privateCheck = assertNoPrivateProjectReference(request);
  errors.push(...secretCheck.errors, ...privateCheck.errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    record: request,
  };
}

function readApprovalRecords() {
  const result = readJsonl("local-state/runtime/approvals.jsonl");
  if (!result.ok) {
    return {
      ok: false,
      records: [],
      errors: [result.error],
      warnings: [],
    };
  }

  return {
    ok: true,
    records: result.records,
    errors: [],
    warnings: [],
  };
}

function consolidateApprovals(records = []) {
  const grouped = new Map();

  for (const record of records) {
    const approvalId = normalizeString(record.approvalId);
    if (!approvalId) {
      continue;
    }

    const current = grouped.get(approvalId) || {
      approvalId,
      request: null,
      decisions: [],
    };

    if (normalizeString(record.decision) === "requested" && !current.request) {
      current.request = record;
    } else {
      current.decisions.push(record);
    }

    grouped.set(approvalId, current);
  }

  return [...grouped.values()].map((entry) => {
    const latestDecision =
      entry.decisions.length > 0
        ? [...entry.decisions].sort((left, right) =>
            normalizeString(left.createdAt).localeCompare(
              normalizeString(right.createdAt)
            )
          )[entry.decisions.length - 1]
        : null;

    const request = entry.request || latestDecision || {};
    const currentDecision =
      normalizeString(latestDecision?.decision) ||
      normalizeString(request.decision) ||
      "requested";

    return {
      approvalId: entry.approvalId,
      type: normalizeString(request.type),
      requestedBy: normalizeString(request.requestedBy),
      projectId: normalizeString(request.projectId),
      taskId: normalizeString(request.taskId),
      riskLevel: normalizeString(request.riskLevel),
      reason: normalizeString(request.reason),
      evidence: ensureArray(request.evidence),
      decision: currentDecision,
      expiresAt: normalizeString(request.expiresAt),
      createdAt: normalizeString(request.createdAt),
      redacted: true,
      decisions: entry.decisions,
      latestDecision,
      request,
    };
  });
}

export function listApprovals(filter = {}) {
  const recordsResult = readApprovalRecords();
  if (!recordsResult.ok) {
    return {
      ok: false,
      approvals: [],
      errors: recordsResult.errors,
      warnings: recordsResult.warnings,
    };
  }

  const approvals = consolidateApprovals(recordsResult.records).filter(
    (approval) => {
      if (
        normalizeString(filter.approvalId) &&
        approval.approvalId !== normalizeString(filter.approvalId)
      ) {
        return false;
      }
      if (
        normalizeString(filter.projectId) &&
        approval.projectId !== normalizeString(filter.projectId)
      ) {
        return false;
      }
      if (
        normalizeString(filter.taskId) &&
        approval.taskId !== normalizeString(filter.taskId)
      ) {
        return false;
      }
      if (
        normalizeString(filter.type) &&
        approval.type !== normalizeString(filter.type)
      ) {
        return false;
      }
      if (
        normalizeString(filter.decision) &&
        approval.decision !== normalizeString(filter.decision)
      ) {
        return false;
      }
      return true;
    }
  );

  return {
    ok: true,
    approvals,
    errors: [],
    warnings: [],
  };
}

export function getApprovalById(approvalId) {
  const listResult = listApprovals({ approvalId });
  if (!listResult.ok) {
    return {
      ok: false,
      approval: null,
      errors: listResult.errors,
      warnings: listResult.warnings,
    };
  }

  const approval = listResult.approvals.find(
    (entry) => entry.approvalId === normalizeString(approvalId)
  );

  if (!approval) {
    return {
      ok: false,
      approval: null,
      errors: ["approvalId was not found."],
      warnings: [],
    };
  }

  return {
    ok: true,
    approval,
    errors: [],
    warnings: [],
  };
}

export function appendApprovalRequest(record = {}) {
  const validation = validateApprovalRequest(record);
  if (!validation.valid) {
    return {
      ok: false,
      path: "local-state/runtime/approvals.jsonl",
      record: validation.record,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  return appendApprovalRecord(validation.record);
}

export function validateApprovalDecision(input = {}) {
  const errors = [];
  const warnings = [];
  const decision = sanitizeRecord(input);
  const approvalLookup = getApprovalById(decision.approvalId);

  if (!normalizeString(decision.approvalId)) {
    errors.push("approvalId is required.");
  }

  if (!normalizeString(decision.decision)) {
    errors.push("decision is required.");
  }

  if (!normalizeString(decision.decidedBy)) {
    errors.push("decidedBy is required.");
  }

  if (!normalizeString(decision.reason)) {
    errors.push("reason is required.");
  }

  if (
    normalizeString(decision.decision) &&
    !DECISION_ACTIONS.has(normalizeString(decision.decision))
  ) {
    errors.push("decision must be approved, rejected, or expired.");
  }

  if (decision.redacted !== undefined && decision.redacted !== true) {
    errors.push("redacted must be true when provided.");
  }

  if (!approvalLookup.ok) {
    errors.push(...approvalLookup.errors);
  } else {
    const approval = approvalLookup.approval;

    if (approval.projectId !== "demoapp") {
      errors.push("Approval decisions are limited to demoapp.");
    }

    if (PRIVATE_PROJECT_PATTERN.test(JSON.stringify(approval))) {
      errors.push("Private project references are not allowed.");
    }

    if (approval.decision !== "requested") {
      errors.push("Only requested approvals may be decided.");
    }

    if (
      normalizeString(decision.decidedBy) &&
      normalizeString(decision.decidedBy) === normalizeString(approval.requestedBy)
    ) {
      errors.push("Self approval is not allowed.");
    }
  }

  const secretCheck = assertNoSecretLikeContent(decision);
  const privateCheck = assertNoPrivateProjectReference(decision);
  errors.push(...secretCheck.errors, ...privateCheck.errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    record: sanitizeRecord({
      approvalId: normalizeString(decision.approvalId),
      decision: normalizeString(decision.decision),
      decidedBy: normalizeString(decision.decidedBy),
      reason: normalizeString(decision.reason),
      createdAt: normalizeString(decision.createdAt) || new Date().toISOString(),
      redacted: true,
    }),
    approval: approvalLookup.approval || null,
  };
}

export function decideApproval(input = {}) {
  const validation = validateApprovalDecision(input);
  if (!validation.valid || !validation.approval) {
    return {
      ok: false,
      approval: validation.approval,
      decisionRecord: null,
      audit: null,
      evidence: null,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const decisionRecord = buildApprovalDecisionRecord(
    validation.record,
    validation.approval
  );
  const approvalWrite = appendApprovalRecord(decisionRecord);
  if (!approvalWrite.ok) {
    return {
      ok: false,
      approval: validation.approval,
      decisionRecord,
      audit: null,
      evidence: null,
      errors: approvalWrite.errors,
      warnings: approvalWrite.warnings,
    };
  }

  const auditWrite = appendAuditEvent({
    eventType: "local_approval_decision",
    actorId: decisionRecord.decidedBy,
    actorType: "user",
    projectId: validation.approval.projectId,
    taskId: validation.approval.taskId,
    capabilityId: "",
    policyDecisionId: "",
    approvalId: decisionRecord.approvalId,
    summary: `Local approval ${decisionRecord.decision} for ${decisionRecord.approvalId}: ${decisionRecord.reason}`,
    redacted: true,
  });

  const evidenceType =
    decisionRecord.decision === "approved"
      ? "approval_granted"
      : decisionRecord.decision === "rejected"
        ? "approval_rejected"
        : "approval_expired";
  const evidenceResult =
    decisionRecord.decision === "approved"
      ? "PASS"
      : decisionRecord.decision === "rejected"
        ? "BLOCKED"
        : "INFO";
  const evidenceWrite = appendEvidence({
    type: evidenceType,
    projectId: validation.approval.projectId,
    taskId: validation.approval.taskId,
    agentId: decisionRecord.decidedBy,
    capabilityId: "",
    result: evidenceResult,
    summary: `Local approval ${decisionRecord.decision} for ${decisionRecord.approvalId}: ${decisionRecord.reason}`,
    artifactPaths: ["local-state/runtime/approvals.jsonl"],
    traceIds: [decisionRecord.approvalId],
    policyDecisionId: "",
    dataClassification: "internal",
    redacted: true,
  });

  const errors = unique([
    ...(approvalWrite.ok ? [] : approvalWrite.errors),
    ...(auditWrite.ok ? [] : auditWrite.errors),
    ...(evidenceWrite.ok ? [] : evidenceWrite.errors),
  ]);
  const warnings = unique([
    ...(approvalWrite.ok ? [] : approvalWrite.warnings),
    ...(auditWrite.ok ? [] : auditWrite.warnings),
    ...(evidenceWrite.ok ? [] : evidenceWrite.warnings),
  ]);

  return {
    ok: errors.length === 0,
    approval: validation.approval,
    decisionRecord: approvalWrite.record,
    audit: auditWrite.record,
    evidence: evidenceWrite.record,
    errors,
    warnings,
  };
}
