import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1452-enterprise-certification-matrix-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p145-enterprise-certification-ga-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P145_ENTERPRISE_CERTIFICATION_GA_READINESS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1452-enterprise-certification-matrix";
const PRIOR_SCRIPT = "check:p1451-enterprise-certification-ga-readiness";
const NEXT_SCRIPT = "check:p1455-enterprise-ga-readiness-tests";
const EXPECTED_BASE_COMMIT = "fab35401";
const REQUIRED_MATRIX_FIELDS = [
  "matrixId",
  "displayName",
  "category",
  "readinessState",
  "certificationAllowed",
  "disabledReason",
  "ownerCapability",
  "evidenceRefs",
  "blockers",
  "nextAction",
  "costImpact",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1452-enterprise-certification-matrix",
  "npm run check:p1451-enterprise-certification-ga-readiness",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P145.2\"",
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

function hasUnsafePositiveClaim(text, pattern) {
  return text.split("\n").some((line, index, lines) => {
    if (/^\s*expect\(|^\s*addCheck\(|^\s*\.replace\(|not\.toMatch|not\.toContain|must not|No raw|avoid raw/i.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|coverage|tests?|ux)\b/i.test(context);
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
const p1452 = subphaseById.get("P145.2") || {};
const p1453 = subphaseById.get("P145.3") || {};
const p1454 = subphaseById.get("P145.4") || {};
const p1455 = subphaseById.get("P145.5") || {};
const p1456 = subphaseById.get("P145.6") || {};
const p1457 = subphaseById.get("P145.7") || {};
const checkerSource = readText("scripts/check-p1452-enterprise-certification-matrix.js");
const priorChecker = readText("scripts/check-p1451-enterprise-certification-ga-readiness.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const complianceData = readText("dashboard/src/data/complianceReadiness.js");
const tabsData = readText("dashboard/src/data/commandCenterTabs.js");
const commandCenter = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P145.2";
const allowedFiles = new Set(p1452.allowedFiles || []);
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
  complianceData,
  commandCenter,
].join("\n");
const displayDataBundle = [
  JSON.stringify(contract.certificationMatrixRows || []),
  complianceData,
].join("\n");

const p1452CurrentState =
  status.currentPhase === "P145.2"
  && status.previousPhase === "P145.1"
  && status.nextPhase === "P145.3"
  && roadmap.currentPhase === "P145.2"
  && roadmap.previousPhase === "P145.1"
  && roadmap.nextPhase === "P145.3"
  && status.current?.phaseId === "P145.2"
  && status.previous?.phaseId === "P145.1"
  && status.next?.phaseId === "P145.3"
  && roadmap.current?.phaseId === "P145.2"
  && roadmap.previous?.phaseId === "P145.1"
  && roadmap.next?.phaseId === "P145.3"
  && statusById.get("P145")?.status === "in_progress"
  && roadmapById.get("P145")?.status === "in_progress"
  && statusById.get("P145.1")?.status === "complete"
  && roadmapById.get("P145.1")?.status === "complete"
  && statusById.get("P145.2")?.status === "complete"
  && roadmapById.get("P145.2")?.status === "complete"
  && statusById.get("P145.3")?.status === "planned"
  && roadmapById.get("P145.3")?.status === "planned";
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
const p1457FinalState =
  status.currentPhase === "P145.7"
  && status.previousPhase === "P145.6"
  && status.nextPhase === ""
  && roadmap.currentPhase === "P145.7"
  && roadmap.previousPhase === "P145.6"
  && roadmap.nextPhase === ""
  && status.current?.phaseId === "P145.7"
  && status.previous?.phaseId === "P145.6"
  && !status.next
  && roadmap.current?.phaseId === "P145.7"
  && roadmap.previous?.phaseId === "P145.6"
  && !roadmap.next
  && statusById.get("P145")?.status === "complete"
  && roadmapById.get("P145")?.status === "complete"
  && ["P145.1", "P145.2", "P145.3", "P145.4", "P145.5", "P145.6", "P145.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete");
const p1452OrLaterState = p1452CurrentState || p1453CurrentState || p1454CurrentState || p1455CurrentState || p1456CurrentState || p1457FinalState;

const matrixRows = contract.certificationMatrixRows || [];
const matrixRowsSafe = matrixRows.length >= 5
  && matrixRows.every((row) => (
    REQUIRED_MATRIX_FIELDS.every((field) => Object.hasOwn(row, field))
    && row.certificationAllowed === false
    && row.costImpact === "No spend"
    && Array.isArray(row.evidenceRefs)
    && row.evidenceRefs.length > 0
    && Array.isArray(row.blockers)
    && row.blockers.length > 0
    && typeof row.disabledReason === "string"
    && /disabled|not enabled|remain/i.test(row.disabledReason)
  ));

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1452-enterprise-certification-matrix.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P145.1 report still passes", reportPassed("reports/p1451-enterprise-certification-ga-readiness-report.md"));
addCheck("contract keeps P145.2 complete through handoff", contract.phaseId === "P145" && p1452.status === "complete" && ((contract.status === "in_progress" && (p1452CurrentState || (contract.currentSubphase === "P145.3" && contract.previousSubphase === "P145.2" && contract.nextSubphase === "P145.4" && p1453.status === "complete") || (contract.currentSubphase === "P145.4" && contract.previousSubphase === "P145.3" && contract.nextSubphase === "P145.5" && p1453.status === "complete" && p1454.status === "complete") || (contract.currentSubphase === "P145.5" && contract.previousSubphase === "P145.4" && contract.nextSubphase === "P145.6" && p1453.status === "complete" && p1454.status === "complete" && p1455.status === "complete") || (contract.currentSubphase === "P145.6" && contract.previousSubphase === "P145.5" && contract.nextSubphase === "P145.7" && p1453.status === "complete" && p1454.status === "complete" && p1455.status === "complete" && p1456.status === "complete"))) || (p1457FinalState && contract.status === "complete" && contract.currentSubphase === "P145.7" && contract.previousSubphase === "P145.6" && contract.nextSubphase === "" && p1457.status === "complete")));
addCheck("contract records expected base commit", p1452.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P145.2 records allowed and forbidden files", p1452.allowedFiles?.includes("dashboard/src/data/complianceReadiness.js") && p1452.allowedFiles?.includes("scripts/check-p1452-enterprise-certification-matrix.js") && p1452.forbiddenFiles?.includes("projects/**") && p1452.forbiddenFiles?.includes("db/**") && p1452.forbiddenFiles?.includes("providers/**") && p1452.forbiddenFiles?.includes("tools/**"));
addCheck("P145.2 records validation commands", VALIDATION_COMMANDS.every((command) => p1452.validationCommands?.includes(command)));
addCheck("certification matrix shape present", hasFields(contract.certificationMatrixShape, REQUIRED_MATRIX_FIELDS));
addCheck("certification matrix rows are safe", matrixRowsSafe, `${matrixRows.length} rows`);
addCheck("authority flags remain blocked", allBooleanValuesFalse(contract.authorityFlags), JSON.stringify(contract.authorityFlags || {}));
addCheck("P145.3 handoff is safe", (p1452CurrentState && p1453.status === "planned" && p1453.expectedBaseCommit === "after-P145.2" && p1453.commit === "" && Array.isArray(p1453.checksRun) && p1453.checksRun.length === 0) || ((p1453CurrentState || p1454CurrentState || p1455CurrentState || p1456CurrentState || p1457FinalState) && p1453.status === "complete" && p1453.expectedBaseCommit === "b8bbbb1a"));
addCheck("P145.1 checker accepts P145.2 handoff", priorChecker.includes("p1452CurrentState") && priorChecker.includes('status.currentPhase === "P145.2"'));
addCheck("enterprise checker accepts P145.2/P145.5 active state", enterpriseChecker.includes("p1452CurrentState") && enterpriseChecker.includes("p1455CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("Compliance view model exposes matrix rows", complianceData.includes("certificationMatrixRows") && complianceData.includes("certificationMatrixSummary") && complianceData.includes(CONTRACT_PATH.split("/").pop()));
addCheck("Compliance tabs include Certification Matrix", tabsData.includes('id: "certification"') && tabsData.includes("Certification Matrix"));
addCheck("Command Center renders matrix without action buttons", commandCenter.includes('tabId="certification"') && commandCenter.includes("Enterprise Certification Matrix") && !/certify now|issue certification now|attest now|run scan now/i.test(commandCenter));
addCheck("phase status keeps P145.2 complete through handoff", p1452OrLaterState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P145 parent records active status", [p145, p145Roadmap].every((entry) => entry.status === (p1457FinalState ? "complete" : "in_progress") && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && entry.commandCenterVisible === true));
addCheck("P145.2 records required status fields", [statusById.get("P145.2"), roadmapById.get("P145.2")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P145.3-P145.5 remain safe", (p1452CurrentState && [statusById.get("P145.3"), roadmapById.get("P145.3")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1453CurrentState && [statusById.get("P145.3"), roadmapById.get("P145.3")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1453-enterprise-e2e-rehearsal")) && [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1454CurrentState && [statusById.get("P145.3"), roadmapById.get("P145.3")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1453-enterprise-e2e-rehearsal")) && [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1454-enterprise-command-center-ux")) && [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1455CurrentState && [statusById.get("P145.3"), roadmapById.get("P145.3")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1453-enterprise-e2e-rehearsal")) && [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1454-enterprise-command-center-ux")) && [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`))) || (p1456CurrentState && [statusById.get("P145.3"), roadmapById.get("P145.3")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1453-enterprise-e2e-rehearsal")) && [statusById.get("P145.4"), roadmapById.get("P145.4")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1454-enterprise-command-center-ux")) && [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`)) && [statusById.get("P145.6"), roadmapById.get("P145.6")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1456-enterprise-ga-readiness-docs-roadmap"))) || p1457FinalState);
addCheck("P145.2 Playwright coverage exists", routeTests.includes("P145.2 enterprise certification matrix keeps Compliance useful") && routeTests.includes("Certification Matrix") && routeTests.includes("P145.3"));
addCheck("route-wide safety coverage retained", routeTests.includes("Command Center route-wide UX") && routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher exists globally"));
addCheck("docs record P145.2 and P145.3 handoff", /## P145\.2 Certification Matrix[\s\S]*Status:\s+complete/.test(plan) && /P145\.2 Certification Matrix is complete/i.test(readme) && /P145\.2 certification matrix is complete/i.test(platformRoadmap) && /P145\.2 is now complete as a read-only certification matrix/i.test(enterpriseRoadmap));
addCheck("changed files stay in P145.2 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix))), changed.join(", "));
addCheck("docs and UX avoid raw private IDs", !/private-project-|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_/i.test(displayDataBundle));
addCheck("docs and UX avoid raw storage or provider URLs", !/https:\/\/|postgres(?:ql)?:\/\//i.test(docsAndUiBundle));
addCheck("docs and UX avoid fake runnable certification actions", !/certify now|issue certification now|attest now|sign attestation now|run security scan now|mutate finding now|run load test now|run recovery now|restore now|failover now|release now|deploy now|export now|package now|write db now|call provider now|call model now|run tool now|dispatch agent now|mutate project now|spend now/i.test(docsAndUiBundle));
addCheck("docs and UX avoid raw dumps", !hasUnsafePositiveClaim(displayDataBundle, /raw JSON|raw logs?|raw policy dump/i));

const failed = checks.filter((check) => check.status !== "PASS");
writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds the read-only enterprise certification matrix for Compliance Command Center.",
        "- Confirms P145.2 remains complete through later P145 handoffs.",
        "- Keeps certification issuance, attestation signing, scanner execution, finding mutation, load/recovery execution, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, deploy/release/export/package actions, network calls, and spend blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Certification Matrix Rows",
      body: matrixRows.map((row) => `- ${row.displayName}: ${row.readinessState}; certificationAllowed=${row.certificationAllowed}; owner=${row.ownerCapability}; cost=${row.costImpact}`).join("\n"),
    },
    {
      title: "Safety",
      body: "- P145.2 is read-only certification matrix work only. It does not issue certification, sign attestations, run security scans, mutate findings, execute load or recovery actions, restore, fail over, write DB/runtime state, call providers/models, run tools, dispatch agents, mutate projects, deploy/release/export/package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length ? `FAIL (${failed.length}/${checks.length})` : `PASS (${checks.length}/${checks.length})` },
  ],
  { title: "P145.2 Enterprise Certification Matrix Report", phase: "P145.2", current: status.currentPhase, next: status.nextPhase },
);

printCheckReport("P145.2 Enterprise Certification Matrix Check", checks);
if (failed.length > 0) process.exit(1);
