import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  P135_2_REQUIRED_FIELDS,
  P135_2_SAFETY_FLAG_NAMES,
  P135_2_SAMPLE_MODELS,
  buildAuthTenantModelEnvelope,
  createAuthTenantModel,
  validateAuthTenantModel,
} from "../auth-governance/p135-2-auth-tenant-model.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1352-auth-tenant-model-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json";
const PLAN_PATH = "docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1352-auth-tenant-model";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|read-only|model|checker|report|docs?|roadmap|status|boundary)\b/i.test(context);
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
const p1352 = subphaseById.get("P135.2") || {};
const p1353 = subphaseById.get("P135.3") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1351Checker = readText("scripts/check-p1351-identity-tenant-roles-permissions.js");
const modelSource = readText("auth-governance/p135-2-auth-tenant-model.js");
const checkerSource = readText("scripts/check-p1352-auth-tenant-model.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P135.2";
const generatedModel = createAuthTenantModel({
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["os-roadmap/phase-status.json#P135.2"],
});
const models = [...P135_2_SAMPLE_MODELS, generatedModel];
const validations = models.map((model) => validateAuthTenantModel(model));
const envelope = buildAuthTenantModelEnvelope({
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["os-roadmap/phase-status.json#P135.2"],
});
const serializedModels = JSON.stringify(models);
const validationCommands = [
  "npm run check:p1352-auth-tenant-model",
  "npm run check:p1351-identity-tenant-roles-permissions",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const allowedFiles = new Set([
  "auth-governance/p135-2-auth-tenant-model.js",
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1352-auth-tenant-model.js",
  "scripts/check-p1351-identity-tenant-roles-permissions.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1351-identity-tenant-roles-permissions-report.md",
  "reports/enterprise-readiness-roadmap-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
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
const p1352CurrentState =
  status.currentPhase === "P135.2"
  && status.previousPhase === "P135.1"
  && status.nextPhase === "P135.3"
  && roadmap.currentPhase === "P135.2"
  && roadmap.previousPhase === "P135.1"
  && roadmap.nextPhase === "P135.3"
  && status.current?.phaseId === "P135.2"
  && status.previous?.phaseId === "P135.1"
  && status.next?.phaseId === "P135.3"
  && roadmap.current?.phaseId === "P135.2"
  && roadmap.previous?.phaseId === "P135.1"
  && roadmap.next?.phaseId === "P135.3"
  && statusById.get("P135")?.status === "in_progress"
  && roadmapById.get("P135")?.status === "in_progress"
  && statusById.get("P135.1")?.status === "complete"
  && roadmapById.get("P135.1")?.status === "complete"
  && statusById.get("P135.2")?.status === "complete"
  && roadmapById.get("P135.2")?.status === "complete"
  && statusById.get("P135.3")?.status === "planned"
  && roadmapById.get("P135.3")?.status === "planned";
const p1353CurrentState =
  status.currentPhase === "P135.3"
  && status.previousPhase === "P135.2"
  && status.nextPhase === "P135.4"
  && roadmap.currentPhase === "P135.3"
  && roadmap.previousPhase === "P135.2"
  && roadmap.nextPhase === "P135.4"
  && status.current?.phaseId === "P135.3"
  && status.previous?.phaseId === "P135.2"
  && status.next?.phaseId === "P135.4"
  && roadmap.current?.phaseId === "P135.3"
  && roadmap.previous?.phaseId === "P135.2"
  && roadmap.next?.phaseId === "P135.4"
  && statusById.get("P135")?.status === "in_progress"
  && roadmapById.get("P135")?.status === "in_progress"
  && ["P135.1", "P135.2", "P135.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P135.4")?.status === "planned"
  && roadmapById.get("P135.4")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("model reuses existing auth and tenant contracts", modelSource.includes("./p73-2-placeholder.js") && modelSource.includes("./p73-3-placeholder.js") && modelSource.includes("../isolation/p76-2-placeholder.js") && modelSource.includes("../shared/resultEnvelope.js"));
addCheck("required model fields listed", P135_2_REQUIRED_FIELDS.length >= 22, `${P135_2_REQUIRED_FIELDS.length} fields`);
addCheck("models validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("all safety flags disabled", models.every((model) => P135_2_SAFETY_FLAG_NAMES.every((flag) => model.safetyFlags[flag] === false)));
addCheck("session policy disabled", models.every((model) => model.sessionPolicy.loginAllowed === false && model.sessionPolicy.sessionCreationAllowed === false && model.sessionPolicy.sessionRefreshAllowed === false && model.sessionPolicy.tokenStorageAllowed === false));
addCheck("auth provider policy disabled", models.every((model) => model.authProviderPolicy.providerCallsAllowed === false && model.authProviderPolicy.oauthAllowed === false && model.authProviderPolicy.ssoAllowed === false && model.authProviderPolicy.passwordFlowAllowed === false));
addCheck("permission policy disabled", models.every((model) => model.permissionPolicy.roleAssignmentAllowed === false && model.permissionPolicy.permissionGrantAllowed === false && model.permissionPolicy.permissionRevokeAllowed === false && model.permissionPolicy.permissionEnforcementAllowed === false));
addCheck("role and tenant catalogs are display-only", models.every((model) => model.roleCatalog.length >= 4 && model.roleCatalog.every((role) => role.mutationAllowed === false) && model.tenantScopeCatalog.length >= 3 && model.tenantScopeCatalog.every((scope) => scope.mutationAllowed === false)));
addCheck("blocked operations and blockers visible", models.every((model) => model.blockedOperations.length >= 6 && model.blockers.length >= 6));
addCheck("evidence activity and cost visible", models.every((model) => model.evidenceRefs.includes(REPORT_PATH) && model.activityRefs.includes("os-roadmap/phase-status.json#P135.2") && model.costImpact.includes("No auth provider calls")));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P135.2" && envelope.data.model.safetyFlags.loginAllowed === false);
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModels) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serializedModels));
addCheck("contract records P135.2 completion", ((contract.currentSubphase === "P135.2" && contract.previousSubphase === "P135.1" && contract.nextSubphase === "P135.3" && p1353.status === "planned") || (contract.currentSubphase === "P135.3" && contract.previousSubphase === "P135.2" && contract.nextSubphase === "P135.4" && p1353.status === "complete")) && p1352.status === "complete");
addCheck("P135.2 records implementation-grade scope", p1352.scopeClassification === "NEXUS_OS_CHANGE" && p1352.allowedFiles?.includes("auth-governance/p135-2-auth-tenant-model.js") && p1352.expectedExports?.includes("createAuthTenantModel") && p1352.validationCommands?.includes("npm run check:p1352-auth-tenant-model"));
addCheck("P135.2 records safety boundary", p1352.safetyRules?.join(" ").includes("Do not enable login") && p1352.safetyRules?.join(" ").includes("Do not mutate tenants") && p1352.safetyRules?.join(" ").includes("Do not enforce permissions") && p1352.forbiddenFiles?.includes("db/**") && p1352.forbiddenFiles?.includes("local-state/runtime/**"));
addCheck("P135.1 checker accepts P135.2 handoff", p1351Checker.includes("p1352CurrentState") && p1351Checker.includes('status.currentPhase === "P135.2"'));
addCheck("enterprise checker accepts P135.2", enterpriseChecker.includes("p1352CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P135.3 handoff", ["P135.1", "P135.2", "P135.3"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P135 plan records P135.2", /## P135\.2 Auth and Tenant Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P135.2", /P135\.2 auth\/tenant model/i.test(readme));
addCheck("platform roadmap records P135.2", /P135\.2 auth\/tenant model is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P135.2", /P135\.2 is now complete/i.test(enterpriseRoadmap) && (/P135\.3 is the next executable subphase/i.test(enterpriseRoadmap) || /P135\.3 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status starts P135.2", p1352CurrentState || p1353CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P135.2 entries have required fields", [statusById.get("P135"), statusById.get("P135.2"), roadmapById.get("P135.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P135.3 remains planned or safely handed off", (statusById.get("P135.3")?.status === "planned" && roadmapById.get("P135.3")?.status === "planned" && !(statusById.get("P135.3")?.checksRun || []).length) || p1353CurrentState);
addCheck(
  "changed files stay in P135.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P135.2 forbidden path check relaxed for ${status.currentPhase}`,
);

const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable auth actions", !/login now|create user now|create tenant now|assign role now|grant permission now|enforce permission now|start session now|save role now|write auth now|enable rbac now|connect auth provider now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /login is enabled|sessions are enabled|tenant writes are enabled|role mutation is enabled|permission enforcement is enabled|RBAC is live|auth provider is connected|identity store is live|user creation is enabled|permission grants are enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|agent dispatch is enabled|project mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds a read-only auth and tenant model for P135.2.",
        "- Reuses existing P73 identity/session and RBAC contracts plus P76 tenant boundary contracts.",
        "- Does not enable login, sessions, tenant writes, role assignment, permission grants, permission enforcement, auth provider calls, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Model Shape", body: P135_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P135.2 is read-only model work. It does not create auth schemas, session stores, tenant stores, role stores, permission stores, permission engines, auth providers, DB/runtime writes, dashboard source, Playwright source, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P135.2 Auth Tenant Model Report", phase: "P135.2" },
);

printCheckReport("P135.2 Auth Tenant Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
