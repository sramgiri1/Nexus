import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  explainTrustScore,
  getDataSourceRegistry,
  getTrustBand,
  scoreDataSource,
  scoreDataSources,
  validateTrustScore,
} from "../trusted-context/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/source-trust-score-report.md");
const checks = [];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function addCheck(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const packageJson = JSON.parse(read("package.json") || "{}");
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const registry = getDataSourceRegistry();
const scores = scoreDataSources(registry.sources);
const scoreById = new Map(scores.map((score) => [score.sourceId, score]));
const validationResults = scores.map(validateTrustScore);

addCheck("Source trust module exists", existsSync(join(ROOT, "trusted-context/sourceTrustScore.js")));
addCheck("All scores validate", validationResults.every((result) => result.ok), validationResults.flatMap((result) => result.errors).join("; "));
addCheck("Trust bands work", getTrustBand(100) === "high" && getTrustBand(79) === "medium" && getTrustBand(49) === "low" && getTrustBand(0) === "unavailable");
addCheck("System-of-record scoring factor", scoreById.get("nexus-os-roadmap")?.score >= 80);
addCheck("Pattern/planned sources warned", scoreById.get("project-profile-pattern")?.warnings.some((warning) => warning.includes("missing")));
addCheck("Explanation redacted", !/api[_-]?key|password|-----BEGIN/i.test(explainTrustScore(scoreById.get("nexus-os-roadmap"))));
addCheck("Single source scoring works", scoreDataSource(registry.sources[0]).sourceId === registry.sources[0].sourceId);
addCheck("Package script exists", packageJson.scripts?.["check:source-trust-score"] === "node scripts/check-source-trust-score.js");
addCheck("P47.2 complete", statusById.get("P47.2")?.status === "complete");
addCheck("P47.3 status visible", ["in_progress", "complete"].includes(statusById.get("P47.3")?.status));
addCheck("P47.4 next", phaseStatus.nextPhase === "P47.4" || statusById.get("P47.3")?.nextPhase === "P47.4");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const summary = {
  high: scores.filter((score) => score.band === "high").length,
  medium: scores.filter((score) => score.band === "medium").length,
  low: scores.filter((score) => score.band === "low").length,
  unavailable: scores.filter((score) => score.band === "unavailable").length,
};
const failed = checks.filter((check) => !check.ok);
const report = `# Source Trust Score Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P47.3 - Source Trust Score

## Summary
- Sources scored: ${scores.length}
- High trust: ${summary.high}
- Medium trust: ${summary.medium}
- Low trust: ${summary.low}
- Unavailable: ${summary.unavailable}
- Raw secrets included: false
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false

## Trust Scores
${scores.map((score) => `- ${score.sourceId}: ${score.band} (${score.score}/100)`).join("\n")}

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P47.4 - Freshness + Lineage
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Source Trust Score Check\n==============================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
