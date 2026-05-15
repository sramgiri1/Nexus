import { getDataSourceRegistry } from "./dataSourceRegistry.js";

export const FRESHNESS_STATUSES = [
  "fresh",
  "stale_pending_validation",
  "invalidated_by_change",
  "unknown",
  "unavailable",
];

const freshnessOverrides = new Map();

function defaultStatusForSource(source) {
  if (!source?.sourceExists) return "unavailable";
  if (!source.freshnessPolicy) return "unknown";
  if (source.freshnessPolicy === "manual_verified") return "unknown";
  return "fresh";
}

export function evaluateFreshness(source, context = {}) {
  const override = freshnessOverrides.get(source.sourceId);
  const status = override?.status || defaultStatusForSource(source);
  const warnings = [];
  if (status !== "fresh") warnings.push(`Source freshness is ${status}.`);
  if (context.changedSources?.includes(source.sourceId)) warnings.push("Source changed in the current context.");
  return {
    sourceId: source.sourceId,
    status: context.changedSources?.includes(source.sourceId) ? "stale_pending_validation" : status,
    freshnessPolicy: source.freshnessPolicy || "unknown",
    evaluatedAt: new Date().toISOString(),
    reason: override?.reason || (source.sourceExists ? "Metadata-only freshness evaluation." : "Source path is unavailable or pattern-based."),
    redacted: true,
    warnings,
  };
}

export function evaluateSourceFreshness(sources = getDataSourceRegistry().sources, context = {}) {
  return sources.map((source) => evaluateFreshness(source, context));
}

export function markSourceStale(sourceId, reason = "Manual stale marker") {
  const record = {
    sourceId,
    status: "stale_pending_validation",
    reason,
    updatedAt: new Date().toISOString(),
    redacted: true,
  };
  freshnessOverrides.set(sourceId, record);
  return record;
}

export function getFreshnessStatus(sourceId) {
  const source = getDataSourceRegistry().sources.find((item) => item.sourceId === sourceId);
  if (!source) {
    return {
      sourceId,
      status: "unknown",
      reason: "Source is not registered.",
      redacted: true,
    };
  }
  return evaluateFreshness(source);
}

export function validateFreshnessRecord(record) {
  const errors = [];
  if (!record?.sourceId) errors.push("sourceId is required");
  if (!FRESHNESS_STATUSES.includes(record?.status)) errors.push(`Invalid freshness status: ${record?.status}`);
  if (record?.redacted !== true) errors.push("Freshness records must be redacted");
  return { ok: errors.length === 0, errors };
}
