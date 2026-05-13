import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/docs-coverage-report.md");

const sections = {
  usageDocs: true,
  codebaseDocs: true,
  readmeLinks: true,
  architectureDocs: true,
  diagramRegistry: true,
  localLinks: true,
  publicPrivateSafety: true,
  limitationsDocumented: true,
  formattingReadability: true,
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

const requiredDiagramIds = [
  "nexus-enterprise-architecture",
  "nexus-roadmap",
  "command-center-flow",
  "project-os-boundary",
  "agent-governance",
  "runtime-self-healing",
  "agent-a2a-a2h-interaction",
  "sentinel-agent-flow",
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

function lineWarnings(relativePath) {
  const content = read(relativePath);
  return content
    .split("\n")
    .map((line, index) => ({ lineNumber: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000);
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

console.log("\nNEXUS Docs Coverage Check\n=========================\n");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of requiredUsageDocs) {
  check(existsSync(join(ROOT, file)), "usageDocs", `Missing usage doc: ${file}`);
}

for (const file of requiredCodebaseDocs) {
  check(existsSync(join(ROOT, file)), "codebaseDocs", `Missing codebase doc: ${file}`);
}

const readme = read("README.md");
check(readme.includes("docs/usage"), "readmeLinks", "README must link to docs/usage");
check(readme.includes("docs/codebase"), "readmeLinks", "README must link to docs/codebase");
check(readme.includes("docs/architecture/NEXUS_PLATFORM_ROADMAP.md"), "readmeLinks", "README must link to the architecture roadmap");

check(existsSync(join(ROOT, "docs/architecture/COMMAND_CENTER_UX_STABILIZATION.md")), "architectureDocs", "Missing COMMAND_CENTER_UX_STABILIZATION.md");
check(existsSync(join(ROOT, "docs/architecture/AGENTIC_OS_ARCHITECTURE.md")), "architectureDocs", "Missing AGENTIC_OS_ARCHITECTURE.md");
check(existsSync(join(ROOT, "docs/architecture/NEXUS_PLATFORM_ROADMAP.md")), "architectureDocs", "Missing NEXUS_PLATFORM_ROADMAP.md");

let registry = null;
try {
  registry = JSON.parse(read("docs/architecture/diagrams/diagram-registry.json"));
} catch (error) {
  fail("diagramRegistry", `Could not parse diagram-registry.json: ${error.message}`);
}

check(!!registry, "diagramRegistry", "Diagram registry must parse");
check(Array.isArray(registry?.diagrams), "diagramRegistry", "Diagram registry must contain a diagrams array");
for (const id of requiredDiagramIds) {
  check(registry?.diagrams?.some((diagram) => diagram.id === id), "diagramRegistry", `Diagram registry missing id: ${id}`);
}

const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
check(routeSource.includes("helpDoc"), "usageDocs", "commandCenterRoutes.js should contain helpDoc mappings when docs finalization is enabled");

const docsToValidateLinks = [
  "README.md",
  ...requiredUsageDocs,
  ...requiredCodebaseDocs,
  "docs/architecture/COMMAND_CENTER_UX_STABILIZATION.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/diagrams/README.md",
];

for (const file of docsToValidateLinks) {
  validateLinksInFile(file);
}

const publicSafeDocs = ["README.md", ...requiredUsageDocs];
for (const file of publicSafeDocs) {
  const content = read(file).toLowerCase();
  for (const forbidden of ["careloop", "shiftpay", "projects/careloop", "projects/careloop-ios"]) {
    check(!content.includes(forbidden), "publicPrivateSafety", `Public-safe doc contains private-project detail (${forbidden}): ${file}`);
  }
}

check(read("docs/usage/GETTING_STARTED.md").includes("Unified boot is planned for P41.6"), "limitationsDocumented", "GETTING_STARTED.md must mention unified boot limitation");
check(read("docs/usage/RUNNING_NEXUS_LOCALLY.md").includes("Unified boot is planned for P41.6"), "limitationsDocumented", "RUNNING_NEXUS_LOCALLY.md must mention unified boot limitation");
check(read("docs/usage/TROUBLESHOOTING.md").includes("check:public-safety"), "limitationsDocumented", "TROUBLESHOOTING.md must document the known public-safety false positive");
check(read("docs/usage/FAQ.md").includes("P42"), "limitationsDocumented", "FAQ.md must mention a current planned limitation or next phase");

for (const file of [
  "README.md",
  ...requiredUsageDocs,
  ...requiredCodebaseDocs,
  "docs/architecture/COMMAND_CENTER_UX_STABILIZATION.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/diagrams/README.md",
]) {
  const warningsForFile = lineWarnings(file);
  if (warningsForFile.length > 0) {
    fail("formattingReadability", `${file} contains lines over 1000 characters`);
  }
}

warnings.push("Known public-safety false positives in docs/architecture/NEXUS_PLATFORM_ROADMAP.md may still keep check:public-safety red outside this docs checker.");

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Usage docs: ${sections.usageDocs ? "PASS" : "FAIL"}`);
console.log(`Codebase docs: ${sections.codebaseDocs ? "PASS" : "FAIL"}`);
console.log(`README links: ${sections.readmeLinks ? "PASS" : "FAIL"}`);
console.log(`Architecture docs: ${sections.architectureDocs ? "PASS" : "FAIL"}`);
console.log(`Diagram registry: ${sections.diagramRegistry ? "PASS" : "FAIL"}`);
console.log(`Local links: ${sections.localLinks ? "PASS" : "FAIL"}`);
console.log(`Public/private safety: ${sections.publicPrivateSafety ? "PASS" : "FAIL"}`);
console.log(`Limitations documented: ${sections.limitationsDocumented ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`);
console.log(`\nResult: ${result}`);

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
- Architecture docs: ${sections.architectureDocs ? "PASS" : "FAIL"}
- Diagram registry: ${sections.diagramRegistry ? "PASS" : "FAIL"}
- Local links: ${sections.localLinks ? "PASS" : "FAIL"}
- Public/private safety: ${sections.publicPrivateSafety ? "PASS" : "FAIL"}
- Limitations documented: ${sections.limitationsDocumented ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}

## Warnings

${warnings.map((warning) => `- ${warning}`).join("\n")}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

if (result !== "PASS") {
  process.exitCode = 1;
}
