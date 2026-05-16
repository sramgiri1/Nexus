import { readFileSync } from "node:fs";
import { join } from "node:path";
import { redactObject } from "../shared/index.js";

const ROOT = process.cwd();
const TYPES = new Set([
  "project_mutation",
  "tool_call",
  "provider_call",
  "db_write",
  "agent_definition_update",
  "release_action",
  "demo_public_boundary",
]);

export function createPolicySimulationRequest(input = {}) {
  return {
    simulationType: input.simulationType || "project_mutation",
    scope: input.scope || "project",
    projectId: input.projectId || "private-project",
    agentId: input.agentId || "NEXUS",
    capabilityId: input.capabilityId || "",
    requestedAction: input.requestedAction || "preview",
    targetPaths: Array.isArray(input.targetPaths) ? input.targetPaths : [],
    dataClassification: input.dataClassification || "internal",
    mode: input.mode || "local-private",
    riskLevel: input.riskLevel || "medium",
  };
}

export function validatePolicySimulationRequest(input = {}) {
  const request = createPolicySimulationRequest(input);
  const errors = [];
  if (!TYPES.has(request.simulationType)) errors.push(`invalid simulationType ${request.simulationType}`);
  if (request.mode === "public" && request.dataClassification === "private") {
    errors.push("public mode cannot request private data");
  }
  return { valid: errors.length === 0, errors, request };
}

function decisionFor(request) {
  if (request.simulationType === "demo_public_boundary") return "DENY";
  if (request.simulationType === "provider_call") return "DENY";
  if (request.simulationType === "tool_call") return "DENY";
  if (request.simulationType === "db_write") return "DENY";
  if (request.simulationType === "release_action") return "REQUIRES_APPROVAL";
  if (request.simulationType === "agent_definition_update") return "REQUIRES_REVIEW";
  if (request.simulationType === "project_mutation" && ["high", "critical"].includes(request.riskLevel)) {
    return "REQUIRES_APPROVAL";
  }
  return "ALLOW_PREVIEW";
}

export function runPolicySimulation(input = {}, options = {}) {
  const validation = validatePolicySimulationRequest(input);
  const request = validation.request;
  const decision = validation.valid ? decisionFor(request) : "DENY";
  const matchedPolicies = [
    request.simulationType,
    request.mode === "local-private" ? "private-project-mode" : "public-private-demo-safety",
  ];
  const result = {
    ok: validation.valid && decision !== "DENY",
    decision,
    matchedPolicies,
    reasons: [
      decision === "DENY"
        ? "Runtime execution or boundary weakening is not enabled."
        : "Request is previewed through governance metadata only.",
    ],
    requiredEvidence: decision === "ALLOW_PREVIEW" ? [] : ["operator intent", "scope summary", "risk summary"],
    requiredApprovals: decision === "REQUIRES_APPROVAL" ? ["WARDEN", "AUDITOR", "human operator"] : [],
    warnings: validation.errors,
    errors: validation.valid ? [] : validation.errors,
    redacted: true,
  };
  return redactObject(options.includeRequest ? { ...result, request } : result);
}

export function summarizePolicySimulation(result = {}) {
  return {
    ok: result.ok === true,
    decision: result.decision || "DENY",
    matchedPolicyCount: (result.matchedPolicies || []).length,
    requiredEvidenceCount: (result.requiredEvidence || []).length,
    requiredApprovals: result.requiredApprovals || [],
    redacted: result.redacted === true,
  };
}

export function listPolicySimulationScenarios() {
  return JSON.parse(readFileSync(join(ROOT, "policy-center/policySimulationScenarios.json"), "utf8"));
}
