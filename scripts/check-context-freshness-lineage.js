import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createLineageRecord,
  evaluateFreshness,
  evaluateSourceFreshness,
  getDataSourceById,
  getDataSourceRegistry,
  getFreshnessStatus,
  linkLineage,
  markSourceStale,
  traceLineage,
  validateFreshnessRecord,
  validateLineageRecord,
} from "../trusted-context/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/context-freshness-lineage-report.md");
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
const freshness = evaluateSourceFreshness(registry.sources);
const staleRecord = markSourceStale("nexus-os-roadmap", "Roadmap changed during P47.4 validation.");
const status = getFreshnessStatus("nexus-os-roadmap");
const lineage = createLineageRecord({
  sourceId: "nexus-os-roadmap",
  derivedFrom: ["os-phase-status"],
  generatedBy: "check-context-freshness-lineage",
  scope: "os",
  activityId: "p47-4-validation",
});
const link = linkLineage("os-phase-status", lineage.lineageId, "supports");
const trace = traceLineage("nexus-os-roadmap");

addCheck("Freshness and lineage modules exist", ["trusted-context/contextFreshness.js", "trusted-context/contextLineage.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Freshness records validate", freshness.every((record) => validateFreshnessRecord(record).ok));
addCheck("Stale marker works", validateFreshnessRecord(staleRecord).ok && status.status === "stale_pending_validation");
addCheck("Changed source is stale", evaluateFreshness(getDataSourceById("os-phase-status"), { changedSources: ["os-phase-status"] }).status === "stale_pending_validation");
addCheck("Lineage record validates", validateLineageRecord(lineage).ok);
addCheck("Lineage link is redacted", link.redacted === true && link.relationship === "supports");
addCheck("Trace lineage works", trace.records.length >= 1 && trace.redacted === true);
addCheck("No raw payloads", !JSON.stringify({ freshness, lineage, trace }).includes("raw"));
addCheck("Package script exists", packageJson.scripts?.["check:context-freshness-lineage"] === "node scripts/check-context-freshness-lineage.js");
addCheck("P47.3 complete", statusById.get("P47.3")?.status === "complete");
addCheck("P47.4 status visible", ["in_progress", "complete"].includes(statusById.get("P47.4")?.status));
addCheck("P47.5 next", phaseStatus.nextPhase === "P47.5" || statusById.get("P47.4")?.nextPhase === "P47.5");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const summary = {
  fresh: freshness.filter((record) => record.status === "fresh").length,
  stale: freshness.filter((record) => record.status === "stale_pending_validation").length,
  unknown: freshness.filter((record) => record.status === "unknown").length,
  unavailable: freshness.filter((record) => record.status === "unavailable").length,
};
const failed = checks.filter((check) => !check.ok);
const report = `# Context Freshness + Lineage Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P47.4 - Freshness + Lineage

## Summary
- Sources evaluated: ${freshness.length}
- Fresh: ${summary.fresh}
- Stale pending validation: ${summary.stale}
- Unknown: ${summary.unknown}
- Unavailable: ${summary.unavailable}
- Lineage records sampled: ${trace.records.length}
- Raw content included: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P47.5 - Trusted Context Packet
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Context Freshness + Lineage Check\n=======================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
