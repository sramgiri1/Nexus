const HEARTBEAT_STATUSES = new Set(["healthy", "stale", "missed", "stopped", "unknown"]);

function heartbeatId(input = {}) {
  const base = `${input.workerId || "worker"}-${input.leaseId || "lease"}-${input.emittedAt || Date.now()}`;
  return `heartbeat-${String(base).replace(/[^a-zA-Z0-9-]/g, "-")}`;
}

export function createHeartbeat(input = {}) {
  const emittedAt = input.emittedAt || new Date().toISOString();
  return {
    heartbeatId: input.heartbeatId || heartbeatId({ ...input, emittedAt }),
    workerId: input.workerId || "local-preview-worker",
    leaseId: input.leaseId || "",
    queueItemId: input.queueItemId || "",
    status: input.status || "healthy",
    emittedAt,
    lastSeenAt: input.lastSeenAt || emittedAt,
    intervalSeconds: Number.isFinite(input.intervalSeconds) ? input.intervalSeconds : 30,
    redacted: true,
    correlationId: input.correlationId || "",
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    errors: Array.isArray(input.errors) ? input.errors : [],
  };
}

export function validateHeartbeat(heartbeat = {}) {
  const errors = [];
  if (!heartbeat.heartbeatId) errors.push("heartbeatId is required");
  if (!heartbeat.workerId) errors.push("workerId is required");
  if (!heartbeat.leaseId) errors.push("leaseId is required");
  if (!heartbeat.queueItemId) errors.push("queueItemId is required");
  if (!HEARTBEAT_STATUSES.has(heartbeat.status)) {
    errors.push(`status must be one of: ${[...HEARTBEAT_STATUSES].join(", ")}`);
  }
  if (!heartbeat.emittedAt) errors.push("emittedAt is required");
  if (!heartbeat.lastSeenAt) errors.push("lastSeenAt is required");
  if (!Number.isFinite(heartbeat.intervalSeconds) || heartbeat.intervalSeconds <= 0) {
    errors.push("intervalSeconds must be a positive number");
  }
  if (heartbeat.redacted !== true) errors.push("redacted must be true");
  if (!Array.isArray(heartbeat.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(heartbeat.errors)) errors.push("errors must be an array");
  return { valid: errors.length === 0, errors };
}

export function detectStaleHeartbeats(heartbeats = [], options = {}) {
  const staleAfterSeconds = Number.isFinite(options.staleAfterSeconds) ? options.staleAfterSeconds : 90;
  const now = options.now ? Date.parse(options.now) : Date.now();
  return heartbeats.map((heartbeat) => {
    const normalized = createHeartbeat(heartbeat);
    const ageSeconds = Math.max(0, Math.floor((now - Date.parse(normalized.lastSeenAt)) / 1000));
    if (normalized.status === "stopped") return normalized;
    if (ageSeconds > staleAfterSeconds) return { ...normalized, status: "stale" };
    return normalized;
  });
}

export function summarizeHeartbeats(heartbeats = [], options = {}) {
  const normalized = detectStaleHeartbeats(heartbeats, options);
  const byStatus = normalized.reduce((acc, heartbeat) => {
    acc[heartbeat.status] = (acc[heartbeat.status] || 0) + 1;
    return acc;
  }, {});
  return {
    totalHeartbeats: normalized.length,
    healthy: byStatus.healthy || 0,
    stale: byStatus.stale || 0,
    missed: byStatus.missed || 0,
    stopped: byStatus.stopped || 0,
    unknown: byStatus.unknown || 0,
    executionEnabled: false,
    warning: "Heartbeat records are preview-only and do not keep real worker processes alive.",
  };
}
