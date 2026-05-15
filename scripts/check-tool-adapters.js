import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { TOOL_ADAPTER_PREVIEWS, listToolAdapterPreviews } from "../tool-governance/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/tool-adapters-report.md");
const sections = {
  modules: true,
  adapterContracts: true,
  previews: true,
  noRuntimeImports: true,
  docs: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  reportWritten: true,
};
const failures = [];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function parseJson(relativePath, section) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(section, `${relativePath} did not parse: ${error.message}`);
    return {};
  }
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

function changedFiles() {
  return gitOutput(["status", "--short"])
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

console.log("NEXUS Tool Adapter Preview Check");
console.log("================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");

const adapterFiles = [
  "tool-governance/adapters/gitAdapter.js",
  "tool-governance/adapters/testRunnerAdapter.js",
  "tool-governance/adapters/filesystemBoundaryAdapter.js",
  "tool-governance/adapters/playwrightAdapter.js",
  "tool-governance/adapters/index.js",
];
for (const file of adapterFiles) check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
check(packageJson.scripts?.["check:tool-adapters"] === "node scripts/check-tool-adapters.js", "modules", "Missing package script check:tool-adapters");

for (const [adapterKey, adapter] of Object.entries(TOOL_ADAPTER_PREVIEWS)) {
  for (const exportName of [
    "describeAdapter",
    "listSupportedMethods",
    "validateAdapterRequest",
    "previewAdapterAction",
    "getAdapterSafetySummary",
  ]) {
    check(typeof adapter[exportName] === "function", "adapterContracts", `${adapterKey} missing ${exportName}`);
  }
  const description = adapter.describeAdapter();
  const methods = adapter.listSupportedMethods();
  const preview = adapter.previewAdapterAction({ method: methods[0] });
  const safety = adapter.getAdapterSafetySummary();
  check(description.executionEnabled === false, "adapterContracts", `${adapterKey} must keep execution disabled`);
  check(preview.previewOnly === true && preview.executed === false, "previews", `${adapterKey} preview must not execute`);
  check(Object.values(safety).every((value) => value === false), "previews", `${adapterKey} safety summary must be fully disabled`);
}
check(listToolAdapterPreviews().length === 4, "adapterContracts", "Expected four adapter previews");

for (const file of adapterFiles) {
  const source = read(file);
  for (const forbidden of ["child_process", "exec(", "spawn(", "fetch(", "writeFile", "appendFile", "open("]) {
    check(!source.includes(forbidden), "noRuntimeImports", `${file} includes forbidden runtime pattern: ${forbidden}`);
  }
}

const docs = read("docs/architecture/TOOL_MCP_REGISTRY_AND_GOVERNANCE.md");
check(docs.includes("P52.7 - Safe Tool Adapter Previews"), "docs", "Architecture doc missing P52.7");
check(docs.includes("do not execute"), "docs", "Architecture doc missing no-execution wording");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P52.6")?.status === "complete", "osPhaseStatus", "P52.6 must be complete");
check(statusById.get("P52.6")?.commit === "f70e5ce", "osPhaseStatus", "P52.6 commit must be f70e5ce");
check(statusById.get("P52.7")?.status === "complete", "osPhaseStatus", "P52.7 must be complete");
check(["planned", "complete"].includes(statusById.get("P52.8")?.status), "osPhaseStatus", "P52.8 must be planned or complete");
check(Boolean(statusById.get(phaseStatus.currentPhase)), "osPhaseStatus", "Current phase entry must exist");
check(Boolean(statusById.get(phaseStatus.nextPhase)), "osPhaseStatus", "Next phase entry must exist");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Tool Adapter Preview Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P52.7 - Safe Tool Adapter Previews

## Summary

- Adapter previews: ${listToolAdapterPreviews().length}
- Runtime execution enabled: false
- Browser launch enabled: false
- Filesystem writes enabled: false
- Shell execution enabled: false

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Adapter contracts: ${sections.adapterContracts ? "PASS" : "FAIL"}
- Previews: ${sections.previews ? "PASS" : "FAIL"}
- No runtime imports: ${sections.noRuntimeImports ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

## Result

${result}
`;

try {
  writeFileSync(REPORT_PATH, report, "utf8");
} catch (error) {
  fail("reportWritten", `Could not write report: ${error.message}`);
}

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Adapter contracts: ${sections.adapterContracts ? "PASS" : "FAIL"}`);
console.log(`Previews: ${sections.previews ? "PASS" : "FAIL"}`);
console.log(`No runtime imports: ${sections.noRuntimeImports ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
