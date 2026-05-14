import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "docs-coverage-report.md");

const sections = {
  usageDocs: true,
  codebaseDocs: true,
  readmeLinks: true,
  helpLinks: true,
  localLinks: true,
  modeGuidance: true,
  noProjectGuidance: true,
  tabbedCommandCenterGuidance: true,
  publicSafeWording: true,
  reportWritten: true,
};

const failures = [];
const warnings = [];

const requiredUsageDocs = [
  "docs/usage/README.md",
  "docs/usage/GETTING_STARTED.md",
  "docs/usage/COMMAND_CENTER_GUIDE.md",
  "docs/usage/RUNNING_NEXUS_LOCALLY.md",
  "docs/usage/STARTING_A_MISSION.md",
  "docs/usage/ACTIVATING_TASKS.md",
  "docs/usage/USING_AGENT_WORKBENCH.md",
  "docs/usage/CONTROLLED_IMPLEMENTATION.md",
  "docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md",
  "docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md",
  "docs/usage/TROUBLESHOOTING.md",
  "docs/usage/FAQ.md",
];

const requiredCodebaseDocs = [
  "docs/codebase/README.md",
  "docs/codebase/CODE_DOCUMENTATION_STANDARD.md",
  "docs/codebase/MODULE_REGISTRY.md",
  "docs/codebase/REUSE_AND_REFACTOR_GUIDE.md",
  "docs/codebase/PHASE_MODULE_INDEX.md",
];

function read(relativePath) {
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
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function collectMarkdownLinks(relativePath) {
  const content = read(relativePath);
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  const links = [];
  for (const match of content.matchAll(regex)) {
    const target = match[1];
    if (!target || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) {
      continue;
    }
    links.push(target);
  }
  return links;
}

function validateLinksInFile(relativePath) {
  for (const target of collectMarkdownLinks(relativePath)) {
    const cleaned = target.split("#")[0];
    if (!cleaned) continue;
    const planned = /planned|future/i.test(read(relativePath));
    const resolved = resolve(dirname(join(ROOT, relativePath)), cleaned);
    if (!existsSync(resolved) && !planned) {
      fail("localLinks", `Broken local link in ${relativePath}: ${target}`);
    }
  }
}

function assertContains(source, expected, section, message) {
  check(source.includes(expected), section, message || `Missing required text: ${expected}`);
}

console.log("\nNEXUS Docs Coverage Check\n=========================\n");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of requiredUsageDocs) {
  check(existsSync(join(ROOT, file)), "usageDocs", `Missing usage doc: ${file}`);
  check(read(file).split("\n").length >= 8, "usageDocs", `Usage doc appears too compressed: ${file}`);
}

for (const file of requiredCodebaseDocs) {
  check(existsSync(join(ROOT, file)), "codebaseDocs", `Missing codebase doc: ${file}`);
}

const readme = read("README.md");
const usageReadme = read("docs/usage/README.md");
const gettingStarted = read("docs/usage/GETTING_STARTED.md");
const commandCenterGuide = read("docs/usage/COMMAND_CENTER_GUIDE.md");
const runningLocally = read("docs/usage/RUNNING_NEXUS_LOCALLY.md");
const demoModeGuide = read("docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md");
const troubleshootingGuide = read("docs/usage/TROUBLESHOOTING.md");
const evidenceGuide = read("docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md");
const controlledImplementation = read("docs/usage/CONTROLLED_IMPLEMENTATION.md");
const moduleRegistry = read("docs/codebase/MODULE_REGISTRY.md");
const phaseModuleIndex = read("docs/codebase/PHASE_MODULE_INDEX.md");
const helpLinksSource = read("dashboard/src/data/commandCenterHelpLinks.js");
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");

for (const expected of [
  "docs/usage",
  "docs/codebase",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
]) {
  assertContains(readme, expected, "readmeLinks", `README missing local docs link: ${expected}`);
}

for (const expected of [
  "Command Center Dashboard",
  "Mission Composer",
  "Live Local API",
  "DB Foundation + Durable State",
  "Unified Local Boot",
  "Reports and Checkers",
]) {
  assertContains(moduleRegistry, expected, "codebaseDocs", `Module registry missing family: ${expected}`);
}

for (const expected of ["P41.7.4", "P41.7.5", "P41.7.6"]) {
  assertContains(phaseModuleIndex, expected, "codebaseDocs", `Phase module index missing entry: ${expected}`);
}

for (const expected of [
  "create, import, or select a project",
  "add a project profile",
  "define stack and test commands",
  "create a mission",
  "generate a plan",
  "activate the first task",
]) {
  check(
    `${usageReadme}\n${gettingStarted}\n${troubleshootingGuide}`.toLowerCase().includes(expected.toLowerCase()),
    "noProjectGuidance",
    `No-project guidance missing: ${expected}`,
  );
}

for (const expected of ["active project", "Active Project", "Private Project"]) {
  check(
    `${gettingStarted}\n${commandCenterGuide}\n${demoModeGuide}`.includes(expected),
    "usageDocs",
    `Active-project guidance missing: ${expected}`,
  );
}

for (const expected of [
  "DemoApp is demo mode only",
  "Local-private",
  "Private Project",
  "must not use DemoApp as fallback",
]) {
  assertContains(`${demoModeGuide}\n${commandCenterGuide}`, expected, "modeGuidance", `Mode guidance missing: ${expected}`);
}

