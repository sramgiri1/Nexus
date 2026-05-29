import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1227-founder-runtime-approval-decision-application-authority-handoff-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|display-only|read-only|future|validation-only|docs-only|final-validation-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p122Subphases = ["P122.1", "P122.2", "P122.3", "P122.4", "P122.5", "P122.6", "P122.7"];
const p1227 = subphaseById.get("P122.7") || {};
const p123Status = statusById.get("P123") || {};
const p123Roadmap = roadmapById.get("P123") || {};
const plan = readText("docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1226Checker = readText("scripts/check-p1226-founder-runtime-approval-decision-application-authority-handoff.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P122.7";
const allowedFiles = new Set(p1227.allowedFiles || []);
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
const p122Entries = [statusById.get("P122"), ...p122Subphases.map((phaseId) => statusById.get(phaseId))].filter(Boolean);
const stalePending = p122Entries.filter((entry) => entry.commit === "pending-final-commit" && !["P122", "P122.7"].includes(entry.phaseId));
const p1227StatusAccepted = (status.currentPhase === "P122.7"
  && status.previousPhase === "P122.6"
  && status.nextPhase === "P123"
  && roadmap.currentPhase === "P122.7"
  && roadmap.previousPhase === "P122.6"
  && roadmap.nextPhase === "P123")
  || (status.currentPhase === "P123.1"
    && status.previousPhase === "P122.7"
    && status.nextPhase === "P123.2"
    && roadmap.currentPhase === "P123.1"
    && roadmap.previousPhase === "P122.7"
    && roadmap.nextPhase === "P123.2");
const p123HandoffAccepted = (p123Status.status === "planned" && p123Roadmap.status === "planned")
  || (p123Status.status === "in_progress"
    && p123Roadmap.status === "in_progress"
    && statusById.get("P123.1")?.status === "complete"
    && roadmapById.get("P123.1")?.status === "complete");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1227-founder-runtime-approval-decision-application-authority-handoff"]));
addCheck("contract marks P122 complete", contract.status === "complete" && contract.currentSubphase === "P122.7" && contract.previousSubphase === "P122.6" && contract.nextSubphase === "P123");
addCheck("contract marks every P122 subphase complete", p122Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract records final validation scope", p1227.status === "complete" && p1227.scopeClassification === "NEXUS_OS_CHANGE" && p1227.expectedExports?.length === 0 && p1227.dataShape?.includes("No runtime exports"));
addCheck("contract forbids dashboard source edits", (p1227.forbiddenFiles || []).includes("dashboard/src/**") && (p1227.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("OS checker recognizes P123", /\"P123\"/.test(osStatusChecker));
addCheck("P122.6 checker accepts P122.7 handoff", p1226Checker.includes("P122.7") && p1226Checker.includes("P123") && p1226Checker.includes("p1226HandoffAccepted"));
addCheck("P122.5 UX regression coverage remains present", routeTests.includes("Approval application authority handoff appears only on scoped pages") && routeTests.includes("Founder approval application authority handoff") && routeTests.includes("Authority scope"));
addCheck("display model remains safe", displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && displayModel.authorityCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("primary UX stays scoped", pageSource.includes("Business Build Approval Application Authority Handoff") && pageSource.includes("Agent Flow Approval Application Authority Handoff") && !pageSource.includes("Lite Approval Application Authority Handoff") && !pageSource.includes("Chat Approval Application Authority Handoff"));
addCheck("primary UX avoids internal phase labels and report paths", !/P122|p122\d|reports\/p122/i.test(primaryUxSource));
addCheck("primary UX avoids raw schema names and private IDs", !/(founderApprovalDecisionApplication|approval_decision_application|approval_application_authority|authorityDraftRef|authorityEventRef|authorityEvidenceRef|approvalApplicationAuthorityKey|(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*)/i.test(serializedDisplayModel));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("docs record P122.7", /P122\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P122.7 and parent completion", /P122\.7 is complete/.test(platformRoadmap) && /P122 is complete/.test(platformRoadmap) && /P123\s+is\s+next/.test(platformRoadmap));
addCheck("README records P122.7 and parent completion", /P122\.7 approval application authority final validation/.test(readme) && /P122 is complete/.test(readme) && /P123\s+is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  p1227StatusAccepted
    && statusById.get("P122")?.status === "complete"
    && statusById.get("P122.7")?.status === "complete"
    && p122Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete")
    && roadmapById.get("P122")?.status === "complete"
    && roadmapById.get("P122.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P123 planned handoff exists", p123HandoffAccepted && p123Status.commandCenterVisible === true);
addCheck("completed P122 entries have commits", p122Entries.length === 8 && p122Entries.every((entry) => Boolean(entry.commit)) && stalePending.length === 0, stalePending.map((entry) => entry.phaseId).join(", "));
addCheck(
  "changed files stay in P122.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P122.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P122.7 contract avoids forbidden file scope", !(p1227.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1227.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1227.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1226Checker}\n${readText("scripts/check-p1227-founder-runtime-approval-decision-application-authority-handoff.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority handoff is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P122.7 final validation and parent phase closure.",
        "- Confirms P122.1-P122.7 are complete, P122 is complete, and P123 is the next planned OS phase.",
        "- Does not modify Command Center source/tests and does not enable grant, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1227.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P122.7 is final validation only. It does not grant authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P122.7 Approval Application Authority Handoff Final Validation Report", phase: "P122.7" },
);

printCheckReport("P122.7 Approval Application Authority Handoff Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
