import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/careloop-phase-2-start-report.md");
const REQUIRED_TASKS = [
  "Phase 2 Product Brief",
  "PRD Gap Review",
  "Backend Validation Readiness",
  "Privacy and Safety Review",
  "iOS Validation Readiness",
  "Test Gap Proposal",
  "Controlled Implementation Candidate Selection",
  "Release Readiness Outline",
];

const sections = {
  missionContract: true,
  taskPlan: true,
  projectRoadmap: true,
  osProjectSeparation: true,
  reports: true,
  commandCenterUx: true,
  demoBoundary: true,
  noForbiddenChanges: true,
  formattingReadability: true,
};
const failures = [];

function pathFor(relativePath) {
  return join(ROOT, relativePath);
}

function read(relativePath) {
  return existsSync(pathFor(relativePath)) ? readFileSync(pathFor(relativePath), "utf8") : "";
}

function readJson(relativePath, section) {
  if (!existsSync(pathFor(relativePath))) {
    fail(section, `${relativePath} is missing`);
    return {};
  }
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(section, `${relativePath} is invalid JSON: ${error.message}`);
    return {};
  }
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function changedFiles() {
  return git(["status", "--short"])
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

function fail(section, message) {
  sections[section] = false;
  failures.push(message);
}

function check(condition, section, message) {
  if (!condition) fail(section, message);
}

function isAllowedCareLoopMetadata(file) {
  return [
    "projects/careloop/nexus.project.json",
    "projects/careloop/docs/NEXUS_CARELOOP_PHASE_2.md",
    "projects/careloop/docs/NEXUS_PROJECT_STATUS.md",
  ].includes(file);
}

function noLongLines(relativePath) {
  return read(relativePath).split("\n").every((line) => line.length <= 1000);
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const mission = readJson("contracts/projects/careloop/phase-2-mission-contract.json", "missionContract");
const taskPlan = readJson("contracts/projects/careloop/phase-2-task-plan.json", "taskPlan");
const roadmap = readJson("project-roadmap/careloop-roadmap.json", "projectRoadmap");
const phaseStatus = readJson("project-roadmap/careloop-phase-status.json", "projectRoadmap");
const missionReport = readJson("reports/careloop-phase-2-mission.json", "reports");
const readiness = readJson("reports/careloop-phase-2-readiness.json", "reports");
const osRoadmap = `${read("os-roadmap/nexus-phases.json")}\n${read("os-roadmap/phase-status.json")}`;
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const viewModelSource = read("dashboard/src/data/commandCenterViewModel.js");
const projectRoadmapSource = read("dashboard/src/data/projectRoadmap.js");
const routeTestSource = read("dashboard/tests/routes.spec.js");
const demoSource = read("dashboard/src/pages/CommandCenterV2.jsx").match(/function DemoModePage[\s\S]*?function WorkspacePage/)?.[0] || "";
const packageSource = read("package.json");

check(mission.contractType === "project_mission", "missionContract", "Mission contract type mismatch");
check(mission.projectId === "careloop", "missionContract", "Mission projectId must be careloop");
check(mission.phaseId === "CARELOOP-P2", "missionContract", "Mission phaseId must be CARELOOP-P2");
check(mission.mutationAllowed === false, "missionContract", "Mission must disable mutation");
check(mission.providerCallsAllowed === false, "missionContract", "Mission must disable providers");
check(mission.toolExecutionAllowed === false, "missionContract", "Mission must disable tool execution");
check(mission.dbWritesAllowed === false, "missionContract", "Mission must disable DB writes");
check(mission.deploymentAllowed === false, "missionContract", "Mission must disable deployment");

check(Array.isArray(taskPlan.tasks) && taskPlan.tasks.length === 8, "taskPlan", "Task plan must include 8 tasks");
for (const title of REQUIRED_TASKS) {
  check(taskPlan.tasks?.some((task) => task.title === title), "taskPlan", `Missing required task: ${title}`);
}
for (const task of taskPlan.tasks || []) {
  check(task.mutationAllowed === false, "taskPlan", `${task.title} must disable mutation`);
  check(task.executionAllowed === false, "taskPlan", `${task.title} must disable execution`);
  check(Boolean(task.requiredEvidence?.length), "taskPlan", `${task.title} missing evidence requirements`);
  check(Boolean(task.nextRecommendedAction), "taskPlan", `${task.title} missing next action`);
}

check(roadmap.projectId === "careloop", "projectRoadmap", "CareLoop roadmap projectId mismatch");
check(roadmap.activePhase === "CARELOOP-P2", "projectRoadmap", "CareLoop roadmap active phase mismatch");
check(roadmap.phases?.some((phase) => phase.phaseId === "CARELOOP-P2" && phase.status === "in_progress"), "projectRoadmap", "CARELOOP-P2 must be in progress");
check(phaseStatus.activeMission === "CareLoop Phase 2", "projectRoadmap", "Phase status active mission mismatch");
check(phaseStatus.mutationAllowed === false, "projectRoadmap", "Phase status must disable mutation");

for (const forbidden of ["CARELOOP-P1", "CARELOOP-P2", "CARELOOP-P3", "CARELOOP-P4"]) {
  check(!osRoadmap.includes(forbidden), "osProjectSeparation", `OS Roadmap must not include ${forbidden}`);
}

for (const file of [
  "reports/careloop-phase-2-mission-report.md",
  "reports/careloop-phase-2-mission.json",
  "reports/careloop-phase-2-readiness.json",
]) {
  check(existsSync(pathFor(file)), "reports", `Missing report: ${file}`);
}
check(missionReport.mission?.phaseId === "CARELOOP-P2", "reports", "Mission JSON report missing mission");
check(readiness.prdClearEnoughToStart === true, "reports", "Readiness must mark PRD clear enough to start planning");
check(read("reports/careloop-phase-2-mission-report.md").includes("Validation HEAD"), "reports", "Markdown report missing Validation HEAD wording");

for (const expected of [
  "CareLoop Phase 2",
  "Review Phase 2 task plan",
  "Product Hardening and Validation",
  "Phase 2 planned tasks",
]) {
  check(
    commandCenterSource.includes(expected) || viewModelSource.includes(expected) || projectRoadmapSource.includes(expected),
    "commandCenterUx",
    `Command Center missing ${expected}`,
  );
}
check(routeTestSource.includes("CARE_PROJECT_LABEL"), "commandCenterUx", "Playwright tests must cover CareLoop without public literal leakage");
check(packageSource.includes("careloop:phase2-start"), "commandCenterUx", "Package script missing careloop:phase2-start");
check(packageSource.includes("check:careloop-phase2-start"), "commandCenterUx", "Package script missing check:careloop-phase2-start");

check(!demoSource.includes("CareLoop") && !demoSource.includes("careloop"), "demoBoundary", "Demo Mode must not show CareLoop");

for (const file of changedFiles()) {
  if (isAllowedCareLoopMetadata(file)) continue;
  check(!file.startsWith("projects/careloop/src/"), "noForbiddenChanges", `Forbidden CareLoop source change: ${file}`);
  check(!file.startsWith("projects/careloop/prisma/"), "noForbiddenChanges", `Forbidden CareLoop Prisma change: ${file}`);
  check(!file.startsWith("projects/careloop/tests/"), "noForbiddenChanges", `Forbidden CareLoop test change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden CareLoop iOS change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tool change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
}

for (const file of [
  "contracts/projects/careloop/phase-2-mission-contract.json",
  "contracts/projects/careloop/phase-2-task-plan.json",
  "project-roadmap/careloop-roadmap.json",
  "project-roadmap/careloop-phase-status.json",
  "scripts/careloop-phase-2-start.js",
  "scripts/check-careloop-phase-2-start.js",
  "reports/careloop-phase-2-mission-report.md",
]) {
  check(noLongLines(file), "formattingReadability", `Line over 1000 chars in ${file}`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = [
  "# NEXUS CareLoop Phase 2 Start Check",
  "",
  "## Metadata",
  "",
  `- Generated at: ${new Date().toISOString()}`,
  `- Validation branch: ${branch}`,
  `- Validation HEAD: ${head}`,
  "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
  "",
  "## Checks",
  "",
  `- Mission contract: ${sections.missionContract ? "PASS" : "FAIL"}`,
  `- Task plan: ${sections.taskPlan ? "PASS" : "FAIL"}`,
  `- Project roadmap: ${sections.projectRoadmap ? "PASS" : "FAIL"}`,
  `- OS/project separation: ${sections.osProjectSeparation ? "PASS" : "FAIL"}`,
  `- Reports: ${sections.reports ? "PASS" : "FAIL"}`,
  `- Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}`,
  `- Demo boundary: ${sections.demoBoundary ? "PASS" : "FAIL"}`,
  `- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`,
  `- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`,
  "",
  "## Failures",
  "",
  failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "None.",
  "",
  "## Result",
  "",
  result,
  "",
].join("\n");
writeFileSync(
  REPORT_PATH,
  report,
);

console.log("NEXUS CareLoop Phase 2 Check");
console.log("============================");
console.log("");
console.log(`Mission contract: ${sections.missionContract ? "PASS" : "FAIL"}`);
console.log(`Task plan: ${sections.taskPlan ? "PASS" : "FAIL"}`);
console.log(`Project roadmap: ${sections.projectRoadmap ? "PASS" : "FAIL"}`);
console.log(`OS/project separation: ${sections.osProjectSeparation ? "PASS" : "FAIL"}`);
console.log(`Reports: ${sections.reports ? "PASS" : "FAIL"}`);
console.log(`Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}`);
console.log(`Demo boundary: ${sections.demoBoundary ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`);
console.log("");
console.log(`Result: ${result}`);

if (result !== "PASS") {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
