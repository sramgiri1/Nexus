import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "os-phase-status-report.md");
const ALLOWED_STATUSES = ["planned", "in_progress", "complete", "blocked", "skipped"];

const sections = {
  files: true,
  statuses: true,
  completedPhases: true,
  currentPhase: true,
  nextPhase: true,
  roadmapTarget: true,
  commandCenterSync: true,
  report: true,
};

const failures = [];

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
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

console.log("NEXUS OS Phase Status Check\n===========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

const phaseIndexPath = "os-roadmap/nexus-phases.json";
const phaseStatusPath = "os-roadmap/phase-status.json";

check(existsSync(join(ROOT, phaseIndexPath)), "files", `${phaseIndexPath} is missing`);
check(existsSync(join(ROOT, phaseStatusPath)), "files", `${phaseStatusPath} is missing`);

let phaseIndex = null;
let phaseStatus = null;

try {
  phaseIndex = JSON.parse(read(phaseIndexPath));
} catch (error) {
  fail("files", `Could not parse ${phaseIndexPath}: ${error.message}`);
}

try {
  phaseStatus = JSON.parse(read(phaseStatusPath));
} catch (error) {
  fail("files", `Could not parse ${phaseStatusPath}: ${error.message}`);
}

const roadmapSource = read("dashboard/src/data/nexusRoadmap.js");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const roadmapDocSource = read("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
let dashboardRoadmap = [];

check(Array.isArray(phaseIndex?.phases), "files", "Phase index must include a phases array");
check(Array.isArray(phaseStatus?.phases), "files", "Phase status must include a phases array");

try {
  ({ NEXUS_ROADMAP_PHASES: dashboardRoadmap } = await import("../dashboard/src/data/nexusRoadmap.js"));
} catch (error) {
  fail("commandCenterSync", `Could not import dashboard/src/data/nexusRoadmap.js: ${error.message}`);
}

const indexById = new Map((phaseIndex?.phases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((phaseStatus?.phases || []).map((entry) => [entry.phaseId, entry]));

for (const entry of phaseStatus?.phases || []) {
  check(ALLOWED_STATUSES.includes(entry.status), "statuses", `Invalid status for ${entry.phaseId}: ${entry.status}`);
}

for (const phaseId of [
  "P41.5.1",
  "P41.5.2",
  "P41.5.3",
  "P41.5.4",
  "P41.5.5",
  "P41.5.6",
  "P41.6.1",
  "P41.6.2",
  "P41.6.3",
  "P41.6.4",
]) {
  const entry = statusById.get(phaseId);
  check(!!entry, "completedPhases", `Missing completed phase entry: ${phaseId}`);
  check(entry?.status === "complete", "completedPhases", `${phaseId} must be complete`);
  check(Boolean(entry?.branch), "completedPhases", `${phaseId} must record a branch`);
  check(Boolean(entry?.commit), "completedPhases", `${phaseId} must record a commit`);
}

const phase164 = statusById.get("P41.6.4");
check(phase164?.branch === "feat/nexus-command-palette", "completedPhases", "P41.6.4 branch must be feat/nexus-command-palette");
check(phase164?.commit === "dd2a601", "completedPhases", "P41.6.4 commit must be dd2a601");

const currentPhase = statusById.get("P41.6.5");
check(!!currentPhase, "currentPhase", "P41.6.5 must exist");
check(
  currentPhase?.status === "in_progress" || currentPhase?.status === "complete",
  "currentPhase",
  "P41.6.5 must be in_progress or complete",
);
check(Boolean(currentPhase?.branch), "currentPhase", "P41.6.5 must record a branch");
check(Boolean(currentPhase?.nextPhase), "currentPhase", "P41.6.5 must record a nextPhase");

const nextPhase = indexById.get("P42");
check(!!nextPhase, "nextPhase", "P42 must exist in the phase index");
check(nextPhase?.title === "Project Registry + Adapter Framework", "nextPhase", "P42 must be Project Registry + Adapter Framework");

for (const plannedPhaseId of ["P41.7", "P41.8", "P41.9", "P42"]) {
  const entry = statusById.get(plannedPhaseId);
  check(!!entry, "nextPhase", `Missing planned phase entry: ${plannedPhaseId}`);
  check(entry?.status === "planned", "nextPhase", `${plannedPhaseId} must be planned`);
}

check(indexById.has("P78"), "roadmapTarget", "Roadmap data must include the expanded phase list through P78");
check(!roadmapDocSource.includes("DB-backed Command Center + Live Refresh"), "roadmapTarget", "Old P42 DB-backed Command Center text should not remain in the primary roadmap doc");
check(!commandCenterSource.includes("Track B"), "roadmapTarget", "Command Center roadmap should not render a Track B project roadmap");
check(!commandCenterSource.includes("CareLoop sprint board"), "roadmapTarget", "Command Center roadmap should not render a mixed project sprint board");

for (const expected of [
  "NEXUS OS Platform Progress",
  "Current OS Phase",
  "Next OS Phase",
  "Completed OS Phases",
  "Planned OS Phases",
  "Blocked OS Phases",
  "Open OS Gaps",
]) {
  check(commandCenterSource.includes(expected), "commandCenterSync", `Command Center roadmap is missing expected OS roadmap copy: ${expected}`);
}

check(!commandCenterSource.includes("CareLoop · Sprint 1 → 4"), "commandCenterSync", "Command Center roadmap should not include CareLoop as an OS phase track");
check(dashboardRoadmap.some((entry) => entry.phase === "P41.6.5"), "commandCenterSync", "dashboard/src/data/nexusRoadmap.js must include P41.6.5");
check(
  dashboardRoadmap.some(
    (entry) => entry.phase === "P42" && entry.label === "Project Registry + Adapter Framework",
  ),
  "commandCenterSync",
  "dashboard/src/data/nexusRoadmap.js must include the correct P42 title",
);
check(roadmapDocSource.includes("P41.6.5"), "commandCenterSync", "NEXUS platform roadmap doc must mention P41.6.5");

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Files: ${sections.files ? "PASS" : "FAIL"}`);
console.log(`Statuses: ${sections.statuses ? "PASS" : "FAIL"}`);
console.log(`Completed phases: ${sections.completedPhases ? "PASS" : "FAIL"}`);
console.log(`Current phase: ${sections.currentPhase ? "PASS" : "FAIL"}`);
console.log(`Next phase: ${sections.nextPhase ? "PASS" : "FAIL"}`);
console.log(`Roadmap target: ${sections.roadmapTarget ? "PASS" : "FAIL"}`);
console.log(`Command Center sync: ${sections.commandCenterSync ? "PASS" : "FAIL"}`);
console.log(`Report: ${sections.report ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

const report = `# NEXUS OS Phase Status Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Current OS Phase

- Current phase: ${currentPhase?.phaseId || "UNKNOWN"} — ${currentPhase?.title || "Unknown"}
- Status: ${currentPhase?.status || "unknown"}
- Branch: ${currentPhase?.branch || "unknown"}
- Commit: ${currentPhase?.commit || "unknown"}
- Next phase: ${currentPhase?.nextPhase || "unknown"}

## Completion Checks

- P41.5.1 through P41.5.6: complete
- P41.6.1 through P41.6.4: complete
- P41.6.5: ${currentPhase?.status || "unknown"}
- P41.7 / P41.8 / P41.9: planned
- P42: Project Registry + Adapter Framework

## Roadmap Separation

- OS roadmap track remains NEXUS-only
- CareLoop / project progress is excluded from the OS phase registry
- Command Center roadmap data mirrors the phase-status registry

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

if (result !== "PASS") {
  process.exitCode = 1;
}
