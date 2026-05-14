import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "docs-coverage-report.md");

const sections = {
  codebaseDocsFolder: true,
  documentationStandard: true,
  moduleRegistry: true,
  phaseModuleIndex: true,
  readmeLinks: true,
  requiredModuleFamilies: true,
  requiredPhaseEntries: true,
  publicSafeWording: true,
  usageDocs: true,
  noProjectGuidance: true,
  modeGuidance: true,
  tabbedCommandCenter: true,
  helpLinks: true,
  localLinks: true,
  reportWritten: true,
};

const failures = [];
const warnings = [];

const requiredCodebaseDocs = [
  "docs/codebase/README.md",
  "docs/codebase/CODE_DOCUMENTATION_STANDARD.md",
  "docs/codebase/MODULE_REGISTRY.md",
  "docs/codebase/PHASE_MODULE_INDEX.md",
];

const requiredModuleFamilies = [
  "Command Center Dashboard",
  "Mission Composer",
  "Live Local API",
  "DB Foundation + Durable State",
  "Unified Local Boot",
  "Policies",
  "Reports and Checkers",
];

const requiredPhaseEntries = ["P41.6.6", "P41.7.1", "P41.7.2"];

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
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
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
    const resolved = resolve(dirname(join(ROOT, relativePath)), cleaned);
    if (!existsSync(resolved)) {
      fail("localLinks", `Broken local link in ${relativePath}: ${target}`);
    }
  }
}

function getLongLineFailures(relativePath) {
  return read(relativePath)
    .split("\n")
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter((entry) => entry.line.length > 1000);
}

console.log("\nNEXUS Docs Coverage Check\n=========================\n");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of requiredCodebaseDocs) {
  check(existsSync(join(ROOT, file)), "codebaseDocsFolder", `Missing codebase doc: ${file}`);
}
for (const file of requiredUsageDocs) {
  check(existsSync(join(ROOT, file)), "usageDocs", `Missing usage doc: ${file}`);
}

const standardDoc = read("docs/codebase/CODE_DOCUMENTATION_STANDARD.md");
const moduleRegistryDoc = read("docs/codebase/MODULE_REGISTRY.md");
const phaseIndexDoc = read("docs/codebase/PHASE_MODULE_INDEX.md");
const readme = read("README.md");
const usageReadme = read("docs/usage/README.md");
const commandCenterGuide = read("docs/usage/COMMAND_CENTER_GUIDE.md");
const gettingStarted = read("docs/usage/GETTING_STARTED.md");
const demoModeGuide = read("docs/usage/DEMO_MODE_VS_PRIVATE_MODE.md");
const troubleshootingGuide = read("docs/usage/TROUBLESHOOTING.md");
const helpLinksSource = read("dashboard/src/data/commandCenterHelpLinks.js");
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
const phaseStatusSource = read("os-roadmap/phase-status.json");

for (const requiredField of [
  "Purpose",
  "Public exports",
  "Inputs",
  "Outputs",
  "Safety boundary",
  "Tests/checkers",
]) {
  check(
    standardDoc.toLowerCase().includes(requiredField.toLowerCase()),
    "documentationStandard",
    `Documentation standard missing required field: ${requiredField}`,
  );
}

for (const moduleFamily of requiredModuleFamilies) {
  check(
    moduleRegistryDoc.includes(moduleFamily),
    "requiredModuleFamilies",
    `Module registry missing family: ${moduleFamily}`,
  );
}

for (const phaseId of requiredPhaseEntries) {
  check(
    phaseIndexDoc.includes(phaseId),
    "requiredPhaseEntries",
    `Phase module index missing required phase entry: ${phaseId}`,
  );
}

check(
  readme.includes("docs/codebase/README.md") || readme.includes("docs/codebase/MODULE_REGISTRY.md"),
  "readmeLinks",
  "README must link to the codebase docs landing page or module registry",
);
check(
  readme.includes("docs/usage") && readme.includes("COMMAND_CENTER_GUIDE"),
  "readmeLinks",
  "README must link to usage docs and the Command Center guide",
);

check(
  moduleRegistryDoc.includes("Status:"),
  "moduleRegistry",
  "Module registry should describe module family status values",
);

check(
  phaseIndexDoc.includes("Primary capability") && phaseIndexDoc.includes("Main checker(s)") && phaseIndexDoc.includes("Safety impact"),
  "phaseModuleIndex",
  "Phase module index must include capability, checker, and safety-impact structure",
);

for (const file of ["README.md", ...requiredCodebaseDocs]) {
  validateLinksInFile(file);
}
for (const file of requiredUsageDocs) {
  validateLinksInFile(file);
}

for (const file of requiredCodebaseDocs) {
  const content = read(file).toLowerCase();
  for (const forbidden of ["careloop", "shiftpay", "projects/careloop", "projects/careloop-ios"]) {
    check(
      !content.includes(forbidden),
      "publicSafeWording",
      `Codebase doc contains private-project detail (${forbidden}): ${file}`,
    );
  }
}

