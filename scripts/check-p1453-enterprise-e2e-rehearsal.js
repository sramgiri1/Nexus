import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1453-enterprise-e2e-rehearsal-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p145-enterprise-certification-ga-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P145_ENTERPRISE_CERTIFICATION_GA_READINESS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1453-enterprise-e2e-rehearsal";
const PRIOR_SCRIPT = "check:p1452-enterprise-certification-matrix";
const NEXT_SCRIPT = "check:p1455-enterprise-ga-readiness-tests";
const EXPECTED_BASE_COMMIT = "b8bbbb1a";
const REQUIRED_REHEARSAL_FIELDS = [
  "rehearsalId",
  "displayName",
  "stage",
  "rehearsalState",
  "executionAllowed",
  "providerCallsAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "spendAllowed",
  "ownerCapability",
  "evidenceRefs",
  "blockers",
  "nextAction",
  "disabledReason",
  "costImpact",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1453-enterprise-e2e-rehearsal",
  "npm run check:p1452-enterprise-certification-matrix",
  "npm run check:p1451-enterprise-certification-ga-readiness",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P145.3\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];

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

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
}

function hasFields(actual = [], required = []) {
  return required.every((field) => actual.includes(field));
}

function allBooleanValuesFalse(value) {
  return Object.values(value || {})
    .filter((entry) => typeof entry === "boolean")
    .every((entry) => entry === false);
}

function displayText(value) {
  return String(value || "")
    .replace(/reports\/[^ \n]+/g, "the current enterprise rehearsal report")
    .replace(/P\d+(?:\.\d+)?/g, "the current enterprise rehearsal")
    .replace(/project_[A-Za-z0-9_-]+/g, "project scope")
    .replace(/tenant_[A-Za-z0-9_-]+/g, "tenant scope")
    .replace(/workspace_[A-Za-z0-9_-]+/g, "workspace scope");
}

