export const LAZY_TOOL_CONTEXT_POLICY = Object.freeze({
  version: "1.0",
  phase: "P52.5",
  maxContractsPerTask: 3,
  maxToolSummaries: 20,
  allToolSchemasAllowed: false,
  allMcpSchemasAllowed: false,
  selectedContractLoadingRequired: true,
  rawMcpSchemasAllowed: false,
  rawToolContractsAllowed: false,
});

export function enforceLazyContractLoading(context = {}, policy = LAZY_TOOL_CONTEXT_POLICY) {
  const contractCount = Array.isArray(context.contracts) ? context.contracts.length : Number(context.contractCount || 0);
  const toolSummaryCount = Array.isArray(context.toolSummaries)
    ? context.toolSummaries.length
    : Number(context.toolSummaryCount || 0);
  const errors = [];
  const warnings = [];

  if (context.allToolSchemas === true) errors.push("All tool schemas cannot be loaded into context");
  if (context.allMcpSchemas === true) errors.push("All MCP schemas cannot be loaded into context");
  if (context.rawMcpSchemas === true) errors.push("Raw MCP schemas cannot be loaded into primary context");
  if (context.rawToolContracts === true) errors.push("Raw tool contracts cannot be bulk-loaded into primary context");
  if (contractCount > policy.maxContractsPerTask) {
    errors.push(`Too many contracts selected: ${contractCount}. Maximum is ${policy.maxContractsPerTask}`);
  }
  if (toolSummaryCount > policy.maxToolSummaries) {
    warnings.push(`Tool summaries exceed recommended maximum: ${toolSummaryCount}`);
  }

  return {
    allowed: errors.length === 0,
    errors,
    warnings,
    summary: {
      contractCount,
      toolSummaryCount,
      maxContractsPerTask: policy.maxContractsPerTask,
      maxToolSummaries: policy.maxToolSummaries,
    },
  };
}
