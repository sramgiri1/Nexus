import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "os-phase-status-report.md");
const ALLOWED_STATUSES = ["planned", "in_progress", "complete", "blocked", "skipped"];
const CURRENT_PHASE_IDS = new Set([
  "P43",
  "P43.6",
  "P44",
  "P44.1",
  "P44.2",
  "P44.3",
  "P44.4",
  "P44.5",
  "P44.6",
  "P44.7",
  "P45",
  "P45.1",
  "P45.2",
  "P45.3",
  "P45.4",
  "P45.5",
  "P45.6",
  "P46",
  "P46.1",
  "P46.2",
  "P46.3",
  "P46.4",
  "P46.5",
  "P46.6",
  "P46.7",
  "P47",
  "P47.1",
  "P47.2",
  "P47.3",
  "P47.4",
  "P47.5",
  "P47.6",
  "P47.7",
  "P48",
  "P48.1",
  "P48.2",
  "P48.3",
  "P48.4",
  "P48.5",
  "P48.6",
  "P48.7",
  "P48.8",
  "P49",
  "P49.1",
  "P49.2",
  "P49.3",
  "P49.4",
  "P49.5",
  "P49.6",
  "P49.7",
  "P49.8",
  "P50",
  "P50.1",
  "P50.2",
  "P50.3",
  "P50.4",
  "P50.5",
  "P50.6",
  "P50.7",
  "P51",
  "P51.1",
  "P51.2",
  "P51.3",
  "P51.4",
  "P51.5",
  "P51.6",
  "P51.7",
  "P52",
  "P52.1",
  "P52.2",
  "P52.3",
  "P52.4",
  "P52.5",
  "P52.6",
  "P52.7",
  "P52.8",
  "P52.9",
  "P53",
  "P53.1",
  "P53.2",
  "P53.3",
  "P53.4",
  "P53.5",
  "P53.6",
  "P53.7",
  "P54",
  "P54.1",
  "P54.2",
  "P54.3",
  "P54.4",
  "P54.5",
  "P54.6",
  "P54.7",
  "P54.8",
  "P54.9",
  "P55",
  "P55.1",
  "P55.2",
  "P55.3",
  "P55.4",
  "P55.5",
  "P55.6",
  "P55.7",
  "P56",
  "P56.1",
  "P56.2",
  "P56.3",
  "P56.4",
  "P56.5",
  "P56.6",
  "P56.7",
  "P56.8",
  "P57",
  "P57.1",
  "P57.2",
  "P57.3",
  "P57.4",
  "P57.5",
  "P57.6",
  "P57.7",
  "P58",
  "P58.1",
  "P58.2",
  "P58.3",
  "P58.4",
  "P58.5",
  "P58.6",
  "P58.7",
  "P58.8",
  "P59",
  "P59.1",
  "P59.2",
  "P59.3",
  "P59.4",
  "P59.5",
  "P59.6",
  "P59.7",
  "P59.8",
  "P60",
  "P60.1",
  "P60.2",
  "P60.3",
  "P60.4",
  "P60.5",
  "P60.6",
  "P60.7",
  "P61",
  "P61.1",
  "P61.2",
  "P61.3",
  "P61.4",
  "P61.5",
  "P61.6",
  "P61.7",
  "P62",
  "P62.1",
  "P62.2",
  "P62.3",
  "P62.4",
  "P62.5",
  "P62.6",
  "P62.7",
  "P62.8",
  "P63",
  "P64",
  "P64.1",
  "P64.2",
  "P64.3",
  "P64.4",
  "P64.5",
  "P64.6",
  "P64.7",
  "P64.8",
  "P64.8.1",
  "P64.8.2",
  "P64.8.3",
  "P64.8.4",
  "P64.8.5",
  "P65",
  "P65.1",
  "P65.2",
  "P65.3",
  "P65.4",
  "P65.5",
  "P65.6",
  "P65.7",
  "P66",
  "P66.1",
  "P66.2",
  "P66.3",
  "P66.4",
  "P66.5",
  "P66.6",
  "P66.7",
  "P67",
  "P67.1",
  "P67.2",
  "P67.3",
  "P67.4",
  "P67.5",
  "P67.6",
  "P67.7",
  "P68",
  "P68.1",
  "P68.2",
  "P68.3",
  "P68.4",
  "P68.5",
  "P68.6",
  "P68.7",
  "P69",
  "P69.1",
  "P69.2",
  "P69.3",
  "P69.4",
  "P69.5",
  "P69.6",
  "P69.7",
  "P70",
  "P70.1",
  "P70.2",
  "P70.3",
  "P70.4",
  "P70.5",
  "P70.6",
  "P70.7",
  "P71",
  "P72",
  "P73",
  "P74",
  "P75",
  "P76",
  "P77",
  "P78",
]);

