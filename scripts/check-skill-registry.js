import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildSkillContracts,
  getSkillRegistry,
  getSkillProfiles,
  getSkillTestRequirements,
  getSkillTemplates,
  summarizeRegisteredSkills,
  summarizeSkillContracts,
  summarizeSkillProfiles,
  summarizeSkillTestRequirements,
  summarizeSkillTemplates,
  validateSkillContract,
  validateSkillProfiles,
  validateRegisteredSkills,
  validateSkillTestRequirements,
  validateSkillTemplates,
} from "../skills-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "skill-registry-report.md");
const sections = {
  modules: true,
  schema: true,
  registry: true,
  contracts: true,
  templates: true,
  profiles: true,
  testRequirements: true,
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
const contracts = buildSkillContracts(skills);
const templates = getSkillTemplates();
const profiles = getSkillProfiles();
const testRequirements = getSkillTestRequirements();
const registryValidation = validateRegisteredSkills(skills);
const templateValidation = validateSkillTemplates(templates);
const profileValidation = validateSkillProfiles(profiles);
const testRequirementsValidation = validateSkillTestRequirements(testRequirements, templates);
const summary = summarizeRegisteredSkills(skills);
const contractSummary = summarizeSkillContracts(contracts);
const templateSummary = summarizeSkillTemplates(templates);
const profileSummary = summarizeSkillProfiles(profiles);
const testRequirementsSummary = summarizeSkillTestRequirements(testRequirements);

for (const file of [
  "skills-registry/skillSchema.js",
  "skills-registry/skillRegistry.js",
  "skills-registry/skillContract.js",
  "skills-registry/skillTemplates.js",
  "skills-registry/skillProfiles.js",
  "skills-registry/skillTestRequirements.js",
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
check(contracts.length === skills.length, "contracts", "Every skill needs a generated contract");
for (const contract of contracts) {
  const validation = validateSkillContract(contract);
  check(validation.valid, "contracts", `Invalid contract ${contract.skillId}: ${validation.errors.join("; ")}`);
  check(contract.forbiddenUseCases.some((item) => item.includes("providers")), "contracts", `${contract.skillId} must forbid provider execution`);
}
check(contractSummary.executionEnabledCount === 0, "contracts", "Contracts must keep execution disabled");
check(contractSummary.providerCallsAllowedCount === 0, "contracts", "Contracts must keep provider calls disabled");
check(contractSummary.projectMutationAllowedCount === 0, "contracts", "Contracts must keep project mutation disabled");

check(templateValidation.valid, "templates", `Template validation failed: ${templateValidation.errors.join("; ")}`);
const templateById = new Map(templates.map((template) => [template.skillId, template]));
for (const templateId of [
  "plan-mission",
  "create-project-brief",
  "review-plan",
  "run-qa-gate",
  "fix-failing-test-plan",
  "prepare-release-review",
  "retro-and-lessons-learned",
  "guard-freeze-scope",
  "explain-current-state",
]) {
  const template = templateById.get(templateId);
  check(Boolean(template), "templates", `Missing governed skill template: ${templateId}`);
  check(template?.executionEnabled === false, "templates", `${templateId} must keep execution disabled`);
  check(template?.costPolicy?.providerSpendAllowed === false, "templates", `${templateId} must block provider spend`);
  check(Boolean(template?.disabledReason), "templates", `${templateId} must have a disabled reason`);
  check(Boolean(template?.approvalRequirement), "templates", `${templateId} must have an approval requirement`);
  check(Boolean(template?.linkedCommandCenterAction), "templates", `${templateId} must link to a Command Center action`);
  check(Array.isArray(template?.requiredEvidence) && template.requiredEvidence.length > 0, "templates", `${templateId} must require evidence`);
}
check(templateSummary.executionEnabledCount === 0, "templates", "No templates may enable execution in P50.3");
check(templateSummary.templateCount >= 9, "templates", "Expected at least nine governed skill templates");

check(profileValidation.valid, "profiles", `Profile validation failed: ${profileValidation.errors.join("; ")}`);
const profileById = new Map(profiles.map((profile) => [profile.profileId, profile]));
for (const profileId of [
  "saas-node-fastify",
  "web-react",
  "ios-swift-xcode",
  "android-gradle-placeholder",
  "docs-architecture",
  "nexus-os-platform",
]) {
  const profile = profileById.get(profileId);
  check(Boolean(profile), "profiles", `Missing stack-specific skill profile: ${profileId}`);
  check(profile?.executionEnabled === false, "profiles", `${profileId} must keep execution disabled`);
  check(Array.isArray(profile?.compatibleSkillIds), "profiles", `${profileId} must list compatible skills`);
  check(Array.isArray(profile?.unavailableSkillIds), "profiles", `${profileId} must list unavailable skills`);
  check(Array.isArray(profile?.requiredFutureAdapters), "profiles", `${profileId} must list future adapters`);
  check(Array.isArray(profile?.projectProfileRequirements), "profiles", `${profileId} must list profile requirements`);
  check(Array.isArray(profile?.testRequirements), "profiles", `${profileId} must list test requirements`);
}
check(profileSummary.executionEnabledCount === 0, "profiles", "No profiles may enable execution in P50.4");
check(profileSummary.profileCount >= 6, "profiles", "Expected at least six stack-specific profiles");

check(
  testRequirementsValidation.valid,
  "testRequirements",
  `Test requirements validation failed: ${testRequirementsValidation.errors.join("; ")}`,
);
check(testRequirements.length === templates.length, "testRequirements", "Every governed skill template must have test requirements");
for (const requirement of testRequirements) {
  check(requirement.executionEnabled === false, "testRequirements", `${requirement.skillId} must keep execution disabled`);
  check(requirement.futureRuntimeEnabled === false, "testRequirements", `${requirement.skillId} must keep future runtime checks disabled`);
  check(requirement.requiredEvidenceChecks.length > 0, "testRequirements", `${requirement.skillId} must validate evidence`);
  check(requirement.requiredUiChecks.length > 0, "testRequirements", `${requirement.skillId} must have UI checks`);
}
check(testRequirementsSummary.executionEnabledCount === 0, "testRequirements", "No test requirements may enable execution");
check(testRequirementsSummary.futureRuntimeEnabledCount === 0, "testRequirements", "Runtime checks must remain future-only");

for (const category of ["planning", "review", "qa", "release"]) {
  check(Boolean(summary.categoryCounts[category]), "registry", `Missing category: ${category}`);
}

check(policy.phase === "P50.1", "policy", "Policy phase must remain P50.1 for the registry policy baseline");
check(policy.skillExecutionAllowed === false, "policy", "Skill execution must be disabled");
check(policy.providerCallsAllowed === false, "policy", "Provider calls must be disabled");
check(policy.toolCallsAllowed === false, "policy", "Tool calls must be disabled");
check(policy.workerRuntimeAllowed === false, "policy", "Worker runtime must be disabled");
check(policy.dbWritesAllowed === false, "policy", "DB writes must be disabled");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must be disabled");
check(policy.agentDefinitionMutationAllowed === false, "policy", "Agent definition mutation must be disabled");

const docs = read("docs/architecture/SKILL_REGISTRY_AND_AUTHORING_WORKFLOW.md");
check(docs.includes("P50.1 - Skill Registry Schema"), "docs", "Architecture doc missing P50.1 section");
check(docs.includes("P50.2 - Skill Contract Model"), "docs", "Architecture doc missing P50.2 section");
check(docs.includes("P50.3 - Governed Skill Templates"), "docs", "Architecture doc missing P50.3 section");
check(docs.includes("P50.4 - Stack-Specific Skill Profiles"), "docs", "Architecture doc missing P50.4 section");
check(docs.includes("P50.5 - Skill Test Requirements"), "docs", "Architecture doc missing P50.5 section");
check(docs.includes("skill execution is disabled"), "docs", "Architecture doc must state skill execution is disabled");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P49.8")?.status === "complete", "osPhaseStatus", "P49.8 must remain complete");
check(statusById.get("P50.1")?.status === "complete", "osPhaseStatus", "P50.1 must be complete");
check(statusById.get("P50.1")?.branch === "arch/skill-registry-authoring-workflow", "osPhaseStatus", "P50.1 branch mismatch");
check(statusById.get("P50.2")?.status === "complete", "osPhaseStatus", "P50.2 must be complete");
check(statusById.get("P50.2")?.branch === "arch/skill-registry-authoring-workflow", "osPhaseStatus", "P50.2 branch mismatch");
check(statusById.get("P50.2")?.nextPhase === "P50.3", "osPhaseStatus", "P50.2 next phase must be P50.3");
check(statusById.get("P50.3")?.status === "complete", "osPhaseStatus", "P50.3 must be complete");
check(statusById.get("P50.3")?.branch === "arch/skill-registry-authoring-workflow", "osPhaseStatus", "P50.3 branch mismatch");
check(statusById.get("P50.3")?.nextPhase === "P50.4", "osPhaseStatus", "P50.3 next phase must be P50.4");
check(statusById.get("P50.4")?.status === "complete", "osPhaseStatus", "P50.4 must be complete");
check(statusById.get("P50.4")?.branch === "arch/skill-registry-authoring-workflow", "osPhaseStatus", "P50.4 branch mismatch");
check(statusById.get("P50.4")?.nextPhase === "P50.5", "osPhaseStatus", "P50.4 next phase must be P50.5");
check(statusById.get("P50.5")?.status === "complete", "osPhaseStatus", "P50.5 must be complete");
check(statusById.get("P50.5")?.branch === "arch/skill-registry-authoring-workflow", "osPhaseStatus", "P50.5 branch mismatch");
check(statusById.get("P50.5")?.nextPhase === "P50.6", "osPhaseStatus", "P50.5 next phase must be P50.6");
check(statusById.get("P50.6")?.status === "planned", "osPhaseStatus", "P50.6 must be planned");
check(phaseStatus.currentPhase === "P50.5", "osPhaseStatus", "Current phase must be P50.5");
check(phaseStatus.nextPhase === "P50.6", "osPhaseStatus", "Next phase must be P50.6");

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
  "skills-registry/skillContract.js",
  "skills-registry/skillTemplates.js",
  "skills-registry/skillProfiles.js",
  "skills-registry/skillTestRequirements.js",
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

P50.5 - Skill Test Requirements

## Summary

- Skills: ${summary.skillCount}
- Contracts: ${contractSummary.contractCount}
- Templates: ${templateSummary.templateCount}
- Profiles: ${profileSummary.profileCount}
- Test requirement sets: ${testRequirementsSummary.requirementCount}
- Rollback-required contracts: ${contractSummary.rollbackRequiredCount}
- Template owner agents: ${templateSummary.ownerAgents.join(", ")}
- Profile skill links: ${profileSummary.compatibleSkillLinks}
- Unavailable profile skill links: ${profileSummary.unavailableSkillLinks}
- Static checks listed: ${testRequirementsSummary.staticCheckCount}
- Evidence checks listed: ${testRequirementsSummary.evidenceCheckCount}
- Categories: ${Object.keys(summary.categoryCounts).join(", ")}
- Execution-enabled skills: ${summary.executionEnabledCount}
- Execution-enabled templates: ${templateSummary.executionEnabledCount}
- Execution-enabled profiles: ${profileSummary.executionEnabledCount}
- Execution-enabled test requirements: ${testRequirementsSummary.executionEnabledCount}
- Future-runtime enabled test requirements: ${testRequirementsSummary.futureRuntimeEnabledCount}
- Provider-enabled skills: ${summary.providerCallsAllowedCount}
- Tool-enabled skills: ${summary.toolCallsAllowedCount}
- Project-mutation skills: ${summary.projectMutationAllowedCount}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Contracts: ${sections.contracts ? "PASS" : "FAIL"}
- Templates: ${sections.templates ? "PASS" : "FAIL"}
- Profiles: ${sections.profiles ? "PASS" : "FAIL"}
- Test requirements: ${sections.testRequirements ? "PASS" : "FAIL"}
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
console.log(`Contracts: ${sections.contracts ? "PASS" : "FAIL"}`);
console.log(`Templates: ${sections.templates ? "PASS" : "FAIL"}`);
console.log(`Profiles: ${sections.profiles ? "PASS" : "FAIL"}`);
console.log(`Test requirements: ${sections.testRequirements ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
