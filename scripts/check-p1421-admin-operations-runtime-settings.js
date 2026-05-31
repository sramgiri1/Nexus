import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1421-admin-operations-runtime-settings-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json";
const PLAN_PATH = "docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1421-admin-operations-runtime-settings";
const EXPECTED_BASE_COMMIT = "18087b39";
const EXPECTED_SUBPHASES = ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5", "P142.6", "P142.7"];
const VALIDATION_COMMANDS = [
  "npm run check:p1421-admin-operations-runtime-settings",
  "npm run check:p1417-security-privacy-compliance-controls-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"OS Roadmap|Command Center route-wide UX\"",
  "git diff --check",
];
const REQUIRED_PLAN_FIELDS = [
  "narrow scope",
  "starting branch and expected base commit",
  "allowed files",
  "forbidden files",
  "exact files/modules",
  "expected exports/schemas/data shapes",
  "Command Center UX requirements",
  "dark/light/system theme requirements",
  "Playwright tests",
  "checker updates",
  "docs/README/roadmap updates",
  "OS phase status update",
  "validation commands",
  "final safety checks",
  "git add/commit/push commands",
  "final response checklist",
];
const REQUIRED_SETTINGS_FIELDS = [
  "settingRef",
  "displayName",
  "category",
  "currentState",
  "allowedValues",
  "mutationAllowed",
  "requiresApproval",
  "ownerCapability",
  "disabledReason",
  "nextAction",
  "evidenceRefs",
];
const REQUIRED_FEATURE_FIELDS = [
  "gateRef",
  "displayName",
  "scope",
  "currentState",
  "toggleAllowed",
  "rolloutAllowed",
  "ownerCapability",
  "disabledReason",
  "blockers",
  "evidenceRefs",
];
const REQUIRED_MAINTENANCE_FIELDS = [
  "controlRef",
  "displayName",
  "operationType",
  "currentState",
  "executionAllowed",
  "scheduleAllowed",
  "requiresApproval",
  "ownerCapability",
  "disabledReason",
  "nextAction",
  "evidenceRefs",
];
const REQUIRED_RUNTIME_FIELDS = [
  "stateRef",
  "displayName",
  "runtimeArea",
  "healthState",
  "lastCheckedLabel",
  "rawStateExposureAllowed",
  "dbWriteAllowed",
  "providerCallAllowed",
  "ownerCapability",
  "evidenceRefs",
];
const REQUIRED_AUDIT_FIELDS = [
  "auditRef",
  "displayName",
  "eventClass",
  "captureState",
  "rawLogExposureAllowed",
  "exportAllowed",
  "retentionPolicyRef",
  "ownerCapability",
  "evidenceRefs",
  "disabledReason",
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

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|coverage|tests?|ux|handoff)\b/i.test(context);
  });
}