for (const expected of [
  "Using Command Center Tabs",
  "Scope and Project Shell",
  "Mission Control is tabbed",
  "Task Queue is tabbed",
  "Agent Workbench is tabbed",
  "Implementation Workflow is tabbed",
]) {
  assertContains(
    `${commandCenterGuide}\n${gettingStarted}\n${read("docs/usage/STARTING_A_MISSION.md")}\n${read("docs/usage/ACTIVATING_TASKS.md")}\n${read("docs/usage/USING_AGENT_WORKBENCH.md")}\n${controlledImplementation}`,
    expected,
    "tabbedCommandCenterGuidance",
    `Tabbed Command Center docs missing: ${expected}`,
  );
}

for (const expected of ["evidence", "audit", "redacted", "raw logs", "centralized activity log"]) {
  check(
    `${evidenceGuide}\n${commandCenterGuide}`.toLowerCase().includes(expected.toLowerCase()),
    "usageDocs",
    `Evidence/audit guidance missing: ${expected}`,
  );
}

for (const expected of ["disabled reason", "Requires governed action bridge", "Requires release action bridge"]) {
  check(
    `${commandCenterGuide}\n${controlledImplementation}\n${troubleshootingGuide}`.includes(expected),
    "usageDocs",
    `Disabled-action reason guidance missing: ${expected}`,
  );
}

for (const expected of ["nexus:up", "nexus:down", "nexus:status", "nexus:doctor"]) {
  assertContains(runningLocally, expected, "usageDocs", `Local boot docs missing command: ${expected}`);
}

for (const expected of [
  "mission",
  "workspace",
  "tasks",
  "workbench",
  "implementation",
  "evidence",
  "safety",
  "projects",
  "liveapi",
  "database",
  "services",
  "roadmap",
  "commandPalette",
]) {
  assertContains(helpLinksSource, `${expected}:`, "helpLinks", `Help-link map missing route/capability key: ${expected}`);
}

for (const expected of ["mission", "workspace", "tasks", "workbench", "implementation", "evidence", "safety", "projects", "liveapi", "database", "services", "roadmap"]) {
  assertContains(routeSource, `key: "${expected}"`, "helpLinks", `Route matrix missing help-covered route: ${expected}`);
}

for (const match of helpLinksSource.matchAll(/docPath: "([^"]+)"/g)) {
  check(existsSync(join(ROOT, match[1])), "helpLinks", `Help-link docPath does not exist: ${match[1]}`);
}

for (const file of ["README.md", ...requiredUsageDocs, ...requiredCodebaseDocs]) {
  validateLinksInFile(file);
}

for (const file of requiredUsageDocs) {
  if (file.endsWith("DEMO_MODE_VS_PRIVATE_MODE.md")) continue;
  const content = read(file);
  const demoMentions = content.match(/DemoApp/g) || [];
  const hasSafeBoundaryCopy = content.includes("DemoApp is demo mode only")
    || content.includes("DemoApp-only public-safe")
    || content.includes("DemoApp-safe");
  check(
    demoMentions.length === 0 || hasSafeBoundaryCopy,
    "publicSafeWording",
    `DemoApp mention must be explicitly demo-safe in ${file}`,
  );
}

for (const file of requiredCodebaseDocs) {
  const content = read(file).toLowerCase();
  for (const forbidden of ["careloop", "shiftpay", "projects/careloop", "projects/careloop-ios"]) {
    check(!content.includes(forbidden), "publicSafeWording", `Codebase doc contains private-project detail (${forbidden}): ${file}`);
  }
}

warnings.push("Known public-safety roadmap-doc false positives may still keep check:public-safety red outside this docs checker.");

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

const report = `# NEXUS Docs Coverage Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- Usage docs: ${sections.usageDocs ? "PASS" : "FAIL"}
- Codebase docs: ${sections.codebaseDocs ? "PASS" : "FAIL"}
- README links: ${sections.readmeLinks ? "PASS" : "FAIL"}
- Help links: ${sections.helpLinks ? "PASS" : "FAIL"}
- Local links: ${sections.localLinks ? "PASS" : "FAIL"}
- Mode guidance: ${sections.modeGuidance ? "PASS" : "FAIL"}
- No-project guidance: ${sections.noProjectGuidance ? "PASS" : "FAIL"}
- Tabbed Command Center guidance: ${sections.tabbedCommandCenterGuidance ? "PASS" : "FAIL"}
- Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Warnings

${warnings.length === 0 ? "- None" : warnings.map((warning) => `- ${warning}`).join("\n")}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

try {
  writeFileSync(REPORT_PATH, report, "utf8");
} catch (error) {
  fail("reportWritten", `Could not write ${REPORT_PATH}: ${error.message}`);
}

console.log(`Usage docs: ${sections.usageDocs ? "PASS" : "FAIL"}`);
console.log(`Codebase docs: ${sections.codebaseDocs ? "PASS" : "FAIL"}`);
console.log(`README links: ${sections.readmeLinks ? "PASS" : "FAIL"}`);
console.log(`Help links: ${sections.helpLinks ? "PASS" : "FAIL"}`);
console.log(`Local links: ${sections.localLinks ? "PASS" : "FAIL"}`);
console.log(`Mode guidance: ${sections.modeGuidance ? "PASS" : "FAIL"}`);
console.log(`No-project guidance: ${sections.noProjectGuidance ? "PASS" : "FAIL"}`);
console.log(`Tabbed Command Center guidance: ${sections.tabbedCommandCenterGuidance ? "PASS" : "FAIL"}`);
console.log(`Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${Object.values(sections).every(Boolean) ? "PASS" : "FAIL"}`);

if (!Object.values(sections).every(Boolean)) {
  process.exitCode = 1;
}
