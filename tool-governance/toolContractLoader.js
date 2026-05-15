import { existsSync, readFileSync } from "node:fs";
import { join, normalize, relative } from "node:path";
import { getToolById } from "./toolRegistry.js";
import { buildToolGatewayDecision, createToolGatewayContext } from "./toolGateway.js";
import { TOOL_GATEWAY_DECISIONS } from "./toolDecision.js";

const ROOT = process.cwd();
const CONTRACT_ROOT = join(ROOT, "tool-governance", "contracts");

function safeContractPath(contractPath) {
  const fullPath = normalize(join(ROOT, contractPath));
  const relativePath = relative(CONTRACT_ROOT, fullPath);
  if (relativePath.startsWith("..") || relativePath === "" || relativePath.includes("..")) return null;
  return fullPath;
}

export function validateToolContract(contract) {
  const errors = [];
  for (const field of [
    "toolId",
    "version",
    "purpose",
    "costEstimateShape",
    "evidenceShape",
    "auditShape",
  ]) {
    if (!contract?.[field] || typeof contract[field] !== "string") errors.push(`Missing string field: ${field}`);
  }
  for (const field of ["methods", "allowedScopes", "policyRefs", "examples"]) {
    if (!Array.isArray(contract?.[field])) errors.push(`Missing array field: ${field}`);
  }
  if (!contract?.inputSchema || typeof contract.inputSchema !== "object") errors.push("Missing inputSchema object");
  if (!contract?.outputSchema || typeof contract.outputSchema !== "object") errors.push("Missing outputSchema object");
  if (contract?.executionEnabled !== false) errors.push("executionEnabled must be false");
  return { valid: errors.length === 0, errors };
}

export function getToolContract(toolId, context = {}) {
  const tool = getToolById(toolId);
  if (!tool) {
    return {
      allowed: false,
      decision: TOOL_GATEWAY_DECISIONS.BLOCKED_NOT_ENABLED,
      reason: "Tool is not registered",
      contract: null,
    };
  }

  const decision = buildToolGatewayDecision({
    requestType: "tool.contract",
    toolId,
    method: tool.allowedMethods[0],
    context: createToolGatewayContext(context),
  });
  if (decision.decision !== TOOL_GATEWAY_DECISIONS.ALLOW_METADATA_ONLY) {
    return { allowed: false, decision: decision.decision, reason: decision.reason, contract: null };
  }
  if (!tool.lazyContractAvailable) {
    return {
      allowed: false,
      decision: TOOL_GATEWAY_DECISIONS.BLOCKED_NOT_ENABLED,
      reason: "Selected tool contract is not available yet",
      contract: null,
    };
  }

  const fullPath = safeContractPath(tool.contractPath);
  if (!fullPath || !existsSync(fullPath)) {
    return {
      allowed: false,
      decision: TOOL_GATEWAY_DECISIONS.BLOCKED_NOT_ENABLED,
      reason: "Selected tool contract file is not available",
      contract: null,
    };
  }
  const contract = JSON.parse(readFileSync(fullPath, "utf8"));
  const validation = validateToolContract(contract);
  if (!validation.valid) {
    return { allowed: false, decision: TOOL_GATEWAY_DECISIONS.DENY, reason: validation.errors.join("; "), contract: null };
  }

  return { allowed: true, decision: decision.decision, reason: decision.reason, contract };
}
