import { readFileSync } from "node:fs";
import { join } from "node:path";
import { containsForbiddenMemoryContent } from "./memorySchema.js";
import { createMemoryAccessDecision, MEMORY_ACCESS_DECISIONS } from "./memoryAccessDecision.js";

const DEFAULT_POLICY_PATH = "policy/memory-access-policy.json";
const METADATA_INSPECTORS = ["WARDEN", "AUDITOR", "NEXUS"];

export function loadMemoryAccessPolicy(options = {}) {
  const path = join(options.root || process.cwd(), options.policyPath || DEFAULT_POLICY_PATH);
  return JSON.parse(readFileSync(path, "utf8"));
}

export function validateMemoryAccessPolicy(policy = {}) {
  const errors = [];
  if (policy.runtimeInjectionAllowed !== false) errors.push("runtimeInjectionAllowed must be false");
  if (policy.providerCallsAllowed !== false) errors.push("providerCallsAllowed must be false");
  if (policy.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (!Array.isArray(policy.decisions)) errors.push("decisions must be an array");
  for (const decision of MEMORY_ACCESS_DECISIONS) {
    if (!policy.decisions?.includes(decision)) errors.push(`Missing decision: ${decision}`);
  }
  return { ok: errors.length === 0, errors };
}

function deny(request, reasons) {
  return createMemoryAccessDecision({ ...request, decision: "DENY", reasons });
}

export function evaluateMemoryAccess(request = {}, options = {}) {
  const policy = options.policy || loadMemoryAccessPolicy(options);
  const reasons = [];
  const redactions = [];
  const mode = request.mode || "local-private";

  if (!validateMemoryAccessPolicy(policy).ok) {
    return deny(request, ["Memory access policy is invalid"]);
  }

  if (["demo", "public"].includes(mode) && request.classification !== "public_safe") {
    return deny(request, ["Private memory is blocked in demo/public modes"]);
  }

  if (request.memoryProjectId && request.projectId && request.memoryProjectId !== request.projectId) {
    return deny(request, ["Unrelated project memory is blocked"]);
  }

  if (request.classification === "forbidden" || containsForbiddenMemoryContent(request.summary || "")) {
    return deny(request, ["Raw secret/source/prompt memory is blocked"]);
  }

  if (request.scope === "promotion_candidate" || request.classification === "sensitive_metadata") {
    if (!METADATA_INSPECTORS.includes(request.agentId)) {
      return createMemoryAccessDecision({
        ...request,
        decision: "REQUIRE_APPROVAL",
        reasons: ["Sensitive memory requires approval or metadata-inspector agent"],
      });
    }
    redactions.push("Sensitive fields redacted for metadata inspection");
    reasons.push("Metadata inspector can review redacted memory metadata");
    return createMemoryAccessDecision({ ...request, decision: "REDACT", reasons, redactions });
  }

  if (Array.isArray(request.allowedAgents) && request.allowedAgents.length > 0 && !request.allowedAgents.includes(request.agentId)) {
    if (METADATA_INSPECTORS.includes(request.agentId)) {
      redactions.push("Content summary redacted; metadata only");
      reasons.push("Governance agent can inspect redacted metadata");
      return createMemoryAccessDecision({ ...request, decision: "REDACT", reasons, redactions });
    }
    return deny(request, ["Agent is not listed in allowedAgents"]);
  }

  reasons.push("Scope, mode, project, classification, and agent checks passed");
  return createMemoryAccessDecision({ ...request, decision: "ALLOW", reasons });
}