function hasUnsafePositiveClaim(text, pattern) {
  return text.split("\n").some((line, index, lines) => {
    if (/^\s*expect\(|^\s*addCheck\(|^\s*\.replace\(|not\.toMatch|not\.toContain|must not|No raw|avoid raw/i.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|coverage|tests?|ux|rehearsal)\b/i.test(context);
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
const p145 = statusById.get("P145") || {};
const p145Roadmap = roadmapById.get("P145") || {};
const p1453 = subphaseById.get("P145.3") || {};
const p1454 = subphaseById.get("P145.4") || {};
const p1455 = subphaseById.get("P145.5") || {};
const p1456 = subphaseById.get("P145.6") || {};
const checkerSource = readText("scripts/check-p1453-enterprise-e2e-rehearsal.js");
const priorChecker = readText("scripts/check-p1452-enterprise-certification-matrix.js");
const p1451Checker = readText("scripts/check-p1451-enterprise-certification-ga-readiness.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const enterprisePreviewData = readText("dashboard/src/data/enterprisePreviewReadiness.js");
const tabsData = readText("dashboard/src/data/commandCenterTabs.js");
const commandCenter = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P145.3";
const allowedFiles = new Set(p1453.allowedFiles || []);
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
const docsAndUiBundle = [
  JSON.stringify(contract),
  plan,
  readme,
  platformRoadmap,
  enterpriseRoadmap,
  enterprisePreviewData,
  commandCenter,
].join("\n");

const p1453CurrentState =
  status.currentPhase === "P145.3"
  && status.previousPhase === "P145.2"
  && status.nextPhase === "P145.4"
  && roadmap.currentPhase === "P145.3"
  && roadmap.previousPhase === "P145.2"
  && roadmap.nextPhase === "P145.4"
  && status.current?.phaseId === "P145.3"
  && status.previous?.phaseId === "P145.2"
  && status.next?.phaseId === "P145.4"
  && roadmap.current?.phaseId === "P145.3"
  && roadmap.previous?.phaseId === "P145.2"
  && roadmap.next?.phaseId === "P145.4"
  && statusById.get("P145")?.status === "in_progress"
  && roadmapById.get("P145")?.status === "in_progress"
  && statusById.get("P145.1")?.status === "complete"
  && roadmapById.get("P145.1")?.status === "complete"
  && statusById.get("P145.2")?.status === "complete"
  && roadmapById.get("P145.2")?.status === "complete"
  && statusById.get("P145.3")?.status === "complete"
  && roadmapById.get("P145.3")?.status === "complete"
  && statusById.get("P145.4")?.status === "planned"
  && roadmapById.get("P145.4")?.status === "planned";
const p1454CurrentState =
  status.currentPhase === "P145.4"
  && status.previousPhase === "P145.3"
  && status.nextPhase === "P145.5"
  && roadmap.currentPhase === "P145.4"
  && roadmap.previousPhase === "P145.3"
  && roadmap.nextPhase === "P145.5"
  && status.current?.phaseId === "P145.4"
  && status.previous?.phaseId === "P145.3"
  && status.next?.phaseId === "P145.5"
  && roadmap.current?.phaseId === "P145.4"
  && roadmap.previous?.phaseId === "P145.3"
  && roadmap.next?.phaseId === "P145.5"
  && statusById.get("P145")?.status === "in_progress"
  && roadmapById.get("P145")?.status === "in_progress"
  && statusById.get("P145.1")?.status === "complete"
  && roadmapById.get("P145.1")?.status === "complete"
  && statusById.get("P145.2")?.status === "complete"
  && roadmapById.get("P145.2")?.status === "complete"
  && statusById.get("P145.3")?.status === "complete"
  && roadmapById.get("P145.3")?.status === "complete"
  && statusById.get("P145.4")?.status === "complete"
  && roadmapById.get("P145.4")?.status === "complete"
  && statusById.get("P145.5")?.status === "planned"
  && roadmapById.get("P145.5")?.status === "planned";
const p1455CurrentState =
  status.currentPhase === "P145.5"
  && status.previousPhase === "P145.4"
  && status.nextPhase === "P145.6"
  && roadmap.currentPhase === "P145.5"
  && roadmap.previousPhase === "P145.4"
  && roadmap.nextPhase === "P145.6"
  && status.current?.phaseId === "P145.5"
  && status.previous?.phaseId === "P145.4"
  && status.next?.phaseId === "P145.6"
  && roadmap.current?.phaseId === "P145.5"
  && roadmap.previous?.phaseId === "P145.4"
  && roadmap.next?.phaseId === "P145.6"
  && statusById.get("P145")?.status === "in_progress"
  && roadmapById.get("P145")?.status === "in_progress"
  && ["P145.1", "P145.2", "P145.3", "P145.4", "P145.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P145.6")?.status === "planned"
  && roadmapById.get("P145.6")?.status === "planned";
const p1456CurrentState =
  status.currentPhase === "P145.6"
  && status.previousPhase === "P145.5"
  && status.nextPhase === "P145.7"
  && roadmap.currentPhase === "P145.6"
  && roadmap.previousPhase === "P145.5"
  && roadmap.nextPhase === "P145.7"
  && status.current?.phaseId === "P145.6"
  && status.previous?.phaseId === "P145.5"
  && status.next?.phaseId === "P145.7"
  && roadmap.current?.phaseId === "P145.6"
  && roadmap.previous?.phaseId === "P145.5"
  && roadmap.next?.phaseId === "P145.7"
  && statusById.get("P145")?.status === "in_progress"
  && roadmapById.get("P145")?.status === "in_progress"
  && ["P145.1", "P145.2", "P145.3", "P145.4", "P145.5", "P145.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P145.7")?.status === "planned"
  && roadmapById.get("P145.7")?.status === "planned";
const p1453OrLaterState = p1453CurrentState || p1454CurrentState || p1455CurrentState || p1456CurrentState;

const rehearsalRows = contract.e2eRehearsalRows || [];
const displayRows = rehearsalRows.map((row) => ({
  ...row,
  displayName: displayText(row.displayName),
  evidenceRefs: (row.evidenceRefs || []).map(displayText),
  blockers: (row.blockers || []).map(displayText),
  nextAction: displayText(row.nextAction),
  disabledReason: displayText(row.disabledReason),
}));
const displayRowsBundle = JSON.stringify(displayRows);
const rehearsalRowsSafe = rehearsalRows.length >= 6
  && rehearsalRows.every((row) => (
    REQUIRED_REHEARSAL_FIELDS.every((field) => Object.hasOwn(row, field))
    && row.executionAllowed === false
    && row.providerCallsAllowed === false
    && row.agentDispatchAllowed === false
    && row.projectMutationAllowed === false
    && row.dbWritesAllowed === false
    && row.networkCallsAllowed === false
    && row.spendAllowed === false
    && row.costImpact === "No spend"
    && Array.isArray(row.evidenceRefs)
    && row.evidenceRefs.length > 0
    && Array.isArray(row.blockers)
    && row.blockers.length > 0
    && typeof row.disabledReason === "string"
    && /disabled|not enabled|does not|remain/i.test(row.disabledReason)
  ));

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1453-enterprise-e2e-rehearsal.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P145.2 report still passes", reportPassed("reports/p1452-enterprise-certification-matrix-report.md"));
addCheck("contract keeps P145.3 complete through handoff", contract.phaseId === "P145" && contract.status === "in_progress" && p1453.status === "complete" && (p1453CurrentState || (contract.currentSubphase === "P145.4" && contract.previousSubphase === "P145.3" && contract.nextSubphase === "P145.5" && p1454.status === "complete") || (contract.currentSubphase === "P145.5" && contract.previousSubphase === "P145.4" && contract.nextSubphase === "P145.6" && p1454.status === "complete" && p1455.status === "complete") || (contract.currentSubphase === "P145.6" && contract.previousSubphase === "P145.5" && contract.nextSubphase === "P145.7" && p1454.status === "complete" && p1455.status === "complete" && p1456.status === "complete")));
addCheck("contract records expected base commit", p1453.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P145.3 records allowed and forbidden files", p1453.allowedFiles?.includes("dashboard/src/data/enterprisePreviewReadiness.js") && p1453.allowedFiles?.includes("scripts/check-p1453-enterprise-e2e-rehearsal.js") && p1453.forbiddenFiles?.includes("projects/**") && p1453.forbiddenFiles?.includes("db/**") && p1453.forbiddenFiles?.includes("providers/**") && p1453.forbiddenFiles?.includes("tools/**"));
addCheck("P145.3 records validation commands", VALIDATION_COMMANDS.every((command) => p1453.validationCommands?.includes(command)));
addCheck("rehearsal evidence shape present", hasFields(contract.e2eRehearsalShape, REQUIRED_REHEARSAL_FIELDS));
addCheck("rehearsal rows are safe", rehearsalRowsSafe, `${rehearsalRows.length} rows`);
addCheck("authority flags remain blocked", allBooleanValuesFalse(contract.authorityFlags), JSON.stringify(contract.authorityFlags || {}));
addCheck("P145.4 handoff is safe", (p1453CurrentState && p1454.status === "planned" && p1454.expectedBaseCommit === "after-P145.3" && p1454.commit === "" && Array.isArray(p1454.checksRun) && p1454.checksRun.length === 0) || ((p1454CurrentState || p1455CurrentState || p1456CurrentState) && p1454.status === "complete" && p1454.expectedBaseCommit === "d045fea1"));
addCheck("P145.2 checker accepts P145.3 handoff", priorChecker.includes("p1453CurrentState") && priorChecker.includes('status.currentPhase === "P145.3"'));
addCheck("P145.1 checker accepts P145.3 handoff", p1451Checker.includes("p1453CurrentState") && p1451Checker.includes('status.currentPhase === "P145.3"'));
addCheck("enterprise checker accepts P145.3/P145.5 active state", enterpriseChecker.includes("p1453CurrentState") && enterpriseChecker.includes("p1455CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("Enterprise Preview view model exposes rehearsal rows", enterprisePreviewData.includes("rehearsalRows") && enterprisePreviewData.includes("rehearsalSummary") && enterprisePreviewData.includes(CONTRACT_PATH.split("/").pop()));
addCheck("Enterprise Preview tabs include Rehearsal Evidence", tabsData.includes('id: "rehearsal"') && tabsData.includes("Rehearsal Evidence"));
addCheck("Command Center renders rehearsal without action buttons", commandCenter.includes('tabId="rehearsal"') && commandCenter.includes("End-to-End Rehearsal Evidence") && !/run rehearsal now|execute rehearsal now|dispatch agents now|generate prd now|start build now|build project now|certify now/i.test(commandCenter));
addCheck("phase status keeps P145.3 complete through handoff", p1453OrLaterState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P145 parent records active status", [p145, p145Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && entry.commandCenterVisible === true));
addCheck("P145.3 records required status fields", [statusById.get("P145.3"), roadmapById.get("P145.3")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P145.4/P145.5 remain safe", (p1453CurrentState && [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1454CurrentState && [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1454-enterprise-command-center-ux")) && [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1455CurrentState && [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1454-enterprise-command-center-ux")) && [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`)) && [statusById.get("P145.6"), roadmapById.get("P145.6")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1456CurrentState && [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1454-enterprise-command-center-ux")) && [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`)) && [statusById.get("P145.6"), roadmapById.get("P145.6")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1456-enterprise-ga-readiness-docs-roadmap"))));
addCheck("P145.3 Playwright coverage exists", routeTests.includes("P145.3 enterprise end-to-end rehearsal keeps Enterprise Preview useful") && routeTests.includes("Rehearsal Evidence") && routeTests.includes("P145.4"));
addCheck("route-wide safety coverage retained", routeTests.includes("Command Center route-wide UX") && routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher exists globally"));
addCheck("docs record P145.3 and later handoff", /## P145\.3 End-to-End Rehearsal[\s\S]*Status:\s+complete/.test(plan) && /P145\.3 End-to-End Rehearsal is complete/i.test(readme) && /P145\.3 end-to-end rehearsal is complete/i.test(platformRoadmap) && /P145\.3 is now complete as read-only end-to-end rehearsal evidence/i.test(enterpriseRoadmap));
addCheck("changed files stay in P145.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix))), changed.join(", "));
addCheck("primary display rows avoid raw private IDs", !/private-project-|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_/i.test(displayRowsBundle));
addCheck("primary display rows avoid internal phase labels", !/P\d+(?:\.\d+)?/.test(displayRowsBundle));
addCheck("docs and UX avoid raw storage or provider URLs", !/https:\/\/|postgres(?:ql)?:\/\//i.test(docsAndUiBundle));
addCheck("docs and UX avoid fake runnable rehearsal actions", !/run rehearsal now|execute rehearsal now|generate prd now|run q&a now|ask founder now|start build now|build project now|certify now|issue certification now|attest now|sign attestation now|run security scan now|mutate finding now|run load test now|run recovery now|restore now|failover now|release now|deploy now|export now|package now|write db now|call provider now|call model now|run tool now|dispatch agent now|mutate project now|spend now/i.test(docsAndUiBundle));
addCheck("docs and UX avoid raw dumps", !hasUnsafePositiveClaim(displayRowsBundle, /raw JSON|raw logs?|raw policy dump/i));

const failed = checks.filter((check) => check.status !== "PASS");
writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds read-only end-to-end rehearsal evidence for the Enterprise Preview founder journey.",
        "- Confirms P145.1-P145.3 remain complete through later P145 handoffs.",
        "- Keeps founder automation, PRD generation, provider/model calls, tool/worker execution, agent dispatch, DB/runtime writes, project mutation, network calls, certification issuance, attestation signing, load/recovery execution, deploy/release/export/package actions, and spend blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Rehearsal Rows",
      body: rehearsalRows.map((row) => `- ${row.displayName}: ${row.rehearsalState}; executionAllowed=${row.executionAllowed}; owner=${row.ownerCapability}; cost=${row.costImpact}`).join("\n"),
    },
    {
      title: "Safety",
      body: "- P145.3 is read-only rehearsal evidence work only. It does not run founder Q&A automation, generate PRDs, dispatch agents, execute tools or workers, write DB/runtime state, mutate projects, call providers/models, use network calls, deploy/release/export/package, execute load/recovery paths, issue certification, sign attestations, or spend.",
    },
    { title: "Result", body: failed.length ? `FAIL (${failed.length}/${checks.length})` : `PASS (${checks.length}/${checks.length})` },
  ],
  { title: "P145.3 Enterprise End-to-End Rehearsal Report", phase: "P145.3", current: status.currentPhase, next: status.nextPhase },
);

printCheckReport("P145.3 Enterprise End-to-End Rehearsal Check", checks);
if (failed.length > 0) process.exit(1);
