import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildFounderApprovalDecisionPersistenceIntentModel,
  validateFounderApprovalDecisionPersistenceIntentModel,
} from "../shared/founderApprovalDecisionPersistenceIntentModel.js";
import {
  buildFounderApprovalDecisionPersistencePreview,
  validateFounderApprovalDecisionPersistencePreview,
} from "../shared/founderApprovalDecisionPersistencePreview.js";
import { buildFounderApprovalDecisionPersistenceBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1206-founder-runtime-approval-decision-persistence-boundary-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
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
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|display-only|read-only|metadata-only|model-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md");
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalDecisionPersistenceBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const intentModel = buildFounderApprovalDecisionPersistenceIntentModel({ intentState: "ready_for_safe_dry_run" });
const preview = buildFounderApprovalDecisionPersistencePreview({ intentModel });
const intentValidation = validateFounderApprovalDecisionPersistenceIntentModel(intentModel);
const previewValidation = validateFounderApprovalDecisionPersistencePreview(preview);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P120.6";
const p1206 = subphaseById.get("P120.6") || {};
const p1207 = subphaseById.get("P120.7") || {};
const allowedFiles = new Set(p1206.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
  "live-ready/",
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
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const serializedDisplayModel = JSON.stringify(displayModel);
const previousReportPaths = [
  "reports/p1201-founder-runtime-approval-decision-persistence-boundary-contract-report.md",
  "reports/p1202-founder-runtime-approval-decision-persistence-boundary-report.md",
  "reports/p1203-founder-runtime-approval-decision-persistence-boundary-report.md",
  "reports/p1204-founder-runtime-approval-decision-persistence-boundary-report.md",
  "reports/p1205-founder-runtime-approval-decision-persistence-boundary-report.md",
];
const packageScripts = [
  "check:p1201-founder-runtime-approval-decision-persistence-boundary-contract",
  "check:p1202-founder-runtime-approval-decision-persistence-boundary",
  "check:p1203-founder-runtime-approval-decision-persistence-boundary",
  "check:p1204-founder-runtime-approval-decision-persistence-boundary",
  "check:p1205-founder-runtime-approval-decision-persistence-boundary",
  "check:p1206-founder-runtime-approval-decision-persistence-boundary",
];
const completedSubphases = ["P120.1", "P120.2", "P120.3", "P120.4", "P120.5", "P120.6"];
const zeroDisplayCounts = [
  "persistenceCandidateCount",
  "persistableCandidateCount",
  "decisionRecordableCandidateCount",
  "approvalDecisionRecordableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "executionUnlockCandidateCount",
  "agentDispatchCandidateCount",
  "projectMutationCandidateCount",
  "hostedDbMutationCandidateCount",
  "providerSpendCandidateCount",
].every((field) => displayModel[field] === 0);
const p1206CurrentState =
  status.currentPhase === "P120.6"
    && status.previousPhase === "P120.5"
    && status.nextPhase === "P120.7"
    && roadmap.currentPhase === "P120.6"
    && roadmap.previousPhase === "P120.5"
    && roadmap.nextPhase === "P120.7"
    && statusById.get("P120")?.status === "in_progress"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && ["planned", "complete"].includes(statusById.get("P120.7")?.status);
const p1207FinalState =
  status.currentPhase === "P120.7"
    && status.previousPhase === "P120.6"
    && status.nextPhase === "P121"
    && roadmap.currentPhase === "P120.7"
    && roadmap.previousPhase === "P120.6"
    && roadmap.nextPhase === "P121"
    && statusById.get("P120")?.status === "complete"
    && roadmapById.get("P120")?.status === "complete"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && statusById.get("P120.7")?.status === "complete"
    && roadmapById.get("P120.7")?.status === "complete"
    && statusById.get("P121")?.status === "planned"
    && roadmapById.get("P121")?.status === "planned";

addCheck("package scripts registered", packageScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P120.1-P120.6 contract statuses complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete") && ["planned", "complete"].includes(p1207.status));
addCheck("P120.6 contract records validation commands", p1206.validationCommands?.includes("npm run check:p1206-founder-runtime-approval-decision-persistence-boundary") && p1206.validationCommands?.includes("git diff --check"));
addCheck("previous reports exist", previousReportPaths.every((reportPath) => existsSync(join(ROOT, reportPath))));
addCheck("intent and preview validate", intentValidation.valid && previewValidation.valid, `${intentValidation.errors.join("; ")} ${previewValidation.errors.join("; ")}`.trim());
addCheck("display model remains blocked and useful", displayModel.readinessRowCount === 3 && displayModel.blockedReadinessRowCount === 3 && zeroDisplayCounts && displayModel.ownerCapability === "NEXUS Approval Decision Persistence Boundary");
addCheck("scoped Playwright coverage remains present", routeTests.includes("Approval decision persistence boundary appears only on scoped pages") && routeTests.includes("Founder runtime approval decision persistence boundary"));
addCheck("docs record P120.6", /P120\.6 Approval Decision Persistence Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P120.6", /P120\.6 approval decision persistence validation/i.test(readme) && /P120\.7\s+is\s+next/.test(readme));
addCheck("platform roadmap records P120.6", /P120\.6 is complete/.test(platformRoadmap) && /P120\.7\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  p1206CurrentState || p1207FinalState,
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P120.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P120.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw schema names", !/(founderApprovalDecisionPersistence|approval_decision_persistence|persistenceDraftRef|persistenceEventRef|persistenceEvidenceRef|sqliteEntity|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P120.1-P120.5 together before final validation.",
        "- Confirms contract, schema metadata, intent model, safe dry run, scoped Command Center UX, docs, reports, package scripts, and phase status are aligned.",
        "- Does not add approval persistence, DB/runtime writes, approve/reject recording, execution, dispatch, provider calls, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1206.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P120.6 is validation and docs only. Approval capture, approval persistence, approve/reject decision recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, and provider spend remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P120.6 Founder Runtime Approval Decision Persistence Boundary Validation Report", phase: "P120.6" },
);

printCheckReport("P120.6 Founder Runtime Approval Decision Persistence Boundary Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
