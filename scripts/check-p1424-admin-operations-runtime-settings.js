import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildAdminOperationsRuntimeSettingsReadinessViewModel } from "../dashboard/src/data/adminOperationsRuntimeSettingsReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1424-admin-operations-runtime-settings-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json";
const PLAN_PATH = "docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1424-admin-operations-runtime-settings";
const EXPECTED_BASE_COMMIT = "34845071";
const EXPECTED_EXPORTS = [
  "buildAdminOperationsRuntimeSettingsReadinessViewModel",
  "adminOperationsRuntimeSettingsReadinessViewModel",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1424-admin-operations-runtime-settings",
  "npm run check:p1423-admin-operations-runtime-settings",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff)\b/i.test(context);
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
const checkerSource = readText("scripts/check-p1424-admin-operations-runtime-settings.js");
const p1423Checker = readText("scripts/check-p1423-admin-operations-runtime-settings.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const viewModelSource = readText("dashboard/src/data/adminOperationsRuntimeSettingsReadiness.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const settingsPageSource = commandCenterSource.slice(
  commandCenterSource.indexOf("function SettingsReadinessRows"),
  commandCenterSource.indexOf("function EnterprisePreviewPage"),
);
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const readiness = buildAdminOperationsRuntimeSettingsReadinessViewModel();
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const uxBundle = `${JSON.stringify(readiness)}\n${settingsPageSource}`;
const p1424CurrentState =
  status.currentPhase === "P142.4"
  && status.previousPhase === "P142.3"
  && status.nextPhase === "P142.5"
  && roadmap.currentPhase === "P142.4"
  && roadmap.previousPhase === "P142.3"
  && roadmap.nextPhase === "P142.5"
  && status.current?.phaseId === "P142.4"
  && status.previous?.phaseId === "P142.3"
  && status.next?.phaseId === "P142.5"
  && roadmap.current?.phaseId === "P142.4"
  && roadmap.previous?.phaseId === "P142.3"
  && roadmap.next?.phaseId === "P142.5"
  && statusById.get("P142")?.status === "in_progress"
  && roadmapById.get("P142")?.status === "in_progress"
  && ["P142.1", "P142.2", "P142.3", "P142.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P142.5")?.status === "planned"
  && roadmapById.get("P142.5")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && roadmapById.get("P143")?.status === "planned";
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
const enforceCurrentDiffScope = status.currentPhase === "P142.4";
const allowedFiles = new Set(p1424.allowedFiles || []);
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

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1424-admin-operations-runtime-settings.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("settings view model exports expected API", EXPECTED_EXPORTS.every((entry) => viewModelSource.includes(`export function ${entry}`) || viewModelSource.includes(`export const ${entry}`)));
addCheck("settings view model reuses P142.2 model and P142.3 dry run", viewModelSource.includes("adminOperationsRuntimeSettingsModel.js") && viewModelSource.includes("adminOperationsRuntimeSettingsDryRun.js"));
addCheck("settings view model does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb)\b/.test(viewModelSource));
addCheck("settings route is implemented", /key:\s+"settings"[\s\S]*status:\s+"implemented"[\s\S]*tabs:\s+SETTINGS_TABS/.test(routeSource));
addCheck("settings tabs are registered", tabsSource.includes("export const SETTINGS_TABS") && ["Overview", "Admin Settings", "Feature Gates", "Maintenance", "Runtime State", "Audit Surfaces", "Dry Run", "Evidence", "Disabled Actions"].every((label) => tabsSource.includes(`label: "${label}"`)));
addCheck("SettingsPage replaces planned placeholder", commandCenterSource.includes("function SettingsPage()") && commandCenterSource.includes("buildAdminOperationsRuntimeSettingsReadinessViewModel") && commandCenterSource.includes('{currentPage === "settings" && <SettingsPage />}'));
addCheck("settings UX has required summary fields", ["What changed", "Current state", "Next action", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => commandCenterSource.includes(label)));
addCheck("view model has required rows and dry-run summary", readiness.settingsRows.length > 0 && readiness.featureGateRows.length > 0 && readiness.maintenanceRows.length > 0 && readiness.runtimeStateRows.length > 0 && readiness.auditSurfaceRows.length > 0 && readiness.dryRunSummary.rowCount >= 10 && readiness.dryRunSummary.executableRowCount === 0);
addCheck("view model disabled actions are explicit and non-runnable", readiness.disabledActions.length >= 8 && readiness.disabledActions.every((action) => /disabled|not enabled|remain disabled/i.test(action.reason)));
addCheck("all settings authority flags remain blocked", Object.values(readiness.safety || {}).every((value) => value === false));
addCheck("cost impact remains zero-spend", readiness.costImpact === "No provider spend" && readiness.readinessCards.some((card) => card.label === "Cost" && card.value === "No spend"));
addCheck("P142.3 report passes", reportPassed("reports/p1423-admin-operations-runtime-settings-report.md"));
addCheck("contract advances through P142.4 safely", contract.phaseId === "P142" && contract.status === "in_progress" && p1421.status === "complete" && p1422.status === "complete" && p1423.status === "complete" && p1424.status === "complete" && ((contract.currentSubphase === "P142.4" && contract.previousSubphase === "P142.3" && contract.nextSubphase === "P142.5" && p1425.status === "planned") || (contract.currentSubphase === "P142.5" && contract.previousSubphase === "P142.4" && contract.nextSubphase === "P142.6" && p1425.status === "complete" && p1426.status === "planned")));
addCheck("contract records expected base commit", p1424.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1424.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1424.validationCommands?.includes(command)));
addCheck("contract scope stays UX-only", /Command Center UX/i.test(p1424.dataShape || "") && p1424.forbiddenFiles?.includes("projects/**") && p1424.forbiddenFiles?.includes("db/**") && p1424.forbiddenFiles?.includes("providers/**"));
addCheck("P142.3 checker accepts P142.4 handoff", p1423Checker.includes("p1424CurrentState") && p1423Checker.includes('status.currentPhase === "P142.4"'));
addCheck("enterprise checker accepts P142.4 active state", enterpriseChecker.includes("p1424CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("docs record P142.4 and later handoff", /## P142\.4 Settings Command Center UX[\s\S]*Status:\s+complete/.test(plan) && /P142\.4 Settings Command Center UX/i.test(readme) && /P142\.4 Settings Command Center UX is complete/i.test(platformRoadmap) && /P142\.4 is now complete/i.test(enterpriseRoadmap) && (/P142\.5 is planned-only next/i.test(enterpriseRoadmap) || /P142\.5 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances through P142.4", p1424CurrentState || p1425CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P142.4 entries have required fields", [statusById.get("P142"), statusById.get("P142.4"), roadmapById.get("P142"), roadmapById.get("P142.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("next P142/P143 handoff remains planned-only", p1424CurrentState
  ? [statusById.get("P142.5"), roadmapById.get("P142.5"), statusById.get("P143"), roadmapById.get("P143")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)
  : [statusById.get("P142.6"), roadmapById.get("P142.6"), statusById.get("P143"), roadmapById.get("P143")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("changed files stay in P142.4 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("P142.4 Playwright coverage exists", routeTests.includes("P142.4 settings command center UX renders admin posture without runnable actions") && routeTests.includes("Admin Dry Run Summary") && routeTests.includes("Disabled action: Save settings"));
addCheck("settings UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(uxBundle));
addCheck("settings UX avoids raw storage or export URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|export|package|compliance|storage|secret|runtime|admin)/i.test(uxBundle));
addCheck("settings UX avoids fake runnable admin actions", !/apply setting now|save setting now|toggle feature now|roll out now|run maintenance now|schedule maintenance now|export audit now|view raw logs now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(uxBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /admin settings mutation is enabled|feature toggles are enabled|feature rollout is enabled|maintenance execution is enabled|maintenance scheduling is enabled|runtime state mutation is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|audit export is enabled|raw log exposure is enabled|raw state exposure is enabled|credentials are handled|secret values are readable|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled/i));
addCheck("settings UX and docs avoid raw dumps", !hasUnsafePositiveClaim(`${uxBundle}\n${docsBundle}`, /raw JSON|raw logs|raw policy dump|raw admin payload|raw runtime payload|raw setting payload|raw feature payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Phase: P142.4",
        "- Adds the P142.4 Settings Command Center UX for admin operations and runtime settings.",
        "- Reuses the P142.2 read-only settings model and P142.3 non-runnable admin dry run.",
        "- Does not mutate settings, toggle or roll out features, execute or schedule maintenance, write DB/runtime state, expose raw logs or raw state, handle credentials, read secrets, export audits, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "View Model Exports", body: EXPECTED_EXPORTS.map((entry) => `- ${entry}`).join("\n") },
    {
      title: "Command Center Summary",
      body: [
        `- Settings rows: ${readiness.settingsRows.length}`,
        `- Feature gate rows: ${readiness.featureGateRows.length}`,
        `- Maintenance rows: ${readiness.maintenanceRows.length}`,
        `- Runtime state rows: ${readiness.runtimeStateRows.length}`,
        `- Audit surface rows: ${readiness.auditSurfaceRows.length}`,
        `- Dry-run rows: ${readiness.dryRunSummary.rowCount}`,
        `- Executable dry-run rows: ${readiness.dryRunSummary.executableRowCount}`,
        `- Cost impact: ${readiness.costImpact}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        p1425CurrentState ? "- P142.6 remains planned-only." : "- P142.5 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Known Limitations",
      body: p1425CurrentState
        ? "- P142.4 is display-only Command Center UX. It does not enable settings mutation, feature toggles, maintenance execution, runtime writes, audit export, provider/model calls, tool execution, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P142.5 has advanced through aggregate tests/checkers; P142.6 remains planned-only."
        : "- P142.4 is display-only Command Center UX. It does not enable settings mutation, feature toggles, maintenance execution, runtime writes, audit export, provider/model calls, tool execution, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P142.5 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} checks failed)` },
  ],
);

printCheckReport("P142.4 Admin Operations Runtime Settings Check", checks);

if (failed.length > 0) {
  process.exitCode = 1;
}
