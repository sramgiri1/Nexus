import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  detectAllToolsInContext,
  enforceLazyContractLoading,
  summarizeContextBudget,
  validateToolContextBudget,
} from "../tool-governance/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/lazy-tool-context-report.md");
const sections = {
  modules: true,
  policy: true,
  enforcement: true,
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

console.log("NEXUS Lazy Tool Context Check");
console.log("=============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const policy = parseJson("policy/lazy-tool-context-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");

for (const file of [
  "tool-governance/lazyContractPolicy.js",
  "tool-governance/contextBudgetGuard.js",
  "policy/lazy-tool-context-policy.json",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
}
check(packageJson.scripts?.["check:lazy-tool-context"] === "node scripts/check-lazy-tool-context.js", "modules", "Missing package script check:lazy-tool-context");

check(policy.maxContractsPerTask === 3, "policy", "Policy must cap contracts per task at 3");
check(policy.maxToolSummaries === 20, "policy", "Policy must cap summaries at 20");
check(policy.allToolSchemasAllowed === false, "policy", "All tool schemas must be blocked");
check(policy.allMcpSchemasAllowed === false, "policy", "All MCP schemas must be blocked");
check(policy.selectedContractLoadingRequired === true, "policy", "Selected contract loading must be required");
check(policy.rawMcpSchemasAllowed === false, "policy", "Raw MCP schemas must be blocked");

const validPayload = validateToolContextBudget({
  contracts: [{ toolId: "git-diff" }],
  toolSummaries: Array.from({ length: 3 }, (_, index) => ({ toolId: `tool-${index}` })),
});
check(validPayload.valid === true, "enforcement", "One selected contract should be valid");

const tooManyContracts = validateToolContextBudget({ contracts: [{}, {}, {}, {}] });
check(tooManyContracts.valid === false, "enforcement", "Four contracts must be blocked");

const allTools = validateToolContextBudget({ allToolSchemas: true });
check(allTools.valid === false, "enforcement", "All tool schemas must be blocked");

const allMcp = validateToolContextBudget({ allMcpSchemas: true, rawMcpSchemas: true });
check(allMcp.valid === false, "enforcement", "All MCP/raw MCP schemas must be blocked");

const detection = detectAllToolsInContext({ allToolSchemas: true, contracts: [{}, {}] });
check(detection.allToolSchemasDetected === true, "enforcement", "All-tools detection failed");
const summary = summarizeContextBudget({ contractCount: 2, toolSummaryCount: 5 });
check(summary.allowed === true && summary.contractCount === 2, "enforcement", "Context budget summary failed");

const docs = read("docs/architecture/TOOL_MCP_REGISTRY_AND_GOVERNANCE.md");
check(docs.includes("P52.5 - Lazy Tool Contract Loading"), "docs", "Architecture doc missing P52.5");
check(docs.includes("all tool or MCP schemas"), "docs", "Architecture doc missing bulk-schema wording");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P52.4")?.status === "complete", "osPhaseStatus", "P52.4 must be complete");
check(statusById.get("P52.4")?.commit === "ec9bb5c", "osPhaseStatus", "P52.4 commit must be ec9bb5c");
check(statusById.get("P52.5")?.status === "complete", "osPhaseStatus", "P52.5 must be complete");
check(["planned", "complete"].includes(statusById.get("P52.6")?.status), "osPhaseStatus", "P52.6 must be planned or complete");
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
const report = `# NEXUS Lazy Tool Context Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P52.5 - Lazy Tool Contract Loading

## Summary

- Max contracts per task: ${policy.maxContractsPerTask}
- Max tool summaries: ${policy.maxToolSummaries}
- Valid single-contract context: ${validPayload.valid ? "PASS" : "FAIL"}
- Bulk contract context blocked: ${tooManyContracts.valid ? "FAIL" : "PASS"}
- All-tool schemas blocked: ${allTools.valid ? "FAIL" : "PASS"}
- All-MCP schemas blocked: ${allMcp.valid ? "FAIL" : "PASS"}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Enforcement: ${sections.enforcement ? "PASS" : "FAIL"}
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
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Enforcement: ${sections.enforcement ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
