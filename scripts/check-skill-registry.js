import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getSkillRegistry,
  summarizeRegisteredSkills,
  validateRegisteredSkills,
} from "../skills-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "skill-registry-report.md");
const sections = {
  modules: true,
  schema: true,
  registry: true,
  policy: true,
  docs: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formatting: true,
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

console.log("NEXUS Skill Registry Check");
console.log("==========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const policy = parseJson("policy/skill-registry-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const skills = getSkillRegistry();
const registryValidation = validateRegisteredSkills(skills);
const summary = summarizeRegisteredSkills(skills);

for (const file of [
  "skills-registry/skillSchema.js",
  "skills-registry/skillRegistry.js",
  "skills-registry/registry.json",
  "skills-registry/index.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing module: ${file}`);
}

check(packageJson.scripts?.["check:skill-registry"] === "node scripts/check-skill-registry.js", "modules", "Missing package script check:skill-registry");
check(registryValidation.valid, "schema", `Registry validation failed: ${registryValidation.errors.join("; ")}`);
check(summary.skillCount >= 4, "registry", "Expected at least four built-in skill placeholders");
check(summary.executionEnabledCount === 0, "registry", "No skills may have execution enabled in P50");
check(summary.providerCallsAllowedCount === 0, "registry", "No skills may allow provider calls in P50");
check(summary.toolCallsAllowedCount === 0, "registry", "No skills may allow tool calls in P50");
check(summary.projectMutationAllowedCount === 0, "registry", "No skills may allow project mutation in P50");

for (const category of ["planning", "review", "qa", "release"]) {
  check(Boolean(summary.categoryCounts[category]), "registry", `Missing category: ${category}`);
}

check(policy.phase === "P50.1", "policy", "Policy phase must be P50.1 for the schema subphase");
check(policy.skillExecutionAllowed === false, "policy", "Skill execution must be disabled");
check(policy.providerCallsAllowed === false, "policy", "Provider calls must be disabled");
check(policy.toolCallsAllowed === false, "policy", "Tool calls must be disabled");
check(policy.workerRuntimeAllowed === false, "policy", "Worker runtime must be disabled");
check(policy.dbWritesAllowed === false, "policy", "DB writes must be disabled");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must be disabled");
check(policy.agentDefinitionMutationAllowed === false, "policy", "Agent definition mutation must be disabled");

const docs = read("docs/architecture/SKILL_REGISTRY_AND_AUTHORING_WORKFLOW.md");
check(docs.includes("P50.1 - Skill Registry Schema"), "docs", "Architecture doc missing P50.1 section");
check(docs.includes("skill execution is disabled"), "docs", "Architecture doc must state skill execution is disabled");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P49.8")?.status === "complete", "osPhaseStatus", "P49.8 must remain complete");
check(statusById.get("P50.1")?.status === "complete", "osPhaseStatus", "P50.1 must be complete");
check(statusById.get("P50.1")?.branch === "arch/skill-registry-authoring-workflow", "osPhaseStatus", "P50.1 branch mismatch");
check(statusById.get("P50.1")?.nextPhase === "P50.2", "osPhaseStatus", "P50.1 next phase must be P50.2");
check(phaseStatus.currentPhase === "P50.1", "osPhaseStatus", "Current phase must be P50.1");
check(phaseStatus.nextPhase === "P50.2", "osPhaseStatus", "Next phase must be P50.2");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent definition change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tool runtime change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
}

for (const file of [
  "skills-registry/skillSchema.js",
  "skills-registry/skillRegistry.js",
  "skills-registry/index.js",
  "scripts/check-skill-registry.js",
  "policy/skill-registry-policy.json",
  "docs/architecture/SKILL_REGISTRY_AND_AUTHORING_WORKFLOW.md",
]) {
  check(!read(file).split("\n").some((line) => line.length > 1000), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Skill Registry Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P50.1 - Skill Registry Schema

## Summary

- Skills: ${summary.skillCount}
- Categories: ${Object.keys(summary.categoryCounts).join(", ")}
- Execution-enabled skills: ${summary.executionEnabledCount}
- Provider-enabled skills: ${summary.providerCallsAllowedCount}
- Tool-enabled skills: ${summary.toolCallsAllowedCount}
- Project-mutation skills: ${summary.projectMutationAllowedCount}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}
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
console.log(`Schema: ${sections.schema ? "PASS" : "FAIL"}`);
console.log(`Registry: ${sections.registry ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
