const LEASE_STATES = new Set(["preview", "active", "released", "expired", "blocked"]);

function nowMs() {
  return Date.now();
}

function isoFromMs(ms) {
  return new Date(ms).toISOString();
}

function makeLeaseId(queueItemId, workerId) {
  return `lease-${String(queueItemId || "queue-item").replace(/[^a-zA-Z0-9-]/g, "-")}-${String(workerId || "worker").replace(/[^a-zA-Z0-9-]/g, "-")}`;
}

export function createWorkerLease(input = {}) {
  const ttlSeconds = Number.isFinite(input.ttlSeconds) ? input.ttlSeconds : 900;
  const acquiredMs = input.acquiredAt ? Date.parse(input.acquiredAt) : nowMs();
  return {
    leaseId: input.leaseId || makeLeaseId(input.queueItemId, input.workerId),
    queueItemId: input.queueItemId || "",
    workerId: input.workerId || "local-preview-worker",
    workerType: input.workerType || "local-preview",
    leaseState: input.leaseState || "preview",
    acquiredAt: input.acquiredAt || isoFromMs(acquiredMs),
    expiresAt: input.expiresAt || isoFromMs(acquiredMs + ttlSeconds * 1000),
    releasedAt: input.releasedAt || "",
    ttlSeconds,
    executionEnabled: false,
    redacted: true,
    correlationId: input.correlationId || "",
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    errors: Array.isArray(input.errors) ? input.errors : [],
  };
}

export function validateWorkerLease(lease = {}) {
  const errors = [];
  if (!lease.leaseId) errors.push("leaseId is required");
  if (!lease.queueItemId) errors.push("queueItemId is required");
  if (!lease.workerId) errors.push("workerId is required");
  if (!["local-preview", "future-worker"].includes(lease.workerType)) {
    errors.push("workerType must be local-preview or future-worker");
  }
  if (!LEASE_STATES.has(lease.leaseState)) errors.push(`leaseState must be one of: ${[...LEASE_STATES].join(", ")}`);
  if (!lease.acquiredAt) errors.push("acquiredAt is required");
  if (!lease.expiresAt) errors.push("expiresAt is required");
  if (lease.executionEnabled !== false) errors.push("executionEnabled must be false");
  if (lease.redacted !== true) errors.push("redacted must be true");
  if (!Array.isArray(lease.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(lease.errors)) errors.push("errors must be an array");
  return { valid: errors.length === 0, errors };
}

export function acquireLeasePreview(queueItem = {}, workerIdentity = {}, options = {}) {
  const existingLeases = Array.isArray(options.existingLeases) ? options.existingLeases : [];
  const activeLease = existingLeases.find(
    (lease) => lease.queueItemId === queueItem.queueItemId && ["preview", "active"].includes(lease.leaseState),
  );
  if (activeLease) {
    return createWorkerLease({
      queueItemId: queueItem.queueItemId,
      workerId: workerIdentity.workerId || "local-preview-worker",
      workerType: workerIdentity.workerType || "local-preview",
      leaseState: "blocked",
      warnings: [`Queue item already has active lease preview: ${activeLease.leaseId}`],
    });
  }
  return createWorkerLease({
    queueItemId: queueItem.queueItemId,
    workerId: workerIdentity.workerId || "local-preview-worker",
    workerType: workerIdentity.workerType || "local-preview",
    ttlSeconds: options.ttlSeconds,
    correlationId: options.correlationId,
  });
}

export function releaseLeasePreview(lease = {}, reason = "manual_preview_release") {
  return {
    ...createWorkerLease(lease),
    leaseState: "released",
    releasedAt: new Date().toISOString(),
    warnings: [...(lease.warnings || []), `Lease released in preview: ${reason}`],
    executionEnabled: false,
  };
}

export function summarizeLeases(leases = [], options = {}) {
  const now = options.now ? Date.parse(options.now) : nowMs();
  const normalized = leases.map((lease) => {
    const base = createWorkerLease(lease);
    if (base.leaseState !== "released" && Date.parse(base.expiresAt) <= now) {
      return { ...base, leaseState: "expired" };
    }
    return base;
  });
  const byState = normalized.reduce((acc, lease) => {
    acc[lease.leaseState] = (acc[lease.leaseState] || 0) + 1;
    return acc;
  }, {});
  return {
    totalLeases: normalized.length,
    preview: byState.preview || 0,
    active: byState.active || 0,
    released: byState.released || 0,
    expired: byState.expired || 0,
    blocked: byState.blocked || 0,
    executionEnabled: false,
    warning: "Leases are preview records only and do not execute queue items.",
  };
}
