import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/memory-center-ui-report.md");
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
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
const tabsSource = read("dashboard/src/data/commandCenterTabs.js");
const pageSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const vmSource = read("dashboard/src/data/commandCenterViewModel.js");
const testSource = read("dashboard/tests/routes.spec.js");

addCheck("Memory Center route", routeSource.includes("/command-center/memory") && routeSource.includes("Memory Center"));
addCheck("Memory Center tabs", ["Overview", "OS Memory", "Project Memory", "Agent Memory", "Task Memory", "Session Memory", "Stale Memory", "Promotion Candidates", "Packets"].every((label) => tabsSource.includes(label)));
addCheck("Memory Center page", pageSource.includes("function MemoryCenterPage") && pageSource.includes("Memory Scope Context"));
addCheck("Read-only safety copy", pageSource.includes("Runtime injection disabled") && pageSource.includes("Raw content: Hidden"));
addCheck("View model memory summary", vmSource.includes("memoryCenter") && vmSource.includes("buildMemoryPacket"));
addCheck("No raw source or prompt UI", !pageSource.includes("raw prompt contents") && !pageSource.includes("raw source content"));
addCheck("Demo boundary", !routeSource.includes("DemoApp") && !vmSource.includes("DemoApp"));
addCheck("Playwright coverage", testSource.includes("Memory Center shows read-only scoped memory tabs and packet preview"));
addCheck("Package script exists", packageJson.scripts?.["check:memory-center-ui"] === "node scripts/check-memory-center-ui.js");
addCheck("P46.6 status visible", ["in_progress", "complete"].includes(statusById.get("P46.6")?.status));
addCheck("P46.7 next", phaseStatus.nextPhase === "P46.7" || statusById.get("P46.6")?.nextPhase === "P46.7");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Memory Center UI Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P46.6 - Command Center Memory Center

## Summary
- Route: /command-center/memory
- Tabs: Overview, OS Memory, Project Memory, Agent Memory, Task Memory, Session Memory, Stale Memory, Promotion Candidates, Packets
- Runtime injection enabled: false
- Memory editing enabled: false
- Raw memory payloads visible: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P46.7 - Tests + Docs + Final Validation
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Memory Center UI Check\n============================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
