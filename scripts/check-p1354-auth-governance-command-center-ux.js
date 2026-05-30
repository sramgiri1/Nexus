import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { authGovernanceReadinessViewModel } from "../dashboard/src/data/authGovernanceReadiness.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1354-auth-governance-command-center-ux-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json";
const PLAN_PATH = "docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1354-auth-governance-command-center-ux";

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

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|review-only|display-only|preview|local|checker|report|docs?|roadmap|status|safety)\b/i.test(context);
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
const p1354 = subphaseById.get("P135.4") || {};
const p1355 = subphaseById.get("P135.5") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1353Checker = readText("scripts/check-p1353-permission-preview.js");
const checkerSource = readText("scripts/check-p1354-auth-governance-command-center-ux.js");
const dataSource = readText("dashboard/src/data/authGovernanceReadiness.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const routesSource = readText("dashboard/src/data/commandCenterRoutes.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const testsSource = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const vm = authGovernanceReadinessViewModel;
const serializedVm = JSON.stringify(vm);
const primaryUxSource = `${dataSource}\n${pageSource}`;
const validationCommands = [
  "npm run check:p1354-auth-governance-command-center-ux",
  "npm run check:p1353-permission-preview",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Auth Governance route\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const allowedFiles = new Set([
  "dashboard/src/data/authGovernanceReadiness.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/data/commandCenterRoutes.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1354-auth-governance-command-center-ux.js",
  "scripts/check-p1353-permission-preview.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1353-permission-preview-report.md",
  "reports/enterprise-readiness-roadmap-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
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
const p1354CurrentState =
  status.currentPhase === "P135.4"
  && status.previousPhase === "P135.3"
  && status.nextPhase === "P135.5"
  && roadmap.currentPhase === "P135.4"
  && roadmap.previousPhase === "P135.3"
  && roadmap.nextPhase === "P135.5"
  && status.current?.phaseId === "P135.4"
  && status.previous?.phaseId === "P135.3"
  && status.next?.phaseId === "P135.5"
  && roadmap.current?.phaseId === "P135.4"
  && roadmap.previous?.phaseId === "P135.3"
  && roadmap.next?.phaseId === "P135.5"
  && statusById.get("P135")?.status === "in_progress"
  && roadmapById.get("P135")?.status === "in_progress"
  && ["P135.1", "P135.2", "P135.3", "P135.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P135.5")?.status === "planned"
  && roadmapById.get("P135.5")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("view model reuses P135.3 preview", dataSource.includes("createPermissionPreview") && dataSource.includes("p135-3-permission-preview.js"));
addCheck("route and tabs registered", routesSource.includes('key: "authGovernance"') && routesSource.includes('badge: "Review"') && tabsSource.includes("Tenant Scope") && tabsSource.includes("Blocked Workflows"));
addCheck("page renderer uses scoped Auth Governance sections", pageSource.includes("function AuthGovernancePage") && ["roleAccessRows", "tenantScopeRows", "commandCenterSurfaceRows", "sensitiveWorkflowRows"].every((field) => pageSource.includes(field)));
addCheck("required UX fields present", ["What changed", "Current state", "Next action", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => pageSource.includes(label)));
addCheck("readiness cards visible", ["Identity mode", "Role posture", "Workspace boundary", "Permission posture"].every((label) => serializedVm.includes(label)));
addCheck("role tenant surface workflow rows visible", vm.roleAccessRows.length >= 4 && vm.tenantScopeRows.length >= 3 && vm.commandCenterSurfaceRows.length >= 4 && vm.sensitiveWorkflowRows.length >= 4);
addCheck("evidence activity disabled reason and cost visible", serializedVm.includes("Auth governance UX evidence report") && serializedVm.includes("OS phase status auth governance record") && serializedVm.includes("Auth governance is display-only") && serializedVm.includes("No auth provider calls"));
addCheck("disabled actions visible", vm.disabledActions.length >= 6 && ["Sign in", "Assign role", "Grant permission", "Enforce access", "Create tenant", "Connect provider"].every((label) => serializedVm.includes(label)));
addCheck("auth and permission safety flags disabled", vm.safety.loginAllowed === false && vm.safety.roleAssignmentAllowed === false && vm.safety.permissionGrantAllowed === false && vm.safety.permissionRevokeAllowed === false && vm.safety.permissionMutationAllowed === false && vm.safety.permissionEnforcementAllowed === false && vm.safety.accessDecisionAllowed === false);
addCheck("tenant DB runtime provider safety disabled", vm.safety.tenantMutationAllowed === false && vm.safety.workspaceMutationAllowed === false && vm.safety.dbWritesAllowed === false && vm.safety.runtimeWritesAllowed === false && vm.safety.authProviderCallsAllowed === false && vm.safety.providerSpendAllowed === false);
addCheck("Playwright route test updated", testsSource.includes('test("Auth Governance route renders readiness without runnable auth actions"') && testsSource.includes("Tenant Scope") && testsSource.includes("Grant permission disabled") && testsSource.includes("P135\\."));
addCheck("P135.3 checker accepts P135.4 handoff", p1353Checker.includes("p1354CurrentState") && p1353Checker.includes('status.currentPhase === "P135.4"'));
addCheck("enterprise checker accepts P135.4", enterpriseChecker.includes("p1354CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P135.5 handoff", ["P135.3", "P135.4", "P135.5"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("contract records P135.4 completion", contract.currentSubphase === "P135.4" && contract.previousSubphase === "P135.3" && contract.nextSubphase === "P135.5" && p1354.status === "complete" && p1355.status === "planned");
addCheck("P135.4 records implementation-grade scope", p1354.scopeClassification === "NEXUS_OS_CHANGE" && p1354.allowedFiles?.includes("dashboard/src/data/authGovernanceReadiness.js") && p1354.allowedFiles?.includes("dashboard/tests/routes.spec.js") && p1354.validationCommands?.includes("npm run check:p1354-auth-governance-command-center-ux"));
addCheck("P135.4 records safety boundary", p1354.safetyRules?.join(" ").includes("Do not enable login") && p1354.safetyRules?.join(" ").includes("Do not grant permissions") && p1354.forbiddenFiles?.includes("db/**") && p1354.forbiddenFiles?.includes("local-state/runtime/**"));
addCheck("docs record P135.4", /## P135\.4 Auth Governance Command Center UX[\s\S]*Status:\s+complete/.test(plan) && /P135\.4 Auth Governance Command Center UX/i.test(readme) && /P135\.4 auth governance Command Center UX is complete/i.test(platformRoadmap) && /P135\.4 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts P135.4", p1354CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P135.4 entries have required fields", [statusById.get("P135"), statusById.get("P135.4"), roadmapById.get("P135.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P135.5 remains planned-only", statusById.get("P135.5")?.status === "planned" && roadmapById.get("P135.5")?.status === "planned" && !(statusById.get("P135.5")?.checksRun || []).length);
addCheck("changed files stay in P135.4 allowed scope", changed.every((file) => allowedFiles.has(file)), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedVm));
addCheck("primary UX avoids tokens URLs and raw dumps", !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serializedVm) && !/raw JSON|raw logs|raw policy dump/i.test(serializedVm));
addCheck("primary UX avoids internal phase labels", !/P73\.|P135\./.test(serializedVm));
addCheck("no DemoApp leakage", !primaryUxSource.includes("DemoApp"));
addCheck("no fake runnable auth action", !/sign in now|log in now|assign role now|grant permission now|revoke permission now|enforce permission now|create tenant now|connect provider now|execute now/i.test(serializedVm));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /login is enabled|sessions are enabled|tenant writes are enabled|role assignment is enabled|permission grants are enabled|permission enforcement is enabled|access decisions are live|RBAC is live|auth provider is connected|DB writes are enabled|runtime writes are enabled|provider calls are enabled|agent dispatch is enabled|project mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Surfaces the P135.3 permission preview in the Auth Governance Command Center route.",
        "- Adds useful role, tenant-scope, surface, workflow, evidence, blocker, and disabled-action views.",
        "- Does not enable login, sessions, role assignment, permission grants, permission revokes, permission enforcement, access decisions as live authority, tenant writes, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Command Center UX",
      body: [
        "- Auth Governance shows concise review-only identity, role, tenant, permission, surface, and workflow posture.",
        "- Primary UX avoids raw JSON, raw logs, raw policy dumps, raw tokens, raw private IDs, DemoApp leakage, internal phase labels, and runnable auth actions.",
      ].join("\n"),
    },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P135.4 is Command Center UX only. It does not create auth schemas, tenant stores, role stores, permission engines, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend paths.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P135.4 Auth Governance Command Center UX Report", phase: "P135.4" },
);

printCheckReport("P135.4 Auth Governance Command Center UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
