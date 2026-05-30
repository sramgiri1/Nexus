import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createAuthTenantModel, validateAuthTenantModel } from "../auth-governance/p135-2-auth-tenant-model.js";
import { createPermissionPreview, validatePermissionPreview } from "../auth-governance/p135-3-permission-preview.js";
import { authGovernanceReadinessViewModel } from "../dashboard/src/data/authGovernanceReadiness.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1355-identity-tenant-roles-permissions-tests-checkers-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json";
const PLAN_PATH = "docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md";
const TEST_PATH = "dashboard/tests/routes.spec.js";
const REQUIRED_SCRIPT = "check:p1355-identity-tenant-roles-permissions-tests-checkers";
const ROUTE_TEST = "P135.5 identity tenant roles permissions coverage keeps Auth Governance review-only";
const VALIDATION_COMMANDS = [
  "npm run check:p1355-identity-tenant-roles-permissions-tests-checkers",
  "npm run check:p1354-auth-governance-command-center-ux",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"P135.5 identity tenant roles permissions\"",
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
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|review-only|display-only|preview|local|tests?|checkers?|coverage|report|docs?|roadmap|status|safety)\b/i.test(context);
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
const p1355 = subphaseById.get("P135.5") || {};
const p1356 = subphaseById.get("P135.6") || {};
const testSource = readText(TEST_PATH);
const checkerSource = readText("scripts/check-p1355-identity-tenant-roles-permissions-tests-checkers.js");
const p1354Checker = readText("scripts/check-p1354-auth-governance-command-center-ux.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const authDataSource = readText("dashboard/src/data/authGovernanceReadiness.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const allowedFiles = new Set(p1355.allowedFiles || []);
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
const authTenantModel = createAuthTenantModel();
const permissionPreview = createPermissionPreview();
const authValidation = validateAuthTenantModel(authTenantModel);
const previewValidation = validatePermissionPreview(permissionPreview);
const authGovernance = authGovernanceReadinessViewModel;
const serializedAuthGovernance = JSON.stringify(authGovernance);
const p1355CurrentState =
  status.currentPhase === "P135.5"
  && status.previousPhase === "P135.4"
  && status.nextPhase === "P135.6"
  && roadmap.currentPhase === "P135.5"
  && roadmap.previousPhase === "P135.4"
  && roadmap.nextPhase === "P135.6"
  && status.current?.phaseId === "P135.5"
  && status.previous?.phaseId === "P135.4"
  && status.next?.phaseId === "P135.6"
  && roadmap.current?.phaseId === "P135.5"
  && roadmap.previous?.phaseId === "P135.4"
  && roadmap.next?.phaseId === "P135.6"
  && statusById.get("P135")?.status === "in_progress"
  && roadmapById.get("P135")?.status === "in_progress"
  && ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P135.6")?.status === "planned"
  && roadmapById.get("P135.6")?.status === "planned";
const p1356CurrentState =
  status.currentPhase === "P135.6"
  && status.previousPhase === "P135.5"
  && status.nextPhase === "P135.7"
  && roadmap.currentPhase === "P135.6"
  && roadmap.previousPhase === "P135.5"
  && roadmap.nextPhase === "P135.7"
  && status.current?.phaseId === "P135.6"
  && status.previous?.phaseId === "P135.5"
  && status.next?.phaseId === "P135.7"
  && roadmap.current?.phaseId === "P135.6"
  && roadmap.previous?.phaseId === "P135.5"
  && roadmap.next?.phaseId === "P135.7"
  && statusById.get("P135")?.status === "in_progress"
  && roadmapById.get("P135")?.status === "in_progress"
  && ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5", "P135.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P135.7")?.status === "planned"
  && roadmapById.get("P135.7")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P135.2 auth tenant model validates", authValidation.valid, authValidation.errors.join("; "));
addCheck("P135.3 permission preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("Auth Governance view model stays review-only", authGovernance.readinessCards.length >= 4 && authGovernance.roleAccessRows.length >= 4 && authGovernance.tenantScopeRows.length >= 3 && authGovernance.commandCenterSurfaceRows.length >= 4 && authGovernance.sensitiveWorkflowRows.length >= 4);
addCheck("Auth Governance safety flags remain disabled", authGovernance.safety.loginAllowed === false && authGovernance.safety.roleAssignmentAllowed === false && authGovernance.safety.permissionGrantAllowed === false && authGovernance.safety.permissionRevokeAllowed === false && authGovernance.safety.permissionEnforcementAllowed === false && authGovernance.safety.accessDecisionAllowed === false && authGovernance.safety.tenantMutationAllowed === false && authGovernance.safety.dbWritesAllowed === false && authGovernance.safety.runtimeWritesAllowed === false && authGovernance.safety.providerSpendAllowed === false);
addCheck("prior P135 reports pass", [
  "reports/p1351-identity-tenant-roles-permissions-report.md",
  "reports/p1352-auth-tenant-model-report.md",
  "reports/p1353-permission-preview-report.md",
  "reports/p1354-auth-governance-command-center-ux-report.md",
].every((reportPath) => reportPassed(reportPath)));
addCheck("P135.5 Playwright regression exists", testSource.includes(ROUTE_TEST));
addCheck("P135.5 Playwright covers Auth Governance sections", ["Roles", "Tenant Scope", "Surfaces", "Blocked Workflows", "Evidence", "Disabled Actions"].every((text) => testSource.includes(text)));
addCheck("P135.5 Playwright keeps unsafe actions blocked", ["sign in now", "assign role now", "grant permission now", "revoke permission now", "enforce permission now", "connect provider now", "create tenant now"].every((text) => testSource.includes(text)));
addCheck("route-wide safety assertions retained", testSource.includes("DemoApp") && testSource.includes("raw JSON") && testSource.includes("Bearer") && testSource.includes("postgres") && testSource.includes("P135\\."));
addCheck("P135.4 checker accepts P135.5 handoff", p1354Checker.includes("p1355CurrentState") && p1354Checker.includes('status.currentPhase === "P135.5"') && p1354Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P135.5", enterpriseChecker.includes("p1355CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P135.6 handoff", ["P135.4", "P135.5", "P135.6", "P135.7"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P135.6 checker registered when handed off", !p1356CurrentState || Boolean(packageJson.scripts?.["check:p1356-identity-tenant-roles-permissions-docs-roadmap"]));
addCheck("contract marks P135.5 complete", p1355.status === "complete" && ((contract.currentSubphase === "P135.5" && contract.previousSubphase === "P135.4" && contract.nextSubphase === "P135.6" && p1356.status === "planned") || (p1356CurrentState && contract.currentSubphase === "P135.6" && contract.previousSubphase === "P135.5" && contract.nextSubphase === "P135.7" && p1356.status === "complete")));
addCheck("P135.5 records expected base commit", p1355.expectedBaseCommit === "3d8f9afb");
addCheck("P135.5 allowed files include checker and route test", [TEST_PATH, "scripts/check-p1355-identity-tenant-roles-permissions-tests-checkers.js"].every((file) => p1355.allowedFiles?.includes(file)));
addCheck("P135.5 forbids project/dashboard-src/db/runtime/provider/tool paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1355.forbiddenFiles?.includes(path)));
addCheck("P135.5 records validation commands", VALIDATION_COMMANDS.every((command) => p1355.validationCommands?.includes(command)));
addCheck("docs record P135.5", /## P135\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan) && /P135\.5 identity\/tenant\/RBAC tests\/checkers/i.test(readme) && /P135\.5 identity\/tenant\/RBAC tests\/checkers is complete/i.test(platformRoadmap) && /P135\.5 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P135.5", p1355CurrentState || p1356CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P135.5 entries have required fields", [statusById.get("P135"), statusById.get("P135.5"), roadmapById.get("P135.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P135.6 remains planned or safely handed off", (statusById.get("P135.6")?.status === "planned" && roadmapById.get("P135.6")?.status === "planned" && !(statusById.get("P135.6")?.checksRun || []).length) || p1356CurrentState);
addCheck("changed files stay in P135.5 allowed scope", status.currentPhase !== "P135.5" || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), status.currentPhase === "P135.5" ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", status.currentPhase !== "P135.5" || changed.every((file) => file === TEST_PATH || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), status.currentPhase === "P135.5" ? changed.join(", ") : `P135.5 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("primary UX data avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedAuthGovernance));
addCheck("primary UX data avoids tokens URLs and raw dumps", !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serializedAuthGovernance) && !/raw JSON|raw logs|raw policy dump/i.test(serializedAuthGovernance));
addCheck("primary UX data avoids internal phase labels", !/P73\.|P135\./.test(serializedAuthGovernance));
addCheck("Auth Governance data avoids fake runnable actions", !/sign in now|log in now|assign role now|grant permission now|revoke permission now|enforce permission now|create tenant now|connect provider now|execute now/i.test(serializedAuthGovernance));
addCheck("Auth Governance source reuses P135.3 preview", authDataSource.includes("createPermissionPreview") && authDataSource.includes("p135-3-permission-preview.js"));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable auth actions", !/sign in now|log in now|assign role now|grant permission now|revoke permission now|enforce permission now|create tenant now|connect provider now|execute now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /login is enabled|sessions are enabled|tenant writes are enabled|role assignment is enabled|permission grants are enabled|permission enforcement is enabled|access decisions are live|RBAC is live|auth provider is connected|DB writes are enabled|runtime writes are enabled|provider calls are enabled|agent dispatch is enabled|project mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P135.1-P135.4 validation into P135.5 tests/checkers evidence.",
        "- Adds focused Auth Governance Playwright regression coverage.",
        "- Does not enable login, sessions, role assignment, permission grants, permission revokes, permission enforcement, access decisions as live authority, tenant writes, auth provider calls, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P135.5 is tests/checkers hardening only. It does not create auth schemas, tenant stores, role stores, permission engines, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend paths.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P135.5 Identity Tenant Roles Permissions Tests Checkers Report", phase: "P135.5" },
);

printCheckReport("P135.5 Identity Tenant Roles Permissions Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
