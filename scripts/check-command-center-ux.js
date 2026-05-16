import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/command-center-ux-report.md");
const SCREENSHOT_AUDIT_SCRIPT_PATH = "scripts/capture-command-center-screenshots.js";
const SCREENSHOT_MANIFEST_PATH = "reports/ui-audit/manifest.json";
const VISUAL_QA_REPORT_PATH = "reports/ui-audit/visual-qa-report.md";

const sections = {
  routeMatrix: true,
  capabilityReadiness: true,
  themeHook: true,
  themeTokens: true,
  themeControl: true,
  missionControlLayout: true,
  pageSpecificUx: true,
  serviceHealthUx: true,
  agentRoomsUx: true,
  skillRegistryUx: true,
  hookRegistryUx: true,
  toolGatewayUx: true,
  triggerIntegrationUx: true,
  apiBatchUx: true,
  commandPalette: true,
  commandCenterHelpLinks: true,
  operatorActions: true,
  commandCenterTabs: true,
  routeWideTabContract: true,
  missionControlTabs: true,
  tabbedCorePages: true,
  tabbedPlatformPages: true,
  scopeBoundaryUx: true,
  scopeSwitcher: true,
  multiProjectShell: true,
  roadmapProjectSeparation: true,
  headerFormatting: true,
  sidebarPlannedBehavior: true,
  boundaryPolish: true,
  missionDisplay: true,
  topBarPolish: true,
  actionReasons: true,
  screenshotAudit: true,
  visualQaReport: true,
  sidebarLabels: true,
  workflowLabels: true,
  pageCopy: true,
  roadmapPreservation: true,
  demoBoundary: true,
  noForbiddenChanges: true,
  formattingReadability: true,
  testCenterUx: true,
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
  "/command-center/services",
  "/command-center/memory",
  "/command-center/context",
  "/command-center/evidence",
  "/command-center/safety",
  "/command-center/projects",
  "/command-center/roadmap",
  "/command-center/demo",
  "/command-center/agents",
  "/command-center/skills",
  "/command-center/hooks",
  "/command-center/tools",
  "/command-center/triggers",
  "/command-center/api-batch",
  "/command-center/approvals",
  "/command-center/contracts",
  "/command-center/release",
  "/command-center/agent-rooms",
  "/command-center/cost",
  "/command-center/batch",
];

const requiredTabbedRoutes = {
  "/command-center": "overview",
  "/command-center/workspace": "recommended",
  "/command-center/tasks": "planned",
  "/command-center/workbench": "task",
  "/command-center/implementation": "proposal",
  "/command-center/liveapi": "overview",
  "/command-center/database": "overview",
  "/command-center/evidence": "timeline",
  "/command-center/safety": "posture",
  "/command-center/projects": "portfolio",
  "/command-center/roadmap": "in-progress",
  "/command-center/cost": "overview",
  "/command-center/batch": "overview",
  "/command-center/memory": "overview",
  "/command-center/context": "overview",
  "/command-center/agent-rooms": "overview",
  "/command-center/skills": "overview",
  "/command-center/hooks": "overview",
  "/command-center/tools": "overview",
  "/command-center/triggers": "overview",
  "/command-center/api-batch": "overview",
};

