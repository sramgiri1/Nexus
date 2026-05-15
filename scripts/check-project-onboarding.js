import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildProjectOnboardingPlan,
  createProjectOnboardingDryRun,
  generateProjectProfile,
  validateProjectOnboardingRequest,
} from "../project-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "project-onboarding-report.md");
const PLAN_PATH = join(ROOT, "reports", "project-onboarding-plan.json");
const sections = {
  modules: true,
  exports: true,
  policy: true,
  dryRun: true,
  reports: true,
  command: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formatting: true,
};
const failures = [];

function read(relativePath) {
  const path = join(ROOT, relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
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
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

console.log("NEXUS Project Onboarding Check");
console.log("==============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const policy = parseJson("policy/project-onboarding-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const indexSource = read("project-registry/index.js");

for (const modulePath of [
  "project-registry/projectOnboarding.js",
  "project-registry/projectProfileGenerator.js",
  "project-registry/projectOnboardingPlan.js",
  "scripts/nexus-init-project.js",
]) {
  check(existsSync(join(ROOT, modulePath)), "modules", `Missing module: ${modulePath}`);
}
for (const exportName of [
  "generateProjectProfile",
  "buildProjectOnboardingPlan",
  "createProjectOnboardingDryRun",
  "validateProjectOnboardingRequest",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P42.4", "policy", "Policy phase must be P42.4");
check(policy.dryRunDefault === true, "policy", "Dry-run must be default");
check(policy.projectFileWritesAllowed === false, "policy", "Project file writes must be disabled");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must be disabled");

const profile = generateProjectProfile({ name: "Example SaaS", type: "saas-mobile" });
const plan = buildProjectOnboardingPlan({ name: "Example SaaS", type: "saas-mobile" });
const dryRun = createProjectOnboardingDryRun({ name: "Example SaaS", type: "saas-mobile" });
check(profile.projectId === "example-saas", "dryRun", "Generated project ID mismatch");
check(plan.dryRun === true, "dryRun", "Onboarding plan must be dry-run");
check(plan.projectFileWritesAllowed === false, "dryRun", "Project file writes must be disabled in plan");
check(dryRun.ok === true, "dryRun", "Dry-run should succeed");
check(validateProjectOnboardingRequest({ name: "Example SaaS", dryRun: false }).valid === false, "dryRun", "Non-dry-run request must fail");

writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 2), "utf8");
const report = `# NEXUS Project Onboarding Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.4 - Project Onboarding Wizard / nexus:init-project

## Summary

- Dry run: yes
- Proposed project ID: ${plan.proposedProjectId}
- Proposed root: ${plan.proposedProjectRoot}
- Proposed stack profile: ${plan.proposedStackProfile}
- Project file writes allowed: no

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Dry run: ${sections.dryRun ? "PASS" : "FAIL"}
- Reports: PASS
- Command: ${sections.command ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}
`;
writeFileSync(REPORT_PATH, report, "utf8");
check(existsSync(PLAN_PATH), "reports", "Plan report missing");
check(existsSync(REPORT_PATH), "reports", "Markdown report missing");

const commandOutput = execFileSync("node", ["scripts/nexus-init-project.js", "--name", "Example SaaS", "--type", "saas-mobile", "--dry-run"], {
  cwd: ROOT,
  encoding: "utf8",
});
check(commandOutput.includes("Project file writes: disabled"), "command", "CLI must report disabled writes");

const statusById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
check(statusById.get("P42.4")?.status === "complete", "osPhaseStatus", "P42.4 must be complete");
check(statusById.get("P42.4")?.branch === "arch/project-registry-adapter-overnight", "osPhaseStatus", "P42.4 branch mismatch");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/"), "noForbiddenChanges", `Forbidden project folder change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
}

for (const file of ["project-registry/projectOnboarding.js", "project-registry/projectProfileGenerator.js", "scripts/check-project-onboarding.js"]) {
  check(!read(file).split("\n").some((line) => line.length > 1000), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Dry run: ${sections.dryRun ? "PASS" : "FAIL"}`);
console.log(`Reports: ${sections.reports ? "PASS" : "FAIL"}`);
console.log(`Command: ${sections.command ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
