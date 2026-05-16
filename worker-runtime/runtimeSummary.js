import { summarizeHeartbeats } from "./heartbeatModel.js";
import { summarizeLeases } from "./leaseModel.js";
import { summarizeWorkerQueue } from "./workerQueue.js";

function summarizeRetryTimeoutState(items = []) {
  return {
    totalItems: items.length,
    modeled: false,
    executionEnabled: false,
    warning: "Retry/timeout modeling is added in P60.4.",
  };
}

function summarizeDeadLetterQueue(items = []) {
  return {
    totalItems: items.length,
    modeled: false,
    requeueEnabled: false,
    executionEnabled: false,
    warning: "Dead-letter queue modeling is added in P60.5.",
  };
}

export function buildWorkerRuntimeSummary(input = {}) {
  const queue = summarizeWorkerQueue(input.queueItems || []);
  const leases = summarizeLeases(input.leases || []);
  const heartbeats = summarizeHeartbeats(input.heartbeats || []);
  const retryTimeout = summarizeRetryTimeoutState(input.retryItems || []);
  const deadLetter = summarizeDeadLetterQueue(input.deadLetterItems || []);
  return {
    phase: "P60",
    runtimeMode: "preview_only",
    executionEnabled: false,
    providerCallsAllowed: false,
    toolCallsAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    queue,
    leases,
    heartbeats,
    retryTimeout,
    deadLetter,
    warning: "P60 defines runtime primitives only. It does not execute agents, tools, providers, or project mutations yet.",
  };
}
