import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1454-enterprise-command-center-ux-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p145-enterprise-certification-ga-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P145_ENTERPRISE_CERTIFICATION_GA_READINESS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1454-enterprise-command-center-ux";
const PRIOR_SCRIPT = "check:p1453-enterprise-e2e-rehearsal";
const NEXT_SCRIPT = "check:p1455-enterprise-ga-readiness-tests";
const EXPECTED_BASE_COMMIT = "d045fea1";
const REQUIRED_READINESS_FIELDS = [
  "readinessId",
  "displayName",
  "lane",
  "currentState",
  "certificationAllowed",
  "executionAllowed",
  "mutationAllowed",
  "spendAllowed",
  "ownerCapability",
  "evidenceRefs",
  "blockers",
  "nextAction",
  "disabledReason",
  "costImpact",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1454-enterprise-command-center-ux",
  "npm run check:p1453-enterprise-e2e-rehearsal",
  "npm run check:p1452-enterprise-certification-matrix",
  "npm run check:p1451-enterprise-certification-ga-readiness",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P145.4\"",
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
    .replace(/reports\/[^ \n]+/g, "the current enterprise readiness report")
    .replace(/P\d+(?:\.\d+)?/g, "the current enterprise readiness")
    .replace(/project_[A-Za-z0-9_-]+/g, "project scope")
    .replace(/tenant_[A-Za-z0-9_-]+/g, "tenant scope")
    .replace(/workspace_[A-Za-z0-9_-]+/g, "workspace scope");
}

