import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/command-center-ux-report.md");

const sections = {
  routeMatrix: true,
  capabilityReadiness: true,
  sidebarLabels: true,
  workflowLabels: true,
  pageCopy: true,
  roadmapPreservation: true,
  demoBoundary: true,
  noForbiddenChanges: true,
  formattingReadability: true,
};

const failures = [];

function readFile(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function fail(section, message) {
  sections[section] = false;
  failures.push(message);
}

function check(condition, section, message) {
  if (!condition) fail(section, message);
}

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
}

function getLineWarnings(relativePath) {
  const content = readFile(relativePath);
  return content
    .split("\n")
    .map((line, index) => ({ lineNumber: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000);
}

function stripRoadmapBlock(source) {
  return source.replace(
    /\/\* ─── OS Roadmap Page ─── \*\/[\s\S]*?function PlannedRoutePage/,
    "function PlannedRoutePage",
  );
}

const forbiddenUiLabels = [
  "Requires P37",
  "Requires P38",
  "Requires P39",
  "Requires P40",
  "Requires P41",
  "P38-LOCAL",
  "P39-LOCAL",
  "P40-LOCAL",
  "P41-LOCAL",
  "Agent Workbench P38",
  "Implementation P39",
  "Live API P40",
  "Durable State P41",
];

const requiredRoutePaths = [
  "/command-center",
  "/command-center/workspace",
  "/command-center/tasks",
  "/command-center/workbench",
  "/command-center/implementation",
  "/command-center/liveapi",
  "/command-center/database",
  "/command-center/evidence",
  "/command-center/safety",
  "/command-center/projects",
  "/command-center/roadmap",
  "/command-center/demo",
  "/command-center/agents",
  "/command-center/approvals",
  "/command-center/contracts",
  "/command-center/release",
  "/command-center/cost",
  "/command-center/batch",
];

const routeHeadings = {
  "/command-center": "Mission Control",
  "/command-center/workspace": "Workspace",
  "/command-center/tasks": "Task Queue",
  "/command-center/workbench": "Agent Workbench",
  "/command-center/implementation": "Implementation Workflow",
  "/command-center/liveapi": "Live API Status",
  "/command-center/database": "Durable State",
  "/command-center/evidence": "Evidence",
  "/command-center/safety": "Safety Center",
  "/command-center/projects": "Projects",
  "/command-center/roadmap": "OS Roadmap",
  "/command-center/demo": "Demo Mode",
  "/command-center/agents": "Agent Fleet",
  "/command-center/approvals": "Approvals",
  "/command-center/contracts": "Contracts",
  "/command-center/release": "Release Control",
  "/command-center/cost": "Cost Center",
  "/command-center/batch": "Batch Queue",
};

console.log("\nNEXUS Command Center UX Check\n=============================\n");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

const commandCenterSource = readFile("dashboard/src/pages/CommandCenterV2.jsx");
const commandCenterNonRoadmapSource = stripRoadmapBlock(commandCenterSource);
const workflowTemplateSource = readFile("workspace/workflowTemplates.js");
const workflowRecommendationSource = readFile("workspace/workflowRecommendations.js");
const routeSource = readFile("dashboard/src/data/commandCenterRoutes.js");
const readinessSource = readFile("dashboard/src/data/capabilityReadiness.js");
const roadmapSource = readFile("dashboard/src/data/nexusRoadmap.js");
const viewModelSource = readFile("dashboard/src/data/commandCenterViewModel.js");

let routeMatrix = [];
let capabilityReadiness = {};
let roadmapPhases = [];

try {
  ({ COMMAND_CENTER_ROUTES: routeMatrix } = await import("../dashboard/src/data/commandCenterRoutes.js"));
} catch (error) {
  fail("routeMatrix", `Could not import commandCenterRoutes.js: ${error.message}`);
}

try {
  ({ CAPABILITY_READINESS: capabilityReadiness } = await import("../dashboard/src/data/capabilityReadiness.js"));
} catch (error) {
  fail("capabilityReadiness", `Could not import capabilityReadiness.js: ${error.message}`);
}

try {
  ({ NEXUS_ROADMAP_PHASES: roadmapPhases } = await import("../dashboard/src/data/nexusRoadmap.js"));
} catch (error) {
  fail("roadmapPreservation", `Could not import nexusRoadmap.js: ${error.message}`);
}

// Route matrix
check(Array.isArray(routeMatrix), "routeMatrix", "COMMAND_CENTER_ROUTES must export an array");
for (const path of requiredRoutePaths) {
  const route = routeMatrix.find((entry) => entry.path === path);
  check(!!route, "routeMatrix", `Missing route matrix entry: ${path}`);
  if (route) {
    check(route.allowPhaseLabels === (path === "/command-center/roadmap"), "routeMatrix", `allowPhaseLabels mismatch for ${path}`);
    check(route.expectedHeading === routeHeadings[path], "routeMatrix", `expectedHeading mismatch for ${path}`);
  }
}
for (const path of ["/command-center/activity", "/command-center/docs", "/command-center/settings"]) {
  const route = routeMatrix.find((entry) => entry.path === path);
  check(!!route, "routeMatrix", `Missing planned route matrix entry: ${path}`);
  check(route?.status === "planned", "routeMatrix", `Planned route should be marked planned: ${path}`);
}

// Capability readiness
const requiredCapabilities = {
  missionComposer: "Available",
  missionActionBridge: "Available",
  taskActivation: "Available",
  agentWorkbench: "Available",
  humanReview: "Available",
  controlledImplementation: "Available for scoped implementation",
  liveLocalApi: "Available",
  dbFoundation: "Durable State foundation ready; DB writes disabled",
  dbWrites: "DB writes not enabled",
  workerRuntime: "Requires worker runtime",
  providerDispatch: "Requires governed provider dispatch",
  iosRunner: "Requires iOS/Xcode runner",
  releaseActionBridge: "Requires release action bridge",
};

for (const [capability, label] of Object.entries(requiredCapabilities)) {
  const entry = capabilityReadiness[capability];
  check(!!entry, "capabilityReadiness", `Missing capability readiness entry: ${capability}`);
  check(entry?.userFacingState === label, "capabilityReadiness", `Unexpected userFacingState for ${capability}`);
  check(typeof entry?.description === "string" && entry.description.length > 0, "capabilityReadiness", `Missing description for ${capability}`);
}
check(readinessSource.includes("ready_scoped"), "capabilityReadiness", "controlledImplementation should use ready_scoped");

// Sidebar labels
for (const forbidden of ["Agent Workbench P38", "Implementation P39", "Live API P40", "Durable State P41"]) {
  check(!commandCenterSource.includes(forbidden), "sidebarLabels", `Sidebar contains stale label: ${forbidden}`);
}
for (const required of ["Mission Control", "Agent Workbench", "Implementation", "Live API", "Durable State", "Activity Log", "Docs & Guides", "Settings"]) {
  check(routeSource.includes(required), "sidebarLabels", `Sidebar route matrix missing label: ${required}`);
}

// Workflow labels
for (const forbidden of ["Requires P37", "Requires P38", "Requires P39", "Requires P40", "Requires P41"]) {
  check(!workflowTemplateSource.includes(forbidden), "workflowLabels", `Workflow templates contain stale label: ${forbidden}`);
  check(!workflowRecommendationSource.includes(forbidden), "workflowLabels", `Workflow recommendations contain stale label: ${forbidden}`);
}
for (const expected of [
  "Available for planning and task activation",
  "Available for scoped remediation if failing evidence exists",
  "Available if backend validation bridge is online",
  "Requires release action bridge.",
  "Requires iOS/Xcode runner.",
  "Requires WARDEN review bridge for full execution.",
]) {
  check(workflowTemplateSource.includes(expected), "workflowLabels", `Workflow templates missing expected copy: ${expected}`);
}

// Page copy
for (const forbidden of forbiddenUiLabels) {
  check(!commandCenterNonRoadmapSource.includes(forbidden), "pageCopy", `Non-roadmap page copy contains stale label: ${forbidden}`);
}
for (const expected of [
  "Mission Control",
  "Evidence",
  "Available for scoped implementation",
  "Current persistence: file-backed",
  "DB writes disabled by policy",
  "Local API: Online",
  "Local API: Offline",
  "Select a task to review agent output, evidence, blockers, and next actions.",
]) {
  check(commandCenterSource.includes(expected), "pageCopy", `CommandCenterV2.jsx missing expected copy: ${expected}`);
}

// OS Roadmap preservation
for (const phase of ["P37", "P38", "P39", "P40", "P41"]) {
  check(roadmapSource.includes(phase), "roadmapPreservation", `OS roadmap data missing phase ${phase}`);
}
check(Array.isArray(roadmapPhases) && roadmapPhases.length >= 6, "roadmapPreservation", "NEXUS_ROADMAP_PHASES should contain the current roadmap entries");
check(commandCenterSource.includes("OS Roadmap"), "roadmapPreservation", "CommandCenterV2.jsx missing OS Roadmap route");

// Demo boundary
check(!commandCenterSource.includes("DEMOAPP ACTIVE"), "demoBoundary", "CommandCenterV2.jsx should not contain DEMOAPP ACTIVE");
check(!viewModelSource.includes('activeProject: studio.activeProject?.name || "DemoApp"'), "demoBoundary", "V2 view model should not default to DemoApp");
check(viewModelSource.includes('activeProject: studio.activeProject?.name || "Private Project"'), "demoBoundary", "V2 view model should default to Private Project in local-private mode");

// No forbidden changes
try {
  const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
  check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");
} catch (error) {
  fail("noForbiddenChanges", `Could not inspect private project diff: ${error.message}`);
}

// Formatting / readability
for (const relativePath of [
  "dashboard/src/data/commandCenterRoutes.js",
  "dashboard/src/data/capabilityReadiness.js",
  "dashboard/src/data/nexusRoadmap.js",
  "workspace/workflowTemplates.js",
  "workspace/workflowRecommendations.js",
  "scripts/check-command-center-ux.js",
  "docs/architecture/COMMAND_CENTER_UX_STABILIZATION.md",
]) {
  if (relativePath.endsWith("COMMAND_CENTER_UX_STABILIZATION.md") && !existsSync(join(ROOT, relativePath))) {
    fail("formattingReadability", "COMMAND_CENTER_UX_STABILIZATION.md is missing");
    continue;
  }
  const warnings = getLineWarnings(relativePath);
  check(warnings.length === 0, "formattingReadability", `${relativePath} contains lines over 1000 characters`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Route matrix: ${sections.routeMatrix ? "PASS" : "FAIL"}`);
console.log(`Capability readiness: ${sections.capabilityReadiness ? "PASS" : "FAIL"}`);
console.log(`Sidebar labels: ${sections.sidebarLabels ? "PASS" : "FAIL"}`);
console.log(`Workflow labels: ${sections.workflowLabels ? "PASS" : "FAIL"}`);
console.log(`Page copy: ${sections.pageCopy ? "PASS" : "FAIL"}`);
console.log(`OS Roadmap preservation: ${sections.roadmapPreservation ? "PASS" : "FAIL"}`);
console.log(`Demo boundary: ${sections.demoBoundary ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`);
console.log(`\nResult: ${result}`);

const report = `# Command Center UX Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- Route matrix: ${sections.routeMatrix ? "PASS" : "FAIL"}
- Capability readiness: ${sections.capabilityReadiness ? "PASS" : "FAIL"}
- Sidebar labels: ${sections.sidebarLabels ? "PASS" : "FAIL"}
- Workflow labels: ${sections.workflowLabels ? "PASS" : "FAIL"}
- Page copy: ${sections.pageCopy ? "PASS" : "FAIL"}
- OS Roadmap preservation: ${sections.roadmapPreservation ? "PASS" : "FAIL"}
- Demo boundary: ${sections.demoBoundary ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

if (result !== "PASS") {
  process.exitCode = 1;
}
