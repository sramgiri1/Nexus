import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "os-phase-status-report.md");

const sections = {
  phaseRegistry: true,
  currentPhase: true,
  nextPhase: true,
  roadmapData: true,
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

let phaseIndex = null;
let phaseStatus = null;
let roadmapSource = "";

try {
  phaseIndex = JSON.parse(read("os-roadmap/nexus-phases.json"));
} catch (error) {
  fail("phaseRegistry", `Could not parse os-roadmap/nexus-phases.json: ${error.message}`);
}

try {
  phaseStatus = JSON.parse(read("os-roadmap/phase-status.json"));
} catch (error) {
  fail("phaseRegistry", `Could not parse os-roadmap/phase-status.json: ${error.message}`);
}

roadmapSource = read("dashboard/src/data/nexusRoadmap.js");

check(Array.isArray(phaseIndex?.phases), "phaseRegistry", "Phase index must include a phases array");
check(Array.isArray(phaseStatus?.phases), "phaseRegistry", "Phase status must include a phases array");

const currentPhase = phaseStatus?.phases?.find((entry) => entry.phaseId === "P41.6.4");
check(!!currentPhase, "currentPhase", "P41.6.4 must exist in os-roadmap/phase-status.json");
check(currentPhase?.status === "COMPLETE", "currentPhase", "P41.6.4 must be marked COMPLETE");
check(Boolean(currentPhase?.branch), "currentPhase", "P41.6.4 must record a branch");
check(
  currentPhase?.commit === "pending-final-commit" || Boolean(currentPhase?.commit),
  "currentPhase",
  "P41.6.4 must record a commit or pending-final-commit placeholder",
);
check(Boolean(currentPhase?.nextPhase), "currentPhase", "P41.6.4 must record a nextPhase");
check(currentPhase?.commandCenterVisible === true, "currentPhase", "P41.6.4 must be Command Center visible");

const nextPhase = phaseStatus?.phases?.find((entry) => entry.phaseId === "P41.6.5");
check(!!nextPhase, "nextPhase", "P41.6.5 must exist in os-roadmap/phase-status.json");
check(nextPhase?.status === "PLANNED", "nextPhase", "P41.6.5 must be marked PLANNED");

for (const phaseId of ["P41.6.1", "P41.6.2", "P41.6.3", "P41.6.4", "P41.6.5"]) {
  check(roadmapSource.includes(phaseId), "roadmapData", `dashboard/src/data/nexusRoadmap.js missing ${phaseId}`);
  check(
    phaseIndex?.phases?.some((entry) => entry.phaseId === phaseId),
    "phaseRegistry",
    `os-roadmap/nexus-phases.json missing ${phaseId}`,
  );
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Phase registry: ${sections.phaseRegistry ? "PASS" : "FAIL"}`);
console.log(`Current phase: ${sections.currentPhase ? "PASS" : "FAIL"}`);
console.log(`Next phase: ${sections.nextPhase ? "PASS" : "FAIL"}`);
console.log(`Roadmap data: ${sections.roadmapData ? "PASS" : "FAIL"}`);
console.log(`Report: ${sections.report ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

const report = `# NEXUS OS Phase Status Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Phase Status

- P41.6.1: COMPLETE
- P41.6.2: COMPLETE
- P41.6.3: COMPLETE
- P41.6.4: ${currentPhase?.status || "UNKNOWN"}
- P41.6.5: ${nextPhase?.status || "UNKNOWN"}

## Summary

- P41.6.1 established the read-only service manifest, status command, and doctor command.
- P41.6.2 added localhost-only process management with nexus:up and nexus:down.
- P41.6.3 added the Command Center Service Health route for operator visibility.
- P41.6.4 adds the NEXUS command palette plus simple operator actions for Plan, Review, QA, Fix, Ship, Retro, Guard, Freeze, and Explain.

## Known Limitations

- Commands do not enable provider dispatch, worker runtime, DB writes, or release execution.
- Several commands remain disabled until later governed capabilities are implemented.
- check:public-safety still has known pre-existing roadmap-doc false positives.

## Next Phase

- P41.6.5 — Boot Docs, Troubleshooting, and Final Validation

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

if (result !== "PASS") {
  process.exitCode = 1;
}
