import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1231-founder-runtime-approval-application-authority-activation-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json");
const p122Contract = readJson("contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1231 = subphaseById.get("P123.1") || {};
const p1232 = subphaseById.get("P123.2") || {};
const p123Subphases = ["P123.1", "P123.2", "P123.3", "P123.4", "P123.5", "P123.6", "P123.7"];
const plan = readText("docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1227Checker = readText("scripts/check-p1227-founder-runtime-approval-decision-application-authority-handoff.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P123.1";
const allowedFiles = new Set(p1231.allowedFiles || []);
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1231-founder-runtime-approval-application-authority-activation-boundary"]));
addCheck("P122 handoff is complete", p122Contract.status === "complete" && statusById.get("P122")?.status === "complete" && roadmapById.get("P122")?.status === "complete");
addCheck("contract marks P123.1 complete", contract.status === "in_progress" && contract.currentSubphase === "P123.1" && contract.previousSubphase === "P122.7" && contract.nextSubphase === "P123.2" && p1231.status === "complete" && p1232.status === "planned");
addCheck("contract splits P123 into seven subphases", p123Subphases.every((phaseId) => subphaseById.has(phaseId)) && contract.subphases?.length === 7);
addCheck("contract records contract-only scope", p1231.expectedExports?.length === 0 && p1231.dataShape?.includes("No runtime exports") && p1231.commandCenterUx?.includes("No new cards"));
addCheck("contract forbids dashboard source edits", (p1231.forbiddenFiles || []).includes("dashboard/src/**") && (p1231.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("OS checker recognizes P123 subphases", p123Subphases.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("P122.7 checker accepts P123.1 handoff", p1227Checker.includes("P123.1") && p1227Checker.includes("P123.2") && p1227Checker.includes("p1227StatusAccepted"));
addCheck("P122.5 UX regression coverage remains present", routeTests.includes("Approval application authority handoff appears only on scoped pages") && routeTests.includes("Founder approval application authority handoff") && routeTests.includes("Authority scope"));
addCheck("display model remains safe", displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && displayModel.authorityCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("primary UX stays scoped", pageSource.includes("Business Build Approval Application Authority Handoff") && pageSource.includes("Agent Flow Approval Application Authority Handoff") && !pageSource.includes("Lite Approval Application Authority Handoff") && !pageSource.includes("Chat Approval Application Authority Handoff"));
addCheck("primary UX avoids internal phase labels and report paths", !/P123|p123\d|P122|p122\d|reports\/p12/i.test(primaryUxSource));
addCheck("primary UX avoids raw schema names and private IDs", !/(approval_application_authority|activation_boundary|authorityActivation|authorityDraftRef|authorityEventRef|authorityEvidenceRef|(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*)/i.test(serializedDisplayModel));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|activate now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("docs record P123.1", /P123\.1 Activation Boundary Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P123.1", /P123\.1 is complete/.test(platformRoadmap) && /P123\.2\s+is\s+next/.test(platformRoadmap));
addCheck("README records P123.1", /P123\.1 approval application authority activation boundary contract/.test(readme) && /P123\.2\s+is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  status.currentPhase === "P123.1"
    && status.previousPhase === "P122.7"
    && status.nextPhase === "P123.2"
    && roadmap.currentPhase === "P123.1"
    && roadmap.previousPhase === "P122.7"
    && roadmap.nextPhase === "P123.2"
    && statusById.get("P123")?.status === "in_progress"
    && statusById.get("P123.1")?.status === "complete"
    && statusById.get("P123.2")?.status === "planned"
    && roadmapById.get("P123")?.status === "in_progress"
    && roadmapById.get("P123.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P123.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P123.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P123.1 contract avoids forbidden file scope", !(p1231.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1231.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1231.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1227Checker}\n${readText("scripts/check-p1231-founder-runtime-approval-application-authority-activation-boundary.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /activation is enabled|approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority activation is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P123.1 approval application authority activation boundary contract/policy.",
        "- Confirms P123 is split into implementation-grade subphases while P123.1 stays contract-only.",
        "- Does not modify Command Center source/tests and does not enable activation, grant, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1231.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P123.1 is contract/policy only. It does not activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P123.1 Approval Application Authority Activation Boundary Contract Report", phase: "P123.1" },
);

printCheckReport("P123.1 Approval Application Authority Activation Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
