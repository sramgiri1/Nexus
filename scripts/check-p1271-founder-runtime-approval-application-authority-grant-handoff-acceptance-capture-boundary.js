import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|display-only|read-only|contract-only|planned-only|future|planned)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json");
const p126Contract = readJson("contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p127Subphases = ["P127.1", "P127.2", "P127.3", "P127.4", "P127.5", "P127.6", "P127.7"];
const p1271 = subphaseById.get("P127.1") || {};
const p1272 = subphaseById.get("P127.2") || {};
const p1273 = subphaseById.get("P127.3") || {};
const plan = readText("docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1267Checker = readText("scripts/check-p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js");
const p1272Checker = readText("scripts/check-p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P127.1";
const allowedFiles = new Set(p1271.allowedFiles || []);
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
const p1271ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P127.1"
  && contract.previousSubphase === "P126.7"
  && contract.nextSubphase === "P127.2"
  && p1271.status === "complete"
  && p1272.status === "planned";
const p1272StartedState = contract.status === "in_progress"
  && contract.currentSubphase === "P127.2"
  && contract.previousSubphase === "P127.1"
  && contract.nextSubphase === "P127.3"
  && p1271.status === "complete"
  && p1272.status === "complete"
  && ["planned", "complete"].includes(p1273.status);
const p1271StatusState = status.currentPhase === "P127.1"
  && status.previousPhase === "P126.7"
  && status.nextPhase === "P127.2"
  && roadmap.currentPhase === "P127.1"
  && roadmap.previousPhase === "P126.7"
  && roadmap.nextPhase === "P127.2"
  && statusById.get("P127.2")?.status === "planned";
const p1272StatusState = status.currentPhase === "P127.2"
  && status.previousPhase === "P127.1"
  && status.nextPhase === "P127.3"
  && roadmap.currentPhase === "P127.2"
  && roadmap.previousPhase === "P127.1"
  && roadmap.nextPhase === "P127.3"
  && statusById.get("P127.2")?.status === "complete"
  && ["planned", "complete"].includes(statusById.get("P127.3")?.status);
const validationCommands = [
  "npm run check:p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "npm run check:p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant handoff acceptance appears only on scoped pages\"",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary"]));
addCheck("P126 acceptance boundary is complete", p126Contract.status === "complete" && statusById.get("P126")?.status === "complete" && roadmapById.get("P126")?.status === "complete");
addCheck("contract marks P127.1 complete", p1271ContractState || p1272StartedState);
addCheck("contract splits P127 into seven subphases", p127Subphases.every((phaseId) => subphaseById.has(phaseId)) && contract.subphases?.length === 7);
addCheck("contract records contract-only scope", p1271.expectedExports?.length === 0 && p1271.dataShape?.includes("No runtime exports") && p1271.commandCenterUx?.includes("No new cards"));
addCheck("contract forbids dashboard source edits", (p1271.forbiddenFiles || []).includes("dashboard/src/**") && (p1271.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P127.1 records validation commands", validationCommands.every((command) => p1271.validationCommands?.includes(command)));
addCheck("OS checker recognizes P127 subphases", p127Subphases.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("P126.7 checker accepts P127.1 handoff", p1267Checker.includes("P127.1") && p1267Checker.includes("P127.2") && p1267Checker.includes("p1271StartedState"));
addCheck("P127.2 checker validates metadata handoff", !p1272StartedState || (p1272Checker.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata") && p1272Checker.includes("P127.3")));
addCheck("P126.5 route regression coverage remains present", routeTests.includes("Approval application authority grant handoff acceptance appears only on scoped pages") && routeTests.includes("Acceptance read-only") && routeTests.includes("/command-center/lite"));
addCheck("primary UX keeps capture boundary absent", !/Acceptance Capture Boundary|P127|p127\d|reports\/p127/i.test(commandCenterSource));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|capture acceptance now|accept handoff now|grant authority now|handoff now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(commandCenterSource));
addCheck("DemoApp not exposed", !commandCenterSource.includes("DemoApp"));
addCheck("docs record P127.1", /P127\.1 Acceptance Capture Boundary Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P127.1", /P127\.1 is complete/.test(platformRoadmap) && (/P127\.2\s+is\s+next/.test(platformRoadmap) || /P127\.2 is complete/.test(platformRoadmap)));
addCheck("README records P127.1", /P127\.1 approval application authority grant handoff acceptance capture\s+boundary\s+contract/i.test(readme) && (/P127\.2\s+is\s+next/.test(readme) || /P127\.2 approval application authority grant handoff acceptance capture/i.test(readme)));
addCheck(
  "phase status advanced",
  (p1271StatusState || p1272StatusState)
    && statusById.get("P127")?.status === "in_progress"
    && statusById.get("P127.1")?.status === "complete"
    && roadmapById.get("P127")?.status === "in_progress"
    && roadmapById.get("P127.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P127.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P127.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P127.1 contract avoids forbidden file scope", !(p1271.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1271.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1271.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("public docs avoid raw capture table names", !/(approval_authority_grant_handoff_acceptance_capture_records|grant_handoff_acceptance_capture_events|acceptance_capture_requests|capture_boundary_records)/i.test(publicDocsBundle));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1267Checker}\n${readText("scripts/check-p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${commandCenterSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture is enabled|handoff acceptance is enabled|grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P127.1 approval application authority grant handoff acceptance capture boundary contract/policy.",
        "- Confirms P127 is split into implementation-grade subphases while P127.1 stays contract-only.",
        "- Does not modify Command Center source/tests and does not enable acceptance capture, handoff acceptance, grant handoff, authority grant, activation, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1271.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P127.1 is contract/policy only. It does not capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P127.1 Approval Application Authority Grant Handoff Acceptance Capture Boundary Contract Report", phase: "P127.1" },
);

printCheckReport("P127.1 Approval Application Authority Grant Handoff Acceptance Capture Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
