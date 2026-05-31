import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES,
  buildBackupRecoveryDrRetentionModel,
  validateBackupRecoveryDrRetentionModel,
} from "../shared/backupRecoveryDrRetentionModel.js";
import {
  BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS,
  buildBackupRecoveryDrRestorePreview,
  validateBackupRecoveryDrRestorePreview,
} from "../shared/backupRecoveryDrRestorePreview.js";
import { buildBackupDrReadinessViewModel } from "../dashboard/src/data/backupDrReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1405-backup-recovery-dr-tests-checkers-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json";
const PLAN_PATH = "docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md";
const REQUIRED_SCRIPT = "check:p1405-backup-recovery-dr-tests-checkers";
const EXPECTED_BASE_COMMIT = "2f3847d9";
const REQUIRED_P140_SCRIPTS = [
  "check:p1401-backup-recovery-dr-retention",
  "check:p1402-backup-recovery-dr-retention",
  "check:p1403-backup-recovery-dr-restore-preview",
  "check:p1404-backup-recovery-dr-command-center-ux",
  REQUIRED_SCRIPT,
];
const PRIOR_REPORTS = [
  "reports/p1401-backup-recovery-dr-retention-report.md",
  "reports/p1402-backup-recovery-dr-retention-report.md",
  "reports/p1403-backup-recovery-dr-restore-preview-report.md",
  "reports/p1404-backup-recovery-dr-command-center-ux-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1405-backup-recovery-dr-tests-checkers",
  "npm run check:p1404-backup-recovery-dr-command-center-ux",
  "npm run check:p1403-backup-recovery-dr-restore-preview",
  "npm run check:p1402-backup-recovery-dr-retention",
  "npm run check:p1401-backup-recovery-dr-retention",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P140.5\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Backup DR\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|coverage|tests?|ux|closure)\b/i.test(context);
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
const p1405 = subphaseById.get("P140.5") || {};
const p1406 = subphaseById.get("P140.6") || {};
const p1407 = subphaseById.get("P140.7") || {};
const checkerSource = readText("scripts/check-p1405-backup-recovery-dr-tests-checkers.js");
const p1404Checker = readText("scripts/check-p1404-backup-recovery-dr-command-center-ux.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P140.5";
const allowedFiles = new Set(p1405.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
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

const retentionModel = buildBackupRecoveryDrRetentionModel();
const retentionValidation = validateBackupRecoveryDrRetentionModel(retentionModel);
const restorePreview = buildBackupRecoveryDrRestorePreview({ sourceModel: retentionModel });
const restoreValidation = validateBackupRecoveryDrRestorePreview(restorePreview);
const readiness = buildBackupDrReadinessViewModel();
const aggregateDisplay = [
  JSON.stringify(retentionModel),
  JSON.stringify(restorePreview),
  readiness.whatChanged,
  readiness.currentState,
  readiness.nextAction,
  readiness.readinessCards.map((card) => `${card.label} ${card.value} ${card.detail}`).join(" "),
  readiness.restorePreviewRows.map((row) => `${row.label} ${row.source} ${row.scope} ${row.approval} ${row.state} ${row.blockedOperations.join(" ")} ${row.nextAction}`).join(" "),
  readiness.disabledActions.map((action) => `${action.label} ${action.reason}`).join(" "),
].join("\n");
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;

const p1405CurrentState =
  status.currentPhase === "P140.5"
  && status.previousPhase === "P140.4"
  && status.nextPhase === "P140.6"
  && roadmap.currentPhase === "P140.5"
  && roadmap.previousPhase === "P140.4"
  && roadmap.nextPhase === "P140.6"
  && status.current?.phaseId === "P140.5"
  && status.previous?.phaseId === "P140.4"
  && status.next?.phaseId === "P140.6"
  && roadmap.current?.phaseId === "P140.5"
  && roadmap.previous?.phaseId === "P140.4"
  && roadmap.next?.phaseId === "P140.6"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P140.6")?.status === "planned"
  && roadmapById.get("P140.6")?.status === "planned";
const p1406CurrentState =
  status.currentPhase === "P140.6"
  && status.previousPhase === "P140.5"
  && status.nextPhase === "P140.7"
  && roadmap.currentPhase === "P140.6"
  && roadmap.previousPhase === "P140.5"
  && roadmap.nextPhase === "P140.7"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P140.7")?.status === "planned"
  && roadmapById.get("P140.7")?.status === "planned";
const p1407FinalState =
  status.currentPhase === "P140.7"
  && status.previousPhase === "P140.6"
  && status.nextPhase === "P141"
  && roadmap.currentPhase === "P140.7"
  && roadmap.previousPhase === "P140.6"
  && roadmap.nextPhase === "P141"
  && status.current?.phaseId === "P140.7"
  && status.previous?.phaseId === "P140.6"
  && status.next?.phaseId === "P141"
  && roadmap.current?.phaseId === "P140.7"
  && roadmap.previous?.phaseId === "P140.6"
  && roadmap.next?.phaseId === "P141"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "planned"
  && roadmapById.get("P141")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1405-backup-recovery-dr-tests-checkers.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("checker reuses P140 models and UX projection", ["../shared/backupRecoveryDrRetentionModel.js", "../shared/backupRecoveryDrRestorePreview.js", "../dashboard/src/data/backupDrReadiness.js"].every((target) => checkerSource.includes(target)));
addCheck("P140.1-P140.5 package scripts registered", REQUIRED_P140_SCRIPTS.every((scriptName) => Boolean(packageJson.scripts?.[scriptName])));
addCheck("P140.1-P140.4 reports pass", PRIOR_REPORTS.every(reportPassed));
addCheck("retention model validates", retentionValidation.valid, retentionValidation.errors.join("; "));
addCheck("retention model has useful Backup DR records", retentionModel.backupRecords?.length >= 2 && retentionModel.retentionPolicies?.length >= 2 && retentionModel.restoreDrills?.length >= 2 && retentionModel.recoveryRunbooks?.length >= 2);
addCheck("retention model keeps every authority blocked", BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES.every((flag) => retentionModel[flag] === false && retentionModel.safetyFlags?.[flag] === false));
addCheck("retention model remains zero-spend", retentionModel.costImpact?.estimatedUsd === 0 && retentionModel.costImpact?.providerSpendAllowed === false);
addCheck("restore preview validates", restoreValidation.valid, restoreValidation.errors.join("; "));
addCheck("restore preview remains useful and non-runnable", restorePreview.restorePreviewRows?.length >= 2 && restorePreview.previewSections?.length >= 2 && restorePreview.readinessSummary?.runnableActionCount === 0);
addCheck("restore preview keeps every authority blocked", BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS.every((flag) => restorePreview[flag] === false && restorePreview.safetyFlags?.[flag] === false));
addCheck("Backup DR view model remains useful", readiness.restorePreviewRows?.length >= 2 && readiness.restorePreviewSections?.length >= 2 && readiness.restorePreviewSummary?.runnableActionCount === 0 && readiness.disabledActions?.some((action) => action.label === "Prune retention"));
addCheck("Backup DR view model keeps all safety flags false", Object.values(readiness.safety || {}).every((value) => value === false));
addCheck("P140.5 Playwright coverage exists", routeTests.includes("P140.5 Backup DR aggregate coverage remains display-only") && routeTests.includes("Restore Preview Summary") && routeTests.includes("Prune retention disabled") && routeTests.includes("restore-preview-row"));
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "Use system theme", "Use dark theme", "Use light theme", "sidebar"].every((text) => routeTests.includes(text)));
addCheck("P140.4 checker accepts P140.5 handoff", p1404Checker.includes("p1405CurrentState") && p1404Checker.includes(REQUIRED_SCRIPT));
addCheck("P140.5 checker accepts P140.6 docs checker", checkerSource.includes("p1406CurrentState") && checkerSource.includes("check:p1406-backup-recovery-dr-docs-roadmap"));
addCheck("enterprise checker accepts P140.5", enterpriseChecker.includes("p1405CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P140.6 handoff", osStatusChecker.includes('"P140.6"') && osStatusChecker.includes('"P140.7"') && osStatusChecker.includes('"P141"'));
addCheck("contract marks P140.5 complete", contract.phaseId === "P140" && p1405.status === "complete" && ((contract.status === "in_progress" && contract.currentSubphase === "P140.5" && contract.previousSubphase === "P140.4" && contract.nextSubphase === "P140.6" && p1406.status === "planned") || (contract.status === "in_progress" && p1406CurrentState && contract.currentSubphase === "P140.6" && p1406.status === "complete") || (contract.status === "complete" && p1407FinalState && contract.currentSubphase === "P140.7" && p1407.status === "complete")));
addCheck("contract records expected base commit", p1405.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1405.validationCommands?.includes(command)));
addCheck("contract scope stays validation-only", /validation|tests|checkers/i.test(p1405.dataShape || "") && p1405.expectedExports?.length === 0 && p1405.forbiddenFiles?.includes("dashboard/src/**") && p1405.forbiddenFiles?.includes("projects/**"));
addCheck("docs record P140.5", /## P140\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan) && /P140\.5 tests\/checkers/i.test(readme) && /P140\.5 tests\/checkers is complete/i.test(platformRoadmap) && /P140\.5 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P140.5", p1405CurrentState || p1406CurrentState || p1407FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P140.5 entries have required fields", [statusById.get("P140"), statusById.get("P140.5"), roadmapById.get("P140"), roadmapById.get("P140.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P140.6 handoff remains valid", (p1405CurrentState && statusById.get("P140.6")?.status === "planned" && roadmapById.get("P140.6")?.status === "planned" && !(statusById.get("P140.6")?.checksRun || []).length && !(roadmapById.get("P140.6")?.checksRun || []).length) || p1406CurrentState || p1407FinalState);
addCheck("changed files stay in P140.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P140.5 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("aggregate display avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(aggregateDisplay));
addCheck("aggregate display avoids raw dumps and storage URLs", !/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|s3:\/\/|gs:\/\/|az:\/\/|raw JSON|raw logs|raw policy dump|raw backup payload|raw restore payload/i.test(aggregateDisplay));
addCheck("aggregate display avoids fake runnable actions", !/backup now|create backup now|run backup now|restore now|execute restore now|failover now|overwrite now|delete now|prune now|write sqlite now|call provider now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(aggregateDisplay));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/backup now|create backup now|run backup now|restore now|execute restore now|failover now|overwrite now|delete now|prune now|write sqlite now|call provider now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(backup creation is enabled|restore execution is enabled|failover is enabled|overwrite is enabled|delete is enabled|prune is enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw backup payloads?|raw restore payloads?|raw storage locations?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P140.1-P140.4 validation across contracts, reports, model, restore preview, Backup / DR UX projection, route coverage, docs, roadmap, and OS phase status.",
        "- Confirms the Backup / DR model, restore preview, and Command Center projection remain display-safe, zero-spend, and non-runnable.",
        "- Does not change Backup / DR source UX, create backups, execute restore/failover, prune/delete/overwrite data, write DB/runtime state, call providers/models, execute tools, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Aggregate Coverage",
      body: [
        `- Backup records: ${retentionModel.backupRecords?.length || 0}`,
        `- Restore preview rows: ${restorePreview.restorePreviewRows?.length || 0}`,
        `- Restore UX rows: ${readiness.restorePreviewRows?.length || 0}`,
        `- Runnable actions: ${readiness.restorePreviewSummary?.runnableActionCount}`,
        `- Disabled actions: ${readiness.disabledActions?.length || 0}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        p1406CurrentState ? "- P140.6 is complete; P140.7 remains planned-only." : "- P140.6 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P140.5 is aggregate tests/checkers work only. It does not enable backup creation, restore execution, failover, overwrite, delete, prune, DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P140.5 Backup Recovery DR Tests Checkers Report", phase: "P140.5" },
);

printCheckReport("P140.5 Backup Recovery DR Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
