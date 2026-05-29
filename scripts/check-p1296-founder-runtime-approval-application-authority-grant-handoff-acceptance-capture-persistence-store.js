import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDisplayModel } from "../dashboard/src/data/businessBuild.js";
import {
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1296-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json";
const PLAN_PATH = "docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md";

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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|display-only|read-only|future|local-only|scoped)\b/i.test(context);
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
const p1296 = subphaseById.get("P129.6") || {};
const p1297 = subphaseById.get("P129.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1295Checker = readText("scripts/check-p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js");
const dryRun = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun();
const dryRunValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun(dryRun);
const displayModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  acceptanceCapturePersistenceStoreDryRun: dryRun,
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const p129DocsSlice = `${plan}\n${readme.match(/- P129\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme}\n${platformRoadmap.match(/P129\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P129.6";
const allowedFiles = new Set(p1296.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
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
const forbiddenDashboardSurfaces = [
  "Lite Capture Persistence Store Readiness",
  "Chat Capture Persistence Store Readiness",
  "Live Readiness Capture Persistence Store Readiness",
  "OS Roadmap Capture Persistence Store Readiness",
];
const p1296CurrentState = status.currentPhase === "P129.6"
  && status.previousPhase === "P129.5"
  && status.nextPhase === "P129.7"
  && roadmap.currentPhase === "P129.6"
  && roadmap.previousPhase === "P129.5"
  && roadmap.nextPhase === "P129.7";
const p1297StartedState = status.currentPhase === "P129.7"
  && status.previousPhase === "P129.6"
  && roadmap.currentPhase === "P129.7"
  && roadmap.previousPhase === "P129.6";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1296-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store"]));
addCheck("dry-run source remains valid", dryRunValidation.valid === true && dryRun.safeDryRunOnly === true && dryRun.localOnly === true);
addCheck("business build exposes store display model", businessBuildSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDisplayModel") && businessBuildSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode === "Store dry-run only" && displayModel.readinessRowCount === 6 && displayModel.blockedReadinessRowCount === 6 && Array.isArray(displayModel.summaryRows) && Array.isArray(displayModel.readinessRows));
addCheck("display model rows are founder-useful", displayModel.readinessRows.every((row) => row.label && row.decisionState === "Store dry-run blocked" && row.nextAction && row.blocker && row.evidenceLocation && row.costImpact));
addCheck("display model sections are useful", displayModel.readinessSections.length === 3 && displayModel.readinessSections.every((section) => section.label && section.blockedCount === 6 && section.nextAction));
addCheck(
  "display model safety counts blocked",
  displayModel.liveCrudActionCount === 0
    && displayModel.dbReadCandidateCount === 0
    && displayModel.dbWritableCandidateCount === 0
    && displayModel.runtimeWritableCandidateCount === 0
    && displayModel.persistedCaptureCandidateCount === 0
    && displayModel.runtimeExecutableCandidateCount === 0
    && displayModel.executionUnlockCandidateCount === 0
    && displayModel.agentDispatchCandidateCount === 0
    && displayModel.projectMutationCandidateCount === 0
    && displayModel.networkCallCandidateCount === 0
    && displayModel.providerSpendCandidateCount === 0,
);
addCheck("reusable Command Center card renders store display", pageSource.includes("FounderApprovalDecisionBoundaryCard") && pageSource.includes("summaryRows") && pageSource.includes("rowAriaSuffix"));
addCheck("store readiness rendered on scoped pages only", pageSource.includes("Business Build Capture Persistence Store Readiness") && pageSource.includes("Agent Flow Capture Persistence Store Readiness") && forbiddenDashboardSurfaces.every((label) => !pageSource.includes(label)));
addCheck("store readiness renders founder-useful state", primaryUxSource.includes("Capture Persistence Store Readiness") && serializedDisplayModel.includes("Dry-run envelopes") && serializedDisplayModel.includes("Live CRUD actions") && serializedDisplayModel.includes("DB-writable candidates") && serializedDisplayModel.includes("Runtime-writable candidates") && serializedDisplayModel.includes("Store CRUD dry-run evidence") && serializedDisplayModel.includes("No provider spend"));
addCheck("Chat and Lite remain clean", !pageSource.includes("Lite Capture Persistence Store Readiness") && !pageSource.includes("Chat Capture Persistence Store Readiness") && !pageSource.includes("Ask NEXUS Capture Persistence Store Readiness"));
addCheck("Playwright coverage added", routeTests.includes("capture persistence store readiness appears only on scoped pages") && routeTests.includes("Founder approval application authority grant handoff acceptance capture persistence store") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Store CRUD dry-run evidence"));
addCheck("contract marks P129.6 complete and P129.7 handoff valid", p1296.status === "complete" && ["planned", "complete"].includes(p1297.status));
addCheck("contract records expected export", p1296.expectedExports?.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDisplayModel"));
addCheck("contract allows only scoped dashboard files", (p1296.allowedFiles || []).includes("dashboard/src/data/businessBuild.js") && (p1296.allowedFiles || []).includes("dashboard/src/pages/CommandCenterV2.jsx") && (p1296.allowedFiles || []).includes("dashboard/tests/routes.spec.js"));
addCheck("P129.5 checker accepts P129.6 handoff", p1295Checker.includes("p1296StartedState") && p1295Checker.includes('status.nextPhase === "P129.7"'));
addCheck("docs record P129.6", /## P129\.6 Command Center Store UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P129.6", /P129\.6 Command Center store UX/i.test(readme) && /P129\.7 is next/i.test(readme));
addCheck("platform roadmap records P129.6", /P129\.6 is complete/i.test(platformRoadmap) && /P129\.7 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1296CurrentState || p1297StartedState)
    && statusById.get("P129")?.status === "in_progress"
    && statusById.get("P129.5")?.status === "complete"
    && statusById.get("P129.6")?.status === "complete"
    && roadmapById.get("P129.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P129.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P129.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw store internals", !/(founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStore|approval_authority_grant_handoff_acceptance_capture|acceptanceCaptureStoreRecord|acceptanceCaptureStoreIndex|acceptanceCaptureStoreEvidenceLink|targetEntityName|actionName|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P129|p129\d|reports\/p129/i.test(primaryUxSource));
addCheck("store UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump|raw policy/i.test(serializedDisplayModel));
addCheck("primary UX avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(p129DocsSlice, /store CRUD is enabled|CRUD is live|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|migration is live|schema is created|acceptance capture is persisted|capture persistence store is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P129.6 scoped Command Center capture persistence store UX.",
        "- Confirms Business Build and Agent Flow render display-safe store readiness while Chat, Lite, OS Roadmap, and Live Readiness stay clean.",
        "- Does not create DB schemas, run migrations, read or write DB records, write runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: (p1296.validationCommands || []).map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P129.6 renders display-safe store readiness only. It does not run CRUD actions, read or write DB records, write runtime records, persist acceptance capture, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record decisions, unlock execution, dispatch agents, mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P129.6 Command Center Store UX Report", phase: "P129.6" },
);

printCheckReport("P129.6 Command Center Store UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
