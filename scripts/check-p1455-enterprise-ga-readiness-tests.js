import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildComplianceReadinessViewModel } from "../dashboard/src/data/complianceReadiness.js";
import { buildEnterprisePreviewReadinessViewModel } from "../dashboard/src/data/enterprisePreviewReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1455-enterprise-ga-readiness-tests-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p145-enterprise-certification-ga-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P145_ENTERPRISE_CERTIFICATION_GA_READINESS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1455-enterprise-ga-readiness-tests";
const PRIOR_SCRIPT = "check:p1454-enterprise-command-center-ux";
const NEXT_SCRIPT = "check:p1456-enterprise-ga-readiness-docs-roadmap";
const EXPECTED_BASE_COMMIT = "4412d7fd";
const PRIOR_REPORTS = [
  "reports/p1451-enterprise-certification-ga-readiness-report.md",
  "reports/p1452-enterprise-certification-matrix-report.md",
  "reports/p1453-enterprise-e2e-rehearsal-report.md",
  "reports/p1454-enterprise-command-center-ux-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1455-enterprise-ga-readiness-tests",
  "npm run check:p1454-enterprise-command-center-ux",
  "npm run check:p1453-enterprise-e2e-rehearsal",
  "npm run check:p1452-enterprise-certification-matrix",
  "npm run check:p1451-enterprise-certification-ga-readiness",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P145.5\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|coverage|tests?|ux|review|aggregate)\b/i.test(context);
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
const p1455 = subphaseById.get("P145.5") || {};
const p1456 = subphaseById.get("P145.6") || {};
const p1457 = subphaseById.get("P145.7") || {};
const checkerSource = readText("scripts/check-p1455-enterprise-ga-readiness-tests.js");
const p1454Checker = readText("scripts/check-p1454-enterprise-command-center-ux.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const commandCenter = readText("dashboard/src/pages/CommandCenterV2.jsx");
const enterprisePreviewData = readText("dashboard/src/data/enterprisePreviewReadiness.js");
const complianceData = readText("dashboard/src/data/complianceReadiness.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const complianceView = buildComplianceReadinessViewModel();
const enterpriseView = buildEnterprisePreviewReadinessViewModel();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P145.5";
const allowedFiles = new Set(p1455.allowedFiles || []);
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

const matrixRows = contract.certificationMatrixRows || [];
const rehearsalRows = contract.e2eRehearsalRows || [];
const readinessRows = contract.commandCenterReadinessRows || [];
const authorityBlocked = allBooleanValuesFalse(contract.authorityFlags);
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
  && roadmap.current?.phaseId === "P145.7"
  && roadmap.previous?.phaseId === "P145.6"
  && statusById.get("P145")?.status === "complete"
  && roadmapById.get("P145")?.status === "complete"
  && ["P145.1", "P145.2", "P145.3", "P145.4", "P145.5", "P145.6", "P145.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete");
const contractRowsSafe = matrixRows.length >= 5
  && rehearsalRows.length >= 6
  && readinessRows.length >= 6
  && matrixRows.every((row) => row.certificationAllowed === false && row.costImpact === "No spend" && Array.isArray(row.evidenceRefs) && row.evidenceRefs.length > 0 && Array.isArray(row.blockers) && row.blockers.length > 0)
  && rehearsalRows.every((row) => row.executionAllowed === false && row.providerCallsAllowed === false && row.agentDispatchAllowed === false && row.projectMutationAllowed === false && row.dbWritesAllowed === false && row.networkCallsAllowed === false && row.spendAllowed === false && row.costImpact === "No spend")
  && readinessRows.every((row) => row.certificationAllowed === false && row.executionAllowed === false && row.mutationAllowed === false && row.spendAllowed === false && row.costImpact === "No spend");
const enterprisePreviewSafe =
  enterpriseView.rehearsalSummary.rowCount === rehearsalRows.length
  && enterpriseView.gaReadinessSummary.rowCount === readinessRows.length
  && enterpriseView.rehearsalSummary.executionAllowedCount === 0
  && enterpriseView.gaReadinessSummary.certificationAllowedCount === 0
  && enterpriseView.gaReadinessSummary.executionAllowedCount === 0
  && enterpriseView.gaReadinessSummary.mutationAllowedCount === 0
  && enterpriseView.gaReadinessSummary.spendAllowedCount === 0
  && enterpriseView.costImpact === "No spend";
const complianceSafe =
  complianceView.certificationMatrixSummary.rowCount === matrixRows.length
  && complianceView.certificationMatrixSummary.allowedCount === 0
  && complianceView.costImpact === "No spend"
  && complianceView.safety.certificationAllowed === false
  && complianceView.safety.providerSpendAllowed === false;
const displayBundle = [
  JSON.stringify(complianceView),
  JSON.stringify(enterpriseView),
].join("\n");
const docsBundle = [
  JSON.stringify(contract),
  plan,
  readme,
  platformRoadmap,
  enterpriseRoadmap,
].join("\n");

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1455-enterprise-ga-readiness-tests.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P145.1-P145.4 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("contract keeps P145.5 complete through handoff", contract.phaseId === "P145" && p1455.status === "complete" && ((contract.status === "in_progress" && contract.currentSubphase === "P145.5" && contract.previousSubphase === "P145.4" && contract.nextSubphase === "P145.6" && p1456.status === "planned") || (contract.status === "in_progress" && contract.currentSubphase === "P145.6" && contract.previousSubphase === "P145.5" && contract.nextSubphase === "P145.7" && p1456.status === "complete" && p1457.status === "planned") || p1457FinalState));
addCheck("contract records expected base commit", p1455.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1455.validationCommands?.includes(command)));
addCheck("contract rows remain safe", contractRowsSafe, `matrix=${matrixRows.length}; rehearsal=${rehearsalRows.length}; readiness=${readinessRows.length}`);
addCheck("authority flags remain blocked", authorityBlocked, JSON.stringify(contract.authorityFlags || {}));
addCheck("Compliance matrix projection remains display-only", complianceSafe, `${complianceView.certificationMatrixSummary.rowCount} rows`);
addCheck("Enterprise Preview projections remain display-only", enterprisePreviewSafe, `rehearsal=${enterpriseView.rehearsalSummary.rowCount}; readiness=${enterpriseView.gaReadinessSummary.rowCount}`);
addCheck("P145.4 checker accepts P145.5 handoff", p1454Checker.includes("p1455CurrentState") && p1454Checker.includes('status.currentPhase === "P145.5"') && p1454Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P145.5 active state", enterpriseChecker.includes("p1455CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("Command Center keeps enterprise readiness non-runnable", !/certify now|issue certification now|attest now|sign attestation now|run security scan now|mutate finding now|run load test now|run recovery now|restore now|failover now|release now|deploy now|export now|package now|write db now|call provider now|call model now|run tool now|dispatch agent now|mutate project now|spend now|generate prd now|start build now|build project now/i.test(commandCenter));
addCheck("phase status advances to P145.5 or safely hands off", p1455CurrentState || p1456CurrentState || p1457FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P145 parent records active status", [p145, p145Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && entry.commandCenterVisible === true));
addCheck("P145.5 records required status fields", [statusById.get("P145.5"), roadmapById.get("P145.5")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P145.6 handoff remains valid", (p1455CurrentState && [statusById.get("P145.6"), roadmapById.get("P145.6")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || ((p1456CurrentState || p1457FinalState) && [statusById.get("P145.6"), roadmapById.get("P145.6")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`))));
addCheck("P145.5 Playwright coverage exists", routeTests.includes("P145.5 aggregate tests keep enterprise GA readiness safe") && routeTests.includes("Enterprise GA Readiness") && routeTests.includes("Certification Matrix") && routeTests.includes("P145.6"));
addCheck("route-wide safety coverage retained", routeTests.includes("Command Center route-wide UX") && routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher exists globally"));
addCheck("docs record P145.5 and P145.6 handoff", /## P145\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan) && /P145\.5 Tests \/ Checkers is complete/i.test(readme) && /P145\.5 aggregate tests\/checkers is complete/i.test(platformRoadmap) && /P145\.5 is now complete as aggregate tests\/checkers only/i.test(enterpriseRoadmap) && (/P145\.6 is\s+planned-only next/i.test(enterpriseRoadmap) || /P145\.6 is now complete/i.test(enterpriseRoadmap)));
addCheck("changed files stay in P145.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix))), changed.join(", "));
addCheck("display avoids raw private IDs", !/private-project-|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\//i.test(displayBundle));
addCheck("display avoids raw dumps", !hasUnsafePositiveClaim(displayBundle, /raw JSON|raw logs?|raw policy dump/i));
addCheck("docs avoid raw storage or provider URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|storage|secret|artifact|certification|attestation|release)|postgres(?:ql)?:\/\//i.test(docsBundle));
addCheck("docs avoid fake runnable enterprise actions", !/certify now|issue certification now|attest now|sign attestation now|run security scan now|mutate finding now|run load test now|run recovery now|restore now|failover now|release now|deploy now|export now|package now|write db now|call provider now|call model now|run tool now|dispatch agent now|mutate project now|spend now|generate prd now|start build now|build project now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /certification is enabled|certification issuance is enabled|attestation is enabled|security scanning is enabled|finding mutation is enabled|load execution is enabled|recovery execution is enabled|restore execution is enabled|failover is enabled|release is enabled|deploy is enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|network calls are enabled|spend is enabled/i));

const failed = checks.filter((check) => check.status !== "PASS");
writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds aggregate P145.5 validation over the enterprise certification contract, certification matrix, end-to-end rehearsal evidence, GA readiness UX, docs/status, and route safety.",
        "- Confirms P145.1-P145.5 are complete and the P145.6 handoff remains valid.",
        "- Keeps certification issuance, attestation signing, scan/load/recovery execution, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, network calls, deploy/release/export/package actions, and spend blocked.",
      ].join("\n"),
    },
    {
      title: "Coverage Summary",
      body: [
        `- Certification matrix rows: ${matrixRows.length}`,
        `- Rehearsal evidence rows: ${rehearsalRows.length}`,
        `- GA readiness rows: ${readinessRows.length}`,
        `- Enterprise Preview allowed execution rows: ${enterpriseView.rehearsalSummary.executionAllowedCount}`,
        `- Certification matrix allowed rows: ${complianceView.certificationMatrixSummary.allowedCount}`,
        "- Cost impact: No spend",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P145.5 is tests/checkers hardening only. It does not run founder Q&A automation, generate PRDs, dispatch agents, execute tools or workers, write DB/runtime state, mutate projects, call providers/models, use network calls, deploy/release/export/package, execute scans/load/recovery paths, issue certification, sign attestations, or spend. P145.6 may now be complete as docs/status closure while P145.7 remains planned-only.",
    },
    { title: "Result", body: failed.length ? `FAIL (${failed.length}/${checks.length})` : `PASS (${checks.length}/${checks.length})` },
  ],
  { title: "P145.5 Enterprise GA Readiness Tests Report", phase: "P145.5", current: status.currentPhase, next: status.nextPhase },
);

printCheckReport("P145.5 Enterprise GA Readiness Tests Check", checks);
process.exit(failed.length ? 1 : 0);
