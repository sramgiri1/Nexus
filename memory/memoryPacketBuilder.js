import { getSafeMemoryFixtures } from "./memoryFixtures.js";
import { normalizeMemoryBudget, summarizeMemoryBudget } from "./memoryBudget.js";
import { selectMemoryItems } from "./memorySelection.js";

export function buildMemoryPacket(input = {}) {
  const budget = normalizeMemoryBudget(input.memoryBudget || {});
  const sourceItems = Array.isArray(input.memoryItems) ? input.memoryItems : getSafeMemoryFixtures();
  const selection = selectMemoryItems(sourceItems, input);
  const included = [];
  const inclusionReasons = {};
  let summaryCharacters = 0;

  for (const candidate of selection.eligible) {
    const itemLength = String(candidate.item.summary || "").length;
    if (included.length >= budget.maxItems || summaryCharacters + itemLength > budget.maxSummaryCharacters) {
      selection.excludedMemory.push({
        memoryId: candidate.item.memoryId,
        reasons: ["Memory budget exceeded"],
      });
      continue;
    }
    included.push(candidate.item);
    inclusionReasons[candidate.item.memoryId] = candidate.reasons;
    summaryCharacters += itemLength;
  }

  const freshnessWarnings = included
    .filter((item) => item.freshness !== "fresh")
    .map((item) => `${item.memoryId}: freshness is ${item.freshness}`);

  const classificationSummary = included.reduce((summary, item) => {
    summary[item.classification] = (summary[item.classification] || 0) + 1;
    return summary;
  }, {});

  return {
    packetVersion: "1.0",
    generatedAt: new Date().toISOString(),
    scope: input.scope || "project",
    projectId: input.projectId || "",
    missionId: input.missionId || "",
    taskId: input.taskId || "",
    agentId: input.agentId || "",
    capabilityId: input.capabilityId || "",
    mode: input.mode || "local-private",
    includedMemory: included,
    excludedMemory: selection.excludedMemory,
    inclusionReasons,
    freshness: {
      warnings: freshnessWarnings,
      hasWarnings: freshnessWarnings.length > 0,
    },
    trustWarnings: included.some((item) => item.confidence < 0.75)
      ? ["Some memory has confidence below 0.75"]
      : [],
    tokenBudgetEstimate: summarizeMemoryBudget(included, budget).tokenBudgetEstimate,
    budget: summarizeMemoryBudget(included, budget),
    classificationSummary,
    rawContentIncluded: false,
    providerReady: false,
    runtimeInjectionEnabled: false,
  };
}

export function validateMemoryPacket(packet = {}) {
  const errors = [];
  if (packet.packetVersion !== "1.0") errors.push("packetVersion must be 1.0");
  if (!Array.isArray(packet.includedMemory)) errors.push("includedMemory must be an array");
  if (!Array.isArray(packet.excludedMemory)) errors.push("excludedMemory must be an array");
  if (packet.rawContentIncluded !== false) errors.push("Raw content must not be included");
  if (packet.runtimeInjectionEnabled !== false) errors.push("Runtime injection must be disabled");
  for (const item of packet.includedMemory || []) {
    if (item.projectId && packet.projectId && item.projectId !== packet.projectId) {
      errors.push(`Unrelated project memory included: ${item.memoryId}`);
    }
    if (item.forbiddenModes?.includes(packet.mode)) {
      errors.push(`Forbidden mode memory included: ${item.memoryId}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function summarizeMemoryPacket(packet = {}) {
  return {
    includedCount: packet.includedMemory?.length || 0,
    excludedCount: packet.excludedMemory?.length || 0,
    freshnessWarnings: packet.freshness?.warnings?.length || 0,
    trustWarnings: packet.trustWarnings?.length || 0,
    tokenBudgetEstimate: packet.tokenBudgetEstimate || 0,
    classifications: packet.classificationSummary || {},
  };
}

export function explainMemoryInclusion(packet = {}) {
  return (packet.includedMemory || []).map((item) => ({
    memoryId: item.memoryId,
    summary: item.summary,
    reasons: packet.inclusionReasons?.[item.memoryId] || ["Selected by scoped memory rules"],
  }));
}
