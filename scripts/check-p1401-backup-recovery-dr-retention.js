import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1401-backup-recovery-dr-retention-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json";
const PLAN_PATH = "docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md";
const REQUIRED_SCRIPT = "check:p1401-backup-recovery-dr-retention";
const EXPECTED_BASE_COMMIT = "43c5dbc2";
const VALIDATION_COMMANDS = [
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
const BACKUP_RECORD_FIELDS = [
  "backupRef",
  "sourceScope",
  "sourceSurface",
  "retentionClass",
  "recoveryObjective",
  "evidenceRefs",
  "auditRefs",
  "activityRefs",
  "redactionState",
  "policyDecision",
  "disabledReason",
  "ownerCapability",
  "createdAt",
];
const RETENTION_POLICY_FIELDS = [
  "retentionClass",
  "retentionWindowDays",
  "legalHoldState",
  "pruneAllowed",
  "deleteAllowed",
  "exportAllowed",
  "evidenceRefs",
  "disabledReason",
];
const RESTORE_DRILL_FIELDS = [
  "drillRef",
  "backupRef",
  "restoreScope",
  "approvalState",
  "restoreExecutionAllowed",
  "failoverAllowed",
  "overwriteAllowed",
  "evidenceRefs",
  "disabledReason",
];
const RECOVERY_RUNBOOK_FIELDS = [
  "runbookRef",
  "recoveryMode",
  "recoveryObjective",
  "safetyGateState",
  "approvalRequired",
  "ownerCapability",
  "blockers",
  "evidenceRefs",
  "nextAction",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|closure)\b/i.test(context);
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
const p1401 = subphaseById.get("P140.1") || {};
const p1402 = subphaseById.get("P140.2") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1401-backup-recovery-dr-retention.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const backupDrData = readText("dashboard/src/data/backupDrReadiness.js");
const backupDrChecker = readText("scripts/check-p755-command-center-backup-dr-ux.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P140.1";
const allowedFiles = new Set(p1401.allowedFiles || []);
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
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1401CurrentState =
  status.currentPhase === "P140.1"
  && status.previousPhase === "P139.7"
  && status.nextPhase === "P140.2"
  && roadmap.currentPhase === "P140.1"
  && roadmap.previousPhase === "P139.7"
  && roadmap.nextPhase === "P140.2"
  && status.current?.phaseId === "P140.1"
  && status.previous?.phaseId === "P139.7"
  && status.next?.phaseId === "P140.2"
  && roadmap.current?.phaseId === "P140.1"
  && roadmap.previous?.phaseId === "P139.7"
  && roadmap.next?.phaseId === "P140.2"
  && statusById.get("P139")?.status === "complete"
  && roadmapById.get("P139")?.status === "complete"
  && statusById.get("P139.7")?.status === "complete"
  && roadmapById.get("P139.7")?.status === "complete"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && statusById.get("P140.1")?.status === "complete"
  && roadmapById.get("P140.1")?.status === "complete"
  && statusById.get("P140.2")?.status === "planned"
  && roadmapById.get("P140.2")?.status === "planned";
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
const p1401OrLaterState = p1401CurrentState || p1402CurrentState;

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1401-backup-recovery-dr-retention.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract starts P140 safely", contract.phaseId === "P140" && contract.status === "in_progress" && ((contract.currentSubphase === "P140.1" && contract.previousSubphase === "P139.7" && contract.nextSubphase === "P140.2") || (contract.currentSubphase === "P140.2" && contract.previousSubphase === "P140.1" && contract.nextSubphase === "P140.3")));
addCheck("contract records expected base commit", contract.expectedBaseCommit === EXPECTED_BASE_COMMIT && p1401.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract has seven implementation-grade subphases", (contract.subphases || []).length === 7 && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => subphaseById.has(phaseId)));
addCheck("P140.1 complete and P140.2 handoff known", p1401.status === "complete" && ["planned", "complete"].includes(p1402.status) && p1401.nextPhase === "P140.2" && p1402.previousPhase === "P140.1");
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1401.validationCommands?.includes(command)));
addCheck("backup record shape is display-safe and complete", BACKUP_RECORD_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(contract.backupRecordShape || {}, field)));
addCheck("retention policy shape is display-safe and non-runnable", RETENTION_POLICY_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(contract.retentionPolicyShape || {}, field)) && contract.retentionPolicyShape?.pruneAllowed === false && contract.retentionPolicyShape?.deleteAllowed === false && contract.retentionPolicyShape?.exportAllowed === false);
addCheck("restore drill shape is display-safe and non-runnable", RESTORE_DRILL_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(contract.restoreDrillShape || {}, field)) && contract.restoreDrillShape?.restoreExecutionAllowed === false && contract.restoreDrillShape?.failoverAllowed === false && contract.restoreDrillShape?.overwriteAllowed === false);
addCheck("recovery runbook shape is display-safe and gated", RECOVERY_RUNBOOK_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(contract.recoveryRunbookShape || {}, field)) && contract.recoveryRunbookShape?.approvalRequired === true && /blocked/.test(contract.recoveryRunbookShape?.safetyGateState || ""));
addCheck("all authority flags remain blocked", Object.values(contract.authorityFlags || {}).every((value) => value === false));
addCheck("contract reuses existing helpers and Backup DR prior art", [
  "shared/reportWriter.js",
  "shared/checkResultFormatter.js",
  "shared/resultEnvelope.js",
  "shared/modeGuard.js",
  "shared/redaction.js",
  "backup-dr/p75-2-placeholder.js",
  "backup-dr/p75-3-placeholder.js",
  "backup-dr/p75-4-placeholder.js",
  "dashboard/src/data/backupDrReadiness.js",
  "ai-recovery/retentionPolicy.js",
  "scripts/db-sqlite-backup.js",
].every((target) => contract.reuseTargets?.includes(target)));
addCheck("contract scope stays contract-only", p1401.expectedExports?.length === 0 && /Contract-only/.test(p1401.dataShape || "") && p1401.forbiddenFiles?.includes("dashboard/src/**") && p1401.forbiddenFiles?.includes("projects/**"));
addCheck("P139.7 report passes", reportPassed("reports/p1397-evidence-audit-observability-cost-ledger-report.md"));
addCheck("enterprise checker accepts P140.1", enterpriseChecker.includes("p1401StartedState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P140 handoff", osStatusChecker.includes('"P140.1"') && osStatusChecker.includes('"P140.2"'));
addCheck("P140 plan records P140.1", /## P140\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P140.1", /P140\.1 backup, recovery, DR, and retention contract/i.test(readme));
addCheck("platform roadmap records P140.1", /P140\.1 backup, recovery, DR, and retention contract is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P140.1", /P140\.1 is now complete/i.test(enterpriseRoadmap) && (/P140\.2 is the next executable subphase/i.test(enterpriseRoadmap) || /P140\.2 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status keeps P140.1 complete", p1401OrLaterState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P140.1 entries have required fields", [statusById.get("P140"), statusById.get("P140.1"), roadmapById.get("P140"), roadmapById.get("P140.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P140.2 handoff remains valid", (p1401CurrentState && statusById.get("P140.2")?.status === "planned" && roadmapById.get("P140.2")?.status === "planned" && !(statusById.get("P140.2")?.checksRun || []).length && !(roadmapById.get("P140.2")?.checksRun || []).length) || (p1402CurrentState && statusById.get("P140.2")?.status === "complete" && roadmapById.get("P140.2")?.status === "complete" && statusById.get("P140.3")?.status === "planned" && roadmapById.get("P140.3")?.status === "planned"));
addCheck("changed files stay in P140.1 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P140.1 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("existing Backup DR UX remains display-only", /backup creation, restore execution, failover/.test(backupDrData) && backupDrData.includes("Backup/DR readiness is display-only") && backupDrChecker.includes("backup restore failover disabled"));
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme", "Backup DR route renders readiness without runnable recovery actions"].every((text) => routeTests.includes(text)));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(backup|restore|storage|failover|runbook)/i.test(docsBundle));
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
        "- Starts P140 with an enterprise backup, recovery, disaster recovery, and retention contract.",
        "- Defines future display-safe backup record, retention policy, restore drill, and recovery runbook shapes.",
        "- Does not create backups, execute restores, perform failover, prune/delete data, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Contract Shapes",
      body: [
        `- backupRecordShape: ${BACKUP_RECORD_FIELDS.join(", ")}`,
        `- retentionPolicyShape: ${RETENTION_POLICY_FIELDS.join(", ")}`,
        `- restoreDrillShape: ${RESTORE_DRILL_FIELDS.join(", ")}`,
        `- recoveryRunbookShape: ${RECOVERY_RUNBOOK_FIELDS.join(", ")}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        "- P140.2 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P140.1 is contract/status/checker/docs only. It does not enable backup creation, restore execution, failover, overwrite, delete, prune, DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P140.1 Backup Recovery DR Retention Report", phase: "P140.1" },
);

printCheckReport("P140.1 Backup Recovery DR Retention Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
