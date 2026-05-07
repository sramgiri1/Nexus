function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

function incrementCount(map, key) {
  if (!key) return;
  map[key] = (map[key] || 0) + 1;
}

function signatureForArgumentShape(argumentShape) {
  if (!argumentShape || typeof argumentShape !== "object" || Array.isArray(argumentShape)) {
    return typeof argumentShape;
  }

  return Object.keys(argumentShape)
    .sort()
    .map((key) => `${key}:${signatureForArgumentShape(argumentShape[key])}`)
    .join("|");
}

export function createEmptyBaseline(agentId = "") {
  return {
    agentId: normalizeString(agentId),
    samples: 0,
    toolCallCounts: {},
    actionTypeCounts: {},
    runtimeCounts: {},
    providerCounts: {},
    responseClassCounts: {},
    argumentShapeCounts: {},
    maxObservedChainDepth: 0,
    maxObservedEgressBytes: 0,
    maxObservedCostUsd: 0,
    lastUpdatedAt: "",
  };
}

export function classifyBehaviorEvent(event = {}) {
  return {
    agentId: normalizeString(event.agentId),
    agentVersion: normalizeString(event.agentVersion) || "unknown",
    actionType: normalizeString(event.actionType),
    toolName: normalizeString(event.toolName),
    runtime: normalizeString(event.runtime),
    provider: normalizeString(event.provider),
    argumentShape:
      event.argumentShape && typeof event.argumentShape === "object"
        ? event.argumentShape
        : {},
    argumentShapeSignature: signatureForArgumentShape(event.argumentShape || {}),
    responseClass: normalizeString(event.responseClass) || "unknown",
    chainDepth: safeNumber(event.chainDepth),
    egressBytes: safeNumber(event.egressBytes),
    costUsd: safeNumber(event.costUsd),
    result: normalizeString(event.result) || "INFO",
    timestamp: normalizeString(event.timestamp) || new Date().toISOString(),
  };
}

export function updateBehaviorBaseline(baseline = {}, event = {}) {
  const normalizedBaseline = {
    ...createEmptyBaseline(baseline.agentId || event.agentId),
    ...baseline,
    toolCallCounts: { ...(baseline.toolCallCounts || {}) },
    actionTypeCounts: { ...(baseline.actionTypeCounts || {}) },
    runtimeCounts: { ...(baseline.runtimeCounts || {}) },
    providerCounts: { ...(baseline.providerCounts || {}) },
    responseClassCounts: { ...(baseline.responseClassCounts || {}) },
    argumentShapeCounts: { ...(baseline.argumentShapeCounts || {}) },
  };
  const normalizedEvent = classifyBehaviorEvent(event);

  normalizedBaseline.agentId =
    normalizedBaseline.agentId || normalizedEvent.agentId;
  normalizedBaseline.samples += 1;
  incrementCount(normalizedBaseline.toolCallCounts, normalizedEvent.toolName);
  incrementCount(normalizedBaseline.actionTypeCounts, normalizedEvent.actionType);
  incrementCount(normalizedBaseline.runtimeCounts, normalizedEvent.runtime);
  incrementCount(normalizedBaseline.providerCounts, normalizedEvent.provider);
  incrementCount(
    normalizedBaseline.responseClassCounts,
    normalizedEvent.responseClass
  );
  incrementCount(
    normalizedBaseline.argumentShapeCounts,
    normalizedEvent.argumentShapeSignature
  );

  normalizedBaseline.maxObservedChainDepth = Math.max(
    normalizedBaseline.maxObservedChainDepth || 0,
    normalizedEvent.chainDepth
  );
  normalizedBaseline.maxObservedEgressBytes = Math.max(
    normalizedBaseline.maxObservedEgressBytes || 0,
    normalizedEvent.egressBytes
  );
  normalizedBaseline.maxObservedCostUsd = Math.max(
    normalizedBaseline.maxObservedCostUsd || 0,
    normalizedEvent.costUsd
  );
  normalizedBaseline.lastUpdatedAt = normalizedEvent.timestamp;

  return normalizedBaseline;
}

export function compareBehaviorToBaseline(baseline = {}, event = {}) {
  const normalizedBaseline = {
    ...createEmptyBaseline(baseline.agentId || event.agentId),
    ...baseline,
  };
  const normalizedEvent = classifyBehaviorEvent(event);
  const reasons = [];
  let status = "NORMAL";

  function addReason(nextStatus, reason) {
    reasons.push(reason);
    if (nextStatus === "ESCALATE") {
      status = "ESCALATE";
      return;
    }

    if (status !== "ESCALATE") {
      status = "WARNING";
    }
  }

  if (
    normalizedBaseline.samples >= 5 &&
    normalizedEvent.toolName &&
    !normalizedBaseline.toolCallCounts?.[normalizedEvent.toolName]
  ) {
    addReason("WARNING", "new_unseen_tool");
  }

  if (
    normalizedBaseline.samples >= 5 &&
    normalizedEvent.provider &&
    !normalizedBaseline.providerCounts?.[normalizedEvent.provider]
  ) {
    addReason("WARNING", "provider_change");
  }

  if (
    normalizedBaseline.samples >= 5 &&
    normalizedEvent.runtime &&
    !normalizedBaseline.runtimeCounts?.[normalizedEvent.runtime]
  ) {
    addReason("WARNING", "runtime_change");
  }

  if (
    normalizedEvent.chainDepth >
    (normalizedBaseline.maxObservedChainDepth || 0) + 2
  ) {
    addReason("WARNING", "chain_depth_increase");
  }

  if (
    normalizedBaseline.maxObservedEgressBytes > 0 &&
    normalizedEvent.egressBytes >
      normalizedBaseline.maxObservedEgressBytes * 3
  ) {
    addReason("ESCALATE", "egress_spike");
  }

  if (
    normalizedBaseline.maxObservedCostUsd > 0 &&
    normalizedEvent.costUsd >
      normalizedBaseline.maxObservedCostUsd * 3
  ) {
    addReason("ESCALATE", "cost_spike");
  }

  return {
    status,
    reasons,
    baselineSamples: normalizedBaseline.samples || 0,
  };
}
