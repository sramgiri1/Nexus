import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json");
const p125Contract = readJson("contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p126Subphases = ["P126.1", "P126.2", "P126.3", "P126.4", "P126.5", "P126.6", "P126.7"];
const p1261 = subphaseById.get("P126.1") || {};
const p1262 = subphaseById.get("P126.2") || {};
const p1263 = subphaseById.get("P126.3") || {};
const plan = readText("docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1257Checker = readText("scripts/check-p1257-founder-runtime-approval-application-authority-grant-handoff.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P126.1";
const allowedFiles = new Set(p1261.allowedFiles || []);
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
const p1261ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P126.1"
  && contract.previousSubphase === "P125.7"
  && contract.nextSubphase === "P126.2"
  && p1261.status === "complete"
  && p1262.status === "planned";
const p1262StartedState = contract.status === "in_progress"
  && contract.currentSubphase === "P126.2"
  && contract.previousSubphase === "P126.1"
  && contract.nextSubphase === "P126.3"
  && p1261.status === "complete"
  && p1262.status === "complete"
  && ["planned", "complete"].includes(p1263.status);
const p1261StatusState = status.currentPhase === "P126.1"
  && status.previousPhase === "P125.7"
  && status.nextPhase === "P126.2"
  && roadmap.currentPhase === "P126.1"
  && roadmap.previousPhase === "P125.7"
  && roadmap.nextPhase === "P126.2"
  && statusById.get("P126.2")?.status === "planned";
const p1262StatusState = status.currentPhase === "P126.2"
  && status.previousPhase === "P126.1"
  && status.nextPhase === "P126.3"
  && roadmap.currentPhase === "P126.2"
  && roadmap.previousPhase === "P126.1"
  && roadmap.nextPhase === "P126.3"
  && statusById.get("P126.2")?.status === "complete"
  && ["planned", "complete"].includes(statusById.get("P126.3")?.status);
const validationCommands = [
  "npm run check:p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary",
  "npm run check:p1257-founder-runtime-approval-application-authority-grant-handoff",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant handoff appears only on scoped pages\"",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary"]));
addCheck("P125 grant handoff is complete", p125Contract.status === "complete" && statusById.get("P125")?.status === "complete" && roadmapById.get("P125")?.status === "complete");
addCheck("contract marks P126.1 complete", p1261ContractState || p1262StartedState);
addCheck("contract splits P126 into seven subphases", p126Subphases.every((phaseId) => subphaseById.has(phaseId)) && contract.subphases?.length === 7);
addCheck("contract records contract-only scope", p1261.expectedExports?.length === 0 && p1261.dataShape?.includes("No runtime exports") && p1261.commandCenterUx?.includes("No new cards"));
addCheck("contract forbids dashboard source edits", (p1261.forbiddenFiles || []).includes("dashboard/src/**") && (p1261.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P126.1 records validation commands", validationCommands.every((command) => p1261.validationCommands?.includes(command)));
addCheck("OS checker recognizes P126 subphases", p126Subphases.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("P125.7 checker accepts P126.1 handoff", p1257Checker.includes("P126.1") && p1257Checker.includes("P126.2") && p1257Checker.includes("p1261StartedState"));
addCheck("P125.5 route regression coverage remains present", routeTests.includes("Approval application authority grant handoff appears only on scoped pages") && routeTests.includes("Handoff read-only") && routeTests.includes("/command-center/lite"));
addCheck("primary UX keeps acceptance boundary absent", !/Approval Application Authority Grant Handoff Acceptance|P126|p126\d|reports\/p126/i.test(commandCenterSource));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|handoff now|accept handoff now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(commandCenterSource));
addCheck("DemoApp not exposed", !commandCenterSource.includes("DemoApp"));
addCheck("docs record P126.1", /P126\.1 Acceptance Boundary Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P126.1", /P126\.1 is complete/.test(platformRoadmap) && (/P126\.2\s+is\s+next/.test(platformRoadmap) || /P126\.2 is complete/.test(platformRoadmap)));
addCheck("README records P126.1", /P126\.1 approval application authority grant handoff acceptance boundary\s+contract/i.test(readme) && (/P126\.2\s+is\s+next/.test(readme) || /P126\.2 approval application authority grant handoff acceptance/i.test(readme)));
addCheck(
  "phase status advanced",
  (p1261StatusState || p1262StatusState)
    && statusById.get("P126")?.status === "in_progress"
    && statusById.get("P126.1")?.status === "complete"
    && roadmapById.get("P126")?.status === "in_progress"
    && roadmapById.get("P126.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P126.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P126.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P126.1 contract avoids forbidden file scope", !(p1261.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1261.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1261.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("public docs avoid raw acceptance table names", !/(approval_authority_grant_handoff_acceptance_records|grant_handoff_acceptance_events|handoff_acceptance_requests|acceptance_boundary_records)/i.test(publicDocsBundle));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1257Checker}\n${readText("scripts/check-p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${commandCenterSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /handoff acceptance is enabled|acceptance capture is enabled|grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P126.1 approval application authority grant handoff acceptance boundary contract/policy.",
        "- Confirms P126 is split into implementation-grade subphases while P126.1 stays contract-only.",
        "- Does not modify Command Center source/tests and does not enable handoff acceptance, acceptance capture, grant handoff, authority grant, activation, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1261.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P126.1 is contract/policy only. It does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P126.1 Approval Application Authority Grant Handoff Acceptance Boundary Contract Report", phase: "P126.1" },
);

printCheckReport("P126.1 Approval Application Authority Grant Handoff Acceptance Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
