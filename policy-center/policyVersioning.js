import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadPolicyRegistry } from "./policyRegistry.js";

const ROOT = process.cwd();

function safeChecksum(sourcePath) {
  const fullPath = join(ROOT, sourcePath);
  if (!existsSync(fullPath)) return "planned";
  const content = readFileSync(fullPath, "utf8");
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function versionForPolicy(policy) {
  return {
    policyId: policy.policyId,
    version: policy.version || "1.0.0",
    sourcePath: policy.sourcePath,
    phaseIntroduced: policy.relatedPhase,
    phaseUpdated: "P58.2",
    status: policy.status === "active" ? "active" : "planned",
    checksum: safeChecksum(policy.sourcePath),
    summary: `${policy.title} version metadata for ${policy.ownerArea}.`,
    breakingChange: false,
    reviewedBy: policy.ownerAgent,
    createdAt: "",
    supersedes: "",
    supersededBy: "",
  };
}

export function buildPolicyVersionIndex(registry = loadPolicyRegistry()) {
  return {
    indexVersion: "1.0",
    phase: "P58.2",
    generatedAt: new Date().toISOString(),
    previewOnly: true,
    policyMutationAllowed: false,
    versions: (registry.policies || []).map(versionForPolicy),
  };
}

export function getPolicyVersion(policyId, version, options = {}) {
  const index = options.index || buildPolicyVersionIndex(options.registry);
  return (
    index.versions.find((entry) => entry.policyId === policyId && entry.version === version) ||
    null
  );
}

export function listPolicyVersions(policyId, options = {}) {
  const index = options.index || buildPolicyVersionIndex(options.registry);
  return index.versions.filter((entry) => entry.policyId === policyId);
}

export function validatePolicyVersionIndex(index = buildPolicyVersionIndex()) {
  const errors = [];
  const activeByPolicy = new Map();
  for (const entry of index.versions || []) {
    for (const field of [
      "policyId",
      "version",
      "sourcePath",
      "phaseIntroduced",
      "phaseUpdated",
      "status",
      "checksum",
      "summary",
      "reviewedBy",
    ]) {
      if (!entry[field]) errors.push(`${entry.policyId || "unknown"} missing ${field}`);
    }
    if (entry.status === "active") {
      activeByPolicy.set(entry.policyId, (activeByPolicy.get(entry.policyId) || 0) + 1);
    }
    if (/sk-|secret|token/i.test(entry.checksum)) {
      errors.push(`${entry.policyId} checksum exposes secret-like text`);
    }
  }
  for (const [policyId, count] of activeByPolicy.entries()) {
    if (count > 1) errors.push(`${policyId} has duplicate active versions`);
  }
  return { valid: errors.length === 0, errors };
}

export function summarizePolicyVersions(index = buildPolicyVersionIndex()) {
  const versions = index.versions || [];
  return {
    policyCount: new Set(versions.map((entry) => entry.policyId)).size,
    versionCount: versions.length,
    activeVersions: versions.filter((entry) => entry.status === "active").length,
    plannedVersions: versions.filter((entry) => entry.status === "planned").length,
    breakingChanges: versions.filter((entry) => entry.breakingChange).length,
    previewOnly: index.previewOnly === true,
    policyMutationAllowed: index.policyMutationAllowed === true,
  };
}
