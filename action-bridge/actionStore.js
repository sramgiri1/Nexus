import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";
import {
  assertNoPrivateProjectReference,
  assertNoSecretLikeContent,
  assertWritePathAllowed,
  sanitizeRecord,
} from "../local-state/writeGuards.js";
import { LOCAL_ACTIONS_FILE } from "./actionSchema.js";

function getActionsPath() {
  return path.join(getRepoRoot(), LOCAL_ACTIONS_FILE);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildStoredAction(action) {
  const sanitized = sanitizeRecord(action);
  return {
    actionId: normalizeString(sanitized.actionId),
    actionType: normalizeString(sanitized.actionType),
    requestedBy: normalizeString(sanitized.requestedBy),
    source: normalizeString(sanitized.source),
    projectId: normalizeString(sanitized.projectId),
    privateProject: sanitized.privateProject === true,
    mode: normalizeString(sanitized.mode),
    target: sanitized.target || {},
    requestedCommand: null,
    mutationRequested: false,
    status: normalizeString(sanitized.status) || "requested",
    createdAt: normalizeString(sanitized.createdAt) || new Date(Date.now()).toISOString(),
    redacted: true,
    evidenceIds: Array.isArray(sanitized.evidenceIds) ? sanitized.evidenceIds : [],
    auditIds: Array.isArray(sanitized.auditIds) ? sanitized.auditIds : [],
  };
}

export function appendAction(action) {
  const pathCheck = assertWritePathAllowed(LOCAL_ACTIONS_FILE);
  if (!pathCheck.ok) {
    return { ok: false, errors: pathCheck.errors, warnings: [] };
  }

  const stored = buildStoredAction(action);
  const secretCheck = assertNoSecretLikeContent(stored);
  const privateCheck = assertNoPrivateProjectReference(stored);
  const errors = [...secretCheck.errors, ...privateCheck.errors];

  if (errors.length > 0) {
    return { ok: false, errors, warnings: [] };
  }

  fs.appendFileSync(getActionsPath(), `${JSON.stringify(stored)}\n`, "utf8");
  return { ok: true, record: stored, errors: [], warnings: [] };
}

export function readActions() {
  const actionsPath = getActionsPath();
  if (!fs.existsSync(actionsPath)) {
    return { records: [], errors: [], warnings: [] };
  }

  const lines = fs.readFileSync(actionsPath, "utf8").split("\n").filter(Boolean);
  const records = [];
  const errors = [];

  for (const line of lines) {
    try {
      records.push(JSON.parse(line));
    } catch {
      errors.push(`Skipped unparseable action record.`);
    }
  }

  return { records, errors, warnings: [] };
}

export function readRecentActions(limit = 5) {
  const { records, errors, warnings } = readActions();
  const recent = [...records]
    .sort((a, b) => {
      const ta = Date.parse(a.createdAt || "") || 0;
      const tb = Date.parse(b.createdAt || "") || 0;
      return tb - ta;
    })
    .slice(0, limit);
  return { records: recent, errors, warnings };
}
