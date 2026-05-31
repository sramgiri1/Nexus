import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildAdminOperationsRuntimeSettingsModel,
  validateAdminOperationsRuntimeSettingsModel,
} from "../shared/adminOperationsRuntimeSettingsModel.js";
import {
  buildAdminOperationsRuntimeSettingsDryRun,
  validateAdminOperationsRuntimeSettingsDryRun,
} from "../shared/adminOperationsRuntimeSettingsDryRun.js";
import { buildAdminOperationsRuntimeSettingsReadinessViewModel } from "../dashboard/src/data/adminOperationsRuntimeSettingsReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1425-admin-operations-runtime-settings-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json";
const PLAN_PATH = "docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1425-admin-operations-runtime-settings";
const NEXT_SCRIPT = "check:p1426-admin-operations-runtime-settings-docs-roadmap";
const FINAL_SCRIPT = "check:p1427-admin-operations-runtime-settings-final-validation";
const EXPECTED_BASE_COMMIT = "4f7f6ac3";
const PRIOR_REPORTS = [
  "reports/p1421-admin-operations-runtime-settings-report.md",
  "reports/p1422-admin-operations-runtime-settings-report.md",
  "reports/p1423-admin-operations-runtime-settings-report.md",
  "reports/p1424-admin-operations-runtime-settings-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1425-admin-operations-runtime-settings",
  "npm run check:p1424-admin-operations-runtime-settings",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P142.5\"",
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

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|aggregate|coverage)\b/i.test(context);
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
const p1421 = subphaseById.get("P142.1") || {};
const p1422 = subphaseById.get("P142.2") || {};
const p1423 = subphaseById.get("P142.3") || {};
const p1424 = subphaseById.get("P142.4") || {};
const p1425 = subphaseById.get("P142.5") || {};
const p1426 = subphaseById.get("P142.6") || {};
const p1427 = subphaseById.get("P142.7") || {};
const checkerSource = readText("scripts/check-p1425-admin-operations-runtime-settings.js");
const p1424Checker = readText("scripts/check-p1424-admin-operations-runtime-settings.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const model = buildAdminOperationsRuntimeSettingsModel({ createdAt: "2026-05-31T12:10:00.000Z" });
const dryRun = buildAdminOperationsRuntimeSettingsDryRun({ sourceModel: model });
const readiness = buildAdminOperationsRuntimeSettingsReadinessViewModel();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P142.5";
const allowedFiles = new Set(p1425.allowedFiles || []);
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
const displayBundle = [
  readiness.pageTitle,
  readiness.whatChanged,
  readiness.currentState,
  readiness.nextAction,
  readiness.disabledReason,
  readiness.evidenceLocation,
  readiness.activityLocation,
  readiness.costImpact,
  readiness.readinessCards.map((card) => `${card.label} ${card.value} ${card.detail}`).join(" "),
  readiness.settingsRows.map((row) => `${row.label} ${row.currentState} ${row.owner} ${row.nextAction} ${row.disabledReason}`).join(" "),
  readiness.featureGateRows.map((row) => `${row.label} ${row.currentState} ${row.owner} ${row.nextAction} ${row.disabledReason}`).join(" "),
  readiness.maintenanceRows.map((row) => `${row.label} ${row.currentState} ${row.owner} ${row.nextAction} ${row.disabledReason}`).join(" "),
  readiness.runtimeStateRows.map((row) => `${row.label} ${row.currentState} ${row.owner} ${row.nextAction} ${row.disabledReason}`).join(" "),
  readiness.auditSurfaceRows.map((row) => `${row.label} ${row.currentState} ${row.owner} ${row.nextAction} ${row.disabledReason}`).join(" "),
  readiness.dryRunRows.map((row) => `${row.label} ${row.currentState} ${row.dryRunState} ${row.owner} ${row.nextAction}`).join(" "),
  readiness.disabledActions.map((action) => `${action.label} ${action.reason}`).join(" "),
].join("\n");
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1425CurrentState =
  status.currentPhase === "P142.5"
  && status.previousPhase === "P142.4"
  && status.nextPhase === "P142.6"
  && roadmap.currentPhase === "P142.5"
  && roadmap.previousPhase === "P142.4"
  && roadmap.nextPhase === "P142.6"
  && status.current?.phaseId === "P142.5"
  && status.previous?.phaseId === "P142.4"
  && status.next?.phaseId === "P142.6"
  && roadmap.current?.phaseId === "P142.5"
  && roadmap.previous?.phaseId === "P142.4"
  && roadmap.next?.phaseId === "P142.6"
  && statusById.get("P142")?.status === "in_progress"
  && roadmapById.get("P142")?.status === "in_progress"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P142.6")?.status === "planned"
  && roadmapById.get("P142.6")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && roadmapById.get("P143")?.status === "planned";
const p1426CurrentState =
  status.currentPhase === "P142.6"
  && status.previousPhase === "P142.5"
  && status.nextPhase === "P142.7"
  && roadmap.currentPhase === "P142.6"
  && roadmap.previousPhase === "P142.5"
  && roadmap.nextPhase === "P142.7"
  && status.current?.phaseId === "P142.6"
  && status.previous?.phaseId === "P142.5"
  && status.next?.phaseId === "P142.7"
  && roadmap.current?.phaseId === "P142.6"
  && roadmap.previous?.phaseId === "P142.5"
  && roadmap.next?.phaseId === "P142.7"
  && statusById.get("P142")?.status === "in_progress"
  && roadmapById.get("P142")?.status === "in_progress"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5", "P142.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P142.7")?.status === "planned"
  && roadmapById.get("P142.7")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && roadmapById.get("P143")?.status === "planned";
const p1427FinalState =
  status.currentPhase === "P142.7"
  && status.previousPhase === "P142.6"
  && status.nextPhase === "P143"
  && roadmap.currentPhase === "P142.7"
  && roadmap.previousPhase === "P142.6"
  && roadmap.nextPhase === "P143"
  && status.current?.phaseId === "P142.7"
  && status.previous?.phaseId === "P142.6"
  && status.next?.phaseId === "P143"
  && roadmap.current?.phaseId === "P142.7"
  && roadmap.previous?.phaseId === "P142.6"
  && roadmap.next?.phaseId === "P143"
  && statusById.get("P142")?.status === "complete"
  && roadmapById.get("P142")?.status === "complete"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5", "P142.6", "P142.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143")?.status === "planned"
  && roadmapById.get("P143")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1425-admin-operations-runtime-settings.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P142.1-P142.4 reports pass", PRIOR_REPORTS.every(reportPassed));
addCheck("P142 settings model validates", validateAdminOperationsRuntimeSettingsModel(model).valid);
addCheck("P142 admin dry run validates", validateAdminOperationsRuntimeSettingsDryRun(dryRun).valid);
addCheck("Settings readiness exposes aggregate UX data", readiness.settingsRows.length >= 3 && readiness.featureGateRows.length >= 3 && readiness.maintenanceRows.length >= 2 && readiness.runtimeStateRows.length >= 2 && readiness.auditSurfaceRows.length >= 2 && readiness.dryRunSummary.executableRowCount === 0 && readiness.disabledActions.length >= 8);
addCheck("Settings display remains public-safe", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(displayBundle) && !/P142\.|raw JSON|raw logs?|raw policy dump|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\//i.test(displayBundle));
addCheck("Settings display has no fake runnable actions", !/save settings now|apply settings now|toggle feature now|roll out now|run maintenance now|schedule maintenance now|export audit now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|package now|execute now|spend now/i.test(displayBundle));
addCheck("all readiness safety flags remain blocked", Object.values(readiness.safety || {}).every((value) => value === false));
addCheck("cost impact remains zero-spend", readiness.costImpact === "No provider spend" && model.costImpact.providerSpendAllowed === false && dryRun.costImpact.providerSpendAllowed === false);
addCheck("Playwright aggregate coverage added", routeTests.includes("P142.5 admin settings aggregate coverage keeps Settings display-only") && routeTests.includes("Admin Dry Run Summary") && routeTests.includes("Disabled action: Save settings") && routeTests.includes("P142.6"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("contract advances through P142.5 safely", contract.phaseId === "P142" && p1421.status === "complete" && p1422.status === "complete" && p1423.status === "complete" && p1424.status === "complete" && p1425.status === "complete" && ((contract.status === "in_progress" && contract.currentSubphase === "P142.5" && contract.previousSubphase === "P142.4" && contract.nextSubphase === "P142.6" && p1426.status === "planned") || (contract.status === "in_progress" && contract.currentSubphase === "P142.6" && contract.previousSubphase === "P142.5" && contract.nextSubphase === "P142.7" && p1426.status === "complete" && p1427.status === "planned") || (contract.status === "complete" && contract.currentSubphase === "P142.7" && contract.previousSubphase === "P142.6" && contract.nextSubphase === "P143" && p1426.status === "complete" && p1427.status === "complete")));
addCheck("contract records expected base commit", p1425.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1425.validationCommands?.includes(command)));
addCheck("contract scope stays aggregate-checker only", /aggregate/i.test(p1425.dataShape || "") && p1425.forbiddenFiles?.includes("projects/**") && p1425.forbiddenFiles?.includes("db/**") && p1425.forbiddenFiles?.includes("providers/**"));
addCheck("P142.4 checker accepts P142.5", p1424Checker.includes("p1425CurrentState") && p1424Checker.includes('status.currentPhase === "P142.5"'));
addCheck("enterprise checker accepts P142.5", enterpriseChecker.includes("p1425CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P142 plan records P142.5", /## P142\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P142.5", /P142\.5 Tests \/ Checkers/i.test(readme));
addCheck("platform roadmap records P142.5", /P142\.5 Tests \/ Checkers is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P142.5", /P142\.5 is now complete/i.test(enterpriseRoadmap) && (/P142\.6 is planned-only next/i.test(enterpriseRoadmap) || /P142\.6 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances through P142.5", p1425CurrentState || p1426CurrentState || p1427FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P142.5 entries have required fields", [statusById.get("P142"), statusById.get("P142.5"), roadmapById.get("P142"), roadmapById.get("P142.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P142.6 handoff remains valid", (p1425CurrentState && [statusById.get("P142.6"), roadmapById.get("P142.6")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || ((p1426CurrentState || p1427FinalState) && [statusById.get("P142.6"), roadmapById.get("P142.6")].every((entry) => entry?.status === "complete" && Boolean(entry.branch) && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`))));
addCheck("P142.7 handoff remains valid after P142.6", (p1426CurrentState && [statusById.get("P142.7"), roadmapById.get("P142.7")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1427FinalState && [statusById.get("P142.7"), roadmapById.get("P142.7")].every((entry) => entry?.status === "complete" && Boolean(entry.branch) && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${FINAL_SCRIPT}`))) || (!p1426CurrentState && !p1427FinalState));
addCheck("P143 remains planned-only", [statusById.get("P143"), roadmapById.get("P143")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("changed files stay in P142.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), changed.join(", "));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or export URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|export|package|compliance|storage|secret|runtime|admin)/i.test(docsBundle));
addCheck("docs avoid fake runnable admin actions", !/apply setting now|save setting now|toggle feature now|roll out now|run maintenance now|schedule maintenance now|export audit now|view raw logs now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /admin settings mutation is enabled|feature toggles are enabled|feature rollout is enabled|maintenance execution is enabled|maintenance scheduling is enabled|runtime state mutation is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|audit export is enabled|raw log exposure is enabled|raw state exposure is enabled|credentials are handled|secret values are readable|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw admin payload|raw runtime payload|raw setting payload|raw feature payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds aggregate P142.5 checker and Playwright coverage for admin operations runtime settings.",
        "- Verifies P142.1-P142.4 reports, P142.2 settings model, P142.3 dry run, P142.4 Settings UX data, route-wide safety coverage, and P142.6 handoff compatibility.",
        "- Does not mutate settings, toggle or roll out features, execute or schedule maintenance, write DB/runtime state, expose raw logs or raw state, handle credentials, read secrets, export audits, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Coverage Summary",
      body: [
        `- Prior reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
        `- Settings rows: ${readiness.settingsRows.length}`,
        `- Feature gate rows: ${readiness.featureGateRows.length}`,
        `- Maintenance rows: ${readiness.maintenanceRows.length}`,
        `- Runtime state rows: ${readiness.runtimeStateRows.length}`,
        `- Audit surface rows: ${readiness.auditSurfaceRows.length}`,
        `- Dry-run rows: ${readiness.dryRunSummary.rowCount}`,
        `- Executable dry-run rows: ${readiness.dryRunSummary.executableRowCount}`,
        `- Disabled actions: ${readiness.disabledActions.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P142.5 is tests/checkers hardening only. It does not enable admin setting mutation, feature toggles, feature rollouts, maintenance execution, maintenance scheduling, runtime state mutation, DB/runtime writes, audit export, raw log exposure, raw state exposure, credential handling, secret value reads, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P142.6 may be complete as docs/status/checker closure; P142.7 remains planned-only until its own implementation-grade plan.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P142.5 Admin Operations Runtime Settings Report", phase: "P142.5" },
);

printCheckReport("P142.5 Admin Operations Runtime Settings Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) {
  process.exitCode = 1;
}
