import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE,
  ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES,
  ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION,
  buildAdminAuditSurface,
  buildAdminFeatureGate,
  buildAdminMaintenanceControl,
  buildAdminOperationsRuntimeSettingsEnvelope,
  buildAdminOperationsRuntimeSettingsModel,
  buildAdminSettingsPolicy,
  buildRuntimeOperationalState,
  validateAdminAuditSurface,
  validateAdminFeatureGate,
  validateAdminMaintenanceControl,
  validateAdminOperationsRuntimeSettingsModel,
  validateAdminSettingsPolicy,
  validateRuntimeOperationalState,
} from "../shared/adminOperationsRuntimeSettingsModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1422-admin-operations-runtime-settings-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json";
const PLAN_PATH = "docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1422-admin-operations-runtime-settings";
const EXPECTED_BASE_COMMIT = "c471aacb";
const EXPECTED_EXPORTS = [
  "ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE",
  "ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION",
  "ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES",
  "buildAdminSettingsPolicy",
  "validateAdminSettingsPolicy",
  "buildAdminFeatureGate",
  "validateAdminFeatureGate",
  "buildAdminMaintenanceControl",
  "validateAdminMaintenanceControl",
  "buildRuntimeOperationalState",
  "validateRuntimeOperationalState",
  "buildAdminAuditSurface",
  "validateAdminAuditSurface",
  "buildAdminOperationsRuntimeSettingsModel",
  "validateAdminOperationsRuntimeSettingsModel",
  "buildAdminOperationsRuntimeSettingsEnvelope",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1422-admin-operations-runtime-settings",
  "npm run check:p1421-admin-operations-runtime-settings",
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
const checkerSource = readText("scripts/check-p1422-admin-operations-runtime-settings.js");
const p1421Checker = readText("scripts/check-p1421-admin-operations-runtime-settings.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const modelSource = readText("shared/adminOperationsRuntimeSettingsModel.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P142.2";
const allowedFiles = new Set(p1422.allowedFiles || []);
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
const setting = buildAdminSettingsPolicy({ sequence: 1 });
const featureGate = buildAdminFeatureGate({ sequence: 1 });
const maintenanceControl = buildAdminMaintenanceControl({ sequence: 1 });
const runtimeState = buildRuntimeOperationalState({ sequence: 1 });
const auditSurface = buildAdminAuditSurface({ sequence: 1 });
const model = buildAdminOperationsRuntimeSettingsModel({ createdAt: "2026-05-31T12:10:00.000Z" });
const envelope = buildAdminOperationsRuntimeSettingsEnvelope({ model });
const modelValidation = validateAdminOperationsRuntimeSettingsModel(model);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const modelAndDocs = `${JSON.stringify(model)}\n${docsBundle}`;
const p1422CurrentState =
  status.currentPhase === "P142.2"
  && status.previousPhase === "P142.1"
  && status.nextPhase === "P142.3"
  && roadmap.currentPhase === "P142.2"
  && roadmap.previousPhase === "P142.1"
  && roadmap.nextPhase === "P142.3"
  && status.current?.phaseId === "P142.2"
  && status.previous?.phaseId === "P142.1"
  && status.next?.phaseId === "P142.3"
  && roadmap.current?.phaseId === "P142.2"
  && roadmap.previous?.phaseId === "P142.1"
  && roadmap.next?.phaseId === "P142.3"
  && statusById.get("P141")?.status === "complete"
  && roadmapById.get("P141")?.status === "complete"
  && statusById.get("P141.7")?.status === "complete"
  && roadmapById.get("P141.7")?.status === "complete"
  && statusById.get("P142")?.status === "in_progress"
  && roadmapById.get("P142")?.status === "in_progress"
  && statusById.get("P142.1")?.status === "complete"
  && roadmapById.get("P142.1")?.status === "complete"
  && statusById.get("P142.2")?.status === "complete"
  && roadmapById.get("P142.2")?.status === "complete"
  && statusById.get("P142.3")?.status === "planned"
  && roadmapById.get("P142.3")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1422-admin-operations-runtime-settings.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("model exports expected API", EXPECTED_EXPORTS.every((entry) => modelSource.includes(`export const ${entry}`) || modelSource.includes(`export function ${entry}`)));
addCheck("model reuses mode guard, redaction, and result envelope helpers", ["./modeGuard.js", "./redaction.js", "./resultEnvelope.js"].every((target) => modelSource.includes(target)));
addCheck("model does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb)\b/.test(modelSource));
addCheck("model constants are correct", ADMIN_OPERATIONS_RUNTIME_SETTINGS_PHASE === "P142.2" && ADMIN_OPERATIONS_RUNTIME_SETTINGS_VERSION === "1.0" && ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES.length >= 20);
addCheck("settings policy validator passes", validateAdminSettingsPolicy(setting).valid, validateAdminSettingsPolicy(setting).errors.join("; "));
addCheck("feature gate validator passes", validateAdminFeatureGate(featureGate).valid, validateAdminFeatureGate(featureGate).errors.join("; "));
addCheck("maintenance control validator passes", validateAdminMaintenanceControl(maintenanceControl).valid, validateAdminMaintenanceControl(maintenanceControl).errors.join("; "));
addCheck("runtime state validator passes", validateRuntimeOperationalState(runtimeState).valid, validateRuntimeOperationalState(runtimeState).errors.join("; "));
addCheck("audit surface validator passes", validateAdminAuditSurface(auditSurface).valid, validateAdminAuditSurface(auditSurface).errors.join("; "));
addCheck("settings model validator passes", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("result envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P142.2" && envelope.envelopeValid === true);
addCheck("model is read-only and hidden from direct Command Center rendering", model.modelOnly === true && model.readOnly === true && model.localOnly === true && model.commandCenterVisible === false);
addCheck("model has required settings rows", model.settings.length >= 3 && model.featureGates.length >= 3 && model.maintenanceControls.length >= 2 && model.runtimeStates.length >= 2 && model.auditSurfaces.length >= 2);
addCheck("readiness summary blocks runtime candidates", model.readinessSummary.runnableActionCount === 0 && model.readinessSummary.mutationCandidateCount === 0 && model.readinessSummary.writeCandidateCount === 0 && model.readinessSummary.exportCandidateCount === 0 && model.readinessSummary.providerSpendCandidateCount === 0);
addCheck("all authority flags remain blocked", ADMIN_OPERATIONS_RUNTIME_SETTINGS_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false));
addCheck("cost impact remains zero-spend", model.costImpact.estimatedUsd === 0 && model.costImpact.actualUsd === 0 && model.costImpact.providerSpendAllowed === false && model.costImpact.networkCallsAllowed === false);
addCheck("P142.1 report passes", reportPassed("reports/p1421-admin-operations-runtime-settings-report.md"));
addCheck("contract advances to P142.2 safely", contract.phaseId === "P142" && contract.status === "in_progress" && contract.currentSubphase === "P142.2" && contract.previousSubphase === "P142.1" && contract.nextSubphase === "P142.3" && p1421.status === "complete" && p1422.status === "complete" && p1423.status === "planned");
addCheck("contract records expected base commit", p1422.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1422.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1422.validationCommands?.includes(command)));
addCheck("contract scope stays model-only", /read-only admin operations settings model/i.test(p1422.dataShape || "") && p1422.forbiddenFiles?.includes("dashboard/src/**") && p1422.forbiddenFiles?.includes("db/**") && p1422.forbiddenFiles?.includes("projects/**"));
addCheck("P142.1 checker accepts P142.2 handoff", p1421Checker.includes("p1422CurrentState") && p1421Checker.includes('status.currentPhase === "P142.2"'));
addCheck("enterprise checker accepts P142.2 active state", enterpriseChecker.includes("p1422CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P142.3 handoff", osStatusChecker.includes('"P142.3"') && osStatusChecker.includes('"P142.7"'));
addCheck("docs record P142.2 and P142.3 handoff", /## P142\.2 Settings Model[\s\S]*Status:\s+complete/.test(plan) && /P142\.2 admin operations settings model/i.test(readme) && /P142\.2 admin operations settings model is complete/i.test(platformRoadmap) && /P142\.2 is now complete/i.test(enterpriseRoadmap) && /P142\.3 is planned-only next/i.test(enterpriseRoadmap));
addCheck("phase status advances to P142.2", p1422CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P142.2 entries have required fields", [statusById.get("P142"), statusById.get("P142.2"), roadmapById.get("P142"), roadmapById.get("P142.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P142.3 and P143 remain planned-only", [statusById.get("P142.3"), roadmapById.get("P142.3"), statusById.get("P143"), roadmapById.get("P143")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("changed files stay in P142.2 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("model and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(modelAndDocs));
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
        "- Adds the P142.2 read-only admin operations settings model.",
        "- Reuses mode guard, redaction, and result envelope helpers.",
        "- Does not mutate settings, toggle or roll out features, execute or schedule maintenance, write DB/runtime state, expose raw logs or raw state, handle credentials, read secrets, export audits, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Model Exports", body: EXPECTED_EXPORTS.map((entry) => `- ${entry}`).join("\n") },
    {
      title: "Model Summary",
      body: [
        `- Settings: ${model.settings.length}`,
        `- Feature gates: ${model.featureGates.length}`,
        `- Maintenance controls: ${model.maintenanceControls.length}`,
        `- Runtime states: ${model.runtimeStates.length}`,
        `- Audit surfaces: ${model.auditSurfaces.length}`,
        `- Runnable actions: ${model.readinessSummary.runnableActionCount}`,
        `- Estimated spend: ${model.costImpact.estimatedUsd}`,
        `- Actual spend: ${model.costImpact.actualUsd}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        "- P142.3 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P142.2 is read-only model work only. It does not render new Command Center UI, mutate settings, toggle or roll out features, execute or schedule maintenance, mutate runtime state, write DB/runtime records, export audits, expose raw logs or raw state, handle credentials, read secrets, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P142.3 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P142.2 Admin Operations Runtime Settings Report", phase: "P142.2" },
);

printCheckReport("P142.2 Admin Operations Runtime Settings Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
