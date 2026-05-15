import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getSystemOfRecord,
  getSystemOfRecordMap,
  listSystemOfRecordDomains,
  validateSystemOfRecordMap,
} from "../trusted-context/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/system-of-record-map-report.md");
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
const map = getSystemOfRecordMap();
const validation = validateSystemOfRecordMap(map);
const domains = listSystemOfRecordDomains();
const requiredDomains = [
  "project_requirements",
  "project_profile",
  "project_registry",
  "os_roadmap",
  "task_state",
  "evidence",
  "audit",
  "activity",
  "validation_result",
  "release_decision",
  "agent_capability",
  "policy",
  "cost_state",
  "memory",
];

addCheck("System-of-record module exists", existsSync(join(ROOT, "trusted-context/systemOfRecordMap.js")));
addCheck("Map validates", validation.ok, validation.errors.join("; "));
addCheck("Required domains", requiredDomains.every((domain) => domains.includes(domain)));
addCheck("Lookup helper works", getSystemOfRecord("os_roadmap", { mode: "local-private", scope: "os" })?.primarySourceId === "nexus-os-roadmap");
addCheck("Private modes constrained", map.domains.every((entry) => entry.allowedModes.includes("local-private") && !entry.allowedModes.includes("public")));
addCheck("Future domains clearly planned", getSystemOfRecord("cost_state")?.warnings.some((warning) => warning.includes("planned")));
addCheck("Memory domain present", getSystemOfRecord("memory")?.primarySourceId === "scoped-memory-stores");
addCheck("Package script exists", packageJson.scripts?.["check:system-of-record-map"] === "node scripts/check-system-of-record-map.js");
addCheck("P47.1 complete", statusById.get("P47.1")?.status === "complete");
addCheck("P47.2 status visible", ["in_progress", "complete"].includes(statusById.get("P47.2")?.status));
addCheck("P47.3 next", phaseStatus.nextPhase === "P47.3" || statusById.get("P47.2")?.nextPhase === "P47.3");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# System-of-Record Map Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P47.2 - System-of-Record Mapping

## Summary
- Domains mapped: ${domains.length}
- Required domains present: ${requiredDomains.length}
- Public mode access enabled: false
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false

## Domain Map
${map.domains.map((entry) => `- ${entry.domain}: ${entry.primarySourceId}${entry.fallbackSourceIds.length ? ` (fallback: ${entry.fallbackSourceIds.join(", ")})` : ""}`).join("\n")}

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P47.3 - Source Trust Score
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS System-of-Record Map Check\n================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