const sections = {
  nexusPhases: true,
  phaseStatus: true,
  p417Entries: true,
  completedPhaseCommits: true,
  currentPhase: true,
  previousPhase: true,
  nextPhase: true,
  commandCenterVisibility: true,
  publicSafeWording: true,
  reportWritten: true,
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
const phaseIndexSource = read(phaseIndexPath);
const phaseStatusSource = read(phaseStatusPath);

check(existsSync(join(ROOT, phaseIndexPath)), "nexusPhases", `${phaseIndexPath} is missing`);
check(existsSync(join(ROOT, phaseStatusPath)), "phaseStatus", `${phaseStatusPath} is missing`);
check(phaseStatusSource.trim().length > 0, "phaseStatus", `${phaseStatusPath} is empty`);

let phaseIndex = {};
let phaseStatus = {};

try {
  phaseIndex = JSON.parse(phaseIndexSource);
} catch (error) {
  fail("nexusPhases", `Could not parse ${phaseIndexPath}: ${error.message}`);
}

try {
  phaseStatus = JSON.parse(phaseStatusSource);
} catch (error) {
  fail("phaseStatus", `Could not parse ${phaseStatusPath}: ${error.message}`);
}

check(Array.isArray(phaseIndex.phases), "nexusPhases", "nexus-phases.json must include a phases array");
check(Array.isArray(phaseStatus.phases), "phaseStatus", "phase-status.json must include a phases array");

const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));

check(CURRENT_PHASE_IDS.has(phaseStatus.currentPhase), "currentPhase", "currentPhase must be P43 or later handoff phase");
check(CURRENT_PHASE_IDS.has(phaseStatus.previousPhase), "previousPhase", "previousPhase must be P43.6 or later handoff phase");
check(CURRENT_PHASE_IDS.has(phaseStatus.nextPhase), "nextPhase", "nextPhase must be P44 or later handoff phase");
check(statusById.has(phaseStatus.currentPhase), "currentPhase", "currentPhase entry must exist");
check(statusById.has(phaseStatus.previousPhase), "previousPhase", "previousPhase entry must exist");
check(statusById.has(phaseStatus.nextPhase), "nextPhase", "nextPhase entry must exist");

for (const entry of phaseStatus.phases || []) {
  check(Boolean(entry.phaseId), "phaseStatus", "Every phase status needs phaseId");
  check(Boolean(entry.title), "phaseStatus", `Every phase status needs title: ${entry.phaseId}`);
  check(ALLOWED_STATUSES.includes(entry.status), "phaseStatus", `Invalid status for ${entry.phaseId}: ${entry.status}`);
  check(
    entry.commandCenterVisible === true || entry.commandCenterVisible === false,
    "commandCenterVisibility",
    `Every phase status needs commandCenterVisible boolean: ${entry.phaseId}`,
  );
}

for (const phaseId of [
  "P41.7.1",
  "P41.7.2",
  "P41.7.3",
  "P41.7.4",
  "P41.7.5",
  "P41.7.6",
  "P41.7.7",
  "P41.7",
  "P41.8",
  "P41.8.1",
  "P41.8.1A",
  "P41.8.2",
  "P41.8.2A",
  "P41.8.3",
  "P41.8.4",
  "P41.8.5",
  "P41.8.6",
  "P41.9",
  "P41.9.1",
  "P41.9.2",
  "P42",
  "P42.1",
  "P42.2",
  "P42.3",
  "P42.4",
  "P42.5",
  "P42.6",
  "P42.7",
  "P43",
  "P43.1",
  "P43.2",
  "P43.3",
  "P43.4",
  "P43.5",
  "P43.6",
  "P44",
  "P44.1",
  "P44.2",
  "P44.3",
  "P44.4",
  "P44.5",
  "P44.6",
  "P44.7",
  "P45",
  "P45.1",
  "P45.2",
  "P45.3",
  "P45.4",
  "P45.5",
  "P45.6",
  "P46",
  "P46.1",
  "P46.2",
  "P46.3",
  "P46.4",
  "P46.5",
  "P46.6",
  "P46.7",
  "P47",
  "P60",
  "P60.1",
  "P60.2",
  "P60.3",
  "P60.4",
  "P60.5",
  "P60.6",
  "P60.7",
  "P61",
  "P61.1",
  "P61.2",
  "P61.3",
  "P61.4",
  "P61.5",
  "P61.6",
  "P61.7",
  "P62",
  "P62.1",
  "P62.2",
  "P62.3",
  "P62.4",
  "P62.5",
  "P62.6",
  "P62.7",
  "P62.8",
  "P63",
]) {
  check(indexById.has(phaseId), "p417Entries", `nexus-phases missing ${phaseId}`);
  check(statusById.has(phaseId), "p417Entries", `phase-status missing ${phaseId}`);
}