function hasUnsafePositiveClaim(text, pattern) {
  return text.split("\n").some((line, index, lines) => {
    if (/^\s*expect\(|^\s*addCheck\(|^\s*\.replace\(|not\.toMatch|not\.toContain|must not|No raw|avoid raw/i.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|coverage|tests?|ux|review)\b/i.test(context);
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
const p1454 = subphaseById.get("P145.4") || {};
const p1455 = subphaseById.get("P145.5") || {};
const checkerSource = readText("scripts/check-p1454-enterprise-command-center-ux.js");
const priorChecker = readText("scripts/check-p1453-enterprise-e2e-rehearsal.js");
const p1452Checker = readText("scripts/check-p1452-enterprise-certification-matrix.js");
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
const enforceCurrentDiffScope = status.currentPhase === "P145.4";
const allowedFiles = new Set(p1454.allowedFiles || []);
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
  && ["P145.1", "P145.2", "P145.3", "P145.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
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

const readinessRows = contract.commandCenterReadinessRows || [];
const displayRows = readinessRows.map((row) => ({
  ...row,
  displayName: displayText(row.displayName),
  lane: displayText(row.lane),
  currentState: displayText(row.currentState),
  evidenceRefs: (row.evidenceRefs || []).map(displayText),
  blockers: (row.blockers || []).map(displayText),
  nextAction: displayText(row.nextAction),
  disabledReason: displayText(row.disabledReason),
}));
const displayRowsBundle = JSON.stringify(displayRows);
const rowsSafe = readinessRows.length >= 6
  && readinessRows.every((row) => (
    REQUIRED_READINESS_FIELDS.every((field) => Object.hasOwn(row, field))
    && row.certificationAllowed === false
    && row.executionAllowed === false
    && row.mutationAllowed === false
    && row.spendAllowed === false
    && row.costImpact === "No spend"
    && Array.isArray(row.evidenceRefs)
    && row.evidenceRefs.length > 0
    && Array.isArray(row.blockers)
    && row.blockers.length > 0
    && typeof row.disabledReason === "string"
    && /disabled|not enabled|does not|remain/i.test(row.disabledReason)
  ));

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1454-enterprise-command-center-ux.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P145.3 report still passes", reportPassed("reports/p1453-enterprise-e2e-rehearsal-report.md"));
addCheck("contract keeps P145.4 complete through handoff", contract.phaseId === "P145" && contract.status === "in_progress" && p1454.status === "complete" && (p1454CurrentState || (contract.currentSubphase === "P145.5" && contract.previousSubphase === "P145.4" && contract.nextSubphase === "P145.6" && p1455.status === "complete")));
addCheck("contract records expected base commit", p1454.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P145.4 records allowed and forbidden files", p1454.allowedFiles?.includes("dashboard/src/data/enterprisePreviewReadiness.js") && p1454.allowedFiles?.includes("scripts/check-p1454-enterprise-command-center-ux.js") && p1454.forbiddenFiles?.includes("projects/**") && p1454.forbiddenFiles?.includes("db/**") && p1454.forbiddenFiles?.includes("providers/**") && p1454.forbiddenFiles?.includes("tools/**"));
addCheck("P145.4 records validation commands", VALIDATION_COMMANDS.every((command) => p1454.validationCommands?.includes(command)));
addCheck("Command Center readiness shape present", hasFields(contract.commandCenterReadinessShape, REQUIRED_READINESS_FIELDS));
addCheck("Command Center readiness rows are safe", rowsSafe, `${readinessRows.length} rows`);
addCheck("authority flags remain blocked", allBooleanValuesFalse(contract.authorityFlags), JSON.stringify(contract.authorityFlags || {}));
addCheck("P145.5 handoff is safe", (p1454CurrentState && p1455.status === "planned" && p1455.expectedBaseCommit === "after-P145.4" && p1455.commit === "" && Array.isArray(p1455.checksRun) && p1455.checksRun.length === 0) || (p1455CurrentState && p1455.status === "complete" && p1455.expectedBaseCommit === "4412d7fd" && Array.isArray(p1455.checksRun) && p1455.checksRun.includes(`npm run ${NEXT_SCRIPT}`)));
addCheck("P145.3 checker accepts P145.4 handoff", priorChecker.includes("p1454CurrentState") && priorChecker.includes('status.currentPhase === "P145.4"'));
addCheck("P145.2 checker accepts P145.4 handoff", p1452Checker.includes("p1454CurrentState") && p1452Checker.includes('status.currentPhase === "P145.4"'));
addCheck("P145.1 checker accepts P145.4 handoff", p1451Checker.includes("p1454CurrentState") && p1451Checker.includes('status.currentPhase === "P145.4"'));
addCheck("enterprise checker accepts P145.4 active state", enterpriseChecker.includes("p1454CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("Enterprise Preview view model exposes GA readiness rows", enterprisePreviewData.includes("gaReadinessRows") && enterprisePreviewData.includes("gaReadinessSummary") && enterprisePreviewData.includes("commandCenterReadinessRows"));
addCheck("Enterprise Preview tabs include GA Readiness", tabsData.includes('id: "ga-readiness"') && tabsData.includes("GA Readiness"));
addCheck("Command Center renders GA readiness without action buttons", commandCenter.includes('tabId="ga-readiness"') && commandCenter.includes("Enterprise GA Readiness") && !/certify now|issue certification now|attest now|sign attestation now|run security scan now|dispatch agents now|generate prd now|start build now|build project now|deploy now|export now|package now|spend now/i.test(commandCenter));
addCheck("phase status keeps P145.4 complete through handoff", p1454CurrentState || p1455CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P145 parent records active status", [p145, p145Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && entry.commandCenterVisible === true));
addCheck("P145.4 records required status fields", [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P145.5 remains safe", (p1454CurrentState && [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1455CurrentState && [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`)) && [statusById.get("P145.6"), roadmapById.get("P145.6")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)));
addCheck("P145.4 Playwright coverage exists", routeTests.includes("P145.4 enterprise readiness UX keeps Enterprise Preview useful") && routeTests.includes("GA Readiness") && routeTests.includes("Enterprise GA Readiness"));
addCheck("route-wide safety coverage retained", routeTests.includes("Command Center route-wide UX") && routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher exists globally"));
addCheck("docs record P145.4 and P145.5 handoff", /## P145\.4 Readiness Command Center UX[\s\S]*Status:\s+complete/.test(plan) && /P145\.4 Readiness Command Center UX is complete/i.test(readme) && /P145\.4 readiness Command Center UX is complete/i.test(platformRoadmap) && /P145\.4 is now complete as focused Enterprise Preview GA readiness UX/i.test(enterpriseRoadmap));
addCheck("changed files stay in P145.4 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix))), changed.join(", "));
addCheck("primary display rows avoid raw private IDs", !/private-project-|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_/i.test(displayRowsBundle));
addCheck("primary display rows avoid internal phase labels", !/P\d+(?:\.\d+)?/.test(displayRowsBundle));
addCheck("docs and UX avoid raw storage or provider URLs", !/https:\/\/|postgres(?:ql)?:\/\//i.test(docsAndUiBundle));
addCheck("docs and UX avoid fake runnable readiness actions", !/certify now|issue certification now|attest now|sign attestation now|run security scan now|mutate finding now|run load test now|run recovery now|restore now|failover now|release now|deploy now|export now|package now|write db now|call provider now|call model now|run tool now|dispatch agent now|mutate project now|spend now|generate prd now|start build now|build project now/i.test(docsAndUiBundle));
addCheck("docs and UX avoid raw dumps", !hasUnsafePositiveClaim(displayRowsBundle, /raw JSON|raw logs?|raw policy dump/i));

const failed = checks.filter((check) => check.status !== "PASS");
writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds focused Enterprise Preview GA readiness UX rows for founder workflow, certification review, runtime boundary, reliability, cost governance, and final readiness.",
        "- Confirms P145.1-P145.4 are complete and P145.5 may now be complete as tests/checkers hardening while P145.6 remains planned-only.",
        "- Keeps founder automation, PRD generation, provider/model calls, tool/worker execution, agent dispatch, DB/runtime writes, project mutation, network calls, certification issuance, attestation signing, load/recovery execution, deploy/release/export/package actions, and spend blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Readiness Rows",
      body: readinessRows.map((row) => `- ${row.displayName}: ${row.currentState}; certificationAllowed=${row.certificationAllowed}; executionAllowed=${row.executionAllowed}; owner=${row.ownerCapability}; cost=${row.costImpact}`).join("\n"),
    },
    {
      title: "Safety",
      body: "- P145.4 is Command Center readiness UX only. It does not run founder Q&A automation, generate PRDs, dispatch agents, execute tools or workers, write DB/runtime state, mutate projects, call providers/models, use network calls, deploy/release/export/package, execute scans/load/recovery paths, issue certification, sign attestations, or spend.",
    },
    { title: "Result", body: failed.length ? `FAIL (${failed.length}/${checks.length})` : `PASS (${checks.length}/${checks.length})` },
  ],
  { title: "P145.4 Enterprise Command Center UX Report", phase: "P145.4", current: status.currentPhase, next: status.nextPhase },
);

printCheckReport("P145.4 Enterprise Command Center UX Check", checks);
process.exit(failed.length ? 1 : 0);
