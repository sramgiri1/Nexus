const FLAKY_STATUSES = ["no_signal", "suspected", "confirmed", "quarantined_recommended", "needs_more_data"];

export function classifyFlakySignal(signal = {}) {
  if (!signal || (!signal.observedFailures && !signal.observedPasses)) return "no_signal";
  if ((signal.observedFailures || 0) > 0 && (signal.observedPasses || 0) > 0) return "suspected";
  if ((signal.observedFailures || 0) >= 3 && (signal.observedPasses || 0) >= 3) return "confirmed";
  return "needs_more_data";
}

export function buildFlakyTestRecords(testResults = []) {
  if (!Array.isArray(testResults) || testResults.length === 0) {
    return [
      {
        testId: "no-historical-test-evidence",
        suiteId: "unknown",
        scope: "cross_cutting",
        projectId: undefined,
        signalType: "insufficient_history",
        observedFailures: 0,
        observedPasses: 0,
        confidence: "low",
        status: "no_signal",
        recommendedAction: "Collect controlled test evidence before classifying flakiness.",
        evidenceRefs: [],
      },
    ];
  }
  const bySuite = new Map();
  for (const result of testResults) {
    const key = result.suiteId || "unknown";
    const entry = bySuite.get(key) || { passes: 0, failures: 0, refs: [], sample: result };
    if (result.status === "pass") entry.passes += 1;
    if (result.status === "fail") entry.failures += 1;
    if (result.resultId) entry.refs.push(result.resultId);
    bySuite.set(key, entry);
  }
  return [...bySuite.entries()].map(([suiteId, entry]) => {
    const status = classifyFlakySignal({ observedFailures: entry.failures, observedPasses: entry.passes });
    return {
      testId: `flaky-${suiteId}`,
      suiteId,
      scope: entry.sample.scope || entry.sample.osScope ? "os" : "project",
      projectId: entry.sample.projectId,
      signalType: status === "no_signal" ? "insufficient_history" : "mixed_result_history",
      observedFailures: entry.failures,
      observedPasses: entry.passes,
      confidence: status === "confirmed" ? "high" : status === "suspected" ? "medium" : "low",
      status,
      recommendedAction: status === "no_signal" ? "Collect more evidence." : "Review test determinism before relying on this suite.",
      evidenceRefs: entry.refs,
    };
  });
}

export function summarizeFlakyTests(records = []) {
  const statusCounts = Object.fromEntries(FLAKY_STATUSES.map((status) => [status, 0]));
  for (const record of records) statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
  return {
    recordCount: records.length,
    statusCounts,
    executionEnabled: false,
    inferredWithoutEvidence: false,
  };
}

export function recommendFlakyTestActions(records = []) {
  return records.map((record) => ({
    testId: record.testId,
    suiteId: record.suiteId,
    status: record.status,
    recommendedAction: record.recommendedAction,
    executionEnabled: false,
    disabledReason: "Preview-only. NEXUS does not run or quarantine tests in P56.",
  }));
}