function hasFields(actual = [], required = []) {
  return required.every((field) => actual.includes(field));
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
const p142 = statusById.get("P142") || {};
const p142Roadmap = roadmapById.get("P142") || {};
const p1421 = subphaseById.get("P142.1") || {};
const p1422 = subphaseById.get("P142.2") || {};
const checkerSource = readText("scripts/check-p1421-admin-operations-runtime-settings.js");
const p1417Checker = readText("scripts/check-p1417-security-privacy-compliance-controls-final-validation.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P142.1";
const allowedFiles = new Set(p1421.allowedFiles || []);
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

const p1421StartedState =
  status.currentPhase === "P142.1"
  && status.previousPhase === "P141.7"
  && status.nextPhase === "P142.2"
  && roadmap.currentPhase === "P142.1"
  && roadmap.previousPhase === "P141.7"
  && roadmap.nextPhase === "P142.2"
  && status.current?.phaseId === "P142.1"
  && status.previous?.phaseId === "P141.7"
  && status.next?.phaseId === "P142.2"
  && roadmap.current?.phaseId === "P142.1"
  && roadmap.previous?.phaseId === "P141.7"
  && roadmap.next?.phaseId === "P142.2"
  && statusById.get("P141")?.status === "complete"
  && roadmapById.get("P141")?.status === "complete"
  && statusById.get("P141.7")?.status === "complete"
  && roadmapById.get("P141.7")?.status === "complete"
  && statusById.get("P142")?.status === "in_progress"
  && roadmapById.get("P142")?.status === "in_progress"
  && statusById.get("P142.1")?.status === "complete"
  && roadmapById.get("P142.1")?.status === "complete"
  && statusById.get("P142.2")?.status === "planned"
  && roadmapById.get("P142.2")?.status === "planned"
  && statusById.get("P143")?.status === "planned"
  && roadmapById.get("P143")?.status === "planned";

const allAuthorityFlagsFalse = Object.values(contract.authorityFlags || {}).every((value) => value === false);

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1421-admin-operations-runtime-settings.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P141.7 report still passes", reportPassed("reports/p1417-security-privacy-compliance-controls-final-validation-report.md"));
addCheck("contract starts P142.1", contract.phaseId === "P142" && contract.status === "in_progress" && contract.currentSubphase === "P142.1" && contract.previousSubphase === "P141.7" && contract.nextSubphase === "P142.2" && p1421.status === "complete");
addCheck("contract records expected base commit", p1421.expectedBaseCommit === EXPECTED_BASE_COMMIT && contract.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records seven subphases", EXPECTED_SUBPHASES.every((phaseId) => subphaseById.has(phaseId)));
addCheck("subphases include implementation plan fields", EXPECTED_SUBPHASES.every((phaseId) => {
  const subphase = subphaseById.get(phaseId) || {};
  const required = subphase.requiredPlanFields || REQUIRED_PLAN_FIELDS;
  return Boolean(subphase.narrowGoal) && subphase.scopeClassification === "NEXUS_OS_CHANGE" && REQUIRED_PLAN_FIELDS.every((field) => required.includes(field) || JSON.stringify(subphase).toLowerCase().includes(field.toLowerCase()));
}));
addCheck("P142.1 records allowed and forbidden files", p1421.allowedFiles?.includes(CONTRACT_PATH) && p1421.allowedFiles?.includes("scripts/check-p1421-admin-operations-runtime-settings.js") && p1421.forbiddenFiles?.includes("projects/**") && p1421.forbiddenFiles?.includes("dashboard/src/**") && p1421.forbiddenFiles?.includes("db/**"));
addCheck("P142.1 records validation commands", VALIDATION_COMMANDS.every((command) => p1421.validationCommands?.includes(command)));
addCheck("admin settings policy shape present", hasFields(contract.adminSettingsPolicyShape, REQUIRED_SETTINGS_FIELDS));
addCheck("feature gate shape present", hasFields(contract.featureGateShape, REQUIRED_FEATURE_FIELDS));
addCheck("maintenance control shape present", hasFields(contract.maintenanceControlShape, REQUIRED_MAINTENANCE_FIELDS));
addCheck("runtime operational state shape present", hasFields(contract.runtimeOperationalStateShape, REQUIRED_RUNTIME_FIELDS));
addCheck("admin audit surface shape present", hasFields(contract.adminAuditSurfaceShape, REQUIRED_AUDIT_FIELDS));
addCheck("authority flags block runtime authority", allAuthorityFlagsFalse, JSON.stringify(contract.authorityFlags || {}));
addCheck("P142.2 remains planned-only in contract", p1422.status === "planned" && p1422.expectedBaseCommit === "after-P142.1");
addCheck("P141.7 checker accepts P142.1 handoff", p1417Checker.includes("p1421StartedState") && p1417Checker.includes('status.currentPhase === "P142.1"'));
addCheck("enterprise checker accepts P142.1 active state", enterpriseChecker.includes("p1421StartedState") && enterpriseChecker.includes("p142ActiveState") && enterpriseChecker.includes("currentP142CheckCommand") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P142 subphases", osStatusChecker.includes('"P142.1"') && osStatusChecker.includes('"P142.2"') && osStatusChecker.includes('"P142.7"'));
addCheck("docs record P142.1 and P142.2 handoff", /## P142\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan) && /P142\.1\s+admin operations runtime settings contract is complete/i.test(readme) && /P142\.1 admin operations contract is complete/i.test(platformRoadmap) && /P142\.1 is now complete as contract\/policy\/safety-boundary only/i.test(enterpriseRoadmap) && /P142\.2 is planned-only next/i.test(enterpriseRoadmap));
addCheck("phase status starts P142.1", p1421StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P142 parent records active status", [p142, p142Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1421-admin-operations-runtime-settings") && entry.commandCenterVisible === true));
addCheck("P142.1 records required status fields", [statusById.get("P142.1"), roadmapById.get("P142.1")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P142.2 and P143 remain planned-only", [statusById.get("P142.2"), roadmapById.get("P142.2"), statusById.get("P143"), roadmapById.get("P143")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P142.1 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage|control|evidence|compliance|setting|feature|admin|runtime)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
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
        "- Starts P142.1 as contract/policy/safety-boundary work for Admin Operations and Runtime Settings.",
        "- Defines display-safe admin settings, feature gates, maintenance controls, runtime operational state, audit surface, and authority flag shapes.",
        "- Does not mutate admin settings, toggle features, roll out features, execute maintenance, schedule maintenance, mutate runtime state, write DB/runtime state, handle credentials, read secrets, export audits, expose raw logs or raw state, call providers/models, execute tools, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "P142.1 Handoff",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- P142 status: ${statusById.get("P142")?.status || "missing"}`,
        `- P142.2 status: ${statusById.get("P142.2")?.status || "missing"}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P142.1 is contract/policy/safety-boundary work only. It does not mutate admin settings, toggle features, roll out features, execute maintenance, schedule maintenance, mutate runtime state, write DB/runtime state, handle credentials, read secrets, export audits, expose raw logs or raw state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P142.2-P142.7 remain planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P142.1 Admin Operations Runtime Settings Report", phase: "P142.1" },
);

printCheckReport("P142.1 Admin Operations Runtime Settings Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
