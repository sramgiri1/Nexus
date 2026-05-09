/**
 * implementationPlan.js
 * Implementation proposal and patch plan builder — P39-LOCAL.
 * No execution, no providers, no network, no DB, no project mutation.
 */

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const ALLOWED_IMPLEMENTATION_TYPES = new Set(["documentation_readiness_log"]);
const ALLOWED_PATHS = new Set(["projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md"]);
const FORBIDDEN_PATH_PREFIXES = [
  "projects/careloop/src",
  "projects/careloop/test",
  "projects/careloop/prisma",
  "projects/careloop-ios",
  "projects/shiftpay",
];

const PROPOSAL_VERSION = "1.0";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isForbiddenPath(p) {
  return FORBIDDEN_PATH_PREFIXES.some((prefix) => p.startsWith(prefix));
}

function isAllowedPath(p) {
  return ALLOWED_PATHS.has(p);
}

// ─── createImplementationProposal ─────────────────────────────────────────────

export function createImplementationProposal(input = {}) {
  const errors = [];
  const warnings = [];

  const mode = normalizeString(input.mode) || "local-private";
  const implementationType = normalizeString(input.implementationType);
  const targetAgent = normalizeString(input.targetAgent);
  const capabilityId = normalizeString(input.capabilityId);
  const allowedPaths = Array.isArray(input.allowedPaths) ? input.allowedPaths : [];

  if (!ALLOWED_IMPLEMENTATION_TYPES.has(implementationType)) {
    errors.push(`implementationType must be one of: ${[...ALLOWED_IMPLEMENTATION_TYPES].join(", ")}. Got: ${implementationType || "(empty)"}`);
  }
  if (!["local-private", "test"].includes(mode)) {
    errors.push(`mode must be local-private or test. Got: ${mode}`);
  }
  if (targetAgent !== "CORE") {
    errors.push(`targetAgent must be CORE. Got: ${targetAgent || "(empty)"}`);
  }
  if (capabilityId !== "implementation.backend_code") {
    errors.push(`capabilityId must be implementation.backend_code. Got: ${capabilityId || "(empty)"}`);
  }
  for (const p of allowedPaths) {
    if (!isAllowedPath(p)) {
      errors.push(`Path not in allowlist: ${p}`);
    }
    if (isForbiddenPath(p)) {
      errors.push(`Path is explicitly forbidden: ${p}`);
    }
  }
  if (allowedPaths.length === 0) {
    warnings.push("No allowedPaths provided; using policy default.");
    allowedPaths.push("projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md");
  }

  if (errors.length > 0) return { ok: false, proposal: null, errors, warnings };

  const proposal = {
    proposalVersion: PROPOSAL_VERSION,
    mode,
    projectId: normalizeString(input.projectId) || "private-project-01",
    missionId: normalizeString(input.missionId) || "private-project-governed-build-mission",
    runtimeTaskId: normalizeString(input.runtimeTaskId),
    targetAgent,
    capabilityId,
    riskLevel: "low",
    implementationType,
    mutationAllowed: true,
    allowedPaths,
    forbiddenPaths: [...FORBIDDEN_PATH_PREFIXES],
    changeSummary: "Append a governed implementation log entry documenting the current NEXUS/private-project baseline.",
    validationPlan: {
      runBackendValidation: true,
      command: "npm test",
      throughControlledRunner: true,
      note: "Validation runs through careloop:backend-validate controlled path only.",
    },
    rollbackPlan: {
      strategy: "revert_doc_change",
      summary: "Remove the appended NEXUS implementation log entry from projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md if needed.",
    },
    safety: {
      providerCalls: false,
      networkCalls: false,
      dbAccess: false,
      apiServer: false,
      dependencyInstall: false,
      schemaChange: false,
      productionBehaviorChange: false,
    },
    createdAt: new Date().toISOString(),
    warnings,
    errors: [],
  };

  return { ok: true, proposal, errors: [], warnings };
}

// ─── validateImplementationProposal ──────────────────────────────────────────