for (const phaseId of ["P41.7.1", "P41.7.2", "P41.7.3", "P41.7.4", "P41.7.5", "P41.7.6"]) {
  const entry = statusById.get(phaseId);
  check(entry?.status === "complete", "p417Entries", `${phaseId} must be complete`);
  check(Boolean(entry?.branch), "completedPhaseCommits", `${phaseId} must have a branch`);
  check(Boolean(entry?.commit), "completedPhaseCommits", `${phaseId} must have a commit`);
  check(entry?.commit !== "pending-final-commit", "completedPhaseCommits", `${phaseId} must have a real commit`);
}

const p4175 = statusById.get("P41.7.5");
check(p4175?.branch === "docs/command-center-help-links-navigation", "p417Entries", "P41.7.5 branch mismatch");
check(p4175?.commit === "49c09bd", "completedPhaseCommits", "P41.7.5 commit must be 49c09bd");

const p4176 = statusById.get("P41.7.6");
check(p4176?.status === "complete", "previousPhase", "P41.7.6 must be complete");
check(p4176?.branch === "docs/docs-coverage-final-validation", "previousPhase", "P41.7.6 branch mismatch");
check(p4176?.commit === "6dc3cff", "completedPhaseCommits", "P41.7.6 commit must be 6dc3cff");
check(p4176?.nextPhase === "P41.7.7", "nextPhase", "P41.7.6 nextPhase must be P41.7.7");

const p4177 = statusById.get("P41.7.7");
check(p4177?.status === "complete", "previousPhase", "P41.7.7 must be complete");
check(p4177?.branch === "ui/header-roadmap-docs-polish", "previousPhase", "P41.7.7 branch mismatch");
check(p4177?.commit === "b9d101a", "completedPhaseCommits", "P41.7.7 commit must be b9d101a");
check(p4177?.nextPhase === "P41.8.1", "nextPhase", "P41.7.7 nextPhase must be P41.8.1");

const p417 = statusById.get("P41.7");
check(p417?.status === "complete", "p417Entries", "P41.7 parent phase must be complete");
check(p417?.branch === "ui/header-roadmap-docs-polish", "p417Entries", "P41.7 parent branch mismatch");
check(p417?.commit === "b9d101a", "completedPhaseCommits", "P41.7 parent commit must be b9d101a");
check(p417?.nextPhase === "P41.8.1", "nextPhase", "P41.7 parent nextPhase must be P41.8.1");

const p418 = statusById.get("P41.8");
check(p418?.status === "complete", "currentPhase", "P41.8 must be complete");
check(p418?.title === "Centralized Activity Log + Observability Ledger", "nextPhase", "P41.8 title mismatch");
check(p418?.commit === "867d899", "completedPhaseCommits", "P41.8 parent commit must be 867d899");
check(p418?.nextPhase === "P41.9.1", "nextPhase", "P41.8 parent nextPhase must be P41.9.1");

const p4181 = statusById.get("P41.8.1");
check(p4181?.status === "complete", "previousPhase", "P41.8.1 must be complete");
check(p4181?.title === "Activity Event Schema + Correlation ID Model", "previousPhase", "P41.8.1 title mismatch");
check(p4181?.branch === "observability/activity-event-schema", "previousPhase", "P41.8.1 branch mismatch");
check(p4181?.commit === "30c3bea", "completedPhaseCommits", "P41.8.1 commit must be 30c3bea");
check(p4181?.nextPhase === "P41.8.1A", "nextPhase", "P41.8.1 nextPhase must be P41.8.1A");

const p4181a = statusById.get("P41.8.1A");
check(p4181a?.status === "complete", "previousPhase", "P41.8.1A must be complete");
check(p4181a?.title === "Docs & Guides Usability + Header Simplification", "previousPhase", "P41.8.1A title mismatch");
check(p4181a?.branch === "fix/docs-guides-header-polish", "previousPhase", "P41.8.1A branch mismatch");
check(p4181a?.commit === "ac288b0", "completedPhaseCommits", "P41.8.1A commit must be ac288b0");
check(p4181a?.nextPhase === "P41.8.2", "nextPhase", "P41.8.1A nextPhase must be P41.8.2");

