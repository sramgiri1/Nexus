import { existsSync } from "node:fs";
import { join } from "node:path";
import { getDataSourceRegistry } from "./dataSourceRegistry.js";

const ROOT = process.cwd();

export function getTrustBand(score) {
  const value = typeof score === "number" ? score : score?.score;
  if (!value || value <= 0) return "unavailable";
  if (value >= 80) return "high";
  if (value >= 50) return "medium";
  return "low";
}

function pathExists(path) {
  return Boolean(path && !path.includes("*") && existsSync(join(ROOT, path)));
}

export function scoreDataSource(source, options = {}) {
  const warnings = [];
  const explanation = [];
  let score = 0;
  const sourceExists = options.sourceExists ?? source.sourceExists ?? pathExists(source.path);

  if (source.systemOfRecord) {
    score += 30;
    explanation.push("System of record source.");
  }
  if (sourceExists) {
    score += 20;
    explanation.push("Source path exists locally.");
  } else {
    warnings.push("Source path is missing, planned, or pattern-based.");
    score -= 15;
  }
  if (source.owner) {
    score += 10;
  } else {
    warnings.push("Source owner is missing.");
    score -= 10;
  }
  if (source.freshnessPolicy) score += 10;
  else warnings.push("Freshness policy is missing.");
  if (source.redactionRequired) score += 10;
  else warnings.push("Redaction is not required for this source.");
  if (source.lineageRequired) score += 10;
  else warnings.push("Lineage is not required for this source.");
  if (Array.isArray(source.forbiddenModes) && source.forbiddenModes.length > 0) score += 5;
  else warnings.push("Forbidden modes are not configured.");
  if (Array.isArray(source.allowedAgents) && source.allowedAgents.length > 0) score += 5;
  else warnings.push("Allowed agents are not configured.");
  if (options.stale === true) {
    score -= 20;
    warnings.push("Source is stale or pending validation.");
  }
  if (source.owner === "Unknown") {
    score -= 10;
    warnings.push("Unknown owner reduces trust.");
  }
  if (source.dataClassification === "local-private" && !source.forbiddenModes?.includes("public")) {
    score -= 25;
    warnings.push("Sensitive source is not blocked in public mode.");
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  return {
    sourceId: source.sourceId,
    label: source.label,
    score: normalizedScore,
    band: getTrustBand(normalizedScore),
    sourceExists,
    explanation,
    warnings,
    redacted: true,
  };
}

export function scoreDataSources(sources = getDataSourceRegistry().sources, options = {}) {
  return sources.map((source) => scoreDataSource(source, options[source.sourceId] || options));
}

export function explainTrustScore(score) {
  if (!score) return "No trust score is available.";
  const notes = [...(score.explanation || []), ...(score.warnings || [])];
  return `${score.label || score.sourceId}: ${score.band} trust (${score.score}/100). ${notes.join(" ")}`.trim();
}

export function validateTrustScore(score) {
  const errors = [];
  if (!score || typeof score !== "object") errors.push("Score must be an object");
  if (!score?.sourceId) errors.push("sourceId is required");
  if (typeof score?.score !== "number") errors.push("score must be numeric");
  if (!["high", "medium", "low", "unavailable"].includes(score?.band)) errors.push("Invalid trust band");
  if (!Array.isArray(score?.explanation)) errors.push("explanation must be an array");
  if (!Array.isArray(score?.warnings)) errors.push("warnings must be an array");
  if (score?.redacted !== true) errors.push("trust score output must be redacted");
  return { ok: errors.length === 0, errors };
}
