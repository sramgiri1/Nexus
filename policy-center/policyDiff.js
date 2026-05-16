import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

function stableId(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 12);
}

function changedKeys(before = {}, after = {}) {
  const beforeKeys = new Set(Object.keys(before || {}));
  const afterKeys = new Set(Object.keys(after || {}));
  const addedFields = [...afterKeys].filter((key) => !beforeKeys.has(key));
  const removedFields = [...beforeKeys].filter((key) => !afterKeys.has(key));
  const changedFields = [...afterKeys].filter(
    (key) => beforeKeys.has(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  return { changedFields, addedFields, removedFields };
}

export function classifyPolicyDiffRisk(diff = {}) {
  const fields = [...(diff.changedFields || []), ...(diff.addedFields || []), ...(diff.removedFields || [])]
    .join(" ")
    .toLowerCase();
  const summary = String(diff.summary || "").toLowerCase();
  const text = `${fields} ${summary}`;
  if (/public|demo|dbwrites|db writes|provider|network|external|production|secret/.test(text)) return "critical";
  if (/tool|mcp|path|write|mutation|permission|allowlist|capability/.test(text)) return "high";
  if (/scope|mode|agent|approval|budget|threshold|risk/.test(text)) return "medium";
  return "low";
}

export function createPolicyDiff(beforePolicy = {}, afterPolicy = {}, options = {}) {
  const fieldChanges = changedKeys(beforePolicy, afterPolicy);
  const partial = {
    diffId: "",
    policyId: options.policyId || afterPolicy.policyId || beforePolicy.policyId || "policy-preview",
    fromVersion: options.fromVersion || beforePolicy.version || "previous",
    toVersion: options.toVersion || afterPolicy.version || "next",
    ...fieldChanges,
    summary: options.summary || "Policy diff preview; no policy changes are applied.",
  };
  const riskLevel = classifyPolicyDiffRisk(partial);
  return {
    ...partial,
    diffId: `policy_diff_${stableId(partial)}`,
    riskLevel,
    policyBoundaryImpact: riskLevel === "low" ? "wording_or_metadata" : "governance_boundary_review_required",
    requiresApproval: ["medium", "high", "critical"].includes(riskLevel),
    requiresWardenReview: ["high", "critical"].includes(riskLevel),
    requiresAuditorReview: ["medium", "high", "critical"].includes(riskLevel),
    warnings: riskLevel === "critical" ? ["Critical boundary impact; preview must not be applied automatically."] : [],
    errors: [],
  };
}

export function diffPolicyFiles(beforePath, afterPath, options = {}) {
  const beforePolicy = JSON.parse(readFileSync(beforePath, "utf8"));
  const afterPolicy = JSON.parse(readFileSync(afterPath, "utf8"));
  return createPolicyDiff(beforePolicy, afterPolicy, options);
}

export function validatePolicyDiff(diff = {}) {
  const errors = [];
  for (const field of [
    "diffId",
    "policyId",
    "fromVersion",
    "toVersion",
    "riskLevel",
    "changedFields",
    "addedFields",
    "removedFields",
    "policyBoundaryImpact",
    "summary",
  ]) {
    if (diff[field] === undefined || diff[field] === null) errors.push(`missing ${field}`);
  }
  if (!["low", "medium", "high", "critical"].includes(diff.riskLevel)) {
    errors.push(`invalid riskLevel ${diff.riskLevel}`);
  }
  if (diff.riskLevel === "critical" && !diff.requiresWardenReview) {
    errors.push("critical diff requires WARDEN review");
  }
  return { valid: errors.length === 0, errors };
}

export function summarizePolicyDiff(diff = {}) {
  return {
    diffId: diff.diffId,
    policyId: diff.policyId,
    riskLevel: diff.riskLevel,
    changedFieldCount: (diff.changedFields || []).length,
    addedFieldCount: (diff.addedFields || []).length,
    removedFieldCount: (diff.removedFields || []).length,
    requiresApproval: diff.requiresApproval === true,
    requiresWardenReview: diff.requiresWardenReview === true,
    requiresAuditorReview: diff.requiresAuditorReview === true,
    summary: diff.summary,
  };
}