const p4182 = statusById.get("P41.8.2");
check(p4182?.status === "complete", "previousPhase", "P41.8.2 must be complete");
check(p4182?.title === "Central Activity Logger", "previousPhase", "P41.8.2 title mismatch");
check(p4182?.branch === "observability/central-activity-logger", "previousPhase", "P41.8.2 branch mismatch");
check(p4182?.commit === "3a63789", "completedPhaseCommits", "P41.8.2 commit must be 3a63789");
check(p4182?.nextPhase === "P41.8.2A", "nextPhase", "P41.8.2 nextPhase must be P41.8.2A");

const p4182a = statusById.get("P41.8.2A");
check(p4182a?.status === "complete", "previousPhase", "P41.8.2A must be complete");
check(p4182a?.title === "Docs & Guides Interaction + Activity Log Placeholder Polish", "previousPhase", "P41.8.2A title mismatch");
check(p4182a?.branch === "fix/docs-guides-activity-log-polish", "previousPhase", "P41.8.2A branch mismatch");
check(p4182a?.commit === "e2e7c88", "completedPhaseCommits", "P41.8.2A commit must be e2e7c88");
check(p4182a?.nextPhase === "P41.8.3", "nextPhase", "P41.8.2A nextPhase must be P41.8.3");

const p4183 = statusById.get("P41.8.3");
check(p4183?.status === "complete", "previousPhase", "P41.8.3 must be complete");
check(p4183?.title === "API/UI/Action Bridge Activity Capture", "previousPhase", "P41.8.3 title mismatch");
check(p4183?.branch === "observability/activity-capture-wiring", "previousPhase", "P41.8.3 branch mismatch");
check(p4183?.commit === "adcc916", "completedPhaseCommits", "P41.8.3 commit must be adcc916");
check(p4183?.nextPhase === "P41.8.4", "nextPhase", "P41.8.3 nextPhase must be P41.8.4");

const p4184 = statusById.get("P41.8.4");
check(p4184?.status === "complete", "previousPhase", "P41.8.4 must be complete");
check(p4184?.title === "Command Center Activity Log Page", "previousPhase", "P41.8.4 title mismatch");
check(p4184?.branch === "observability/activity-log-command-center-page", "previousPhase", "P41.8.4 branch mismatch");
check(p4184?.commit === "5c6b80d", "completedPhaseCommits", "P41.8.4 commit must be 5c6b80d");
check(p4184?.nextPhase === "P41.8.5", "nextPhase", "P41.8.4 nextPhase must be P41.8.5");

const p4185 = statusById.get("P41.8.5");
check(p4185?.status === "complete", "previousPhase", "P41.8.5 must be complete");
check(p4185?.title === "Trace View by Correlation ID", "previousPhase", "P41.8.5 title mismatch");
check(p4185?.branch === "observability/activity-trace-view", "previousPhase", "P41.8.5 branch mismatch");
check(p4185?.commit === "a473bc0", "completedPhaseCommits", "P41.8.5 commit must be a473bc0");
check(p4185?.nextPhase === "P41.8.6", "nextPhase", "P41.8.5 nextPhase must be P41.8.6");

const p4186 = statusById.get("P41.8.6");
check(p4186?.status === "complete", "previousPhase", "P41.8.6 must be complete");
check(p4186?.title === "Activity Tests + Docs + Final Validation", "previousPhase", "P41.8.6 title mismatch");
check(p4186?.branch === "observability/activity-final-validation", "previousPhase", "P41.8.6 branch mismatch");
check(p4186?.commit === "867d899", "completedPhaseCommits", "P41.8.6 commit must be 867d899");
check(p4186?.nextPhase === "P41.9.1", "nextPhase", "P41.8.6 nextPhase must be P41.9.1");

const p419 = statusById.get("P41.9");
check(p419?.status === "complete", "currentPhase", "P41.9 must be complete");
check(p419?.title === "README + Architecture Diagram Registry", "nextPhase", "P41.9 title mismatch");
check(p419?.branch === "docs/architecture-diagram-rendering", "currentPhase", "P41.9 branch mismatch");
check(Boolean(p419?.commit), "currentPhase", "P41.9 must have a commit or pending-final-commit placeholder");
check(p419?.nextPhase === "P42", "nextPhase", "P41.9 nextPhase must be P42");

