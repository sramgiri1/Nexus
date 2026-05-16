import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildPrdTestMap, loadPrdSignals, summarizePrdTestCoverage, validatePrdTestMap } from "../quality-intelligence/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/prd-test-mapping-report.md");
const sections = { modules: true, mapping: true, policy: true, osPhaseStatus: true, noForbiddenChanges: true, reportWritten: true };
const failures = [];

function fail(section, message) { sections[section] = false; failures.push(message); }
function check(condition, section, message) { if (!condition) fail(section, message); }
function read(relativePath) { const full = join(ROOT, relativePath); return existsSync(full) ? readFileSync(full, "utf8") : ""; }
function parseJson(relativePath, section) { try { return JSON.parse(read(relativePath)); } catch (error) { fail(section, `${relativePath} did not parse: ${error.message}`); return {}; } }
function git(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }
function changedFiles() { return git(["status", "--short"]).split("\n").map((line) => line.trim().slice(3)).filter(Boolean); }

console.log("NEXUS PRD Test Mapping Check");
console.log("============================");

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const pkg = parseJson("package.json", "modules");
const policy = parseJson("policy/quality-intelligence-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const map = buildPrdTestMap({ projectId: "careloop" });
const validation = validatePrdTestMap(map);
const summary = summarizePrdTestCoverage(map);

check(existsSync(join(ROOT, "quality-intelligence/prdTestMapper.js")), "modules", "Missing prdTestMapper.js");
check(existsSync(join(ROOT, "quality-intelligence/index.js")), "modules", "Missing quality-intelligence/index.js");
check(pkg.scripts?.["check:prd-test-mapping"] === "node scripts/check-prd-test-mapping.js", "modules", "Missing check:prd-test-mapping script");
check(loadPrdSignals().length >= 8, "mapping", "Expected at least eight PRD signal domains");
check(validation.valid, "mapping", `PRD test map invalid: ${validation.errors.join("; ")}`);
check(summary.totalRequirements >= 8, "mapping", "Coverage summary must include required domains");
check(summary.executionEnabled === false, "mapping", "Mapping must not enable execution");
check(policy.previewOnly === true, "policy", "Quality intelligence policy must be preview-only");
for (const field of ["testExecutionAllowed", "projectMutationAllowed", "providerCallsAllowed", "toolExecutionAllowed", "workerRuntimeAllowed", "dbWritesAllowed", "externalNetworkCallsAllowed", "privateSourceContentScanningAllowed"]) {
  check(policy[field] === false, "policy", `Policy must set ${field} false`);
}
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P55.7")?.commit === "f1a8a05", "osPhaseStatus", "P55.7 commit must be updated to f1a8a05");
check(["in_progress", "complete"].includes(statusById.get("P56.1")?.status), "osPhaseStatus", "P56.1 must be tracked");
check(phaseStatus.currentPhase?.startsWith("P56"), "osPhaseStatus", "Current phase must be P56");
for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# PRD Test Mapping Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P56.1 - PRD-to-Test Mapping

## Summary

- Requirements mapped: ${summary.totalRequirements}
- Covered requirements: ${summary.coveredRequirements}
- Gap requirements: ${summary.gapRequirements}
- Execution enabled: ${summary.executionEnabled}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Mapping: ${sections.mapping ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

## Result

${result}
`;
try { writeFileSync(REPORT_PATH, report, "utf8"); } catch (error) { fail("reportWritten", error.message); }
result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
for (const [label, section] of [["Modules", "modules"], ["Mapping", "mapping"], ["Policy", "policy"], ["OS phase status", "osPhaseStatus"], ["No forbidden changes", "noForbiddenChanges"], ["Report written", "reportWritten"]]) {
  console.log(`${label}: ${sections[section] ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
