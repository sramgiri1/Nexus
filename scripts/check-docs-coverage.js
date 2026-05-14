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

const requiredPhaseEntries = ["P41.6.6", "P41.7.1"];

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

console.log("\nNEXUS Docs Coverage Check\n=========================\n");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of requiredCodebaseDocs) {
  check(existsSync(join(ROOT, file)), "codebaseDocsFolder", `Missing codebase doc: ${file}`);
}

const standardDoc = read("docs/codebase/CODE_DOCUMENTATION_STANDARD.md");
const moduleRegistryDoc = read("docs/codebase/MODULE_REGISTRY.md");
const phaseIndexDoc = read("docs/codebase/PHASE_MODULE_INDEX.md");
const readme = read("README.md");

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
