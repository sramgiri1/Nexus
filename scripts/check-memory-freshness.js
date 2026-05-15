import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  assessMemoryFreshness,
  buildMemoryInvalidationPlan,
  getSafeMemoryFixtures,
  listPromotionCandidates,
  markMemoryStale,
} from "../memory/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/memory-freshness-report.md");
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
const fixtures = getSafeMemoryFixtures();
const fresh = assessMemoryFreshness(fixtures[0], { now: "2026-05-15T00:00:00.000Z" });
const stale = assessMemoryFreshness(fixtures[1], { changedProjectId: "private-project" });
const expired = assessMemoryFreshness({ ...fixtures[3], expiresAt: "2020-01-01T00:00:00.000Z" }, { now: "2026-05-15T00:00:00.000Z" });
const staleCopy = markMemoryStale(fixtures[2], "Validation result changed");
const invalidationPlan = buildMemoryInvalidationPlan({ changeScope: "PROJECT_CHANGE", projectId: "private-project" }, fixtures);
const promotionCandidates = listPromotionCandidates(fixtures);

addCheck("Freshness modules exist", ["memory/memoryFreshness.js", "memory/memoryInvalidation.js", "memory/memoryPromotion.js"].every((path) => existsSync(join(ROOT, path))));
addCheck("Fresh state assessed", fresh.freshness === "fresh" && fresh.stale === false);
addCheck("Project change marks stale", stale.freshness === "stale_pending_validation" && stale.stale === true);
addCheck("Expired state assessed", expired.freshness === "expired");
addCheck("Mark stale helper", staleCopy.freshness === "stale_pending_validation" && staleCopy.staleReason);
addCheck("Invalidation plan", invalidationPlan.affected.length >= 3 && invalidationPlan.autoInvalidationEnabled === false);
addCheck("Promotion candidates are proposals", promotionCandidates.length >= 1 && promotionCandidates.every((candidate) => candidate.autoPromoted === false && candidate.approvalRequired === true));
addCheck("No raw private content in reports", !read("reports/memory-freshness-report.md").includes("raw private source"));
addCheck("Package script exists", packageJson.scripts?.["check:memory-freshness"] === "node scripts/check-memory-freshness.js");
addCheck("P46.5 status visible", ["in_progress", "complete"].includes(statusById.get("P46.5")?.status));
addCheck("P46.6 next", phaseStatus.nextPhase === "P46.6" || statusById.get("P46.5")?.nextPhase === "P46.6");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Memory Freshness Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P46.5 - Memory Freshness + Staleness

## Summary
- Freshness states: fresh, stale_pending_validation, expired, invalidated, unknown
- Invalidation affected items: ${invalidationPlan.affected.length}
- Promotion candidates: ${promotionCandidates.length}
- Auto-promotion enabled: false
- Runtime injection enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P46.6 - Command Center Memory Center
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Memory Freshness Check\n============================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