const p4191 = statusById.get("P41.9.1");
check(p4191?.status === "complete", "previousPhase", "P41.9.1 must be complete");
check(p4191?.title === "Architecture Diagram Registry Foundation", "previousPhase", "P41.9.1 title mismatch");
check(p4191?.branch === "docs/architecture-diagram-registry-foundation", "previousPhase", "P41.9.1 branch mismatch");
check(p4191?.commit === "41bb0bd", "completedPhaseCommits", "P41.9.1 commit must be 41bb0bd");
check(p4191?.nextPhase === "P41.9.2", "nextPhase", "P41.9.1 nextPhase must be P41.9.2");

const p4192 = statusById.get("P41.9.2");
check(p4192?.status === "complete", "previousPhase", "P41.9.2 must be complete");
check(p4192?.title === "Architecture Diagram Rendering + README Follow-through", "previousPhase", "P41.9.2 title mismatch");
check(p4192?.branch === "docs/architecture-diagram-rendering", "previousPhase", "P41.9.2 branch mismatch");
check(p4192?.commit === "8ec2a4c", "completedPhaseCommits", "P41.9.2 commit must be 8ec2a4c");
check(p4192?.nextPhase === "P42.1", "nextPhase", "P41.9.2 nextPhase must be P42.1");

const p42 = statusById.get("P42");
check(p42?.status === "complete", "currentPhase", "P42 must be complete");
check(p42?.title === "Project Registry + Adapter Framework", "currentPhase", "P42 title mismatch");
check(p42?.branch === "test/project-registry-final-validation", "currentPhase", "P42 branch mismatch");
check(p42?.commit === "e6a98d2", "currentPhase", "P42 commit must be e6a98d2");
check(p42?.nextPhase === "P43", "nextPhase", "P42 nextPhase must be P43");

const p421 = statusById.get("P42.1");
check(p421?.status === "complete", "previousPhase", "P42.1 must be complete");
check(p421?.title === "Project Registry Schema + Policy", "currentPhase", "P42.1 title mismatch");
check(p421?.branch === "arch/project-registry-schema-policy", "currentPhase", "P42.1 branch mismatch");
check(p421?.commit === "4c1d11d", "completedPhaseCommits", "P42.1 commit must be 4c1d11d");
check(p421?.nextPhase === "P42.2", "nextPhase", "P42.1 nextPhase must be P42.2");

const p422 = statusById.get("P42.2");
check(p422?.status === "complete", "currentPhase", "P42.2 must be complete");
check(p422?.title === "nexus.project.json Loader + Validator", "nextPhase", "P42.2 title mismatch");
check(p422?.branch === "arch/project-profile-loader-validator", "currentPhase", "P42.2 branch mismatch");
check(p422?.commit === "276bfb4", "completedPhaseCommits", "P42.2 commit must be 276bfb4");
check(p422?.nextPhase === "P42.3", "nextPhase", "P42.2 nextPhase must be P42.3");

const p423 = statusById.get("P42.3");
check(p423?.status === "complete", "nextPhase", "P42.3 must be complete");
check(p423?.title === "Stack Profile Model", "nextPhase", "P42.3 title mismatch");
check(p423?.branch === "arch/project-registry-adapter-overnight", "currentPhase", "P42.3 branch mismatch");
check(Boolean(p423?.commit), "currentPhase", "P42.3 must have a commit or pending-final-commit placeholder");
check(p423?.nextPhase === "P42.4", "nextPhase", "P42.3 nextPhase must be P42.4");

const p424 = statusById.get("P42.4");
check(p424?.status === "complete", "nextPhase", "P42.4 must be complete");
check(p424?.title === "Project Onboarding Wizard / nexus:init-project", "nextPhase", "P42.4 title mismatch");
check(p424?.branch === "arch/project-registry-adapter-overnight", "currentPhase", "P42.4 branch mismatch");
check(Boolean(p424?.commit), "currentPhase", "P42.4 must have a commit or pending-final-commit placeholder");
check(p424?.nextPhase === "P42.5", "nextPhase", "P42.4 nextPhase must be P42.5");

const p425 = statusById.get("P42.5");
check(p425?.status === "complete", "nextPhase", "P42.5 must be complete");
check(p425?.title === "Project Selector in Command Center", "nextPhase", "P42.5 title mismatch");
check(p425?.branch === "arch/project-registry-adapter-overnight", "currentPhase", "P42.5 branch mismatch");
check(Boolean(p425?.commit), "currentPhase", "P42.5 must have a commit or pending-final-commit placeholder");
check(p425?.nextPhase === "P42.6", "nextPhase", "P42.5 nextPhase must be P42.6");

