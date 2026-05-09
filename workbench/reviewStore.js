/**
 * reviewStore.js
 * Append-only store for human review records — P38-LOCAL.
 * Writes to local-state/runtime/reviews.jsonl.
 */

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRepoRoot } from "../local-state/safeFileReader.js";
import {
  assertNoPrivateProjectReference,
  assertNoSecretLikeContent,
  assertWritePathAllowed,
  sanitizeRecord,
} from "../local-state/writeGuards.js";

export const LOCAL_REVIEWS_FILE = "local-state/runtime/reviews.jsonl";

function getReviewsPath() {
  return path.join(getRepoRoot(), LOCAL_REVIEWS_FILE);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

const ALLOWED_DECISIONS = new Set(["approve", "reject", "request_changes"]);

function buildReviewRecord(record = {}) {
  const sanitized = sanitizeRecord(record);
  return {
    reviewId: normalizeString(sanitized.reviewId) || randomUUID(),
    actionType: "task.review",
    runtimeTaskId: normalizeString(sanitized.runtimeTaskId),
    sourcePlanTaskId: normalizeString(sanitized.sourcePlanTaskId),
    missionId: normalizeString(sanitized.missionId) || "private-project-governed-build-mission",
    projectId: normalizeString(sanitized.projectId) || "private-project-01",
    decision: normalizeString(sanitized.decision),
    reason: normalizeString(sanitized.reason),
    reviewer: normalizeString(sanitized.reviewer) || "local-operator",
    reviewerRole: normalizeString(sanitized.reviewerRole) || "founder",
    reviewedObject: normalizeString(sanitized.reviewedObject) || "task_plan",
    status: normalizeString(sanitized.status) || "completed",
    mode: normalizeString(sanitized.mode) || "local-private",
    evidenceIds: Array.isArray(sanitized.evidenceIds) ? sanitized.evidenceIds : [],
    auditIds: Array.isArray(sanitized.auditIds) ? sanitized.auditIds : [],
    createdAt: normalizeString(sanitized.createdAt) || new Date().toISOString(),
    redacted: true,
  };
}

function validateReviewRecord(record = {}) {
  const errors = [];
  const r = buildReviewRecord(record);

  if (!r.runtimeTaskId) errors.push("runtimeTaskId is required.");
  if (!ALLOWED_DECISIONS.has(r.decision)) {
    errors.push(`decision must be one of: ${[...ALLOWED_DECISIONS].join(", ")}. Got: ${r.decision}`);
  }
  if (r.redacted !== true) errors.push("redacted must be true.");

  const secretCheck = assertNoSecretLikeContent(r);
  const privateCheck = assertNoPrivateProjectReference(r);
  errors.push(...secretCheck.errors, ...privateCheck.errors);

  return { valid: errors.length === 0, errors, record: r };
}

export function appendReviewRecord(record = {}) {
  const pathCheck = assertWritePathAllowed(LOCAL_REVIEWS_FILE);
  const validation = validateReviewRecord(record);
  const errors = [...pathCheck.errors, ...validation.errors];

  if (errors.length > 0) {
    return { ok: false, path: LOCAL_REVIEWS_FILE, record: validation.record, errors };
  }

  fs.appendFileSync(getReviewsPath(), `${JSON.stringify(validation.record)}\n`, "utf8");
  return { ok: true, path: LOCAL_REVIEWS_FILE, record: validation.record, errors: [] };
}

export function listReviewRecords() {
  try {
    const p = getReviewsPath();
    if (!fs.existsSync(p)) return { ok: true, records: [] };
    const lines = fs.readFileSync(p, "utf8").split("\n").filter(Boolean);
    const records = lines.map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
    return { ok: true, records };
  } catch (e) {
    return { ok: false, records: [], errors: [e.message] };
  }
}

export function getReviewRecord(reviewId) {
  const all = listReviewRecords();
  if (!all.ok) return { ok: false, record: null, errors: all.errors };
  const record = all.records.find((r) => r.reviewId === reviewId);
  if (!record) return { ok: false, record: null, errors: [`Review not found: ${reviewId}`] };
  return { ok: true, record };
}

export function listReviewsForTask(runtimeTaskId) {
  const all = listReviewRecords();
  if (!all.ok) return { ok: false, records: [], errors: all.errors };
  return { ok: true, records: all.records.filter((r) => r.runtimeTaskId === runtimeTaskId) };
}
