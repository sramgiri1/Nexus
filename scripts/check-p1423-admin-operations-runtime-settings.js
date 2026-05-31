import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE,
  ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_SAFETY_FLAG_NAMES,
  ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_VERSION,
  buildAdminOperationDryRunRow,
  buildAdminOperationsRuntimeSettingsDryRun,
  buildAdminOperationsRuntimeSettingsDryRunEnvelope,
  validateAdminOperationDryRunRow,
  validateAdminOperationsRuntimeSettingsDryRun,
} from "../shared/adminOperationsRuntimeSettingsDryRun.js";
import { buildAdminOperationsRuntimeSettingsModel } from "../shared/adminOperationsRuntimeSettingsModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1423-admin-operations-runtime-settings-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json";
const PLAN_PATH = "docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1423-admin-operations-runtime-settings";
const EXPECTED_BASE_COMMIT = "11bd52f5";
const EXPECTED_EXPORTS = [
  "ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE",
  "ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_VERSION",
  "ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_SAFETY_FLAG_NAMES",
  "buildAdminOperationDryRunRow",
  "validateAdminOperationDryRunRow",
  "buildAdminOperationsRuntimeSettingsDryRun",
  "validateAdminOperationsRuntimeSettingsDryRun",
  "buildAdminOperationsRuntimeSettingsDryRunEnvelope",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1423-admin-operations-runtime-settings",
  "npm run check:p1422-admin-operations-runtime-settings",
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
const checkerSource = readText("scripts/check-p1423-admin-operations-runtime-settings.js");
const p1422Checker = readText("scripts/check-p1422-admin-operations-runtime-settings.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const dryRunSource = readText("shared/adminOperationsRuntimeSettingsDryRun.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P142.3";
const allowedFiles = new Set(p1423.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
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
const sourceModel = buildAdminOperationsRuntimeSettingsModel({ createdAt: "2026-05-31T12:10:00.000Z" });
const row = buildAdminOperationDryRunRow({ category: "setting", sourceItem: sourceModel.settings[0], index: 0 });
const rowValidation = validateAdminOperationDryRunRow(row);
const dryRun = buildAdminOperationsRuntimeSettingsDryRun({ sourceModel });
const dryRunValidation = validateAdminOperationsRuntimeSettingsDryRun(dryRun);
const envelope = buildAdminOperationsRuntimeSettingsDryRunEnvelope({ sourceModel });
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const dryRunAndDocs = `${JSON.stringify(dryRun)}\n${docsBundle}`;
const p1423CurrentState =
  status.currentPhase === "P142.3"
  && status.previousPhase === "P142.2"
  && status.nextPhase === "P142.4"
  && roadmap.currentPhase === "P142.3"
  && roadmap.previousPhase === "P142.2"
  && roadmap.nextPhase === "P142.4"
  && status.current?.phaseId === "P142.3"
  && status.previous?.phaseId === "P142.2"
  && status.next?.phaseId === "P142.4"
  && roadmap.current?.phaseId === "P142.3"
  && roadmap.previous?.phaseId === "P142.2"
  && roadmap.next?.phaseId === "P142.4"
  && statusById.get("P142")?.status === "in_progress"
  && roadmapById.get("P142")?.status === "in_progress"
  && statusById.get("P142.1")?.status === "complete"
  && roadmapById.get("P142.1")?.status === "complete"
  && statusById.get("P142.2")?.status === "complete"
  && roadmapById.get("P142.2")?.status === "complete"
  && statusById.get("P142.3")?.status === "complete"
  && roadmapById.get("P142.3")?.status === "complete"
  && statusById.get("P142.4")?.status === "planned"
  && roadmapById.get("P142.4")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && roadmapById.get("P143")?.status === "planned";
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
const p1423OrLaterState = p1423CurrentState || p1424CurrentState;

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1423-admin-operations-runtime-settings.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("dry run exports expected API", EXPECTED_EXPORTS.every((entry) => dryRunSource.includes(`export const ${entry}`) || dryRunSource.includes(`export function ${entry}`)));
addCheck("dry run reuses P142.2 model, redaction, and result envelope helpers", ["./adminOperationsRuntimeSettingsModel.js", "./redaction.js", "./resultEnvelope.js"].every((target) => dryRunSource.includes(target)));
addCheck("dry run source does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb)\b/.test(dryRunSource));
addCheck("dry run constants are correct", ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_PHASE === "P142.3" && ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_VERSION === "1.0" && ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_SAFETY_FLAG_NAMES.length >= 25);
addCheck("dry-run row validator passes", rowValidation.valid, rowValidation.errors.join("; "));
addCheck("dry run validator passes", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("result envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P142.3" && envelope.envelopeValid === true);
addCheck("dry run is local-only and hidden from direct Command Center rendering", dryRun.dryRunOnly === true && dryRun.nonRunnable === true && dryRun.localOnly === true && dryRun.commandCenterVisible === false);
addCheck("dry run covers model rows", dryRun.dryRunRowCount >= 10 && dryRun.blockedDryRunRowCount === dryRun.dryRunRowCount && dryRun.executableDryRunRowCount === 0);
addCheck("all candidate counts remain zero", Object.values(dryRun.candidateCounts || {}).every((value) => value === 0));
addCheck("payloads and executable command remain null", ["settingMutationPayload", "featureTogglePayload", "maintenanceExecutionPayload", "runtimeWritePayload", "auditExportPayload", "executableCommand"].every((field) => dryRun[field] === null));
addCheck("all dry-run authority flags remain blocked", ADMIN_OPERATIONS_RUNTIME_SETTINGS_DRY_RUN_SAFETY_FLAG_NAMES.every((flag) => dryRun[flag] === false && dryRun.safetyFlags?.[flag] === false));
addCheck("cost impact remains zero-spend", dryRun.costImpact.estimatedUsd === 0 && dryRun.costImpact.actualUsd === 0 && dryRun.costImpact.providerSpendAllowed === false && dryRun.costImpact.networkCallsAllowed === false);
addCheck("P142.2 report passes", reportPassed("reports/p1422-admin-operations-runtime-settings-report.md"));
addCheck("contract advances through P142.3 safely", contract.phaseId === "P142" && contract.status === "in_progress" && p1421.status === "complete" && p1422.status === "complete" && p1423.status === "complete" && ((contract.currentSubphase === "P142.3" && contract.previousSubphase === "P142.2" && contract.nextSubphase === "P142.4" && p1424.status === "planned") || (contract.currentSubphase === "P142.4" && contract.previousSubphase === "P142.3" && contract.nextSubphase === "P142.5" && p1424.status === "complete")));
addCheck("contract records expected base commit", p1423.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1423.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1423.validationCommands?.includes(command)));
addCheck("contract scope stays dry-run only", /non-runnable admin operations dry run/i.test(p1423.dataShape || "") && p1423.forbiddenFiles?.includes("dashboard/src/**") && p1423.forbiddenFiles?.includes("db/**") && p1423.forbiddenFiles?.includes("projects/**"));
addCheck("P142.2 checker accepts P142.3 handoff", p1422Checker.includes("p1423CurrentState") && p1422Checker.includes('status.currentPhase === "P142.3"'));
addCheck("enterprise checker accepts P142.3 active state", enterpriseChecker.includes("p1423CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P142.4 handoff", osStatusChecker.includes('"P142.4"') && osStatusChecker.includes('"P142.7"'));
addCheck("docs record P142.3 and later handoff", /## P142\.3 Admin Dry Run[\s\S]*Status:\s+complete/.test(plan) && /P142\.3 admin operations dry run/i.test(readme) && /P142\.3 admin operations dry run is complete/i.test(platformRoadmap) && /P142\.3 is now complete/i.test(enterpriseRoadmap) && (/P142\.4 is planned-only next/i.test(enterpriseRoadmap) || /P142\.4 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances through P142.3", p1423OrLaterState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P142.3 entries have required fields", [statusById.get("P142"), statusById.get("P142.3"), roadmapById.get("P142"), roadmapById.get("P142.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("next P142/P143 handoff remains planned-only", p1423CurrentState
  ? [statusById.get("P142.4"), roadmapById.get("P142.4"), statusById.get("P143"), roadmapById.get("P143")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)
  : [statusById.get("P142.5"), roadmapById.get("P142.5"), statusById.get("P143"), roadmapById.get("P143")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("changed files stay in P142.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("dry run and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(dryRunAndDocs));
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
        "- Adds the P142.3 non-runnable admin operations dry run.",
        "- Reuses the P142.2 read-only settings model, redaction helper, and result envelope helper.",
        "- Does not mutate settings, toggle or roll out features, execute or schedule maintenance, write DB/runtime state, expose raw logs or raw state, handle credentials, read secrets, export audits, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Dry Run Exports", body: EXPECTED_EXPORTS.map((entry) => `- ${entry}`).join("\n") },
    {
      title: "Dry Run Summary",
      body: [
        `- Dry-run rows: ${dryRun.dryRunRowCount}`,
        `- Blocked rows: ${dryRun.blockedDryRunRowCount}`,
        `- Executable rows: ${dryRun.executableDryRunRowCount}`,
        `- Candidate count total: ${Object.values(dryRun.candidateCounts).reduce((sum, value) => sum + value, 0)}`,
        `- Estimated spend: ${dryRun.costImpact.estimatedUsd}`,
        `- Actual spend: ${dryRun.costImpact.actualUsd}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        p1424CurrentState ? "- P142.5 remains planned-only." : "- P142.4 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: p1424CurrentState
        ? "- P142.3 is non-runnable dry-run work only. It does not mutate settings, toggle or roll out features, execute or schedule maintenance, mutate runtime state, write DB/runtime records, export audits, expose raw logs or raw state, handle credentials, read secrets, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P142.4 has advanced through display-only Settings UX; P142.5 remains planned-only."
        : "- P142.3 is non-runnable dry-run work only. It does not render new Command Center UI, mutate settings, toggle or roll out features, execute or schedule maintenance, mutate runtime state, write DB/runtime records, export audits, expose raw logs or raw state, handle credentials, read secrets, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P142.4 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P142.3 Admin Operations Runtime Settings Report", phase: "P142.3" },
);

printCheckReport("P142.3 Admin Operations Runtime Settings Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
