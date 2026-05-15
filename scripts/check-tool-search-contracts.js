import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getToolContract,
  previewToolExecution,
  searchTools,
  summarizeToolSearchResults,
  TOOL_GATEWAY_DECISIONS,
  validateToolContract,
} from "../tool-governance/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/tool-search-contracts-report.md");
const sections = {
  modules: true,
  contracts: true,
  search: true,
  preview: true,
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

console.log("NEXUS Tool Search + Contracts Check");
console.log("===================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const context = {
  agentId: "AUDITOR",
  projectId: "private-project",
  scope: "NEXUS_OS_CHANGE",
  dataClassification: "internal",
};

for (const file of [
  "tool-governance/toolSearch.js",
  "tool-governance/toolContractLoader.js",
  "tool-governance/toolExecutionPreview.js",
  "tool-governance/contracts/git-status.json",
  "tool-governance/contracts/git-diff.json",
  "tool-governance/contracts/test-runner.json",
  "tool-governance/contracts/filesystem-boundary.json",
  "tool-governance/contracts/playwright-browser.json",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
}

check(
  packageJson.scripts?.["check:tool-search-contracts"] === "node scripts/check-tool-search-contracts.js",
  "modules",
  "Missing package script check:tool-search-contracts",
);

for (const contractPath of [
  "tool-governance/contracts/git-status.json",
  "tool-governance/contracts/git-diff.json",
  "tool-governance/contracts/test-runner.json",
  "tool-governance/contracts/filesystem-boundary.json",
  "tool-governance/contracts/playwright-browser.json",
]) {
  const contract = parseJson(contractPath, "contracts");
  const validation = validateToolContract(contract);
  check(validation.valid, "contracts", `${contractPath} invalid: ${validation.errors.join("; ")}`);
  check(contract.executionEnabled === false, "contracts", `${contractPath} must keep execution disabled`);
}

const results = searchTools("git", context);
const summary = summarizeToolSearchResults(results);
check(results.length >= 2, "search", "Search for git should return git tool summaries");
check(results.every((result) => !("inputSchema" in result) && !("outputSchema" in result)), "search", "Search results must not include raw schemas");
check(summary.resultCount === results.length, "search", "Search summary count mismatch");

const contractResult = getToolContract("git-diff", context);
check(contractResult.allowed === true, "contracts", "Selected git-diff contract should load for allowed context");
check(contractResult.contract?.toolId === "git-diff", "contracts", "Loaded contract should match selected tool");
const unavailableContract = getToolContract("github-pr", context);
check(unavailableContract.allowed === false, "contracts", "Unavailable planned contract should not load");

const preview = previewToolExecution({
  toolId: "git-diff",
  method: "diff",
  context,
});
check(preview.previewOnly === true, "preview", "Preview must be marked preview-only");
check(preview.executed === false, "preview", "Preview must not execute");
check(preview.decision === TOOL_GATEWAY_DECISIONS.BLOCKED_RUNTIME_DISABLED, "preview", "Execution preview must be runtime-disabled");

const docs = read("docs/architecture/TOOL_MCP_REGISTRY_AND_GOVERNANCE.md");
check(docs.includes("P52.4 - Tool Search + Contract Preview"), "docs", "Architecture doc missing P52.4");
check(docs.includes("selected contract"), "docs", "Architecture doc missing selected contract wording");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P52.3")?.status === "complete", "osPhaseStatus", "P52.3 must be complete");
check(statusById.get("P52.3")?.commit === "607210b", "osPhaseStatus", "P52.3 commit must be 607210b");
check(statusById.get("P52.4")?.status === "complete", "osPhaseStatus", "P52.4 must be complete");
check(["planned", "complete"].includes(statusById.get("P52.5")?.status), "osPhaseStatus", "P52.5 must be planned or complete");
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
const report = `# NEXUS Tool Search + Contracts Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P52.4 - Tool Search + Contract Preview

## Summary

- Search result count for sample query: ${summary.resultCount}
- Search categories: ${summary.categories.join(", ")}
- Loaded selected contract: ${contractResult.contract?.toolId || "none"}
- Execution preview decision: ${preview.decision}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Contracts: ${sections.contracts ? "PASS" : "FAIL"}
- Search: ${sections.search ? "PASS" : "FAIL"}
- Preview: ${sections.preview ? "PASS" : "FAIL"}
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
console.log(`Contracts: ${sections.contracts ? "PASS" : "FAIL"}`);
console.log(`Search: ${sections.search ? "PASS" : "FAIL"}`);
console.log(`Preview: ${sections.preview ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