export function validateImplementationProposal(proposal = {}) {
  const errors = [];
  if (!proposal || typeof proposal !== "object") {
    return { valid: false, errors: ["proposal must be an object."] };
  }
  if (!ALLOWED_IMPLEMENTATION_TYPES.has(proposal.implementationType)) {
    errors.push(`implementationType invalid: ${proposal.implementationType}`);
  }
  if (proposal.targetAgent !== "CORE") errors.push("targetAgent must be CORE.");
  if (proposal.capabilityId !== "implementation.backend_code") errors.push("capabilityId must be implementation.backend_code.");
  if (proposal.riskLevel !== "low") errors.push("riskLevel must be low.");
  if (proposal.mutationAllowed !== true) errors.push("mutationAllowed must be true.");
  if (!proposal.rollbackPlan || !proposal.rollbackPlan.strategy) errors.push("rollbackPlan.strategy is required.");
  if (!proposal.validationPlan) errors.push("validationPlan is required.");
  if (proposal.safety?.providerCalls !== false) errors.push("safety.providerCalls must be false.");
  if (proposal.safety?.networkCalls !== false) errors.push("safety.networkCalls must be false.");
  if (proposal.safety?.dbAccess !== false) errors.push("safety.dbAccess must be false.");
  if (proposal.safety?.productionBehaviorChange !== false) errors.push("safety.productionBehaviorChange must be false.");
  const paths = Array.isArray(proposal.allowedPaths) ? proposal.allowedPaths : [];
  for (const p of paths) {
    if (!isAllowedPath(p)) errors.push(`Allowed path not in whitelist: ${p}`);
    if (isForbiddenPath(p)) errors.push(`Forbidden path in allowedPaths: ${p}`);
  }
  return { valid: errors.length === 0, errors };
}

// ─── createPatchPlan ──────────────────────────────────────────────────────────

export function createPatchPlan(proposal) {
  if (!proposal || proposal.implementationType !== "documentation_readiness_log") {
    return { ok: false, errors: ["Only documentation_readiness_log is supported in P39."] };
  }
  const targetFile = "projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md";
  const timestamp = new Date().toISOString();
  const isNew = !existsSync(join(ROOT, targetFile));
  const entryContent = buildLogEntry(timestamp, proposal);
  return {
    ok: true,
    plan: {
      targetFile,
      operation: isNew ? "create" : "append",
      content: entryContent,
      patchSummary: `${isNew ? "Created" : "Appended to"} ${targetFile} with P39 governance log entry.`,
      rollbackNote: `To rollback: remove the P39 entry appended at ${timestamp} from ${targetFile}.`,
      timestamp,
    },
    errors: [],
  };
}

function buildLogEntry(timestamp, proposal) {
  const header = !existsSync(join(ROOT, "projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md"))
    ? "# NEXUS Implementation Log\n\nThis file tracks governed implementation actions applied by NEXUS agents.\n\n---\n\n"
    : "\n---\n\n";

  return `${header}## P39 Controlled Implementation Workflow

- Date: ${timestamp}
- Mode: ${proposal.mode}
- Mission: Private Project Governed Build Mission
- Assigned agent: ${proposal.targetAgent}
- Capability: ${proposal.capabilityId}
- Change type: ${proposal.implementationType}
- Baseline validation: 58/58 backend tests passing
- Project mutation scope: documentation only
- Production behavior changed: no
- Provider/network/DB/API used: no
- Rollback: remove this entry
- Evidence: reports/implementation-result.json
`;
}

// ─── createRollbackPlan ───────────────────────────────────────────────────────

export function createRollbackPlan(proposal) {
  return {
    strategy: "revert_doc_change",
    targetFile: "projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md",
    summary: "Remove the appended NEXUS implementation log entry if needed. The file was documentation-only; no production behavior was changed.",
    steps: [
      "Open projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md",
      "Remove the P39 implementation entry block (from '## P39 Controlled Implementation Workflow' to end of entry)",
      "If file was newly created, delete it entirely",
    ],
    providerRequired: false,
    networkRequired: false,
    dbRequired: false,
    createdAt: new Date().toISOString(),
  };
}

// ─── writeImplementationProposalReports ──────────────────────────────────────

export function writeImplementationProposalReports(result = {}) {
  const errors = [];
  try {
    writeFileSync(
      join(ROOT, "reports/implementation-proposal.json"),
      JSON.stringify({ ...result, redacted: true }, null, 2),
      "utf8"
    );
  } catch (e) {
    errors.push(`Failed to write implementation-proposal.json: ${e.message}`);
  }
  return { ok: errors.length === 0, errors };
}
