export function listPromotionCandidates(items = [], options = {}) {
  const minConfidence = options.minConfidence || 0.85;
  return items
    .filter((item) => item.redacted === true)
    .filter((item) => item.freshness === "fresh")
    .filter((item) => Number(item.confidence || 0) >= minConfidence)
    .filter((item) => !["session", "task"].includes(item.scope) || item.evidenceIds?.length > 0)
    .map((item) => ({
      memoryId: item.memoryId,
      currentScope: item.scope,
      proposedScope: item.scope === "session" ? "project" : "promotion_candidate",
      reason: "Fresh, redacted, high-confidence memory can be reviewed for promotion.",
      autoPromoted: false,
      approvalRequired: true,
    }));
}
