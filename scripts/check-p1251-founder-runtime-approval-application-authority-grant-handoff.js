import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1251-founder-runtime-approval-application-authority-grant-handoff-report.md";

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
const contract = readJson("contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json");
const p124Contract = readJson("contracts/os-roadmap/p124-founder-runtime-approval-application-authority-grant-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p125Subphases = ["P125.1", "P125.2", "P125.3", "P125.4", "P125.5", "P125.6", "P125.7"];
const p1251 = subphaseById.get("P125.1") || {};
const p1252 = subphaseById.get("P125.2") || {};
const p1253 = subphaseById.get("P125.3") || {};
const plan = readText("docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1247Checker = readText("scripts/check-p1247-founder-runtime-approval-application-authority-grant-boundary.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P125.1";
const allowedFiles = new Set(p1251.allowedFiles || []);
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
const p1251ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P125.1"
  && contract.previousSubphase === "P124.7"
  && contract.nextSubphase === "P125.2"
  && p1251.status === "complete"
  && p1252.status === "planned";
const p1252StartedState = contract.status === "in_progress"
  && contract.currentSubphase === "P125.2"
  && contract.previousSubphase === "P125.1"
  && contract.nextSubphase === "P125.3"
  && p1251.status === "complete"
  && p1252.status === "complete"
  && ["planned", "complete"].includes(p1253.status);
const p1251StatusState = status.currentPhase === "P125.1"
  && status.previousPhase === "P124.7"
  && status.nextPhase === "P125.2"
  && roadmap.currentPhase === "P125.1"
  && roadmap.previousPhase === "P124.7"
  && roadmap.nextPhase === "P125.2"
  && statusById.get("P125.2")?.status === "planned";
const p1252StatusState = status.currentPhase === "P125.2"
  && status.previousPhase === "P125.1"
  && status.nextPhase === "P125.3"
  && roadmap.currentPhase === "P125.2"
  && roadmap.previousPhase === "P125.1"
  && roadmap.nextPhase === "P125.3"
  && statusById.get("P125.2")?.status === "complete"
  && ["planned", "complete"].includes(statusById.get("P125.3")?.status);
const validationCommands = [
  "npm run check:p1251-founder-runtime-approval-application-authority-grant-handoff",
  "npm run check:p1247-founder-runtime-approval-application-authority-grant-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant appears only on scoped pages\"",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1251-founder-runtime-approval-application-authority-grant-handoff"]));
addCheck("P124 grant boundary is complete", p124Contract.status === "complete" && statusById.get("P124")?.status === "complete" && roadmapById.get("P124")?.status === "complete");
addCheck("contract marks P125.1 complete", p1251ContractState || p1252StartedState);
addCheck("contract splits P125 into seven subphases", p125Subphases.every((phaseId) => subphaseById.has(phaseId)) && contract.subphases?.length === 7);
addCheck("contract records contract-only scope", p1251.expectedExports?.length === 0 && p1251.dataShape?.includes("No runtime exports") && p1251.commandCenterUx?.includes("No new cards"));
addCheck("contract forbids dashboard source edits", (p1251.forbiddenFiles || []).includes("dashboard/src/**") && (p1251.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("P125.1 records validation commands", validationCommands.every((command) => p1251.validationCommands?.includes(command)));
addCheck("OS checker recognizes P125 subphases", p125Subphases.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("P124.7 checker accepts P125.1 handoff", p1247Checker.includes("P125.1") && p1247Checker.includes("P125.2") && p1247Checker.includes("p1251StartedState"));
addCheck("P124.5 route regression coverage remains present", routeTests.includes("Approval application authority grant appears only on scoped pages") && routeTests.includes("Grant read-only") && routeTests.includes("/command-center/lite"));
addCheck("primary UX keeps grant handoff absent", !/Approval Application Authority Grant Handoff|P125|p125\d|reports\/p125/i.test(commandCenterSource));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|handoff now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(commandCenterSource));
addCheck("DemoApp not exposed", !commandCenterSource.includes("DemoApp"));
addCheck("docs record P125.1", /P125\.1 Handoff Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P125.1", /P125\.1 is complete/.test(platformRoadmap) && (/P125\.2\s+is\s+next/.test(platformRoadmap) || /P125\.2 is complete/.test(platformRoadmap)));
addCheck("README records P125.1", /P125\.1 approval application authority grant handoff contract/i.test(readme) && (/P125\.2\s+is\s+next/.test(readme) || /P125\.2 approval application authority grant handoff/i.test(readme)));
addCheck(
  "phase status advanced",
  (p1251StatusState || p1252StatusState)
    && statusById.get("P125")?.status === "in_progress"
    && statusById.get("P125.1")?.status === "complete"
    && roadmapById.get("P125")?.status === "in_progress"
    && roadmapById.get("P125.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P125.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P125.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P125.1 contract avoids forbidden file scope", !(p1251.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", p1251.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1251.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("public docs avoid raw handoff table names", !/(approval_authority_grant_handoff_records|grant_handoff_events|grant_handoff_requests|handoff_boundary_records)/i.test(publicDocsBundle));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(`${p1247Checker}\n${readText("scripts/check-p1251-founder-runtime-approval-application-authority-grant-handoff.js")}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${commandCenterSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P125.1 approval application authority grant handoff contract/policy.",
        "- Confirms P125 is split into implementation-grade subphases while P125.1 stays contract-only.",
        "- Does not modify Command Center source/tests and does not enable grant handoff, authority grant, activation, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1251.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P125.1 is contract/policy only. It does not hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P125.1 Approval Application Authority Grant Handoff Contract Report", phase: "P125.1" },
);

printCheckReport("P125.1 Approval Application Authority Grant Handoff Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
