import { enforceLazyContractLoading, LAZY_TOOL_CONTEXT_POLICY } from "./lazyContractPolicy.js";

export function detectAllToolsInContext(payload = {}) {
  const text = JSON.stringify(payload);
  return {
    allToolSchemasDetected: payload.allToolSchemas === true || text.includes('"allToolSchemas":true'),
    allMcpSchemasDetected: payload.allMcpSchemas === true || text.includes('"allMcpSchemas":true'),
    rawMcpSchemasDetected: payload.rawMcpSchemas === true || text.includes('"rawMcpSchemas":true'),
    bulkContractCount: Array.isArray(payload.contracts) ? payload.contracts.length : Number(payload.contractCount || 0),
  };
}

export function summarizeContextBudget(payload = {}, policy = LAZY_TOOL_CONTEXT_POLICY) {
  const detection = detectAllToolsInContext(payload);
  const enforcement = enforceLazyContractLoading(payload, policy);
  return {
    allowed: enforcement.allowed,
    contractCount: enforcement.summary.contractCount,
    toolSummaryCount: enforcement.summary.toolSummaryCount,
    maxContractsPerTask: policy.maxContractsPerTask,
    maxToolSummaries: policy.maxToolSummaries,
    allToolSchemasDetected: detection.allToolSchemasDetected,
    allMcpSchemasDetected: detection.allMcpSchemasDetected,
    rawMcpSchemasDetected: detection.rawMcpSchemasDetected,
    errors: enforcement.errors,
    warnings: enforcement.warnings,
  };
}

export function validateToolContextBudget(payload = {}, policy = LAZY_TOOL_CONTEXT_POLICY) {
  const summary = summarizeContextBudget(payload, policy);
  return {
    valid: summary.allowed,
    errors: summary.errors,
    warnings: summary.warnings,
    summary,
  };
}
