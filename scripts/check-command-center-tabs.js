import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/command-center-tabs-report.md");

const sections = {
  commandTabs: true,
  scopeSwitcher: true,
  projectSwitcher: true,
  tabConfig: true,
  missionControlTabShell: true,
  multiProjectShell: true,
  demoBoundary: true,
  playwrightCoverage: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formattingReadability: true,
};

const failures = [];

function readFile(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function check(condition, section, message) {
  if (!condition) {
    sections[section] = false;
    failures.push(message);
  }
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

console.log("\nNEXUS Command Center Tabs Check\n===============================\n");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

const componentSource = readFile("dashboard/src/components/command-center-v2/CommandTabs.jsx");
const scopeSource = readFile("dashboard/src/components/command-center-v2/ScopeSwitcher.jsx");
const projectSource = readFile("dashboard/src/components/command-center-v2/ProjectSwitcher.jsx");
const tabConfigSource = readFile("dashboard/src/data/commandCenterTabs.js");
const commandCenterSource = readFile("dashboard/src/pages/CommandCenterV2.jsx");
const viewModelSource = readFile("dashboard/src/data/commandCenterViewModel.js");
const testSource = readFile("dashboard/tests/routes.spec.js");
const uxDocSource = readFile("docs/architecture/COMMAND_CENTER_TABBED_NAVIGATION.md");
const phaseStatusSource = readFile("os-roadmap/phase-status.json");

check(componentSource.includes("export function CommandTabs"), "commandTabs", "CommandTabs export missing");
check(componentSource.includes("role=\"tablist\""), "commandTabs", "CommandTabs must render a tablist");
check(componentSource.includes("role=\"tab\""), "commandTabs", "CommandTabs must render button tabs with tab role");
check(componentSource.includes("aria-disabled"), "commandTabs", "Disabled tabs must expose aria-disabled");

check(scopeSource.includes("export function ScopeSwitcher"), "scopeSwitcher", "ScopeSwitcher export missing");
for (const label of ["Portfolio", "Project", "NEXUS OS"]) {
  check(scopeSource.includes(label), "scopeSwitcher", `ScopeSwitcher missing label: ${label}`);
}

check(projectSource.includes("export function ProjectSwitcher"), "projectSwitcher", "ProjectSwitcher export missing");
check(projectSource.includes("Private Project"), "projectSwitcher", "ProjectSwitcher must use Private Project local-private fallback");
check(projectSource.includes("Project Registry planned"), "projectSwitcher", "ProjectSwitcher must explain Project Registry placeholder");

let tabConfig = {};
try {
  tabConfig = await import("../dashboard/src/data/commandCenterTabs.js");
} catch (error) {
  check(false, "tabConfig", `Could not import commandCenterTabs.js: ${error.message}`);
}

const requiredTabIds = ["overview", "workflows", "tasks", "agents", "gates", "evidence", "risks", "cost"];
const missionTabs = tabConfig.MISSION_CONTROL_TABS || [];
for (const tabId of requiredTabIds) {
  check(missionTabs.some((tab) => tab.id === tabId), "tabConfig", `Mission Control tabs missing: ${tabId}`);
}
for (const tab of missionTabs) {
  check(!/P3[7-9]|P4[0-9]|P5[0-9]/.test(tab.label), "tabConfig", `Tab label contains internal phase label: ${tab.label}`);
}
check(Boolean(tabConfig.PAGE_TAB_PLANS?.workspace), "tabConfig", "PAGE_TAB_PLANS must include Workspace");
check(Boolean(tabConfig.PAGE_TAB_PLANS?.projects), "tabConfig", "PAGE_TAB_PLANS must include Projects");

check(commandCenterSource.includes("<CommandTabs"), "missionControlTabShell", "Mission Control must render CommandTabs");
check(commandCenterSource.includes("<CommandTabPanel tabId=\"overview\""), "missionControlTabShell", "Overview tab panel missing");
check(commandCenterSource.includes("MISSION_CONTROL_TABS"), "missionControlTabShell", "Mission Control must use tab config");
check(commandCenterSource.includes("<ScopeSwitcher"), "multiProjectShell", "Mission Control must render ScopeSwitcher");
check(commandCenterSource.includes("<ProjectSwitcher"), "multiProjectShell", "Mission Control must render ProjectSwitcher");
check(commandCenterSource.includes("Portfolio view is planned with Project Registry in P42"), "multiProjectShell", "Portfolio placeholder copy missing");

check(viewModelSource.includes("shellMode === \"local-private\""), "demoBoundary", "View model must branch on local-private mode");
check(viewModelSource.includes("? \"Private Project\""), "demoBoundary", "Local-private view model must default to Private Project");
check(viewModelSource.includes("activeProject: safeProjectDisplayName"), "demoBoundary", "Shell active project must use safeProjectDisplayName");

for (const expected of [
  "Mission Control tab shell renders required tabs",
  "Mission Control tab navigation shows drilldown panels",
  "Mission Control scope shell shows project, portfolio, and OS context",
  "Mission Control tabs render in dark and light themes",
]) {
  check(testSource.includes(expected), "playwrightCoverage", `Playwright coverage missing: ${expected}`);
}

check(uxDocSource.includes("P41.7.3A"), "playwrightCoverage", "Tabbed navigation architecture doc must mention P41.7.3A");
check(uxDocSource.toLowerCase().includes("demoapp boundary"), "playwrightCoverage", "Tabbed navigation architecture doc must document DemoApp boundary");

let phaseStatus = null;
try {
  phaseStatus = JSON.parse(phaseStatusSource);
} catch (error) {
  check(false, "osPhaseStatus", `Could not parse phase status: ${error.message}`);
}
const statusById = new Map((phaseStatus?.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P41.7.3")?.commit === "81a73c1", "osPhaseStatus", "P41.7.3 must record commit 81a73c1");
check(statusById.get("P41.7.3A")?.status === "complete", "osPhaseStatus", "P41.7.3A must be complete");
check(statusById.get("P41.7.3A")?.branch === "ui/command-center-tab-system-foundation", "osPhaseStatus", "P41.7.3A branch mismatch");
check(statusById.get("P41.7.3A")?.nextPhase === "P41.7.3B", "osPhaseStatus", "P41.7.3A next phase must be P41.7.3B");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files must not be modified");

const changedFiles = gitOutput(["diff", "--name-only"]).split("\n").filter(Boolean);
for (const file of changedFiles) {
  check(!file.startsWith("local-api/"), "noForbiddenChanges", `local-api runtime file changed: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `db runtime file changed: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `command execution file changed: ${file}`);
}

for (const file of [
  "dashboard/src/components/command-center-v2/CommandTabs.jsx",
  "dashboard/src/components/command-center-v2/ScopeSwitcher.jsx",
  "dashboard/src/components/command-center-v2/ProjectSwitcher.jsx",
  "dashboard/src/data/commandCenterTabs.js",
  "scripts/check-command-center-tabs.js",
  "docs/architecture/COMMAND_CENTER_TABBED_NAVIGATION.md",
]) {
  const longLines = readFile(file)
    .split("\n")
    .map((line, index) => ({ line, index: index + 1 }))
    .filter((entry) => entry.line.length > 1000);
  check(longLines.length === 0, "formattingReadability", `${file} has lines over 1000 chars`);
}

const report = `# NEXUS Command Center Tabs Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- CommandTabs component: ${sections.commandTabs ? "PASS" : "FAIL"}
- Scope switcher: ${sections.scopeSwitcher ? "PASS" : "FAIL"}
- Project switcher: ${sections.projectSwitcher ? "PASS" : "FAIL"}
- Tab config: ${sections.tabConfig ? "PASS" : "FAIL"}
- Mission Control tab shell: ${sections.missionControlTabShell ? "PASS" : "FAIL"}
- Multi-project shell: ${sections.multiProjectShell ? "PASS" : "FAIL"}
- Demo boundary: ${sections.demoBoundary ? "PASS" : "FAIL"}
- Playwright coverage: ${sections.playwrightCoverage ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}

## Result

${failures.length === 0 ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "None" : failures.map((failure) => `- ${failure}`).join("\n")}
`;

writeFileSync(REPORT_PATH, report);

for (const [label, key] of [
  ["CommandTabs component", "commandTabs"],
  ["Scope switcher", "scopeSwitcher"],
  ["Project switcher", "projectSwitcher"],
  ["Tab config", "tabConfig"],
  ["Mission Control tab shell", "missionControlTabShell"],
  ["Multi-project shell", "multiProjectShell"],
  ["Demo boundary", "demoBoundary"],
  ["Playwright coverage", "playwrightCoverage"],
  ["OS phase status", "osPhaseStatus"],
  ["No forbidden changes", "noForbiddenChanges"],
  ["Formatting/readability", "formattingReadability"],
]) {
  console.log(`${label}: ${sections[key] ? "PASS" : "FAIL"}`);
}

console.log(`Result: ${failures.length === 0 ? "PASS" : "FAIL"}`);

if (failures.length > 0) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
