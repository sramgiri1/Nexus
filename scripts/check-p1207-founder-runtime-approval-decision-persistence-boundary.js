import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionPersistenceBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1207-founder-runtime-approval-decision-persistence-boundary-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|final-validation|planned-only|read-only|dry-run|display-only)\b/i.test(context);
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
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1206Checker = readText("scripts/check-p1206-founder-runtime-approval-decision-persistence-boundary.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalDecisionPersistenceBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const p1207 = subphaseById.get("P120.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1207.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P120.7";

const p120Scripts = [
  "check:p1201-founder-runtime-approval-decision-persistence-boundary-contract",
  "check:p1202-founder-runtime-approval-decision-persistence-boundary",
  "check:p1203-founder-runtime-approval-decision-persistence-boundary",
  "check:p1204-founder-runtime-approval-decision-persistence-boundary",
  "check:p1205-founder-runtime-approval-decision-persistence-boundary",
  "check:p1206-founder-runtime-approval-decision-persistence-boundary",
  "check:p1207-founder-runtime-approval-decision-persistence-boundary",
];
const p120Reports = [
  "reports/p1201-founder-runtime-approval-decision-persistence-boundary-contract-report.md",
  "reports/p1202-founder-runtime-approval-decision-persistence-boundary-report.md",
  "reports/p1203-founder-runtime-approval-decision-persistence-boundary-report.md",
  "reports/p1204-founder-runtime-approval-decision-persistence-boundary-report.md",
  "reports/p1205-founder-runtime-approval-decision-persistence-boundary-report.md",
  "reports/p1206-founder-runtime-approval-decision-persistence-boundary-report.md",
];
const validationCommands = [
  "npm run check:p1207-founder-runtime-approval-decision-persistence-boundary",
  "npm run check:p1206-founder-runtime-approval-decision-persistence-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "dashboard/src/",
  "dashboard/tests/",
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
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const primaryUxSource = serializedDisplayModel;
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

const p120ClosedState =
  status.currentPhase === "P120.7"
    && status.previousPhase === "P120.6"
    && status.nextPhase === "P121"
    && roadmap.currentPhase === "P120.7"
    && roadmap.previousPhase === "P120.6"
    && roadmap.nextPhase === "P121"
    && statusById.get("P120")?.status === "complete"
    && roadmapById.get("P120")?.status === "complete"
    && statusById.get("P120.7")?.status === "complete"
    && roadmapById.get("P120.7")?.status === "complete"
    && statusById.get("P121")?.status === "planned"
    && roadmapById.get("P121")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1207-founder-runtime-approval-decision-persistence-boundary"]));
addCheck("all P120 scripts registered", p120Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P120 reports exist and pass", p120Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P120 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P121", contract.currentSubphase === "P120.7" && contract.previousSubphase === "P120.6" && contract.nextSubphase === "P121");
addCheck("P120.7 records final validation commands", validationCommands.every((command) => p1207.validationCommands?.includes(command)));
addCheck("P120.7 avoids forbidden file scope", !(p1207.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P120.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P120.6 checker accepts final handoff", p1206Checker.includes("p1207FinalState") && p1206Checker.includes("P120.7") && p1206Checker.includes("P121"));
addCheck("OS status checker recognizes P121", osStatusChecker.includes('"P121"') && statusById.has("P121") && roadmapById.has("P121"));
addCheck("phase status closed", p120ClosedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P120")?.commit, statusById.get("P120.7")?.commit, roadmapById.get("P120")?.commit, roadmapById.get("P120.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P120")?.commandCenterVisible === true && statusById.get("P120.7")?.commandCenterVisible === true);
addCheck("P121 handoff is controlled", statusById.get("P121")?.status === "planned" && roadmapById.get("P121")?.status === "planned" && statusById.get("P121")?.checksRun?.length === 0 && roadmapById.get("P121")?.checksRun?.length === 0);
addCheck("P120 plan records final validation", /P120\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P120 is complete/.test(plan) && /P121/.test(plan));
addCheck("platform roadmap records P120 complete", /P120\.7 is complete/.test(platformRoadmap) && /P120 is complete/.test(platformRoadmap) && /P121/.test(platformRoadmap));
addCheck("README records P120 complete", /P120\.7 final validation/i.test(readme) && /P120 is complete/.test(readme) && /P121/.test(readme));
addCheck("dashboard uses browser-safe persistence display model", businessBuildSource.includes("buildFounderApprovalDecisionPersistenceBoundaryDisplayModel") && businessBuildSource.includes("Approval decision persistence safe dry-run report"));
addCheck("Command Center persistence card retained", pageSource.includes("Business Build Approval Decision Persistence Boundary") && pageSource.includes("Agent Flow Approval Decision Persistence Boundary") && pageSource.includes("Persistence read-only"));
addCheck("Command Center persistence surfaces remain scoped", !pageSource.includes("Lite Approval Decision Persistence Boundary") && !pageSource.includes("Chat Approval Decision Persistence Boundary") && !pageSource.includes("Live Readiness Approval Decision Persistence Boundary"));
addCheck("route coverage retained", routeTests.includes("Approval decision persistence boundary appears only on scoped pages") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 3 && displayModel.readinessRows?.every((row) => row.label && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", zeroDisplayCounts);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(primaryUxSource));
addCheck("primary UX avoids raw persistence keys and table names", !/(founderApprovalDecisionPersistence|approval_decision_persistence|persistenceDraftRef|persistenceEventRef|persistenceEvidenceRef|approvalDecisionPersistenceKey|sqliteEntity|recordRef|requestKey)/i.test(primaryUxSource));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("public docs avoid raw persistence keys and table names", !/(founderApprovalDecisionPersistence|approval_decision_persistence|persistenceDraftRef|persistenceEventRef|persistenceEvidenceRef|approvalDecisionPersistenceKey|sqliteEntity|recordRef|requestKey|approval_decision_persistence_|founder_runtime_approval_decision_persistence)/i.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|write approval now|unlock execution now/i.test(docsBundle));
addCheck(
  "docs and UX do not claim unsafe authority live",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${primaryUxSource}`,
    /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|hosted DB mutation is enabled|raw SQL is allowed|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime writes are enabled/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P120 founder runtime approval decision persistence boundary closure.",
        "- Confirms parent P120 and all subphases are complete, reports and scripts exist, Command Center persistence route safety is retained, and P121 is a planned-only placeholder.",
        "- Does not enable approval capture, approval persistence, approve/reject decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P120.7 closes P120 validation only. It does not add Command Center source changes, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, run runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend. P121 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P120.7 Founder Runtime Approval Decision Persistence Boundary Final Report", phase: "P120.7" },
);

printCheckReport("P120.7 Founder Runtime Approval Decision Persistence Boundary Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
