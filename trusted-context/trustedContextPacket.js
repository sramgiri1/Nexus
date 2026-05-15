import { getDataSourceRegistry } from "./dataSourceRegistry.js";
import { evaluateSourceFreshness } from "./contextFreshness.js";
import { createLineageRecord } from "./contextLineage.js";
import { isSourceAllowedForPacket, TRUSTED_CONTEXT_PACKET_POLICY } from "./contextPacketPolicy.js";
import { scoreDataSources } from "./sourceTrustScore.js";

const ALLOWED_PACKET_SCOPES = ["PROJECT_CHANGE", "NEXUS_OS_CHANGE", "CROSS_CUTTING_CHANGE"];

export function createTrustedContextRequest(input = {}) {
  return {
    scope: input.scope || "PROJECT_CHANGE",
    projectId: input.projectId || "private-project",
    missionId: input.missionId || null,
    taskId: input.taskId || null,
    agentId: input.agentId || "NEXUS",
    capabilityId: input.capabilityId || "trusted-context.preview",
    mode: input.mode || "local-private",
    maxSources: input.maxSources || TRUSTED_CONTEXT_PACKET_POLICY.maxSourcesDefault,
    summariesOnly: input.summariesOnly !== false,
  };
}

function sourceScopeMatches(source, request) {
  if (request.scope === "NEXUS_OS_CHANGE") return ["os", "safety", "runtime"].includes(source.scope);
  if (request.scope === "CROSS_CUTTING_CHANGE") return ["os", "portfolio", "project", "safety", "runtime"].includes(source.scope);
  return ["project", "mission", "task", "runtime", "safety", "portfolio"].includes(source.scope);
}

function includedSourceSummary(source, score, freshness) {
  return {
    sourceId: source.sourceId,
    label: source.label,
    type: source.type,
    scope: source.scope,
    systemOfRecord: source.systemOfRecord,
    trustBand: score?.band || "unknown",
    trustScore: score?.score || 0,
    freshnessStatus: freshness?.status || "unknown",
    dataClassification: source.dataClassification,
    summaryOnly: true,
    redacted: true,
  };
}

export function buildTrustedContextPacket(input = {}) {
  const request = createTrustedContextRequest(input);
  const warnings = [];
  const errors = [];
  if (!ALLOWED_PACKET_SCOPES.includes(request.scope)) errors.push(`Invalid context scope: ${request.scope}`);
  if (!TRUSTED_CONTEXT_PACKET_POLICY.allowedModes.includes(request.mode)) errors.push(`Invalid context mode: ${request.mode}`);
  if (!request.summariesOnly) errors.push("P47 trusted context packets must be summaries-only.");

  const sources = getDataSourceRegistry().sources;
  const scores = new Map(scoreDataSources(sources).map((score) => [score.sourceId, score]));
  const freshness = new Map(evaluateSourceFreshness(sources).map((record) => [record.sourceId, record]));
  const includedSources = [];
  const excludedSources = [];

  for (const source of sources) {
    const policyDecision = isSourceAllowedForPacket(source, request);
    const scopeMatch = sourceScopeMatches(source, request);
    if (policyDecision.allowed && scopeMatch && includedSources.length < request.maxSources) {
      includedSources.push(includedSourceSummary(source, scores.get(source.sourceId), freshness.get(source.sourceId)));
    } else {
      excludedSources.push({
        sourceId: source.sourceId,
        label: source.label,
        reasons: [
          ...policyDecision.reasons,
          ...(scopeMatch ? [] : ["Source scope does not match requested context scope."]),
          ...(includedSources.length >= request.maxSources ? ["Packet source limit reached."] : []),
        ],
        redacted: true,
      });
    }
  }

  const lineageRecord = createLineageRecord({
    sourceId: "trusted-context-packet-preview",
    derivedFrom: includedSources.map((source) => source.sourceId),
    generatedBy: "trusted-context-packet-builder",
    projectId: request.projectId,
    scope: request.scope,
    taskId: request.taskId,
  });

  return {
    packetVersion: "1.0",
    scope: request.scope,
    projectId: request.projectId,
    taskId: request.taskId,
    agentId: request.agentId,
    capabilityId: request.capabilityId,
    mode: request.mode,
    includedSources,
    excludedSources,
    trustSummary: {
      high: includedSources.filter((source) => source.trustBand === "high").length,
      medium: includedSources.filter((source) => source.trustBand === "medium").length,
      low: includedSources.filter((source) => source.trustBand === "low").length,
      unavailable: includedSources.filter((source) => source.trustBand === "unavailable").length,
    },
    freshnessSummary: {
      fresh: includedSources.filter((source) => source.freshnessStatus === "fresh").length,
      stale: includedSources.filter((source) => source.freshnessStatus === "stale_pending_validation").length,
      unknown: includedSources.filter((source) => source.freshnessStatus === "unknown").length,
      unavailable: includedSources.filter((source) => source.freshnessStatus === "unavailable").length,
    },
    lineageSummary: {
      lineageId: lineageRecord.lineageId,
      derivedFromCount: lineageRecord.derivedFrom.length,
      redacted: true,
    },
    dataClassification: request.mode === "local-private" ? "internal" : "public-safe",
    rawContentIncluded: false,
    redacted: true,
    warnings,
    errors,
  };
}

export function validateTrustedContextPacket(packet) {
  const errors = [];
  if (packet?.packetVersion !== "1.0") errors.push("packetVersion must be 1.0");
  if (!ALLOWED_PACKET_SCOPES.includes(packet?.scope)) errors.push("Invalid packet scope");
  if (!Array.isArray(packet?.includedSources)) errors.push("includedSources must be an array");
  if (!Array.isArray(packet?.excludedSources)) errors.push("excludedSources must be an array");
  if (packet?.rawContentIncluded !== false) errors.push("rawContentIncluded must be false");
  if (packet?.redacted !== true) errors.push("packet must be redacted");
  if (packet?.mode !== "local-private" && packet?.includedSources?.some((source) => ["local-private", "confidential"].includes(source.dataClassification))) {
    errors.push("demo/public-safe packets cannot include private sources");
  }
  return { ok: errors.length === 0 && (packet.errors || []).length === 0, errors: [...errors, ...(packet.errors || [])] };
}

export function explainContextInclusion(packet) {
  return packet.includedSources.map((source) => `${source.label} included as ${source.trustBand} trust, ${source.freshnessStatus} freshness.`);
}

export function explainContextExclusion(packet) {
  return packet.excludedSources.map((source) => `${source.label} excluded: ${source.reasons.join(" ") || "Not selected."}`);
}

export function summarizeTrustedContextPacket(packet) {
  return {
    scope: packet.scope,
    mode: packet.mode,
    included: packet.includedSources.length,
    excluded: packet.excludedSources.length,
    trustSummary: packet.trustSummary,
    freshnessSummary: packet.freshnessSummary,
    rawContentIncluded: packet.rawContentIncluded,
    redacted: packet.redacted,
  };
}
