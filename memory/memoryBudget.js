export const DEFAULT_MEMORY_BUDGET = {
  maxItems: 6,
  maxSummaryCharacters: 1800,
  reservedForInstructions: 800,
};

export function estimateMemoryTokens(text = "") {
  return Math.ceil(String(text).length / 4);
}

export function normalizeMemoryBudget(input = {}) {
  return {
    maxItems: Number.isFinite(input.maxItems) ? input.maxItems : DEFAULT_MEMORY_BUDGET.maxItems,
    maxSummaryCharacters: Number.isFinite(input.maxSummaryCharacters)
      ? input.maxSummaryCharacters
      : DEFAULT_MEMORY_BUDGET.maxSummaryCharacters,
    reservedForInstructions: Number.isFinite(input.reservedForInstructions)
      ? input.reservedForInstructions
      : DEFAULT_MEMORY_BUDGET.reservedForInstructions,
  };
}

export function summarizeMemoryBudget(items = [], budget = DEFAULT_MEMORY_BUDGET) {
  const summaryCharacters = items.reduce((total, item) => total + String(item.summary || "").length, 0);
  return {
    itemCount: items.length,
    maxItems: budget.maxItems,
    summaryCharacters,
    maxSummaryCharacters: budget.maxSummaryCharacters,
    tokenBudgetEstimate: estimateMemoryTokens(items.map((item) => item.summary).join("\n")),
    reservedForInstructions: budget.reservedForInstructions,
    withinBudget: items.length <= budget.maxItems && summaryCharacters <= budget.maxSummaryCharacters,
  };
}
