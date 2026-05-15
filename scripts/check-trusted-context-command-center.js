import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildTrustedContextPacket, validateTrustedContextPacket } from "../trusted-context/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/trusted-context-command-center-report.md");
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
const vmSource = read("dashboard/src/data/commandCenterViewModel.js");
const pageSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const testSource = read("dashboard/tests/routes.spec.js");
const packet = buildTrustedContextPacket({ mode: "local-private", scope: "PROJECT_CHANGE" });

addCheck("Route registered", routeSource.includes("/command-center/context") && routeSource.includes("Data & Context Center"));
addCheck("Tabs registered", ["Data Sources", "System of Record", "Trust Scores", "Freshness & Lineage", "Context Packet Preview", "Exclusions / Blocks"].every((label) => tabsSource.includes(label)));
addCheck("View model includes trusted context", vmSource.includes("contextCenter") && vmSource.includes("trustedContextPacket"));
addCheck("Page renders trusted context center", pageSource.includes("function DataContextCenterPage") && pageSource.includes("Raw content: Hidden"));
addCheck(
  "Primary UI avoids raw dumps",
  !pageSource.includes("JSON.stringify(context") && !pageSource.includes("<pre>"),
);
addCheck("Packet preview remains safe", validateTrustedContextPacket(packet).ok && packet.rawContentIncluded === false);
addCheck("Playwright coverage", testSource.includes("Data and Context Center shows trusted context tabs without raw dumps"));
addCheck("Package script exists", packageJson.scripts?.["check:trusted-context-command-center"] === "node scripts/check-trusted-context-command-center.js");
addCheck("P47.5 complete", statusById.get("P47.5")?.status === "complete");
addCheck("P47.6 status visible", ["in_progress", "complete"].includes(statusById.get("P47.6")?.status));
addCheck("P47.7 next", phaseStatus.nextPhase === "P47.7" || statusById.get("P47.6")?.nextPhase === "P47.7");
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");

const failed = checks.filter((check) => !check.ok);
const report = `# Trusted Context Command Center Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P47.6 - Command Center Data / Context Center

## Summary
- Route: /command-center/context
- Page title: Data & Context Center
- Packet preview raw content included: false
- Runtime agent injection enabled: false
- Provider/tool/worker dispatch enabled: false
- DB writes enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Next Phase
P47.7 - Tests + Docs + Final Validation
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Trusted Context Command Center Check\n=========================================");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
