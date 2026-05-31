import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS,
  BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE,
  BACKUP_RECOVERY_DR_RESTORE_PREVIEW_VERSION,
  buildBackupRecoveryDrRestorePreview,
  buildBackupRecoveryDrRestorePreviewEnvelope,
  buildBackupRecoveryDrRestorePreviewRow,
  validateBackupRecoveryDrRestorePreview,
  validateBackupRecoveryDrRestorePreviewRow,
} from "../shared/backupRecoveryDrRestorePreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1403-backup-recovery-dr-restore-preview-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json";
const PLAN_PATH = "docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md";
const REQUIRED_SCRIPT = "check:p1403-backup-recovery-dr-restore-preview";
const EXPECTED_BASE_COMMIT = "ae5402e3";
const EXPECTED_EXPORTS = [
  "BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE",
  "BACKUP_RECOVERY_DR_RESTORE_PREVIEW_VERSION",
  "BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS",
  "buildBackupRecoveryDrRestorePreviewRow",
  "validateBackupRecoveryDrRestorePreviewRow",
  "buildBackupRecoveryDrRestorePreview",
  "validateBackupRecoveryDrRestorePreview",
  "buildBackupRecoveryDrRestorePreviewEnvelope",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1403-backup-recovery-dr-restore-preview",
  "npm run check:p1402-backup-recovery-dr-retention",
  "npm run check:p1401-backup-recovery-dr-retention",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|closure)\b/i.test(context);
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
const p1403 = subphaseById.get("P140.3") || {};
const p1404 = subphaseById.get("P140.4") || {};
const p1405 = subphaseById.get("P140.5") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1403-backup-recovery-dr-restore-preview.js");
const helperSource = readText("shared/backupRecoveryDrRestorePreview.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P140.3";
const allowedFiles = new Set(p1403.allowedFiles || []);
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
const previewRow = buildBackupRecoveryDrRestorePreviewRow();
const preview = buildBackupRecoveryDrRestorePreview();
const rowValidation = validateBackupRecoveryDrRestorePreviewRow(previewRow);
const previewValidation = validateBackupRecoveryDrRestorePreview(preview);
const envelope = buildBackupRecoveryDrRestorePreviewEnvelope({ preview });
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const serializedPreview = JSON.stringify(preview);
const p1403CurrentState =
  status.currentPhase === "P140.3"
  && status.previousPhase === "P140.2"
  && status.nextPhase === "P140.4"
  && roadmap.currentPhase === "P140.3"
  && roadmap.previousPhase === "P140.2"
  && roadmap.nextPhase === "P140.4"
  && status.current?.phaseId === "P140.3"
  && status.previous?.phaseId === "P140.2"
  && status.next?.phaseId === "P140.4"
  && roadmap.current?.phaseId === "P140.3"
  && roadmap.previous?.phaseId === "P140.2"
  && roadmap.next?.phaseId === "P140.4"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && statusById.get("P140.2")?.status === "complete"
  && roadmapById.get("P140.2")?.status === "complete"
  && statusById.get("P140.3")?.status === "complete"
  && roadmapById.get("P140.3")?.status === "complete"
  && statusById.get("P140.4")?.status === "planned"
  && roadmapById.get("P140.4")?.status === "planned";
const p1404CurrentState =
  status.currentPhase === "P140.4"
  && status.previousPhase === "P140.3"
  && status.nextPhase === "P140.5"
  && roadmap.currentPhase === "P140.4"
  && roadmap.previousPhase === "P140.3"
  && roadmap.nextPhase === "P140.5"
  && status.current?.phaseId === "P140.4"
  && status.previous?.phaseId === "P140.3"
  && status.next?.phaseId === "P140.5"
  && roadmap.current?.phaseId === "P140.4"
  && roadmap.previous?.phaseId === "P140.3"
  && roadmap.next?.phaseId === "P140.5"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && statusById.get("P140.3")?.status === "complete"
  && roadmapById.get("P140.3")?.status === "complete"
  && statusById.get("P140.4")?.status === "complete"
  && roadmapById.get("P140.4")?.status === "complete"
  && statusById.get("P140.5")?.status === "planned"
  && roadmapById.get("P140.5")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1403-backup-recovery-dr-restore-preview.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("restore preview exports expected API", EXPECTED_EXPORTS.every((entry) => helperSource.includes(`export const ${entry}`) || helperSource.includes(`export function ${entry}`)));
addCheck("restore preview reuses P140.2 model and P75 restore preview", [
  "./backupRecoveryDrRetentionModel.js",
  "../backup-dr/p75-3-placeholder.js",
  "./modeGuard.js",
  "./redaction.js",
  "./resultEnvelope.js",
].every((target) => helperSource.includes(target)));
addCheck("restore preview helper has no writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb|createSqliteRuntimeBackup)\b/.test(helperSource));
addCheck("restore preview constants are correct", BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE === "P140.3" && BACKUP_RECOVERY_DR_RESTORE_PREVIEW_VERSION === "1.0");
addCheck("restore preview row validates", rowValidation.valid, rowValidation.errors.join("; "));
addCheck("restore preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("restore preview envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P140.3" && envelope.envelopeValid === true);
addCheck("restore preview rows are useful", preview.restorePreviewRows.length >= 2 && preview.previewSections.length >= 2 && preview.readinessSummary.rowCount === preview.restorePreviewRows.length);
addCheck("all restore preview authority flags remain blocked", BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS.every((flag) => preview[flag] === false && preview.safetyFlags?.[flag] === false && preview.restorePreviewRows.every((row) => row[flag] === false && row.safetyFlags?.[flag] === false)));
addCheck("restore preview keeps every row non-runnable", preview.restorePreviewRows.every((row) => row.executionState === "blocked" && row.approvalRequired === true && row.blockedOperations.length >= 8));
addCheck("restore preview cost remains zero-spend", preview.costImpact.estimatedUsd === 0 && preview.costImpact.actualUsd === 0 && preview.costImpact.providerSpendAllowed === false && preview.restorePreviewRows.every((row) => row.costImpact.actualUsd === 0));
addCheck("contract advances P140.3 safely", contract.phaseId === "P140" && contract.status === "in_progress" && ((contract.currentSubphase === "P140.3" && contract.previousSubphase === "P140.2" && contract.nextSubphase === "P140.4") || (contract.currentSubphase === "P140.4" && contract.previousSubphase === "P140.3" && contract.nextSubphase === "P140.5")));
addCheck("contract records expected base commit", p1403.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P140.3 complete and P140.4 handoff known", p1403.status === "complete" && ["planned", "complete"].includes(p1404.status) && p1403.nextPhase === "P140.4");
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1403.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1403.validationCommands?.includes(command)));
addCheck("contract scope stays restore-preview-only", /display-safe restore preview/i.test(p1403.dataShape || "") && p1403.forbiddenFiles?.includes("dashboard/src/**") && p1403.forbiddenFiles?.includes("db/**") && p1403.forbiddenFiles?.includes("projects/**"));
addCheck("P140.1 report passes", reportPassed("reports/p1401-backup-recovery-dr-retention-report.md"));
addCheck("P140.2 report passes", reportPassed("reports/p1402-backup-recovery-dr-retention-report.md"));
addCheck("enterprise checker accepts P140.3", enterpriseChecker.includes("p1403CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P140.4 handoff", osStatusChecker.includes('"P140.4"') && osStatusChecker.includes('"P140.5"'));
addCheck("P140 plan records P140.3", /## P140\.3 Restore Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P140.3", /P140\.3 restore preview/i.test(readme));
addCheck("platform roadmap records P140.3", /P140\.3 restore preview is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P140.3", /P140\.3 is now complete/i.test(enterpriseRoadmap) && (/P140\.4 is the next executable subphase/i.test(enterpriseRoadmap) || /P140\.4 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status keeps P140.3 complete", p1403CurrentState || p1404CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P140.3 entries have required fields", [statusById.get("P140"), statusById.get("P140.3"), roadmapById.get("P140"), roadmapById.get("P140.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P140.4 handoff remains valid", (p1403CurrentState && statusById.get("P140.4")?.status === "planned" && roadmapById.get("P140.4")?.status === "planned" && !(statusById.get("P140.4")?.checksRun || []).length && !(roadmapById.get("P140.4")?.checksRun || []).length) || (p1404CurrentState && p1404.status === "complete" && p1405.status === "planned"));
addCheck("changed files stay in P140.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P140.3 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme", "Backup DR route renders readiness without runnable recovery actions"].every((text) => routeTests.includes(text)));
addCheck("restore preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(`${serializedPreview}\n${docsBundle}`));
addCheck("restore preview avoids raw storage URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(backup|restore|storage|failover|runbook)/i.test(`${serializedPreview}\n${docsBundle}`));
addCheck("restore preview avoids fake runnable actions", !/backup now|create backup now|run backup now|restore now|execute restore now|failover now|delete backup now|prune now|write sqlite now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(`${serializedPreview}\n${docsBundle}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(backup creation is enabled|restore execution is enabled|failover is enabled|overwrite is enabled|delete is enabled|prune is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw backup payloads?|raw restore payloads?|raw storage locations?|raw registry dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds the P140.3 display-safe restore preview model.",
        "- Reuses the P140.2 backup/retention model, P75 restore preview contract, mode guard, redaction, and result envelope helpers.",
        "- Does not execute restores, perform failover, overwrite/delete/prune data, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Restore Preview Summary",
      body: [
        `- Restore preview rows: ${preview.restorePreviewRows.length}`,
        `- Preview sections: ${preview.previewSections.length}`,
        `- Blocked rows: ${preview.readinessSummary.blockedRowCount}`,
        `- Runnable actions: ${preview.readinessSummary.runnableActionCount}`,
        `- Source model phase: ${preview.sourceModelPhase}`,
        `- Cost impact: $${preview.costImpact.actualUsd}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        "- The next incomplete P140 subphase remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P140.3 is display-safe restore preview work only. It does not enable backup creation, restore execution, failover, overwrite, delete, prune, DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P140.3 Backup Recovery DR Restore Preview Report", phase: "P140.3" },
);

printCheckReport("P140.3 Backup Recovery DR Restore Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
