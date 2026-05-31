import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  BACKUP_RECOVERY_DR_RETENTION_PHASE,
  BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES,
  BACKUP_RECOVERY_DR_RETENTION_VERSION,
  buildBackupRecoveryDrRetentionBackupRecord,
  buildBackupRecoveryDrRetentionEnvelope,
  buildBackupRecoveryDrRetentionModel,
  buildBackupRecoveryDrRetentionPolicy,
  validateBackupRecoveryDrRetentionBackupRecord,
  validateBackupRecoveryDrRetentionModel,
  validateBackupRecoveryDrRetentionPolicy,
} from "../shared/backupRecoveryDrRetentionModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1402-backup-recovery-dr-retention-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json";
const PLAN_PATH = "docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md";
const REQUIRED_SCRIPT = "check:p1402-backup-recovery-dr-retention";
const EXPECTED_BASE_COMMIT = "81a5dce4";
const EXPECTED_EXPORTS = [
  "BACKUP_RECOVERY_DR_RETENTION_PHASE",
  "BACKUP_RECOVERY_DR_RETENTION_VERSION",
  "BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES",
  "buildBackupRecoveryDrRetentionBackupRecord",
  "validateBackupRecoveryDrRetentionBackupRecord",
  "buildBackupRecoveryDrRetentionPolicy",
  "validateBackupRecoveryDrRetentionPolicy",
  "buildBackupRecoveryDrRetentionModel",
  "validateBackupRecoveryDrRetentionModel",
  "buildBackupRecoveryDrRetentionEnvelope",
];
const VALIDATION_COMMANDS = [
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
const p1402 = subphaseById.get("P140.2") || {};
const p1403 = subphaseById.get("P140.3") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1402-backup-recovery-dr-retention.js");
const modelSource = readText("shared/backupRecoveryDrRetentionModel.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P140.2";
const allowedFiles = new Set(p1402.allowedFiles || []);
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
const backupRecord = buildBackupRecoveryDrRetentionBackupRecord({
  createdAt: "2026-05-31T01:24:00.000Z",
});
const retentionPolicy = buildBackupRecoveryDrRetentionPolicy({
  createdAt: "2026-05-31T01:24:00.000Z",
  retentionClass: "final_validation",
});
const model = buildBackupRecoveryDrRetentionModel({
  createdAt: "2026-05-31T01:24:00.000Z",
});
const backupRecordValidation = validateBackupRecoveryDrRetentionBackupRecord(backupRecord);
const retentionPolicyValidation = validateBackupRecoveryDrRetentionPolicy(retentionPolicy);
const modelValidation = validateBackupRecoveryDrRetentionModel(model);
const envelope = buildBackupRecoveryDrRetentionEnvelope({ model });
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1402CurrentState =
  status.currentPhase === "P140.2"
  && status.previousPhase === "P140.1"
  && status.nextPhase === "P140.3"
  && roadmap.currentPhase === "P140.2"
  && roadmap.previousPhase === "P140.1"
  && roadmap.nextPhase === "P140.3"
  && status.current?.phaseId === "P140.2"
  && status.previous?.phaseId === "P140.1"
  && status.next?.phaseId === "P140.3"
  && roadmap.current?.phaseId === "P140.2"
  && roadmap.previous?.phaseId === "P140.1"
  && roadmap.next?.phaseId === "P140.3"
  && statusById.get("P139")?.status === "complete"
  && roadmapById.get("P139")?.status === "complete"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && statusById.get("P140.1")?.status === "complete"
  && roadmapById.get("P140.1")?.status === "complete"
  && statusById.get("P140.2")?.status === "complete"
  && roadmapById.get("P140.2")?.status === "complete"
  && statusById.get("P140.3")?.status === "planned"
  && roadmapById.get("P140.3")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1402-backup-recovery-dr-retention.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("model exports expected API", EXPECTED_EXPORTS.every((entry) => modelSource.includes(`export const ${entry}`) || modelSource.includes(`export function ${entry}`)));
addCheck("model reuses existing safety helpers and Backup DR prior art", [
  "../backup-dr/p75-2-placeholder.js",
  "../backup-dr/p75-3-placeholder.js",
  "../backup-dr/p75-4-placeholder.js",
  "../ai-recovery/retentionPolicy.js",
  "./modeGuard.js",
  "./redaction.js",
  "./resultEnvelope.js",
].every((target) => modelSource.includes(target)));
addCheck("model does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb|createSqliteRuntimeBackup)\b/.test(modelSource));
addCheck("model constants are correct", BACKUP_RECOVERY_DR_RETENTION_PHASE === "P140.2" && BACKUP_RECOVERY_DR_RETENTION_VERSION === "1.0");
addCheck("backup record validator passes", backupRecordValidation.valid, backupRecordValidation.errors.join("; "));
addCheck("retention policy validator passes", retentionPolicyValidation.valid, retentionPolicyValidation.errors.join("; "));
addCheck("backup recovery model validator passes", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("result envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P140.2" && envelope.envelopeValid === true);
addCheck("model has useful reliability records", model.backupRecords.length >= 2 && model.retentionPolicies.length >= 2 && model.restoreDrills.length === model.backupRecords.length && model.recoveryRunbooks.length === model.restoreDrills.length);
addCheck("all authority flags remain blocked", BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false));
addCheck("restore and runbook outputs remain non-runnable", model.restoreDrills.every((drill) => drill.restoreExecutionAllowed === false && drill.failoverAllowed === false && drill.overwriteAllowed === false && drill.deleteAllowed === false) && model.recoveryRunbooks.every((runbook) => runbook.failoverAllowed === false && runbook.restoreExecutionAllowed === false && runbook.approvalRequired === true));
addCheck("cost model remains zero-spend", model.costImpact.estimatedUsd === 0 && model.costImpact.actualUsd === 0 && model.costImpact.providerSpendAllowed === false);
addCheck("contract advances P140.2 safely", contract.phaseId === "P140" && contract.status === "in_progress" && contract.currentSubphase === "P140.2" && contract.previousSubphase === "P140.1" && contract.nextSubphase === "P140.3");
addCheck("contract records expected base commit", contract.expectedBaseCommit === "43c5dbc2" && p1402.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P140.2 complete and P140.3 handoff known", p1402.status === "complete" && p1403.status === "planned" && p1402.nextPhase === "P140.3");
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1402.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1402.validationCommands?.includes(command)));
addCheck("contract scope stays model-only", /read-only backup and retention model/i.test(p1402.dataShape || "") && p1402.forbiddenFiles?.includes("dashboard/src/**") && p1402.forbiddenFiles?.includes("db/**") && p1402.forbiddenFiles?.includes("projects/**"));
addCheck("P140.1 report passes", reportPassed("reports/p1401-backup-recovery-dr-retention-report.md"));
addCheck("enterprise checker accepts P140.2", enterpriseChecker.includes("p1402CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P140.3 handoff", osStatusChecker.includes('"P140.3"'));
addCheck("P140 plan records P140.2", /## P140\.2 Backup and Retention Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P140.2", /P140\.2 backup and retention model/i.test(readme));
addCheck("platform roadmap records P140.2", /P140\.2 backup and retention model is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P140.2", /P140\.2 is now complete/i.test(enterpriseRoadmap) && /P140\.3 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status keeps P140.2 complete", p1402CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P140.2 entries have required fields", [statusById.get("P140"), statusById.get("P140.2"), roadmapById.get("P140"), roadmapById.get("P140.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P140.3 handoff remains planned-only", statusById.get("P140.3")?.status === "planned" && roadmapById.get("P140.3")?.status === "planned" && !(statusById.get("P140.3")?.checksRun || []).length && !(roadmapById.get("P140.3")?.checksRun || []).length);
addCheck("changed files stay in P140.2 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P140.2 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme", "Backup DR route renders readiness without runnable recovery actions"].every((text) => routeTests.includes(text)));
addCheck("model and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(`${JSON.stringify(model)}\n${docsBundle}`));
addCheck("model and docs avoid raw storage URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(backup|restore|storage|failover|runbook)/i.test(`${JSON.stringify(model)}\n${docsBundle}`));
addCheck("docs avoid fake runnable actions", !/backup now|create backup now|run backup now|restore now|execute restore now|failover now|delete backup now|prune now|write sqlite now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(backup creation is enabled|restore execution is enabled|failover is enabled|overwrite is enabled|delete is enabled|prune is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw backup payloads?|raw restore payloads?|raw storage locations?|raw registry dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds the P140.2 read-only backup and retention model.",
        "- Reuses existing Backup / DR preview contracts, retention policy helpers, mode guard, redaction, and result envelope helpers.",
        "- Does not create backups, execute restores, perform failover, prune/delete data, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Model Summary",
      body: [
        `- Backup records: ${model.backupRecords.length}`,
        `- Retention policies: ${model.retentionPolicies.length}`,
        `- Restore drills: ${model.restoreDrills.length}`,
        `- Recovery runbooks: ${model.recoveryRunbooks.length}`,
        `- Runnable actions: ${model.readinessSummary.runnableActionCount}`,
        `- Cost impact: $${model.costImpact.actualUsd}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        "- P140.3 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P140.2 is read-only model work. It does not enable backup creation, restore execution, failover, overwrite, delete, prune, DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P140.2 Backup Recovery DR Retention Report", phase: "P140.2" },
);

printCheckReport("P140.2 Backup Recovery DR Retention Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