const p426 = statusById.get("P42.6");
check(p426?.status === "complete", "nextPhase", "P42.6 must be complete");
check(p426?.title === "Project Capability Matrix", "nextPhase", "P42.6 title mismatch");
check(p426?.branch === "arch/project-registry-adapter-overnight", "currentPhase", "P42.6 branch mismatch");
check(Boolean(p426?.commit), "currentPhase", "P42.6 must have a commit or pending-final-commit placeholder");
check(p426?.nextPhase === "P42.7", "nextPhase", "P42.6 nextPhase must be P42.7");

const p427 = statusById.get("P42.7");
check(p427?.status === "complete", "currentPhase", "P42.7 must be complete");
check(p427?.title === "Project Registry Adapter Final Validation + Roadmap Closure", "currentPhase", "P42.7 title mismatch");
check(p427?.branch === "test/project-registry-final-validation", "currentPhase", "P42.7 branch mismatch");
check(p427?.commit === "e6a98d2", "currentPhase", "P42.7 commit must be e6a98d2");
check(p427?.nextPhase === "P43", "nextPhase", "P42.7 nextPhase must be P43");

const p43 = statusById.get("P43");
check(p43?.status === "complete", "currentPhase", "P43 must be complete");
check(p43?.title === "Scope Boundary + Project Packaging Safety", "currentPhase", "P43 title mismatch");
check(p43?.branch === "arch/scope-boundary-packaging-safety", "currentPhase", "P43 branch mismatch");
check(Boolean(p43?.commit), "currentPhase", "P43 must have a commit or pending-final-commit placeholder");
check(p43?.nextPhase === "P44", "nextPhase", "P43 nextPhase must be P44");

const p431 = statusById.get("P43.1");
check(p431?.status === "complete", "currentPhase", "P43.1 must be complete");
check(p431?.title === "Scope Classification Model", "currentPhase", "P43.1 title mismatch");
check(p431?.branch === "arch/scope-classification-model", "currentPhase", "P43.1 branch mismatch");
check(p431?.commit === "3b8e572", "currentPhase", "P43.1 commit must be 3b8e572");
check(p431?.nextPhase === "P43.2", "nextPhase", "P43.1 nextPhase must be P43.2");

const p432 = statusById.get("P43.2");
check(p432?.status === "complete", "nextPhase", "P43.2 must be complete");
check(p432?.title === "Project vs OS Mutation Boundary", "nextPhase", "P43.2 title mismatch");
check(p432?.branch === "arch/scope-boundary-packaging-safety", "nextPhase", "P43.2 branch mismatch");
check(p432?.commit === "5ae9242", "nextPhase", "P43.2 commit must be 5ae9242");
check(p432?.nextPhase === "P43.3", "nextPhase", "P43.2 nextPhase must be P43.3");

const p433 = statusById.get("P43.3");
check(p433?.status === "complete", "nextPhase", "P43.3 must be complete");
check(p433?.title === "Project Export Safety Rules", "nextPhase", "P43.3 title mismatch");
check(p433?.branch === "arch/scope-boundary-packaging-safety", "nextPhase", "P43.3 branch mismatch");
check(p433?.commit === "69dbd28", "nextPhase", "P43.3 commit must be 69dbd28");
check(p433?.nextPhase === "P43.4", "nextPhase", "P43.3 nextPhase must be P43.4");

const p434 = statusById.get("P43.4");
check(p434?.status === "complete", "nextPhase", "P43.4 must be complete");
check(p434?.title === "Redacted Release Manifest", "nextPhase", "P43.4 title mismatch");
check(p434?.branch === "arch/scope-boundary-packaging-safety", "nextPhase", "P43.4 branch mismatch");
check(p434?.commit === "9c964a8", "nextPhase", "P43.4 commit must be 9c964a8");
check(p434?.nextPhase === "P43.5", "nextPhase", "P43.4 nextPhase must be P43.5");

const p435 = statusById.get("P43.5");
check(p435?.status === "complete", "nextPhase", "P43.5 must be complete");
check(p435?.title === "Command Center Scope Boundary UX", "nextPhase", "P43.5 title mismatch");
check(p435?.branch === "arch/scope-boundary-packaging-safety", "nextPhase", "P43.5 branch mismatch");
check(Boolean(p435?.commit), "nextPhase", "P43.5 must have a commit or pending-final-commit placeholder");
check(p435?.nextPhase === "P43.6", "nextPhase", "P43.5 nextPhase must be P43.6");