for (const expected of [
  "Getting Started",
  "Command Center Guide",
  "Running NEXUS Locally",
  "Demo Mode vs Private Mode",
  "Troubleshooting",
  "FAQ",
]) {
  check(usageReadme.includes(expected), "usageDocs", `Usage README missing link or section: ${expected}`);
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

for (const expected of [
  "DemoApp is demo mode only",
  "Local-private",
  "Private Project",
  "must not use DemoApp as fallback",
]) {
  check(
    `${demoModeGuide}\n${commandCenterGuide}`.includes(expected),
    "modeGuidance",
    `Mode guidance missing: ${expected}`,
  );
}

for (const expected of [
  "Using Command Center Tabs",
  "Scope and Project Shell",
  "Roadmap Separation",
  "Mission Control is tabbed",
  "Task Queue is tabbed",
  "Agent Workbench is tabbed",
  "Implementation Workflow is tabbed",
]) {
  check(
    `${commandCenterGuide}\n${gettingStarted}\n${read("docs/usage/STARTING_A_MISSION.md")}\n${read("docs/usage/ACTIVATING_TASKS.md")}\n${read("docs/usage/USING_AGENT_WORKBENCH.md")}\n${read("docs/usage/CONTROLLED_IMPLEMENTATION.md")}`.includes(expected),
    "tabbedCommandCenter",
    `Tabbed Command Center docs missing: ${expected}`,
  );
}

for (const expected of [
  "COMMAND_CENTER_HELP_LINKS",
  "STARTING_A_MISSION.md",
  "COMMAND_CENTER_GUIDE.md",
  "ACTIVATING_TASKS.md",
  "USING_AGENT_WORKBENCH.md",
  "CONTROLLED_IMPLEMENTATION.md",
  "UNDERSTANDING_EVIDENCE_AUDIT.md",
  "RUNNING_NEXUS_LOCALLY.md",
  "DEMO_MODE_VS_PRIVATE_MODE.md",
]) {
  check(helpLinksSource.includes(expected), "helpLinks", `Help-link map missing: ${expected}`);
}

for (const expected of [
  "safety",
  "projects",
  "roadmap",
  "troubleshooting",
  "faq",
]) {
  check(helpLinksSource.includes(`${expected}:`), "helpLinks", `Help-link map missing route key: ${expected}`);
}

const helpDocPathMatches = [...helpLinksSource.matchAll(/docPath: "([^"]+)"/g)];
for (const match of helpDocPathMatches) {
  check(existsSync(join(ROOT, match[1])), "helpLinks", `Help-link docPath does not exist: ${match[1]}`);
}

for (const expectedRouteKey of [
  "mission",
  "workspace",
  "tasks",
  "workbench",
  "implementation",
  "evidence",
  "liveapi",
  "services",
  "safety",
  "projects",
  "roadmap",
  "demo",
]) {
  check(routeSource.includes(`key: "${expectedRouteKey}"`), "helpLinks", `Route matrix missing help-covered route: ${expectedRouteKey}`);
}

check(phaseStatusSource.trim().length > 0, "usageDocs", "phase-status.json must be non-empty");

for (const file of requiredUsageDocs) {
  const content = read(file);
  const lines = content.split("\n");
  check(lines.length >= 8, "usageDocs", `Usage doc appears too compressed: ${file}`);
  for (const longLine of getLongLineFailures(file)) {
    fail("usageDocs", `${file}:${longLine.lineNumber} exceeds 1000 characters`);
  }
  if (file.endsWith("DEMO_MODE_VS_PRIVATE_MODE.md")) continue;
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

warnings.push(
  "Known public-safety roadmap-doc false positives may still keep check:public-safety red outside this docs checker.",
);

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Codebase docs folder: ${sections.codebaseDocsFolder ? "PASS" : "FAIL"}`);
console.log(`Documentation standard: ${sections.documentationStandard ? "PASS" : "FAIL"}`);
console.log(`Module registry: ${sections.moduleRegistry ? "PASS" : "FAIL"}`);
console.log(`Phase module index: ${sections.phaseModuleIndex ? "PASS" : "FAIL"}`);
console.log(`README links: ${sections.readmeLinks ? "PASS" : "FAIL"}`);
console.log(`Required module families: ${sections.requiredModuleFamilies ? "PASS" : "FAIL"}`);
console.log(`Required phase entries: ${sections.requiredPhaseEntries ? "PASS" : "FAIL"}`);
console.log(`Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}`);
console.log(`Usage docs: ${sections.usageDocs ? "PASS" : "FAIL"}`);
console.log(`No-project guidance: ${sections.noProjectGuidance ? "PASS" : "FAIL"}`);
console.log(`Mode guidance: ${sections.modeGuidance ? "PASS" : "FAIL"}`);
console.log(`Tabbed Command Center: ${sections.tabbedCommandCenter ? "PASS" : "FAIL"}`);
console.log(`Help links: ${sections.helpLinks ? "PASS" : "FAIL"}`);
console.log(`Local links: ${sections.localLinks ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`\nResult: ${result}`);

const report = `# NEXUS Docs Coverage Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- Codebase docs folder: ${sections.codebaseDocsFolder ? "PASS" : "FAIL"}
- Documentation standard: ${sections.documentationStandard ? "PASS" : "FAIL"}
- Module registry: ${sections.moduleRegistry ? "PASS" : "FAIL"}
- Phase module index: ${sections.phaseModuleIndex ? "PASS" : "FAIL"}
- README links: ${sections.readmeLinks ? "PASS" : "FAIL"}
- Required module families: ${sections.requiredModuleFamilies ? "PASS" : "FAIL"}
- Required phase entries: ${sections.requiredPhaseEntries ? "PASS" : "FAIL"}
- Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}
- Usage docs: ${sections.usageDocs ? "PASS" : "FAIL"}
- No-project guidance: ${sections.noProjectGuidance ? "PASS" : "FAIL"}
- Mode guidance: ${sections.modeGuidance ? "PASS" : "FAIL"}
- Tabbed Command Center: ${sections.tabbedCommandCenter ? "PASS" : "FAIL"}
- Help links: ${sections.helpLinks ? "PASS" : "FAIL"}
- Local links: ${sections.localLinks ? "PASS" : "FAIL"}
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

if (!Object.values(sections).every(Boolean)) {
  process.exitCode = 1;
}