const routeHeadings = {
  "/command-center": "Mission Control",
  "/command-center/workspace": "Workspace",
  "/command-center/tasks": "Task Queue",
  "/command-center/workbench": "Agent Workbench",
  "/command-center/implementation": "Implementation Workflow",
  "/command-center/liveapi": "Live API Status",
  "/command-center/database": "Durable State",
  "/command-center/services": "Service Health",
  "/command-center/memory": "Memory Center",
  "/command-center/context": "Data & Context Center",
  "/command-center/evidence": "Evidence",
  "/command-center/safety": "Safety Center",
  "/command-center/projects": "Projects",
  "/command-center/roadmap": "OS Roadmap",
  "/command-center/demo": "Demo Mode",
  "/command-center/agents": "Agent Registry",
  "/command-center/skills": "Skill Registry",
  "/command-center/hooks": "Hook Registry",
  "/command-center/tools": "Tool Gateway",
  "/command-center/triggers": "Trigger + Integrations",
  "/command-center/api-batch": "API / Batch Adapter",
  "/command-center/agent-rooms": "Agent Rooms",
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
const topBarSource = commandCenterSource.match(/function TopBar[\s\S]*?\/\* ─── Mission Composer Card ─── \*\//)?.[0] || "";
const workflowTemplateSource = readFile("workspace/workflowTemplates.js");
const workflowRecommendationSource = readFile("workspace/workflowRecommendations.js");
const routeSource = readFile("dashboard/src/data/commandCenterRoutes.js");
const readinessSource = readFile("dashboard/src/data/capabilityReadiness.js");
const commandSource = readFile("dashboard/src/data/nexusCommands.js");
const helpLinksSource = readFile("dashboard/src/data/commandCenterHelpLinks.js");
const commandTabsSource = readFile("dashboard/src/data/commandCenterTabs.js");
const roadmapSource = readFile("dashboard/src/data/nexusRoadmap.js");
const viewModelSource = readFile("dashboard/src/data/commandCenterViewModel.js");
const themeHookSource = readFile("dashboard/src/hooks/useNexusTheme.js");
const themeCssSource = readFile("dashboard/src/styles-command-center-v2.css");
const routeTestSource = readFile("dashboard/tests/routes.spec.js");
const screenshotAuditSource = readFile(SCREENSHOT_AUDIT_SCRIPT_PATH);
const visualQaReportSource = readFile(VISUAL_QA_REPORT_PATH);
const uxDocSource = readFile("docs/architecture/COMMAND_CENTER_UX_STABILIZATION.md");
const phaseStatusSource = readFile("os-roadmap/phase-status.json");

let routeMatrix = [];
let capabilityReadiness = {};
let nexusCommands = [];
let roadmapPhases = [];
let screenshotManifest = null;

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
  ({ NEXUS_COMMANDS: nexusCommands } = await import("../dashboard/src/data/nexusCommands.js"));
} catch (error) {
  fail("commandPalette", `Could not import nexusCommands.js: ${error.message}`);
}

try {
  ({ NEXUS_ROADMAP_PHASES: roadmapPhases } = await import("../dashboard/src/data/nexusRoadmap.js"));
} catch (error) {
  fail("roadmapPreservation", `Could not import nexusRoadmap.js: ${error.message}`);
}

try {
  if (!existsSync(join(ROOT, SCREENSHOT_MANIFEST_PATH))) {
    fail("screenshotAudit", "Screenshot manifest is missing");
  } else {
    screenshotManifest = JSON.parse(readFile(SCREENSHOT_MANIFEST_PATH));
  }
} catch (error) {
  fail("screenshotAudit", `Could not parse screenshot manifest: ${error.message}`);
}

// Route matrix
check(Array.isArray(routeMatrix), "routeMatrix", "COMMAND_CENTER_ROUTES must export an array");
for (const path of requiredRoutePaths) {
  const route = routeMatrix.find((entry) => entry.path === path);
  check(!!route, "routeMatrix", `Missing route matrix entry: ${path}`);
  if (route) {
    check(route.allowPhaseLabels === (path === "/command-center/roadmap"), "routeMatrix", `allowPhaseLabels mismatch for ${path}`);
    check(route.expectedHeading === routeHeadings[path], "routeMatrix", `expectedHeading mismatch for ${path}`);
    check(["implemented", "planned"].includes(route.status), "routeWideTabContract", `Route status must be normalized for ${path}`);
    check(
      ["os", "project", "portfolio", "platform", "demo"].includes(route.scope),
      "routeWideTabContract",
      `Route scope must be normalized for ${path}`,
    );
  }
}
for (const path of ["/command-center/settings"]) {
  const route = routeMatrix.find((entry) => entry.path === path);
  check(!!route, "routeMatrix", `Missing planned route matrix entry: ${path}`);
  check(route?.status === "planned", "routeMatrix", `Planned route should be marked planned: ${path}`);
}
const activityRoute = routeMatrix.find((entry) => entry.path === "/command-center/activity");
check(!!activityRoute, "routeMatrix", "Missing Activity Log route matrix entry");
check(activityRoute?.status === "implemented", "routeMatrix", "Activity Log route should be implemented");
const docsRoute = routeMatrix.find((entry) => entry.path === "/command-center/docs");
check(!!docsRoute, "routeMatrix", "Missing docs route matrix entry");
check(docsRoute?.status === "implemented", "routeMatrix", "Docs & Guides route should be implemented");

for (const [path, defaultTab] of Object.entries(requiredTabbedRoutes)) {
  const route = routeMatrix.find((entry) => entry.path === path);
  check(Array.isArray(route?.tabs), "routeWideTabContract", `Tabbed route missing tab list: ${path}`);
  check(route?.tabs?.length > 0, "routeWideTabContract", `Tabbed route has empty tab list: ${path}`);
  check(route?.defaultTab === defaultTab, "routeWideTabContract", `Tabbed route default tab mismatch: ${path}`);
  check(
    route?.tabs?.some((tab) => tab.id === defaultTab),
    "routeWideTabContract",
    `Default tab is not present in tab list: ${path}`,
  );
  for (const tab of route?.tabs || []) {
    check(typeof tab.label === "string" && tab.label.length > 0, "routeWideTabContract", `Tab missing label on ${path}`);
    check(!forbiddenUiLabels.some((label) => tab.label.includes(label)), "routeWideTabContract", `Tab label contains stale phase copy on ${path}`);
  }
}
for (const expectedTest of [
  "route metadata declares tab contracts for implemented tabbed routes",
  "route-wide implemented tabs can switch without stale labels",
]) {
  check(routeTestSource.includes(expectedTest), "routeWideTabContract", `Route tests missing route-wide tab contract coverage: ${expectedTest}`);
}

// Capability readiness
const requiredCapabilities = {
  missionComposer: "Available",
  missionActionBridge: "Available",
  taskActivation: "Available",
  agentWorkbench: "Available",
  humanReview: "Available",
  controlledImplementation: "Available for scoped implementation",
  controlledValidation: "Requires controlled validation bridge",
  liveLocalApi: "Available",
  dbFoundation: "Durable State foundation ready; DB writes disabled",
  dbWrites: "DB writes not enabled",
  workerRuntime: "Requires worker runtime",
  providerDispatch: "Requires governed provider dispatch",
  iosRunner: "Requires iOS/Xcode runner",
  releaseActionBridge: "Requires release action bridge",
  runtimeLocks: "Requires runtime lock controls",
  commandPalette: "Available",
  operatorActions: "Available as read-only summaries",
};

for (const [capability, label] of Object.entries(requiredCapabilities)) {
  const entry = capabilityReadiness[capability];
  check(!!entry, "capabilityReadiness", `Missing capability readiness entry: ${capability}`);
  check(entry?.userFacingState === label, "capabilityReadiness", `Unexpected userFacingState for ${capability}`);
  check(typeof entry?.description === "string" && entry.description.length > 0, "capabilityReadiness", `Missing description for ${capability}`);
}
check(readinessSource.includes("ready_scoped"), "capabilityReadiness", "controlledImplementation should use ready_scoped");

// Theme hook
check(themeHookSource.length > 0, "themeHook", "useNexusTheme.js must exist");
for (const expectedExport of [
  "export function useNexusTheme",
  "export function getStoredNexusTheme",
  "export function resolveNexusTheme",
  "export function applyNexusTheme",
]) {
  check(themeHookSource.includes(expectedExport), "themeHook", `Theme hook missing export: ${expectedExport}`);
}
for (const expectedToken of [
  "nexus-theme",
  "data-nexus-theme",
  "data-nexus-resolved-theme",
  "prefers-color-scheme: dark",
  "system",
  "dark",
  "light",
]) {
  check(themeHookSource.includes(expectedToken), "themeHook", `Theme hook missing behavior token: ${expectedToken}`);
}

// Theme tokens
for (const token of [
  "--nexus-bg",
  "--nexus-bg-soft",
  "--nexus-panel",
  "--nexus-panel-soft",
  "--nexus-panel-strong",
  "--nexus-text",
  "--nexus-text-strong",
  "--nexus-muted",
  "--nexus-border",
  "--nexus-border-strong",
  "--nexus-accent",
  "--nexus-accent-soft",
  "--nexus-success",
  "--nexus-success-soft",
  "--nexus-warning",
  "--nexus-warning-soft",
  "--nexus-danger",
  "--nexus-danger-soft",
  "--nexus-info",
  "--nexus-info-soft",
  "--nexus-shadow",
  "--nexus-code-bg",
  "--nexus-input-bg",
  "--nexus-button-bg",
  "--nexus-button-text",
]) {
  check(themeCssSource.includes(token), "themeTokens", `Missing theme token: ${token}`);
}
check(
  themeCssSource.includes(':root[data-nexus-resolved-theme="dark"]')
    || themeCssSource.includes(":root,\n:root[data-nexus-resolved-theme=\"dark\"]"),
  "themeTokens",
  "Missing dark theme selector",
);
check(
  themeCssSource.includes(':root[data-nexus-resolved-theme="light"]'),
  "themeTokens",
  "Missing light theme selector",
);

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

// OS Roadmap / project separation
for (const expected of [
  "NEXUS OS Platform Progress",
  "Latest completed phase",
  "In progress phase",
  "Next planned phase",
  "Completed",
  "In Progress",
  "Planned",
  "Project Progress",
]) {
  check(commandCenterSource.includes(expected), "roadmapProjectSeparation", `Roadmap / project separation missing expected copy: ${expected}`);
}
for (const forbidden of [
  "CareLoop sprint board",
  "Track B",
  "DB-backed Command Center + Live Refresh",
  "Blocked / Risks",
  "History",
]) {
  check(!commandCenterSource.includes(forbidden), "roadmapProjectSeparation", `Roadmap / project separation contains forbidden mixed-roadmap copy: ${forbidden}`);
}
for (const expectedTest of [
  "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage",
  "projects page keeps project milestones separate from the OS roadmap",
]) {
  check(routeTestSource.includes(expectedTest), "roadmapProjectSeparation", `Route tests missing roadmap/project separation coverage: ${expectedTest}`);
}

// Header environment formatting
check(topBarSource.includes("ccv2-topbar__breadcrumb"), "headerFormatting", "Top bar should include concise breadcrumb markup");
check(topBarSource.includes("ccv2-topbar__scope-chip"), "headerFormatting", "Top bar should include compact scope/project chip");
check(!topBarSource.includes("Environment:"), "headerFormatting", "Top bar should not show Environment text");
check(!topBarSource.includes("Local API:"), "headerFormatting", "Top bar should not show Local API text");
check(!topBarSource.includes("Durable State:"), "headerFormatting", "Top bar should not show Durable State text");
check(!topBarSource.includes(">ENV<"), "headerFormatting", "Top bar should not use the old ENV badge copy");
check(routeTestSource.includes("top header is compact and omits noisy runtime badges"), "headerFormatting", "Route tests missing compact header coverage");

// Sidebar label completeness / planned behavior
check(commandCenterSource.includes("title={item.name}"), "sidebarPlannedBehavior", "Sidebar links should preserve full labels through title attributes");
check(commandCenterSource.includes("Coming Soon"), "sidebarPlannedBehavior", "Planned routes should render Coming Soon copy");
check(commandCenterSource.includes("read-only guidance"), "sidebarPlannedBehavior", "Planned routes should explain read-only guidance");
for (const expectedTest of [
  "sidebar uses cleaned product labels and preserves full labels",
  "planned routes show a safe coming-soon state instead of crashing",
]) {
  check(routeTestSource.includes(expectedTest), "sidebarPlannedBehavior", `Route tests missing sidebar/planned-route coverage: ${expectedTest}`);
}

// Page copy
for (const forbidden of forbiddenUiLabels) {
  check(!commandCenterNonRoadmapSource.includes(forbidden), "pageCopy", `Non-roadmap page copy contains stale label: ${forbidden}`);
}
for (const expected of [
  "Mission Control",
  "Evidence",
  "Implementation Summary",
  "Durable State Summary",
  "Service Health",
  "Start, inspect, and troubleshoot local NEXUS services.",
  "Disabled by policy",
  "Local API",
  "http://127.0.0.1:4321",
  "Coming Soon",
  "Docs & Guides",
  "Select a task to review agent output, evidence, blockers, and next actions.",
]) {
  check(commandCenterSource.includes(expected), "pageCopy", `CommandCenterV2.jsx missing expected copy: ${expected}`);
}

// Theme control
for (const expected of [
  "ccv2-theme-control",
  "Theme selector",
  "Use system theme",
  "Use dark theme",
  "Use light theme",
  "data-nexus-theme",
  "data-nexus-resolved-theme",
]) {
  check(commandCenterSource.includes(expected), "themeControl", `CommandCenterV2.jsx missing theme control marker: ${expected}`);
}
for (const expectedTest of [
  "theme switcher exists globally",
  "theme persistence stores and restores light mode",
  "dark mode applies without reload",
  "system mode follows resolved color scheme",
  "implemented routes render in dark and light themes",
]) {
  check(routeTestSource.includes(expectedTest), "themeControl", `Route tests missing theme coverage: ${expectedTest}`);
}

// Mission Control layout
for (const expected of [
  "Mission Hero",
  "Next Best Action",
  "System Status",
  "Execution Pipeline",
  "Activity Stream",
  "Verification Gates",
  "Active Mission Tasks",
  "Project Progress",
  "Evidence Timeline",
  "Safety / Approval",
  "Release Readiness",
  "Cost Snapshot",
  "enterprise command surface for governed agentic work",
]) {
  check(commandCenterSource.includes(expected), "missionControlLayout", `Mission Control missing required section or copy: ${expected}`);
}
for (const expectedTest of [
  "Mission Control renders enterprise cockpit sections",
  "Mission Hero shows mission, scope, actions, and disabled reasons",
  "Mission Control status strip shows key platform states",
  "Mission Control renders in dark and light themes",
]) {
  check(routeTestSource.includes(expectedTest), "missionControlLayout", `Mission Control test coverage missing: ${expectedTest}`);
}
check(!commandCenterSource.includes("Requires P37"), "missionControlLayout", "Mission Control must not include stale P37 requirement");
check(!commandCenterSource.includes("P38-LOCAL"), "missionControlLayout", "Mission Control must not include stale P38-LOCAL label");

// Page-specific UX
for (const expected of [
  "Workspace Summary",
  "Queue Summary",
  "Task State Summary",
  "Workbench Summary",
  "Implementation Summary",
  "API Summary",
  "Durable State Summary",
  "Evidence Summary",
  "Safety Summary",
  "Project Operating Surface",
  "Developer Details",
  "Documentation-only update",
  "DB writes disabled by policy",
  "Evidence proves what governed actions produced.",
  "Project Health Strip",
  "Stack",
  "Project Capability Matrix",
  "Agent Registry",
  "Boundary Envelope Preview",
  "Runtime Enforcement",
  "Tool Dispatch",
  "Settings / Adapter",
]) {
  check(commandCenterSource.includes(expected), "pageSpecificUx", `Page-specific UX missing expected copy: ${expected}`);
}
for (const forbidden of ["Project Briefshepherd", "mutation allowed YES", "DEMOAPP ACTIVE"]) {
  check(!commandCenterNonRoadmapSource.includes(forbidden), "pageSpecificUx", `Page-specific UX contains forbidden copy: ${forbidden}`);
}
for (const expectedTest of [
  "workspace shows grouped governed workflows and clear availability states",
  "task queue shows planned and runtime task states with user-facing next actions",
  "agent workbench shows review summary and helpful empty or selected task state",
  "implementation workflow shows user-facing status summary and developer details split",
  "live api page groups endpoints by business purpose",
  "durable state page shows file-backed posture without failure framing",
  "evidence page shows summary and avoids raw payload dumps",
  "safety center shows plain-language safety posture without raw policy keys",
  "projects page keeps project milestones separate from the OS roadmap",
]) {
  check(routeTestSource.includes(expectedTest), "pageSpecificUx", `Page-specific UX tests missing: ${expectedTest}`);
}

// Service Health UX
for (const expected of [
  "Service Health",
  "Start, inspect, and troubleshoot local NEXUS services.",
  "Local Boot Summary",
  "Service Cards",
  "Operator Commands",
  "Doctor Findings",
  "Troubleshooting",
  "localhost-only",
  "npm run nexus:up",
  "npm run nexus:down",
  "npm run nexus:status",
  "npm run nexus:doctor",
  "Run this command in a local terminal",
  "Port already in use",
  "Local API offline",
  "Action bridge offline",
]) {
  check(commandCenterSource.includes(expected), "serviceHealthUx", `Service Health page missing expected copy: ${expected}`);
}
for (const expectedTest of [
  "Service Health route renders with operator guidance and service cards",
  "service health route renders in dark and light themes",
]) {
  check(routeTestSource.includes(expectedTest), "serviceHealthUx", `Service Health tests missing: ${expectedTest}`);
}
check(routeSource.includes("/command-center/services"), "serviceHealthUx", "Route matrix missing /command-center/services");

// Agent Rooms UX
for (const expected of [
  "Agent Rooms",
  "Governed Mesh Boundary",
  "Agents coordinate through NEXUS governance, not direct free chat.",
  "Messages are scoped, redacted, audited, and policy-checked.",
  "Provider/tool/worker dispatch is not enabled by P48.",
  "Recent Redacted Messages",
  "Governed Handoffs",
  "Context Sync",
  "Task ownership unchanged",
  "Runtime agent injection enabled: no",
]) {
  check(commandCenterSource.includes(expected) || viewModelSource.includes(expected), "agentRoomsUx", `Agent Rooms UX missing expected copy: ${expected}`);
}
for (const expectedTest of [
  "Agent Rooms route shows governed mesh coordination",
  "agent rooms tabs expose rooms messages handoffs context and policy",
]) {
  check(routeTestSource.includes(expectedTest), "agentRoomsUx", `Agent Rooms tests missing: ${expectedTest}`);
}
check(routeSource.includes("/command-center/agent-rooms"), "agentRoomsUx", "Route matrix missing /command-center/agent-rooms");

// Skill Registry UX
for (const expected of [
  "Skill Registry",
  "Governed skill definitions, templates, stack profiles, and validation requirements.",
  "Skill execution is not enabled yet",
  "Provider, tool, worker, DB write, and project mutation paths remain disabled.",
  "Test Requirement Sets",
  "By Project / Stack",
  "Future runtime checks are documented but not enabled.",
]) {
  check(
    commandCenterSource.includes(expected) || viewModelSource.includes(expected) || commandTabsSource.includes(expected),
    "skillRegistryUx",
    `Skill Registry UX missing expected copy: ${expected}`,
  );
}
for (const expected of [
  "export const SKILL_REGISTRY_TABS",
  'id: "overview"',
  'id: "skills"',
  'id: "by-agent"',
  'id: "by-project-stack"',
  'id: "test-requirements"',
  'id: "developer-details"',
]) {
  check(commandTabsSource.includes(expected), "skillRegistryUx", `Skill Registry tabs missing expected config: ${expected}`);
}
check(routeSource.includes("/command-center/skills"), "skillRegistryUx", "Route matrix missing /command-center/skills");
check(routeTestSource.includes("Skill Registry route renders read-only governed skill metadata"), "skillRegistryUx", "Route tests missing Skill Registry coverage");

// Hook Registry UX
for (const expected of [
  "Hook Registry",
  "Safe automation hook readiness, triggers, guardrails, and kill switches.",
  "Hook execution is not enabled yet.",
  "Hooks are registry/readiness only in P51.",
  "Worker/runtime integration comes later.",
  "Kill Switches",
  "Would execute",
]) {
  check(
    commandCenterSource.includes(expected) || viewModelSource.includes(expected) || commandTabsSource.includes(expected),
    "hookRegistryUx",
    `Hook Registry UX missing expected copy: ${expected}`,
  );
}
for (const expected of [
  "export const HOOK_REGISTRY_TABS",
  'id: "overview"',
  'id: "hooks"',
  'id: "triggers"',
  'id: "guardrails"',
  'id: "kill-switches"',
  'id: "developer-details"',
]) {
  check(commandTabsSource.includes(expected), "hookRegistryUx", `Hook Registry tabs missing expected config: ${expected}`);
}
check(routeSource.includes("/command-center/hooks"), "hookRegistryUx", "Route matrix missing /command-center/hooks");
check(routeTestSource.includes("Hook Registry route renders read-only safe automation metadata"), "hookRegistryUx", "Route tests missing Hook Registry coverage");

// Tool Gateway UX
for (const expected of [
  "Tool Gateway",
  "Governed Tool Gateway",
  "One governed tool gateway for registry metadata, lazy contracts, permissions, and safe previews.",
  "Execution disabled",
  "MCP placeholders disabled",
  "No all-tools-in-context loading.",
  "No all-MCP-schemas-in-context loading.",
  "Adapter Previews",
  "Lazy Contract Loading",
]) {
  check(
    commandCenterSource.includes(expected) || viewModelSource.includes(expected) || commandTabsSource.includes(expected),
    "toolGatewayUx",
    `Tool Gateway UX missing expected copy: ${expected}`,
  );
}
for (const expected of [
  "export const TOOL_GATEWAY_TABS",
  'id: "overview"',
  'id: "tool-registry"',
  'id: "mcp-registry"',
  'id: "permissions"',
  'id: "contracts"',
  'id: "adapters"',
  'id: "lazy-loading"',
  'id: "developer-details"',
]) {
  check(commandTabsSource.includes(expected), "toolGatewayUx", `Tool Gateway tabs missing expected config: ${expected}`);
}
check(routeSource.includes("/command-center/tools"), "toolGatewayUx", "Route matrix missing /command-center/tools");
check(routeTestSource.includes("Tool Gateway route renders read-only governed tool metadata"), "toolGatewayUx", "Route tests missing Tool Gateway coverage");

// Trigger + Integrations UX
for (const expected of [
  "Trigger + Integrations",
  "Preview-only trigger gateway",
  "Execution disabled",
  "No credentials",
  "GitHub Events - Preview only",
  "Jira / Linear - Planned integration",
  "Slack / Teams - Planned integration",
  "Scheduled triggers: Preview only",
]) {
  check(
    commandCenterSource.includes(expected) || viewModelSource.includes(expected) || commandTabsSource.includes(expected),
    "triggerIntegrationUx",
    `Trigger + Integrations UX missing expected copy: ${expected}`,
  );
}
for (const expected of [
  "export const TRIGGER_INTEGRATION_TABS",
  'id: "manual"',
  'id: "scheduled"',
  'id: "github"',
  'id: "tickets"',
  'id: "chat"',
  'id: "developer-details"',
]) {
  check(commandTabsSource.includes(expected), "triggerIntegrationUx", `Trigger tabs missing expected config: ${expected}`);
}
check(routeSource.includes("/command-center/triggers"), "triggerIntegrationUx", "Route matrix missing /command-center/triggers");
check(routeTestSource.includes("Trigger Gateway route renders preview-only integration metadata"), "triggerIntegrationUx", "Route tests missing Trigger Gateway coverage");

// API / Batch Adapter UX
for (const expected of [
  "API / Batch Adapter",
  "Preview-only provider request packaging",
  "Provider calls disabled",
  "Upload disabled",
  "Provider Adapters",
  "Batch Jobs",
  "Cost Estimate",
  "Result Reconciliation Preview",
]) {
  check(
    commandCenterSource.includes(expected) || viewModelSource.includes(expected) || commandTabsSource.includes(expected),
    "apiBatchUx",
    `API / Batch UX missing expected copy: ${expected}`,
  );
}
for (const expected of [
  "export const API_BATCH_TABS",
  'id: "providers"',
  'id: "batch"',
  'id: "cost"',
  'id: "reconciliation"',
  'id: "developer-details"',
]) {
  check(commandTabsSource.includes(expected), "apiBatchUx", `API / Batch tabs missing expected config: ${expected}`);
}
check(routeSource.includes("/command-center/api-batch"), "apiBatchUx", "Route matrix missing /command-center/api-batch");
check(routeTestSource.includes("API Batch route renders preview-only provider and batch metadata"), "apiBatchUx", "Route tests missing API Batch coverage");

// Test Center UX
for (const expected of [
  "Test Center",
  "Execution is not enabled in Test Center yet",
  "Policy Posture",
  "testExecutionAllowed: false",
  "Registry only",
  "Project Test Suites",
  "NEXUS OS Test Suites",
]) {
  check(
    commandCenterSource.includes(expected) || viewModelSource.includes(expected) || commandTabsSource.includes(expected),
    "testCenterUx",
    `Test Center UX missing expected copy: ${expected}`,
  );
}
for (const expected of [
  "export const TEST_CENTER_TABS",
  'id: "project-tests"',
  'id: "os-tests"',
  'id: "selection-preview"',
  'id: "evidence-model"',
  'id: "gaps"',
]) {
  check(commandTabsSource.includes(expected), "testCenterUx", `Test Center tabs missing expected config: ${expected}`);
}
check(routeSource.includes("/command-center/tests"), "testCenterUx", "Route matrix missing /command-center/tests");
check(routeTestSource.includes("Test Center renders with overview and policy posture"), "testCenterUx", "Route tests missing Test Center coverage");
check(commandCenterSource.includes("TestCenterPage"), "testCenterUx", "CommandCenterV2.jsx missing TestCenterPage component");

// Command Center help links
check(helpLinksSource.includes("COMMAND_CENTER_HELP_LINKS"), "commandCenterHelpLinks", "commandCenterHelpLinks.js must export COMMAND_CENTER_HELP_LINKS");
check(commandCenterSource.includes("HelpLink"), "commandCenterHelpLinks", "Command Center shell must render HelpLink");
check(commandCenterSource.includes('<HelpLink routeKey={currentPage}'), "commandCenterHelpLinks", "HelpLink should be route-aware");
for (const expected of [
  "Starting a Mission",
  "Command Center Guide",
  "Activating Tasks",
  "Using Agent Workbench",
  "Controlled Implementation",
  "Understanding Evidence and Audit",
  "Running NEXUS Locally",
  "Demo Mode vs Private Mode",
  "Troubleshooting",
  "FAQ",
]) {
  check(helpLinksSource.includes(expected), "commandCenterHelpLinks", `Help links missing expected label: ${expected}`);
}
for (const expected of ["database", "services", "commandPalette"]) {
  check(helpLinksSource.includes(`${expected}:`), "commandCenterHelpLinks", `Help links missing route/capability key: ${expected}`);
}
for (const expectedTest of [
  "Command Center help links are visible on major routes",
  "Command Center help links map to expected usage docs",
]) {
  check(routeTestSource.includes(expectedTest), "commandCenterHelpLinks", `Route tests missing help-link coverage: ${expectedTest}`);
}

// Command palette
check(commandSource.includes("export const NEXUS_COMMANDS"), "commandPalette", "nexusCommands.js must export NEXUS_COMMANDS");
check(commandSource.includes("getNexusCommandsForScope"), "commandPalette", "nexusCommands.js must export getNexusCommandsForScope");
check(commandSource.includes("getCommandById"), "commandPalette", "nexusCommands.js must export getCommandById");
check(Array.isArray(nexusCommands), "commandPalette", "NEXUS_COMMANDS must be an array");
for (const commandId of ["plan", "review", "qa", "fix", "ship", "retro", "guard", "freeze", "explain"]) {
  const command = nexusCommands.find((entry) => entry.id === commandId);
  check(!!command, "commandPalette", `Missing required command: ${commandId}`);
  for (const field of [
    "label",
    "shortLabel",
    "category",
    "intent",
    "ownerAgent",
    "riskLevel",
    "capabilityId",
    "requiredCapabilities",
    "currentState",
    "disabledReason",
    "evidenceProduced",
    "costMode",
    "actionMode",
    "routeTarget",
    "commandCenterVisible",
  ]) {
    check(command && field in command, "commandPalette", `Command ${commandId} missing schema field: ${field}`);
  }
}
for (const expected of [
  "Command Palette",
  "Plan Mission",
  "Review Work",
  "Run QA Gate",
  "Propose Fix",
  "Prepare Ship",
  "Run Retro",
  "Guard Scope",
  "Freeze Workspace",
  "Explain Current State",
  "Requires release action bridge.",
  "Requires runtime lock controls.",
  "Requires failing validation evidence.",
]) {
  check(commandCenterSource.includes(expected) || commandSource.includes(expected), "commandPalette", `Command palette missing expected copy: ${expected}`);
}
for (const expectedTest of [
  "Command Palette entrypoint exists and opens core commands",
  "Command Palette shows command details for plan and explain",
  "Command Palette disabled commands show clear reasons and do not execute",
  "Command Palette renders in dark and light themes",
]) {
  check(routeTestSource.includes(expectedTest), "commandPalette", `Route tests missing command palette coverage: ${expectedTest}`);
}

// Operator actions
for (const expected of [
  "Operator Actions",
  "Simple governed actions for the active scope",
  "Plan Mission",
  "Review Work",
  "Run QA Gate",
  "Explain Current State",
  "Propose Fix",
  "Prepare Ship",
  "Guard Scope",
  "Freeze Workspace",
  "Run Retro",
]) {
  check(
    commandCenterSource.includes(expected) || commandSource.includes(expected),
    "operatorActions",
    `Mission Control operator actions missing expected copy: ${expected}`,
  );
}
check(commandCenterSource.includes("Read-only and route-first"), "operatorActions", "Operator actions should explain read-only and route-first posture");
check(routeTestSource.includes("Mission Control shows simple operator action rows"), "operatorActions", "Route tests missing Mission Control operator actions coverage");

// Command Center tabs
check(commandTabsSource.includes("export const MISSION_CONTROL_TABS"), "commandCenterTabs", "commandCenterTabs.js must export MISSION_CONTROL_TABS");
check(commandTabsSource.includes("export const PAGE_TAB_PLANS"), "commandCenterTabs", "commandCenterTabs.js must export PAGE_TAB_PLANS");
for (const tabId of ["overview", "workflows", "tasks", "agents", "gates", "evidence", "risks", "cost"]) {
  check(commandTabsSource.includes(`id: "${tabId}"`), "commandCenterTabs", `Mission Control tab missing: ${tabId}`);
  check(commandTabsSource.includes(`id: "${tabId}"`), "missionControlTabs", `Mission Control tab missing: ${tabId}`);
}
for (const expected of [
  "<CommandTabs",
  "MissionControlOverviewTab",
  "MissionControlWorkflowsTab",
  "MissionControlTasksTab",
  "MissionControlAgentsTab",
]) {
  check(commandCenterSource.includes(expected), "missionControlTabs", `Mission Control tabbed cockpit missing: ${expected}`);
}
for (const tabSet of [
  { exportName: "WORKSPACE_TABS", ids: ["recommended", "plan", "build", "validate", "govern", "release", "all"] },
  { exportName: "TASK_QUEUE_TABS", ids: ["planned", "active", "review", "blocked", "completed", "all-projects"] },
  { exportName: "WORKBENCH_TABS", ids: ["task", "review", "evidence", "activity", "context"] },
  { exportName: "IMPLEMENTATION_TABS", ids: ["proposal", "apply", "validation", "rollback", "activity", "developer-details"] },
]) {
  check(commandTabsSource.includes(`export const ${tabSet.exportName}`), "tabbedCorePages", `Missing tab config export: ${tabSet.exportName}`);
  for (const tabId of tabSet.ids) {
    check(commandTabsSource.includes(`id: "${tabId}"`), "tabbedCorePages", `${tabSet.exportName} missing tab id: ${tabId}`);
  }
}
for (const tabSet of [
  { exportName: "LIVE_API_TABS", ids: ["overview", "endpoints", "action-bridges", "diagnostics"] },
  { exportName: "DURABLE_STATE_TABS", ids: ["overview", "entities", "import-plan", "fallback", "developer-details"] },
  { exportName: "EVIDENCE_TABS", ids: ["timeline", "by-task", "by-agent", "by-project", "developer-details"] },
  { exportName: "SAFETY_CENTER_TABS", ids: ["posture", "policy-blocks", "approvals", "data-privacy", "developer-details"] },
  { exportName: "PROJECTS_TABS", ids: ["portfolio", "selected-project", "stack", "capabilities", "milestones", "gaps", "evidence", "settings-adapter"] },
  { exportName: "OS_ROADMAP_TABS", ids: ["current", "completed", "planned", "blocked-risks", "history"] },
  { exportName: "COST_CENTER_TABS", ids: ["overview", "budgets", "by-project", "by-agent", "provider-spend"] },
  { exportName: "BATCH_QUEUE_TABS", ids: ["overview", "jobs", "results", "cost"] },
]) {
  check(commandTabsSource.includes(`export const ${tabSet.exportName}`), "tabbedPlatformPages", `Missing tab config export: ${tabSet.exportName}`);
  for (const tabId of tabSet.ids) {
    check(commandTabsSource.includes(`id: "${tabId}"`), "tabbedPlatformPages", `${tabSet.exportName} missing tab id: ${tabId}`);
  }
}
for (const expected of [
  "tabs={WORKSPACE_TABS}",
  "tabs={TASK_QUEUE_TABS}",
  "tabs={WORKBENCH_TABS}",
  "tabs={IMPLEMENTATION_TABS}",
]) {
  check(commandCenterSource.includes(expected), "tabbedCorePages", `Operational page must reuse CommandTabs foundation: ${expected}`);
}
for (const expected of [
  "tabs={LIVE_API_TABS}",
  "tabs={DURABLE_STATE_TABS}",
  "tabs={EVIDENCE_TABS}",
  "tabs={SAFETY_CENTER_TABS}",
  "tabs={PROJECTS_TABS}",
  "tabs={roadmapTabs}",
  "tabs={COST_CENTER_TABS}",
  "tabs={BATCH_QUEUE_TABS}",
]) {
  check(commandCenterSource.includes(expected), "tabbedPlatformPages", `Platform/governance page must reuse CommandTabs foundation: ${expected}`);
}
for (const expectedTest of [
  "platform and governance pages render reusable tabs",
  "platform tabbed pages preserve theme readability and roadmap separation",
]) {
  check(routeTestSource.includes(expectedTest), "tabbedPlatformPages", `Route tests missing platform tab coverage: ${expectedTest}`);
}
for (const expectedTest of [
  "Workspace tabs route users through recommended, grouped, and all workflows",
  "Task Queue tabs separate planned, active, review, blocked, completed, and all projects",
  "Agent Workbench tabs separate task, review, evidence, activity, and context",
  "Implementation Workflow tabs separate proposal, apply, validation, rollback, activity, and developer details",
  "core operational pages prioritize active project context and keep DemoApp out",
]) {
  check(routeTestSource.includes(expectedTest), "tabbedCorePages", `Route tests missing operational tab coverage: ${expectedTest}`);
}
for (const expected of [
  "Active Project Context",
  "No project selected",
  "Create or import a project",
  "Add a project profile",
  "Define stack and test commands",
]) {
  check(commandCenterSource.includes(expected), "tabbedCorePages", `Active project/no-project guidance missing: ${expected}`);
}
check(!commandCenterSource.includes("function OperationalTabs"), "tabbedCorePages", "Do not introduce a duplicate one-off tab component");
for (const expected of [
  "Project Operating Surface",
  "Project Selector",
  "Selected Project",
  "Project Health",
  "Stack",
  "Project Capability Matrix",
  "OS Roadmap tracks NEXUS platform phases. Project milestones live under Projects.",
  "Why it matters",
  "Project Evidence",
  "Settings / Adapter",
  "Developer Details",
]) {
  check(commandCenterSource.includes(expected) || viewModelSource.includes(expected), "projectsEnterpriseUx", `Projects enterprise UX missing: ${expected}`);
}
for (const expected of [
  "Project Registry",
  "Profile",
  "Stack Profile",
  "Capability Matrix",
  "Adapter Runtime",
  "Project Mutation",
  "Provider Dispatch",
  "DB Writes",
]) {
  check(viewModelSource.includes(expected), "projectsEnterpriseUx", `Project health strip missing: ${expected}`);
}
for (const expected of [
  'id: "portfolio"',
  'id: "selected-project"',
  'id: "stack"',
  'id: "capabilities"',
  'id: "milestones"',
  'id: "gaps"',
  'id: "evidence"',
  'id: "settings-adapter"',
]) {
  check(commandTabsSource.includes(expected), "projectsEnterpriseUx", `Projects tabs missing ${expected}`);
}
for (const expected of [
  "Portfolio / All Projects",
  "No Project Selected Guidance",
  "Create Project",
  "Project onboarding action is not enabled yet",
  "Project mutation",
  "Provider dispatch",
  "DB writes",
]) {
  check(commandCenterSource.includes(expected), "projectsEnterpriseUx", `Projects productization copy missing: ${expected}`);
}
check(routeTestSource.includes("Projects page shows enterprise operating surface tabs and project boundary"), "projectsEnterpriseUx", "Route tests missing Projects enterprise tab coverage");
for (const expected of [
  "<ScopeSwitcher",
  "Portfolio view is planned with Project Registry in P42",
  "NEXUS OS scope is available through the OS Roadmap",
]) {
  check(commandCenterSource.includes(expected), "scopeSwitcher", `Scope switcher missing expected copy: ${expected}`);
}
for (const expected of [
  "<ProjectSwitcher",
  "projectSummaries",
  "portfolioSummary",
  "osSummary",
  "Project Registry will enable cross-project task aggregation",
]) {
  check(commandCenterSource.includes(expected) || viewModelSource.includes(expected), "multiProjectShell", `Multi-project shell missing: ${expected}`);
}
for (const expectedTest of [
  "Mission Control tab shell renders required tabs",
  "Mission Control tab navigation shows drilldown panels",
  "Mission Control scope shell shows project, portfolio, and OS context",
  "Mission Control scope-aware tabs show portfolio, project, and OS content",
]) {
  check(routeTestSource.includes(expectedTest), "commandCenterTabs", `Route tests missing tab coverage: ${expectedTest}`);
}

// Boundary polish
check(viewModelSource.includes('activeProject: safeProjectDisplayName'), "boundaryPolish", "Local-private Mission Control should use a safe project display name");
check(commandCenterSource.includes("Local Preview"), "boundaryPolish", "Sidebar should use a safe preview label instead of an arbitrary version");
check(!commandCenterNonRoadmapSource.includes("DEMOAPP ACTIVE"), "boundaryPolish", "Primary Command Center UX should not show DEMOAPP ACTIVE");
check(
  routeTestSource.includes("demo boundary keeps DemoApp on demo route only") ||
    routeTestSource.includes("DemoApp appears on demo route only"),
  "boundaryPolish",
  "Route tests missing DemoApp boundary coverage",
);
check(uxDocSource.includes("Sidebar Badge Semantics"), "boundaryPolish", "UX stabilization doc must record sidebar badge semantics");
check(phaseStatusSource.includes('"phaseId": "P41.6.6"'), "boundaryPolish", "OS phase status registry must include P41.6.6");

// Mission display
for (const expected of [
  "Mission ID",
  "Mission Prompt",
  "Read-only until mission edit workflow is enabled.",
  "Current State",
  "Next Action",
  "Pipeline Snapshot",
  "Verification Gates",
  "Activity Pulse",
]) {
  check(commandCenterSource.includes(expected) || viewModelSource.includes(expected), "missionDisplay", `Mission display missing expected copy: ${expected}`);
}
check(
  viewModelSource.includes("private-project-governed-build-mission")
    && commandCenterSource.includes("humanizeMissionId"),
  "missionDisplay",
  "Mission display should derive a human-readable title from the governed mission id",
);
check(!commandCenterSource.includes('ccv2-mission-cockpit__title">Mission Control'), "missionDisplay", "Mission Control title should not be duplicated inside the hero");
check(!commandCenterSource.includes("Venture Orchestration System"), "missionDisplay", "Old Venture Orchestration System wording should not remain in primary UX");
check(commandCenterSource.includes("NEXUS OS - Agentic Command Center"), "missionDisplay", "Command Center should set the updated browser/app title");
check(routeTestSource.includes("Mission Hero shows mission, scope, actions, and disabled reasons"), "missionDisplay", "Mission display tests missing updated hero coverage");

// Top bar polish
for (const expected of [
  "NEXUS",
  "ccv2-topbar__scope-chip",
  "Open Command Palette",
  "Open theme menu",
  "Use system theme",
  "Use dark theme",
  "Use light theme",
]) {
  check(topBarSource.includes(expected), "topBarPolish", `Top bar missing polished copy: ${expected}`);
}
for (const forbidden of ["Environment:", "Cmd/Ctrl+K", "THEME", "Local API:", "Durable State:"]) {
  check(!topBarSource.includes(forbidden), "topBarPolish", `Top bar still contains noisy copy: ${forbidden}`);
}
check(commandCenterSource.includes("DocsGuidesPage"), "topBarPolish", "Docs & Guides route should render a real docs page");
check(commandCenterSource.includes("Operator Guides"), "topBarPolish", "Docs & Guides should use operator-focused docs copy");
check(commandCenterSource.includes("navigate(`/command-center/docs/${guide.id}`)"), "topBarPolish", "Docs & Guides cards should navigate to guide panels");
check(!commandCenterSource.includes("ccv2-doc-card__path"), "topBarPolish", "Docs cards should not render raw paths as primary text");
check(!commandCenterSource.includes("ccv2-doc-card__action"), "topBarPolish", "Docs cards should not render separate Open guide links");
check(commandCenterSource.includes("ActivityLogPage"), "topBarPolish", "Activity Log should render an observability page");
check(commandCenterSource.includes("Activity Log is ready for summarized local records."), "topBarPolish", "Activity Log page copy missing");
for (const label of ["Overview", "Timeline", "By Agent", "By Task", "Failures & Blocks", "API & Actions", "Correlations"]) {
  check(commandCenterSource.includes(label), "topBarPolish", `Activity Log missing required tab/copy: ${label}`);
}
check(commandCenterSource.includes("ActivityFilterBar"), "topBarPolish", "Activity Log should include filter controls");
check(commandCenterSource.includes("UI/API/action instrumentation"), "topBarPolish", "Activity Log should identify instrumentation status");
check(commandCenterSource.includes("ActivityTracePanel"), "topBarPolish", "Activity Log should include trace details panel");
check(commandCenterSource.includes("Trace drilldown available"), "topBarPolish", "Activity Log should show trace readiness");
check(commandCenterSource.includes("Copy correlation ID"), "topBarPolish", "Activity Log should include trace copy action");
check(routeTestSource.includes("corr_traceview001"), "topBarPolish", "Route tests should cover trace drilldown fixture");
check(!commandCenterSource.includes("v4.7"), "topBarPolish", "Sidebar should not show arbitrary v4.7 version text");
check(routeTestSource.includes("top header is compact and omits noisy runtime badges"), "topBarPolish", "Route tests missing top-bar polish coverage");

// Action reasons
check(commandCenterSource.includes("Requires generated mission plan"), "actionReasons", "Mission Control should explain generated-plan prerequisites");
check(commandCenterSource.includes("Requires approved task plan"), "actionReasons", "Mission Control should explain approved-task-plan prerequisites");
check(
  !commandCenterSource.includes('mc.buttons?.[1]?.reason || "Requires governed action bridge"'),
  "actionReasons",
  "Create Project Brief should not default to a governed action bridge reason in source",
);
check(
  !commandCenterSource.includes('mc.buttons?.[2]?.reason || "Requires worker runtime"'),
  "actionReasons",
  "Start Governed Run should not default to a worker-runtime reason in source",
);
check(routeTestSource.includes("Mission Hero shows mission, scope, actions, and disabled reasons"), "actionReasons", "Route tests missing action-reason coverage");

// Screenshot audit
check(screenshotAuditSource.length > 0, "screenshotAudit", "capture-command-center-screenshots.js must exist");
for (const expected of [
  "reports/ui-audit",
  "manifest.json",
  "visual-qa-report.md",
  "dark",
  "light",
  "staleLabelsAbsent",
  "rawDumpAbsent",
  "themeControlVisible",
]) {
  check(screenshotAuditSource.includes(expected), "screenshotAudit", `Screenshot audit script missing expected contract marker: ${expected}`);
}
for (const expectedTest of [
  "screenshot audit script contract exists and manifest is compatible when generated",
  "implemented routes render in dark and light themes",
  "every primary route has a heading, state block, and no raw JSON dump",
]) {
  check(routeTestSource.includes(expectedTest), "screenshotAudit", `Route tests missing screenshot/theme audit coverage: ${expectedTest}`);
}
check(!!screenshotManifest, "screenshotAudit", "Screenshot manifest must parse");
check(screenshotManifest?.auditVersion === "1.0", "screenshotAudit", "Screenshot manifest auditVersion must be 1.0");
check(screenshotManifest?.phase === "P41.5.5", "screenshotAudit", "Screenshot manifest phase must be P41.5.5");
check(Array.isArray(screenshotManifest?.themes), "screenshotAudit", "Screenshot manifest themes must be an array");
check(screenshotManifest?.themes?.includes("dark"), "screenshotAudit", "Screenshot manifest must include dark theme");
check(screenshotManifest?.themes?.includes("light"), "screenshotAudit", "Screenshot manifest must include light theme");
check(Array.isArray(screenshotManifest?.routes), "screenshotAudit", "Screenshot manifest routes must be an array");
const screenshotRequiredRoutePaths = requiredRoutePaths.filter(
  (path) => ![
    "/command-center/services",
    "/command-center/memory",
    "/command-center/context",
    "/command-center/agent-rooms",
    "/command-center/skills",
    "/command-center/hooks",
    "/command-center/tools",
    "/command-center/triggers",
    "/command-center/api-batch",
  ].includes(path),
);
for (const path of screenshotRequiredRoutePaths) {
  const route = screenshotManifest?.routes?.find((entry) => entry.path === path);
  check(!!route, "screenshotAudit", `Screenshot manifest missing required route: ${path}`);
}
for (const route of screenshotManifest?.routes || []) {
  if (route.status === "captured") {
    check(!!route.screenshots?.dark, "screenshotAudit", `Captured route missing dark screenshot path: ${route.path}`);
    check(!!route.screenshots?.light, "screenshotAudit", `Captured route missing light screenshot path: ${route.path}`);
    if (route.screenshots?.dark) {
      check(existsSync(join(ROOT, route.screenshots.dark)), "screenshotAudit", `Dark screenshot file missing: ${route.screenshots.dark}`);
    }
    if (route.screenshots?.light) {
      check(existsSync(join(ROOT, route.screenshots.light)), "screenshotAudit", `Light screenshot file missing: ${route.screenshots.light}`);
    }
  }
  if (route.status === "skipped") {
    check(route.implemented === false || route.warnings?.length > 0, "screenshotAudit", `Skipped route should be marked planned/unavailable with a reason: ${route.path}`);
  }
}

// Visual QA report
check(visualQaReportSource.length > 0, "visualQaReport", "Visual QA report must exist");
for (const expected of [
  "# NEXUS Command Center Visual QA Report",
  "## Metadata",
  "Validation branch:",
  "Validation HEAD:",
  "## Scope",
  "## Summary",
  "## Route Coverage Table",
  "## UX Checks",
  "## Known Limitations",
  "## Next Phase",
]) {
  check(visualQaReportSource.includes(expected), "visualQaReport", `Visual QA report missing expected section: ${expected}`);
}

// OS Roadmap preservation
for (const phase of ["P26-P41", "P41.5.1", "P41.5.6", "P41.6.4", "P41.6.5", "P41.6.6", "P41.7.1", "P41.7.7", "P41.8.1", "P42", "P78"]) {
  check(
    Array.isArray(roadmapPhases) && roadmapPhases.some((entry) => entry.phase === phase),
    "roadmapPreservation",
    `OS roadmap data missing phase ${phase}`,
  );
}
check(Array.isArray(roadmapPhases) && roadmapPhases.length >= 30, "roadmapPreservation", "NEXUS_ROADMAP_PHASES should contain the expanded roadmap entries");
check(commandCenterSource.includes("OS Roadmap"), "roadmapPreservation", "CommandCenterV2.jsx missing OS Roadmap route");
for (const expectedTest of [
  "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage",
  "OS Roadmap and Projects render cleanly across theme changes",
]) {
  check(routeTestSource.includes(expectedTest), "roadmapPreservation", `Route tests missing roadmap coverage: ${expectedTest}`);
}

// Demo boundary
check(!commandCenterSource.includes("DEMOAPP ACTIVE"), "demoBoundary", "CommandCenterV2.jsx should not contain DEMOAPP ACTIVE");
check(!viewModelSource.includes('activeProject: studio.activeProject?.name || "DemoApp"'), "demoBoundary", "V2 view model should not default to DemoApp");
check(viewModelSource.includes('activeProject: safeProjectDisplayName'), "demoBoundary", "V2 view model should use a safe local-private project label");

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
  "dashboard/src/data/commandCenterViewModel.js",
  "dashboard/src/data/nexusRoadmap.js",
  "dashboard/src/hooks/useNexusTheme.js",
  "dashboard/src/styles-command-center-v2.css",
  "workspace/workflowTemplates.js",
  "workspace/workflowRecommendations.js",
  SCREENSHOT_AUDIT_SCRIPT_PATH,
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
console.log(`Theme hook: ${sections.themeHook ? "PASS" : "FAIL"}`);
console.log(`Theme tokens: ${sections.themeTokens ? "PASS" : "FAIL"}`);
console.log(`Theme control: ${sections.themeControl ? "PASS" : "FAIL"}`);
console.log(`Mission Control layout: ${sections.missionControlLayout ? "PASS" : "FAIL"}`);
console.log(`Page-specific UX: ${sections.pageSpecificUx ? "PASS" : "FAIL"}`);
console.log(`Service Health UX: ${sections.serviceHealthUx ? "PASS" : "FAIL"}`);
console.log(`Agent Rooms UX: ${sections.agentRoomsUx ? "PASS" : "FAIL"}`);
console.log(`Skill Registry UX: ${sections.skillRegistryUx ? "PASS" : "FAIL"}`);
console.log(`Hook Registry UX: ${sections.hookRegistryUx ? "PASS" : "FAIL"}`);
console.log(`Tool Gateway UX: ${sections.toolGatewayUx ? "PASS" : "FAIL"}`);
console.log(`Trigger + Integrations UX: ${sections.triggerIntegrationUx ? "PASS" : "FAIL"}`);
console.log(`API / Batch UX: ${sections.apiBatchUx ? "PASS" : "FAIL"}`);
console.log(`Test Center UX: ${sections.testCenterUx ? "PASS" : "FAIL"}`);
console.log(`Command palette: ${sections.commandPalette ? "PASS" : "FAIL"}`);
console.log(`Command Center help links: ${sections.commandCenterHelpLinks ? "PASS" : "FAIL"}`);
console.log(`Operator actions: ${sections.operatorActions ? "PASS" : "FAIL"}`);
console.log(`Command Center tabs: ${sections.commandCenterTabs ? "PASS" : "FAIL"}`);
console.log(`Route-wide tab contract: ${sections.routeWideTabContract ? "PASS" : "FAIL"}`);
console.log(`Mission Control tabs: ${sections.missionControlTabs ? "PASS" : "FAIL"}`);
console.log(`Tabbed core pages: ${sections.tabbedCorePages ? "PASS" : "FAIL"}`);
console.log(`Tabbed platform/governance pages: ${sections.tabbedPlatformPages ? "PASS" : "FAIL"}`);
console.log(`Scope boundary UX: ${sections.scopeBoundaryUx ? "PASS" : "FAIL"}`);
console.log(`Scope switcher: ${sections.scopeSwitcher ? "PASS" : "FAIL"}`);
console.log(`Multi-project shell: ${sections.multiProjectShell ? "PASS" : "FAIL"}`);
console.log(`OS Roadmap / Project Progress separation: ${sections.roadmapProjectSeparation ? "PASS" : "FAIL"}`);
console.log(`Header environment formatting: ${sections.headerFormatting ? "PASS" : "FAIL"}`);
console.log(`Sidebar label completeness/planned behavior: ${sections.sidebarPlannedBehavior ? "PASS" : "FAIL"}`);
console.log(`Boundary polish: ${sections.boundaryPolish ? "PASS" : "FAIL"}`);
console.log(`Mission display: ${sections.missionDisplay ? "PASS" : "FAIL"}`);
console.log(`Top bar polish: ${sections.topBarPolish ? "PASS" : "FAIL"}`);
console.log(`Action reasons: ${sections.actionReasons ? "PASS" : "FAIL"}`);
console.log(`Screenshot audit: ${sections.screenshotAudit ? "PASS" : "FAIL"}`);
console.log(`Visual QA report: ${sections.visualQaReport ? "PASS" : "FAIL"}`);
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
- Theme hook: ${sections.themeHook ? "PASS" : "FAIL"}
- Theme tokens: ${sections.themeTokens ? "PASS" : "FAIL"}
- Theme control: ${sections.themeControl ? "PASS" : "FAIL"}
- Mission Control layout: ${sections.missionControlLayout ? "PASS" : "FAIL"}
- Page-specific UX: ${sections.pageSpecificUx ? "PASS" : "FAIL"}
- Service Health UX: ${sections.serviceHealthUx ? "PASS" : "FAIL"}
- Agent Rooms UX: ${sections.agentRoomsUx ? "PASS" : "FAIL"}
- Skill Registry UX: ${sections.skillRegistryUx ? "PASS" : "FAIL"}
- Hook Registry UX: ${sections.hookRegistryUx ? "PASS" : "FAIL"}
- Tool Gateway UX: ${sections.toolGatewayUx ? "PASS" : "FAIL"}
- Trigger + Integrations UX: ${sections.triggerIntegrationUx ? "PASS" : "FAIL"}
- API / Batch UX: ${sections.apiBatchUx ? "PASS" : "FAIL"}
- Test Center UX: ${sections.testCenterUx ? "PASS" : "FAIL"}
- Command palette: ${sections.commandPalette ? "PASS" : "FAIL"}
- Command Center help links: ${sections.commandCenterHelpLinks ? "PASS" : "FAIL"}
- Operator actions: ${sections.operatorActions ? "PASS" : "FAIL"}
- Command Center tabs: ${sections.commandCenterTabs ? "PASS" : "FAIL"}
- Route-wide tab contract: ${sections.routeWideTabContract ? "PASS" : "FAIL"}
- Mission Control tabs: ${sections.missionControlTabs ? "PASS" : "FAIL"}
- Tabbed core pages: ${sections.tabbedCorePages ? "PASS" : "FAIL"}
- Scope boundary UX: ${sections.scopeBoundaryUx ? "PASS" : "FAIL"}
- Scope switcher: ${sections.scopeSwitcher ? "PASS" : "FAIL"}
- Multi-project shell: ${sections.multiProjectShell ? "PASS" : "FAIL"}
- OS Roadmap / Project Progress separation: ${sections.roadmapProjectSeparation ? "PASS" : "FAIL"}
- Header environment formatting: ${sections.headerFormatting ? "PASS" : "FAIL"}
- Sidebar label completeness/planned behavior: ${sections.sidebarPlannedBehavior ? "PASS" : "FAIL"}
- Boundary polish: ${sections.boundaryPolish ? "PASS" : "FAIL"}
- Mission display: ${sections.missionDisplay ? "PASS" : "FAIL"}
- Top bar polish: ${sections.topBarPolish ? "PASS" : "FAIL"}
- Action reasons: ${sections.actionReasons ? "PASS" : "FAIL"}
- Screenshot audit: ${sections.screenshotAudit ? "PASS" : "FAIL"}
- Visual QA report: ${sections.visualQaReport ? "PASS" : "FAIL"}
- Sidebar labels: ${sections.sidebarLabels ? "PASS" : "FAIL"}
- Workflow labels: ${sections.workflowLabels ? "PASS" : "FAIL"}
- Page copy: ${sections.pageCopy ? "PASS" : "FAIL"}
- OS Roadmap preservation: ${sections.roadmapPreservation ? "PASS" : "FAIL"}
- Demo boundary: ${sections.demoBoundary ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}
- Test Center UX (inline): ${sections.testCenterUx ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

if (result !== "PASS") {
  process.exitCode = 1;
}