const p436 = statusById.get("P43.6");
check(p436?.status === "complete", "nextPhase", "P43.6 must be complete");
check(p436?.title === "Packaging Safety Checker + Final Validation", "nextPhase", "P43.6 title mismatch");
check(p436?.branch === "arch/scope-boundary-packaging-safety", "nextPhase", "P43.6 branch mismatch");
check(Boolean(p436?.commit), "nextPhase", "P43.6 must have a commit or pending-final-commit placeholder");
check(p436?.nextPhase === "P44", "nextPhase", "P43.6 nextPhase must be P44");

const p44 = statusById.get("P44");
check(["planned", "in_progress", "complete"].includes(p44?.status), "nextPhase", "P44 must be planned, in progress, or complete");
check(p44?.title === "Multi-Repo Workspace + Git/PR Lifecycle", "nextPhase", "P44 title mismatch");

for (const phaseId of ["P44.1", "P44.2", "P44.3", "P44.4", "P44.5", "P44.6", "P44.7"]) {
  const entry = statusById.get(phaseId);
  check(Boolean(entry), "nextPhase", `${phaseId} must exist`);
  check(entry?.commandCenterVisible === true, "commandCenterVisibility", `${phaseId} must be Command Center visible`);
}
const p441 = statusById.get("P44.1");
if (p441?.status === "complete") {
  check(p441?.branch === "arch/multi-repo-git-pr-lifecycle", "currentPhase", "P44.1 branch mismatch");
  check(Boolean(p441?.commit), "completedPhaseCommits", "P44.1 must have a commit or pending-final-commit placeholder");
}

const p568 = statusById.get("P56.8");
check(p568?.status === "complete", "currentPhase", "P56.8 must be complete");
check(
  p568?.title === "Codebase Maintainability Guardrails + Shared Utility Foundation",
  "currentPhase",
  "P56.8 title mismatch",
);
check(
  p568?.branch === "chore/codebase-maintainability-guardrails",
  "currentPhase",
  "P56.8 branch mismatch",
);
check(Boolean(p568?.commit), "completedPhaseCommits", "P56.8 must have a commit or pending-final-commit placeholder");
check(p568?.nextPhase === "P57", "nextPhase", "P56.8 nextPhase must be P57");

const p57 = statusById.get("P57");
check(["planned", "in_progress", "complete"].includes(p57?.status), "nextPhase", "P57 must be planned, in progress, or complete");
check(p57?.title === "Cost Center + Budget Enforcement", "nextPhase", "P57 title mismatch");

const p58 = statusById.get("P58");
check(["planned", "in_progress", "complete"].includes(p58?.status), "nextPhase", "P58 must be planned, in progress, or complete");
check(p58?.title === "Policy Center + Governance Admin", "nextPhase", "P58 title mismatch");

const p59 = statusById.get("P59");
check(["planned", "in_progress", "complete"].includes(p59?.status), "nextPhase", "P59 must be planned, in progress, or complete");
check(p59?.title === "Secrets and Credential Boundary", "nextPhase", "P59 title mismatch");

const p49 = statusById.get("P49");
check(p49?.status === "complete", "previousPhase", "P49 parent phase must be complete");
check(p49?.title === "Agent Definition Update Workflow", "previousPhase", "P49 title mismatch");
check(p49?.nextPhase === "P50", "nextPhase", "P49 nextPhase must be P50");
for (const phaseId of ["P49.1", "P49.2", "P49.3", "P49.4", "P49.5", "P49.6", "P49.7", "P49.8"]) {
  check(statusById.get(phaseId)?.status === "complete", "previousPhase", `${phaseId} must be complete`);
}

const p598 = statusById.get("P59.8");
check(p598?.status === "complete", "nextPhase", "P59.8 must be complete");
check(p598?.title === "Command Center OS / Multi-Project Identity Cleanup", "nextPhase", "P59.8 title mismatch");

const p60 = statusById.get("P60");
check(["planned", "in_progress", "complete"].includes(p60?.status), "nextPhase", "P60 must be planned, in progress, or complete");
check(p60?.title === "Worker Queue + Runtime Engine", "nextPhase", "P60 title mismatch");
if (p60?.status === "complete") {
  check(p60?.nextPhase === "P61", "nextPhase", "P60 nextPhase must be P61 when complete");
  for (const phaseId of ["P60.1", "P60.2", "P60.3", "P60.4", "P60.5", "P60.6", "P60.7"]) {
    check(statusById.get(phaseId)?.status === "complete", "previousPhase", `${phaseId} must be complete`);
  }
}

