import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1241-founder-runtime-approval-application-authority-grant-boundary-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|display-only|read-only|future|contract-only|planned)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p124-founder-runtime-approval-application-authority-grant-boundary-contracts.json");
const p123Contract = readJson("contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p124Subphases = ["P124.1", "P124.2", "P124.3", "P124.4", "P124.5", "P124.6", "P124.7"];
const p1241 = subphaseById.get("P124.1") || {};
const p1242 = subphaseById.get("P124.2") || {};
const p1243 = subphaseById.get("P124.3") || {};
const plan = readText("docs/architecture/P124_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1237Checker = readText("scripts/check-p1237-founder-runtime-approval-application-authority-activation-boundary.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P124.1";
const allowedFiles = new Set(p1241.allowedFiles || []);
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
const p1241ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P124.1"
  && contract.previousSubphase === "P123.7"
  && contract.nextSubphase === "P124.2"
  && p1241.status === "complete"
  && p1242.status === "planned";
const p1242StartedState = contract.status === "in_progress"
  && contract.currentSubphase === "P124.2"
  && contract.previousSubphase === "P124.1"
  && contract.nextSubphase === "P124.3"
  && p1241.status === "complete"
  && p1242.status === "complete"
  && ["planned", "complete"].includes(p1243.status);
const p1241StatusState = status.currentPhase === "P124.1"
  && status.previousPhase === "P123.7"
  && status.nextPhase === "P124.2"
  && roadmap.currentPhase === "P124.1"
  && roadmap.previousPhase === "P123.7"
  && roadmap.nextPhase === "P124.2"
  && statusById.get("P124.2")?.status === "planned";
const p1242StatusState = status.currentPhase === "P124.2"
  && status.previousPhase === "P124.1"
  && status.nextPhase === "P124.3"
  && roadmap.currentPhase === "P124.2"
  && roadmap.previousPhase === "P124.1"
  && roadmap.nextPhase === "P124.3"
  && statusById.get("P124.2")?.status === "complete"
  && ["planned", "complete"].includes(statusById.get("P124.3")?.status);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1241-founder-runtime-approval-application-authority-grant-boundary"]));
addCheck("P123 activation boundary is complete", p123Contract.status === "complete" && statusById.get("P123")?.status === "complete" && roadmapById.get("P123")?.status === "complete");
addCheck("contract marks P124.1 complete", p1241ContractState || p1242StartedState);
addCheck("contract splits P124 into seven subphases", p124Subphases.every((phaseId) => subphaseById.has(phaseId)) && contract.subphases?.length === 7);
addCheck("contract records contract-only scope", p1241.expectedExports?.length === 0 && p1241.dataShape?.includes("No runtime exports") && p1241.commandCenterUx?.includes("No new cards"));
addCheck("contract forbids dashboard source edits", (p1241.forbiddenFiles || []).includes("dashboard/src/**") && (p1241.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("OS checker recognizes P124 subphases", p124Subphases.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("P123.7 checker accepts P124.1 handoff", p1237Checker.includes("P124.1") && p1237Checker.includes("P124.2") && p1237Checker.includes("p1241StatusAccepted"));
addCheck("P123.5 route regression coverage remains present", routeTests.includes("Approval application authority activation appears only on scoped pages") && routeTests.includes("Founder approval application authority activation") && routeTests.includes("Activation scope"));
addCheck("display model remains safe", displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && displayModel.authorityGrantCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("primary UX stays scoped", pageSource.includes("Business Build Approval Application Authority Activation") && pageSource.includes("Agent Flow Approval Application Authority Activation") && !pageSource.includes("Lite Approval Application Authority Activation") && !pageSource.includes("Chat Approval Application Authority Activation"));
addCheck("primary UX avoids internal phase labels and report paths", !/P124|p124\d|P123|p123\d|reports\/p12/i.test(primaryUxSource));
addCheck("primary UX avoids raw schema names and private IDs", !/(approval_application_authority_grant|approval_authority_grant|grantDraftRef|grantEventRef|grantEvidenceRef|approvalApplicationAuthorityGrantKey|(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*)/i.test(serializedDisplayModel));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("docs record P124.1", /P124\.1 Grant Boundary Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P124.1", /P124\.1 is complete/.test(platformRoadmap) && (/P124\.2\s+is\s+next/.test(platformRoadmap) || /P124\.2 is complete/.test(platformRoadmap)));
addCheck("README records P124.1", /P124\.1 approval application authority grant boundary contract/.test(readme) && (/P124\.2\s+is\s+next/.test(readme) || /P124\.2 approval application authority grant eligibility metadata/i.test(readme)));
addCheck(
  "phase status advanced",
  (p1241StatusState || p1242StatusState)
    && statusById.get("P124")?.status === "in_progress"
    && statusById.get("P124.1")?.status === "complete"
    && roadmapById.get("P124")?.status === "in_progress"
    && roadmapById.get("P124.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P124.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P124.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P124.1 contract avoids forbidden file scope", !(p1241.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1241.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1241.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1237Checker}\n${readText("scripts/check-p1241-founder-runtime-approval-application-authority-grant-boundary.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant authority is enabled|authority grant is enabled|approval authority grant is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P124.1 approval application authority grant boundary contract/policy.",
        "- Confirms P124 is split into implementation-grade subphases while P124.1 stays contract-only.",
        "- Does not modify Command Center source/tests and does not enable authority grant, activation, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1241.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P124.1 is contract/policy only. It does not grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P124.1 Approval Application Authority Grant Boundary Contract Report", phase: "P124.1" },
);

printCheckReport("P124.1 Approval Application Authority Grant Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
