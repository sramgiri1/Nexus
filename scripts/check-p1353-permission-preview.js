import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  P135_3_REQUIRED_FIELDS,
  P135_3_SAFETY_FLAG_NAMES,
  P135_3_SAMPLE_PREVIEWS,
  buildPermissionPreviewEnvelope,
  createPermissionPreview,
  validatePermissionPreview,
} from "../auth-governance/p135-3-permission-preview.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1353-permission-preview-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json";
const PLAN_PATH = "docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1353-permission-preview";

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
const p1353 = subphaseById.get("P135.3") || {};
const p1354 = subphaseById.get("P135.4") || {};
const p1355 = subphaseById.get("P135.5") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1352Checker = readText("scripts/check-p1352-auth-tenant-model.js");
const previewSource = readText("auth-governance/p135-3-permission-preview.js");
const checkerSource = readText("scripts/check-p1353-permission-preview.js");
const changed = changedFiles();
const generatedPreview = createPermissionPreview({
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["os-roadmap/phase-status.json#P135.3"],
});
const previews = [...P135_3_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validatePermissionPreview(preview));
const envelope = buildPermissionPreviewEnvelope({
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["os-roadmap/phase-status.json#P135.3"],
});
const serializedPreviews = JSON.stringify(previews);
const validationCommands = [
  "npm run check:p1353-permission-preview",
  "npm run check:p1352-auth-tenant-model",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const allowedFiles = new Set([
  "auth-governance/p135-3-permission-preview.js",
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1353-permission-preview.js",
  "scripts/check-p1352-auth-tenant-model.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1352-auth-tenant-model-report.md",
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
const p1353ContractState =
  (contract.currentSubphase === "P135.3" && contract.previousSubphase === "P135.2" && contract.nextSubphase === "P135.4" && p1353.status === "complete" && p1354.status === "planned")
  || (contract.currentSubphase === "P135.4" && contract.previousSubphase === "P135.3" && contract.nextSubphase === "P135.5" && p1353.status === "complete" && p1354.status === "complete" && p1355.status === "planned");
const enforceCurrentDiffScope = status.currentPhase === "P135.3";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("preview reuses P135.2 auth tenant model", previewSource.includes("./p135-2-auth-tenant-model.js") && previewSource.includes("../shared/resultEnvelope.js"));
addCheck("required preview fields listed", P135_3_REQUIRED_FIELDS.length >= 20, `${P135_3_REQUIRED_FIELDS.length} fields`);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("all safety flags disabled", previews.every((preview) => P135_3_SAFETY_FLAG_NAMES.every((flag) => preview.safetyFlags[flag] === false)));
addCheck("permission policy is preview-only", previews.every((preview) => preview.permissionPreviewPolicy.previewOnly === true && preview.permissionPreviewPolicy.grantsAllowed === false && preview.permissionPreviewPolicy.revokesAllowed === false && preview.permissionPreviewPolicy.enforcementAllowed === false && preview.permissionPreviewPolicy.accessDecisionAllowed === false));
addCheck("role and tenant rows display-only", previews.every((preview) => preview.rolePreviewRows.length >= 4 && preview.rolePreviewRows.every((row) => row.assignmentAllowed === false && row.mutationAllowed === false && row.enforcementAllowed === false) && preview.tenantScopePreviewRows.length >= 3 && preview.tenantScopePreviewRows.every((row) => row.accessDecisionAllowed === false && row.mutationAllowed === false && row.enforcementAllowed === false)));
addCheck("surface and workflow rows blocked", previews.every((preview) => preview.commandCenterSurfaceRows.length >= 4 && preview.commandCenterSurfaceRows.every((row) => row.mutationAllowed === false && row.grantAllowed === false && row.enforcementAllowed === false) && preview.sensitiveWorkflowRows.length >= 4 && preview.sensitiveWorkflowRows.every((row) => row.executionAllowed === false)));
addCheck("blocked operations and blockers visible", previews.every((preview) => preview.blockedOperations.length >= 6 && preview.blockers.length >= 6));
addCheck("evidence activity and cost visible", previews.every((preview) => preview.evidenceRefs.includes(REPORT_PATH) && preview.activityRefs.includes("os-roadmap/phase-status.json#P135.3") && preview.costImpact.includes("No auth provider calls")));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P135.3" && envelope.data.preview.permissionPreviewPolicy.enforcementAllowed === false);
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreviews) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serializedPreviews));
addCheck("contract records P135.3 completion", p1353ContractState);
addCheck("P135.3 records implementation-grade scope", p1353.scopeClassification === "NEXUS_OS_CHANGE" && p1353.allowedFiles?.includes("auth-governance/p135-3-permission-preview.js") && p1353.expectedExports?.includes("createPermissionPreview") && p1353.validationCommands?.includes("npm run check:p1353-permission-preview"));
addCheck("P135.3 records safety boundary", p1353.safetyRules?.join(" ").includes("Do not enforce permissions") && p1353.safetyRules?.join(" ").includes("Do not grant permissions") && p1353.forbiddenFiles?.includes("db/**") && p1353.forbiddenFiles?.includes("local-state/runtime/**"));
addCheck("P135.2 checker accepts P135.3 handoff", p1352Checker.includes("p1353CurrentState") && p1352Checker.includes('status.currentPhase === "P135.3"'));
addCheck("enterprise checker accepts P135.3", enterpriseChecker.includes("p1353CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P135.4 handoff", ["P135.2", "P135.3", "P135.4"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P135 plan records P135.3", /## P135\.3 Permission Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P135.3", /P135\.3 permission preview/i.test(readme));
addCheck("platform roadmap records P135.3", /P135\.3 permission preview is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P135.3", /P135\.3 is now complete/i.test(enterpriseRoadmap) && (/P135\.4 is the next executable subphase/i.test(enterpriseRoadmap) || /P135\.4 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status starts or safely hands off P135.3", p1353CurrentState || p1354CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P135.3 entries have required fields", [statusById.get("P135"), statusById.get("P135.3"), roadmapById.get("P135.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P135.4 remains planned or safely handed off", (statusById.get("P135.4")?.status === "planned" && roadmapById.get("P135.4")?.status === "planned" && !(statusById.get("P135.4")?.checksRun || []).length) || p1354CurrentState);
addCheck("changed files stay in P135.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : "scope check relaxed for P135.4");
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : "P135.3 forbidden path check relaxed for P135.4");

const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable permission actions", !/assign role now|grant permission now|revoke permission now|enforce permission now|allow access now|start session now|login now|write auth now|enable rbac now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /login is enabled|sessions are enabled|tenant writes are enabled|role assignment is enabled|permission grants are enabled|permission enforcement is enabled|access decisions are live|RBAC is live|auth provider is connected|DB writes are enabled|runtime writes are enabled|provider calls are enabled|agent dispatch is enabled|project mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds a display-safe permission preview for P135.3.",
        "- Reuses the P135.2 auth and tenant model.",
        "- Does not enable role assignment, permission grants, permission revokes, permission enforcement, access decisions as live authority, login, sessions, tenant writes, auth provider calls, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P135_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P135.3 is preview-only. It does not create a permission engine, auth schema, tenant store, role store, grant store, enforcement adapter, auth provider, DB/runtime write, dashboard source, Playwright source, provider/model call, agent dispatch, project mutation, deploy, release, export, package, network call, or spend path.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P135.3 Permission Preview Report", phase: "P135.3" },
);

printCheckReport("P135.3 Permission Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