const p61 = statusById.get("P61");
check(["planned", "in_progress", "complete"].includes(p61?.status), "nextPhase", "P61 must be planned, in progress, or complete");
check(p61?.title === "Concurrent Execution + Work Deduplication", "nextPhase", "P61 title mismatch");
if (p61?.status === "complete") {
  check(p61?.nextPhase === "P62", "nextPhase", "P61 nextPhase must be P62 when complete");
  for (const phaseId of ["P61.1", "P61.2", "P61.3", "P61.4", "P61.5", "P61.6", "P61.7"]) {
    check(statusById.get(phaseId)?.status === "complete", "previousPhase", `${phaseId} must be complete`);
  }
}

const p62 = statusById.get("P62");
check(["planned", "in_progress", "complete"].includes(p62?.status), "nextPhase", "P62 must be planned, in progress, or complete");
check(p62?.title === "Conversational NEXUS Command Interface", "nextPhase", "P62 title mismatch");
const p628 = statusById.get("P62.8");
check(["in_progress", "complete"].includes(p628?.status), "nextPhase", "P62.8 must be in progress or complete");
check(p628?.title === "Command Center Chat Entry + Conversational UI Fix", "nextPhase", "P62.8 title mismatch");

for (const entry of phaseStatus.phases || []) {
  if (entry.status !== "complete") continue;
  check(Boolean(entry.branch), "completedPhaseCommits", `Completed phase missing branch: ${entry.phaseId}`);
  check(Boolean(entry.commit), "completedPhaseCommits", `Completed phase missing commit: ${entry.phaseId}`);
  check(Boolean(entry.summary), "completedPhaseCommits", `Completed phase missing summary: ${entry.phaseId}`);
  check(Array.isArray(entry.checksRun), "completedPhaseCommits", `Completed phase missing checksRun: ${entry.phaseId}`);
  check(Array.isArray(entry.knownLimitations), "completedPhaseCommits", `Completed phase missing knownLimitations: ${entry.phaseId}`);
  check(Boolean(entry.nextPhase), "completedPhaseCommits", `Completed phase missing nextPhase: ${entry.phaseId}`);
  check(entry.commandCenterVisible === true, "commandCenterVisibility", `Completed phase must be Command Center visible: ${entry.phaseId}`);
  if (!CURRENT_PHASE_IDS.has(entry.phaseId)) {
    check(entry.commit !== "pending-final-commit", "completedPhaseCommits", `Completed prior phase has pending commit: ${entry.phaseId}`);
  }
}

for (const forbidden of ["CareLoop", "careloop", "projects/careloop", "DemoApp"]) {
  check(!phaseStatusSource.includes(forbidden), "publicSafeWording", `Phase status contains forbidden term: ${forbidden}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

const report = `# NEXUS OS Phase Status Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Current OS Phase

- Current phase: ${phaseStatus.currentPhase || "unknown"}
- Previous phase: ${phaseStatus.previousPhase || "unknown"}
- Next phase: ${phaseStatus.nextPhase || "unknown"}

## Checks

- Nexus phases: ${sections.nexusPhases ? "PASS" : "FAIL"}
- Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}
- P41.7 entries: ${sections.p417Entries ? "PASS" : "FAIL"}
- Completed phase commits: ${sections.completedPhaseCommits ? "PASS" : "FAIL"}
- Current phase: ${sections.currentPhase ? "PASS" : "FAIL"}
- Previous phase: ${sections.previousPhase ? "PASS" : "FAIL"}
- Next phase: ${sections.nextPhase ? "PASS" : "FAIL"}
- Command Center visibility: ${sections.commandCenterVisibility ? "PASS" : "FAIL"}
- Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

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

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Nexus phases: ${sections.nexusPhases ? "PASS" : "FAIL"}`);
console.log(`Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}`);
console.log(`P41.7 entries: ${sections.p417Entries ? "PASS" : "FAIL"}`);
console.log(`Completed phase commits: ${sections.completedPhaseCommits ? "PASS" : "FAIL"}`);
console.log(`Current phase: ${sections.currentPhase ? "PASS" : "FAIL"}`);
console.log(`Previous phase: ${sections.previousPhase ? "PASS" : "FAIL"}`);
console.log(`Next phase: ${sections.nextPhase ? "PASS" : "FAIL"}`);
console.log(`Command Center visibility: ${sections.commandCenterVisibility ? "PASS" : "FAIL"}`);
console.log(`Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
