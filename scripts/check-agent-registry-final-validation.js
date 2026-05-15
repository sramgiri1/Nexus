import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildAgentCapabilityMatrix,
  buildAgentBoundaryModel,
  buildBoundaryCompilerExamples,
  getAgentRegistry,
  validateAgentBoundaryModel,
  validateAgentRegistry,
  validateSeparationOfDuties,
} from "../agent-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/agent-registry-final-validation-report.md");
const checks = [];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function read(relativePath) {
  const path = join(ROOT, relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function addCheck(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

const branch = git(["branch", "--show-current"]);
const head = git(["rev-parse", "--short", "HEAD"]);
const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json") || "{}");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const registry = getAgentRegistry();
const matrix = buildAgentCapabilityMatrix();
const boundaryModel = buildAgentBoundaryModel();
const envelopes = buildBoundaryCompilerExamples();
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
const viewModelSource = read("dashboard/src/data/commandCenterViewModel.js");
const changedFiles = git(["diff", "--name-only"]).split("\n").filter(Boolean);

addCheck("P45.1-P45.5 complete", ["P45.1", "P45.2", "P45.3", "P45.4", "P45.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P45.6 active or complete", ["in_progress", "complete"].includes(statusById.get("P45.6")?.status));
addCheck("P46 next", phaseStatus.nextPhase === "P46" || statusById.get("P45.6")?.nextPhase === "P46");
addCheck("Registry validates", validateAgentRegistry(registry).ok);
addCheck("Capability matrix validates", validateSeparationOfDuties(matrix).ok);
addCheck("Boundary model validates", validateAgentBoundaryModel(boundaryModel).ok);
addCheck("Boundary compiler examples", envelopes.length >= 4 && envelopes.every((envelope) => envelope.dryRun === true && envelope.runtimeEnforcementEnabled === false));
addCheck("Reports exist", [
  "reports/agent-registry-schema-report.md",
  "reports/agent-capability-matrix-report.md",
  "reports/agent-boundaries-report.md",
  "reports/boundary-compiler-report.md",
  "reports/command-center-ux-report.md",
  "reports/docs-coverage-report.md",
  "reports/os-phase-status-report.md",
].every((path) => existsSync(join(ROOT, path))));
addCheck("Reports include Validation HEAD", [
  "reports/agent-registry-schema-report.md",
  "reports/agent-capability-matrix-report.md",
  "reports/agent-boundaries-report.md",
  "reports/boundary-compiler-report.md",
].every((path) => read(path).includes("Validation HEAD")));
addCheck("Command Center Agent Registry UX", routeSource.includes("Agent Registry") && commandCenterSource.includes("Boundary Envelope Preview"));
addCheck(
  "DemoApp demo-only",
  !viewModelSource.includes("DemoApp") && !routeSource.includes("DemoApp"),
  "Demo-only mentions may exist in explicit docs/demo guidance, but local-private data and route metadata must not fall back to DemoApp.",
);
addCheck("No runtime enforcement enabled", viewModelSource.includes("runtimeEnforcementEnabled: false") && read("policy/boundary-compiler-policy.json").includes('"runtimeEnforcementAllowed": false'));
addCheck("No provider/tool/DB execution enabled", [
  "policy/agent-registry-policy.json",
  "policy/agent-capability-matrix-policy.json",
  "policy/agent-boundary-policy.json",
  "policy/boundary-compiler-policy.json",
].every((path) => {
  const source = read(path);
  return source.includes('"providerCallsAllowed": false')
    && source.includes('"dbWritesAllowed": false')
    && (source.includes('"toolDispatchAllowed": false') || source.includes('"runtimePermissionsGranted": false'));
}));
addCheck("No private project diff", git(["diff", "--", "projects/careloop", "projects/careloop-ios"]) === "");
addCheck("No forbidden changed files", changedFiles.every((file) => !file.startsWith("projects/careloop/") && !file.startsWith("projects/careloop-ios/") && !file.startsWith("agents/") && !file.startsWith("providers/") && !file.startsWith("tools/") && !file.startsWith("orchestrator/")));

const failed = checks.filter((check) => !check.ok);
const generatedAt = new Date().toISOString();
const report = `# Agent Registry Final Validation Report

## Metadata
- Generated at: ${generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P45.6 - Agent Boundary Tests + Final Validation

## Summary
- Registered agents: ${registry.agents.length}
- Capability matrix agents: ${matrix.agents.length}
- Boundary model agents: ${boundaryModel.agents.length}
- Boundary compiler examples: ${envelopes.length}
- Runtime enforcement enabled: false
- Provider/tool dispatch enabled: false
- DB writes enabled: false

## Checks
${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"}: ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n")}

## Remaining Limitations
- Boundary envelopes are dry-run previews and are not runtime enforcement.
- Agent editing/update workflows are deferred to P49.
- Tool/provider/worker/DB/release execution remains disabled.

## Next Phase
P46 - Scoped Memory Architecture + Memory Center
`;

writeFileSync(REPORT_PATH, report);

console.log("\nNEXUS Agent Registry Final Validation Check\n==========================================\n");
for (const check of checks) console.log(`${check.name}: ${check.ok ? "PASS" : "FAIL"}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "FAIL"}`);
if (failed.length > 0) process.exitCode = 1;
