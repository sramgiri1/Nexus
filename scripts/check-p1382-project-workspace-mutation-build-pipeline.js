import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  PROJECT_WORKSPACE_MUTATION_PHASE,
  PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES,
  PROJECT_WORKSPACE_MUTATION_VERSION,
  buildProjectWorkspaceMutationEnvelope,
  buildProjectWorkspaceMutationModel,
  validateProjectWorkspaceMutationModel,
} from "../shared/projectWorkspaceMutationModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1382-project-workspace-mutation-build-pipeline-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p138-project-workspace-mutation-build-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P138_PROJECT_WORKSPACE_MUTATION_BUILD_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1382-project-workspace-mutation-build-pipeline";
const EXPECTED_BASE_COMMIT = "1e9edfbd";
const EXPECTED_EXPORTS = [
  "PROJECT_WORKSPACE_MUTATION_PHASE",
  "PROJECT_WORKSPACE_MUTATION_VERSION",
  "PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES",
  "buildProjectWorkspaceMutationModel",
  "validateProjectWorkspaceMutationModel",
  "buildProjectWorkspaceMutationEnvelope",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1382-project-workspace-mutation-build-pipeline",
  "npm run check:p1381-project-workspace-mutation-build-pipeline",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|approval|rollback|explicitly allows|model)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1382 = subphaseById.get("P138.2") || {};
const p1383 = subphaseById.get("P138.3") || {};
const p1384 = subphaseById.get("P138.4") || {};
const p1385 = subphaseById.get("P138.5") || {};
const p1386 = subphaseById.get("P138.6") || {};
const p1387 = subphaseById.get("P138.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1381Checker = readText("scripts/check-p1381-project-workspace-mutation-build-pipeline.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1382-project-workspace-mutation-build-pipeline.js");
const modelSource = readText("shared/projectWorkspaceMutationModel.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P138.2";
const allowedFiles = new Set(p1382.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const model = buildProjectWorkspaceMutationModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const modelValidation = validateProjectWorkspaceMutationModel(model);
const envelope = buildProjectWorkspaceMutationEnvelope({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const p1382CurrentState =
  status.currentPhase === "P138.2"
  && status.previousPhase === "P138.1"
  && status.nextPhase === "P138.3"
  && roadmap.currentPhase === "P138.2"
  && roadmap.previousPhase === "P138.1"
  && roadmap.nextPhase === "P138.3"
  && status.current?.phaseId === "P138.2"
  && status.previous?.phaseId === "P138.1"
  && status.next?.phaseId === "P138.3"
  && roadmap.current?.phaseId === "P138.2"
  && roadmap.previous?.phaseId === "P138.1"
  && roadmap.next?.phaseId === "P138.3"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && roadmapById.get("P138")?.status === "in_progress"
  && statusById.get("P138.1")?.status === "complete"
  && roadmapById.get("P138.1")?.status === "complete"
  && statusById.get("P138.2")?.status === "complete"
  && roadmapById.get("P138.2")?.status === "complete"
  && statusById.get("P138.3")?.status === "planned"
  && roadmapById.get("P138.3")?.status === "planned";
const p1383CurrentState =
  status.currentPhase === "P138.3"
  && status.previousPhase === "P138.2"
  && status.nextPhase === "P138.4"
  && roadmap.currentPhase === "P138.3"
  && roadmap.previousPhase === "P138.2"
  && roadmap.nextPhase === "P138.4"
  && status.current?.phaseId === "P138.3"
  && status.previous?.phaseId === "P138.2"
  && status.next?.phaseId === "P138.4"
  && roadmap.current?.phaseId === "P138.3"
  && roadmap.previous?.phaseId === "P138.2"
  && roadmap.next?.phaseId === "P138.4"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && roadmapById.get("P138")?.status === "in_progress"
  && statusById.get("P138.1")?.status === "complete"
  && roadmapById.get("P138.1")?.status === "complete"
  && statusById.get("P138.2")?.status === "complete"
  && roadmapById.get("P138.2")?.status === "complete"
  && statusById.get("P138.3")?.status === "complete"
  && roadmapById.get("P138.3")?.status === "complete"
  && statusById.get("P138.4")?.status === "planned"
  && roadmapById.get("P138.4")?.status === "planned";
const p1384CurrentState =
  status.currentPhase === "P138.4"
  && status.previousPhase === "P138.3"
  && status.nextPhase === "P138.5"
  && roadmap.currentPhase === "P138.4"
  && roadmap.previousPhase === "P138.3"
  && roadmap.nextPhase === "P138.5"
  && status.current?.phaseId === "P138.4"
  && status.previous?.phaseId === "P138.3"
  && status.next?.phaseId === "P138.5"
  && roadmap.current?.phaseId === "P138.4"
  && roadmap.previous?.phaseId === "P138.3"
  && roadmap.next?.phaseId === "P138.5"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && roadmapById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P138.5")?.status === "planned"
  && roadmapById.get("P138.5")?.status === "planned";
const p1385CurrentState =
  status.currentPhase === "P138.5"
  && status.previousPhase === "P138.4"
  && status.nextPhase === "P138.6"
  && roadmap.currentPhase === "P138.5"
  && roadmap.previousPhase === "P138.4"
  && roadmap.nextPhase === "P138.6"
  && status.current?.phaseId === "P138.5"
  && status.previous?.phaseId === "P138.4"
  && status.next?.phaseId === "P138.6"
  && roadmap.current?.phaseId === "P138.5"
  && roadmap.previous?.phaseId === "P138.4"
  && roadmap.next?.phaseId === "P138.6"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && roadmapById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P138.6")?.status === "planned"
  && roadmapById.get("P138.6")?.status === "planned";
const p1386CurrentState =
  status.currentPhase === "P138.6"
  && status.previousPhase === "P138.5"
  && status.nextPhase === "P138.7"
  && roadmap.currentPhase === "P138.6"
  && roadmap.previousPhase === "P138.5"
  && roadmap.nextPhase === "P138.7"
  && status.current?.phaseId === "P138.6"
  && status.previous?.phaseId === "P138.5"
  && status.next?.phaseId === "P138.7"
  && roadmap.current?.phaseId === "P138.6"
  && roadmap.previous?.phaseId === "P138.5"
  && roadmap.next?.phaseId === "P138.7"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && roadmapById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P138.7")?.status === "planned"
  && roadmapById.get("P138.7")?.status === "planned";
const p1387FinalState =
  status.currentPhase === "P138.7"
  && status.previousPhase === "P138.6"
  && status.nextPhase === "P139"
  && roadmap.currentPhase === "P138.7"
  && roadmap.previousPhase === "P138.6"
  && roadmap.nextPhase === "P139"
  && status.current?.phaseId === "P138.7"
  && status.previous?.phaseId === "P138.6"
  && status.next?.phaseId === "P139"
  && roadmap.current?.phaseId === "P138.7"
  && roadmap.previous?.phaseId === "P138.6"
  && roadmap.next?.phaseId === "P139"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "complete"
  && roadmapById.get("P138")?.status === "complete"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6", "P138.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139")?.status === "planned"
  && roadmapById.get("P139")?.status === "planned";
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const serializedModel = JSON.stringify(model);

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1382-project-workspace-mutation-build-pipeline.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("model exports exist", PROJECT_WORKSPACE_MUTATION_PHASE === "P138.2" && PROJECT_WORKSPACE_MUTATION_VERSION === "1.0" && Array.isArray(PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES) && EXPECTED_EXPORTS.every((name) => modelSource.includes(`export ${name}`) || modelSource.includes(`export function ${name}`) || modelSource.includes(`export const ${name}`)));
addCheck("model reuses existing helpers", [
  "./agentWorkOrderRuntimeModel.js",
  "./modeGuard.js",
  "./redaction.js",
  "./resultEnvelope.js",
].every((needle) => modelSource.includes(needle)));
addCheck("model avoids forbidden runtime imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|local-state\/runtime|deploy|release|exports|packages|projects)\//.test(modelSource));
addCheck("model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("envelope validates", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P138.2" && envelope.data?.phase === "P138.2" && envelope.errors.length === 0);
addCheck("model has scoped project boundary", model.selectedProjectProfile?.privateRawIdVisible === false && model.projectBoundary?.approvedBoundaryPresent === false && model.projectBoundary?.boundaryBypassAllowed === false && model.allowedPathGlobs.length >= 3 && model.forbiddenPathGlobs.length >= 5);
addCheck("model has useful plan shape", model.changeIntent?.requestedOutcome && model.patchPlan?.candidateChanges?.length >= 4 && model.buildPlan?.commandCandidates?.length === 1 && model.testPlan?.commandCandidates?.length === 1 && model.rollbackPlan?.rollbackSteps?.length >= 4);
addCheck("model keeps approval required", model.approvalGate?.required === true && model.approvalGate?.approvalCaptured === false && model.approvalGate?.approved === false && model.approvalGate?.bypassAllowed === false);
addCheck("candidate counts are blocked", model.candidateCounts?.patchCandidates >= 1 && Object.entries(model.candidateCounts).every(([key, value]) => key === "patchCandidates" ? value >= 1 : value === 0));
addCheck("all authority flags remain blocked", PROJECT_WORKSPACE_MUTATION_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false));
addCheck("plans do not expose executable commands", model.buildPlan?.executableCommand === null && model.testPlan?.executableCommand === null && model.rollbackPlan?.executableNow === false);
addCheck("model has operator-facing state", Boolean(model.ownerAgentCapability) && Boolean(model.nextAction) && Boolean(model.disabledReason) && Boolean(model.costImpact) && Array.isArray(model.blockers) && model.blockers.length >= 5);
addCheck("model hides raw private ids and dumps", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel) && !/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|raw JSON|raw logs|raw policy dump|raw patch dump|raw diff dump/i.test(serializedModel));
addCheck("model avoids fake runnable actions", !/apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(serializedModel));
addCheck("contract advances P138.2", contract.phaseId === "P138" && ((contract.status === "in_progress" && ((contract.currentSubphase === "P138.2" && contract.previousSubphase === "P138.1" && contract.nextSubphase === "P138.3" && p1383.status === "planned") || (contract.currentSubphase === "P138.3" && contract.previousSubphase === "P138.2" && contract.nextSubphase === "P138.4" && p1383.status === "complete" && p1384.status === "planned") || (contract.currentSubphase === "P138.4" && contract.previousSubphase === "P138.3" && contract.nextSubphase === "P138.5" && p1383.status === "complete" && p1384.status === "complete") || (contract.currentSubphase === "P138.5" && contract.previousSubphase === "P138.4" && contract.nextSubphase === "P138.6" && p1383.status === "complete" && p1384.status === "complete" && p1385.status === "complete") || (contract.currentSubphase === "P138.6" && contract.previousSubphase === "P138.5" && contract.nextSubphase === "P138.7" && p1383.status === "complete" && p1384.status === "complete" && p1385.status === "complete" && p1386.status === "complete" && p1387.status === "planned"))) || (contract.status === "complete" && contract.currentSubphase === "P138.7" && contract.previousSubphase === "P138.6" && contract.nextSubphase === "P139" && p1383.status === "complete" && p1384.status === "complete" && p1385.status === "complete" && p1386.status === "complete" && p1387.status === "complete")) && p1382.status === "complete");
addCheck("contract records expected base commit", p1382.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((name) => p1382.expectedExports?.includes(name)) && !p1382.expectedExports?.includes("buildProjectPatchBuildPreview"));
addCheck("P138.1 report passes", reportPassed("reports/p1381-project-workspace-mutation-build-pipeline-report.md"));
addCheck("P138.1 checker accepts P138.2", p1381Checker.includes("p1382CurrentState") && p1381Checker.includes('status.currentPhase === "P138.2"'));
addCheck("enterprise checker accepts P138.2", enterpriseChecker.includes("p1382CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P138.3 handoff", ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6", "P138.7"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P138 plan records P138.2", /## P138\.2 Workspace Mutation Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P138.2", /P138\.2 project workspace mutation model/i.test(readme));
addCheck("platform roadmap records P138.2", /P138\.2 project workspace mutation model is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P138.2", /P138\.2 is now complete/i.test(enterpriseRoadmap) && (/P138\.3 is the next executable subphase/i.test(enterpriseRoadmap) || /P138\.3 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status starts P138.2 or hands off through P138.7", p1382CurrentState || p1383CurrentState || p1384CurrentState || p1385CurrentState || p1386CurrentState || p1387FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P138.2 entries have required fields", [statusById.get("P138"), statusById.get("P138.2"), roadmapById.get("P138.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P138.3 remains planned or is safely complete", (statusById.get("P138.3")?.status === "planned" && roadmapById.get("P138.3")?.status === "planned" && !(statusById.get("P138.3")?.checksRun || []).length) || p1383CurrentState || p1384CurrentState || p1385CurrentState || p1386CurrentState || p1387FinalState);
addCheck(
  "changed files stay in P138.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P138.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable project actions", !/apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(project mutation is enabled|patch application is enabled|build execution is enabled|test execution is enabled|rollback execution is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|provider calls are enabled|model calls are enabled|agent dispatch is enabled|DB writes are enabled|runtime writes are enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw registry dumps?|raw patch dumps?|raw diff dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Implements the P138.2 read-only project workspace mutation model.",
        "- Produces project boundary, allowed/forbidden path summaries, change intent, patch plan, build plan, test plan, rollback plan, approval gate, evidence/activity/audit refs, owner, next action, blockers, disabled reason, cost impact, and blocked safety flags.",
        "- Confirms this subphase does not mutate project files, apply patches, run builds/tests, execute rollbacks, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Model Summary",
      body: [
        `- Phase: ${model.phase}`,
        `- Candidate patch summaries: ${model.candidateCounts.patchCandidates}`,
        `- Project mutation candidates: ${model.candidateCounts.projectMutationCandidates}`,
        `- Build execution candidates: ${model.candidateCounts.buildExecutionCandidates}`,
        `- Approval state: ${model.approvalGate.gateState}`,
        `- Disabled reason: ${model.disabledReason}`,
        `- Cost impact: ${model.costImpact}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P138.2 is read-only model work only. It does not apply patches, mutate projects, run builds/tests, execute rollbacks, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, deploy, release, export, package, use network calls, or spend. Later P138 subphases may advance only through their own scoped plans and validation.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P138.2 Project Workspace Mutation Model Report", phase: "P138.2" },
);

printCheckReport("P138.2 Project Workspace Mutation Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
