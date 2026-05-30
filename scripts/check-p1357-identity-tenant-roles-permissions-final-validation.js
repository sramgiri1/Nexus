import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1357-identity-tenant-roles-permissions-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json";
const PLAN_PATH = "docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md";
const ENTERPRISE_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";
const PLATFORM_PATH = "docs/architecture/NEXUS_PLATFORM_ROADMAP.md";
const REQUIRED_SCRIPT = "check:p1357-identity-tenant-roles-permissions-final-validation";
const COMPLETED_SUBPHASES = ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5", "P135.6", "P135.7"];
const VALIDATION_COMMANDS = [
  "npm run check:p1357-identity-tenant-roles-permissions-final-validation",
  "npm run check:p1356-identity-tenant-roles-permissions-docs-roadmap",
  "npm run check:p1355-identity-tenant-roles-permissions-tests-checkers",
  "npm run check:p1354-auth-governance-command-center-ux",
  "npm run check:p1353-permission-preview",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|review-only|display-only|preview|local|docs?|roadmap|status|safety|final validation|readiness|non-runnable|handoff)\b/i.test(context);
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
const p1357 = subphaseById.get("P135.7") || {};
const p136Status = statusById.get("P136") || {};
const checkerSource = readText("scripts/check-p1357-identity-tenant-roles-permissions-final-validation.js");
const p1356Checker = readText("scripts/check-p1356-identity-tenant-roles-permissions-docs-roadmap.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText(PLATFORM_PATH);
const enterpriseRoadmap = readText(ENTERPRISE_PATH);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P135.7";
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  ENTERPRISE_PATH,
  PLATFORM_PATH,
  "README.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1357-identity-tenant-roles-permissions-final-validation.js",
  "scripts/check-p1356-identity-tenant-roles-permissions-docs-roadmap.js",
  "scripts/check-p1355-identity-tenant-roles-permissions-tests-checkers.js",
  "scripts/check-p1354-auth-governance-command-center-ux.js",
  "scripts/check-p1353-permission-preview.js",
  "scripts/check-p1352-auth-tenant-model.js",
  "scripts/check-p1351-identity-tenant-roles-permissions.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1356-identity-tenant-roles-permissions-docs-roadmap-report.md",
  "reports/p1355-identity-tenant-roles-permissions-tests-checkers-report.md",
  "reports/p1354-auth-governance-command-center-ux-report.md",
  "reports/p1353-permission-preview-report.md",
  "reports/p1352-auth-tenant-model-report.md",
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
const p1357FinalState =
  status.currentPhase === "P135.7"
  && status.previousPhase === "P135.6"
  && status.nextPhase === "P136"
  && roadmap.currentPhase === "P135.7"
  && roadmap.previousPhase === "P135.6"
  && roadmap.nextPhase === "P136"
  && status.current?.phaseId === "P135.7"
  && status.previous?.phaseId === "P135.6"
  && status.next?.phaseId === "P136"
  && roadmap.current?.phaseId === "P135.7"
  && roadmap.previous?.phaseId === "P135.6"
  && roadmap.next?.phaseId === "P136"
  && statusById.get("P134")?.status === "complete"
  && roadmapById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "complete"
  && roadmapById.get("P135")?.status === "complete"
  && COMPLETED_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136")?.status === "planned"
  && roadmapById.get("P136")?.status === "planned";
const p1361StartedState =
  status.currentPhase === "P136.1"
  && status.previousPhase === "P135.7"
  && status.nextPhase === "P136.2"
  && roadmap.currentPhase === "P136.1"
  && roadmap.previousPhase === "P135.7"
  && roadmap.nextPhase === "P136.2"
  && status.current?.phaseId === "P136.1"
  && status.previous?.phaseId === "P135.7"
  && status.next?.phaseId === "P136.2"
  && roadmap.current?.phaseId === "P136.1"
  && roadmap.previous?.phaseId === "P135.7"
  && roadmap.next?.phaseId === "P136.2"
  && statusById.get("P134")?.status === "complete"
  && roadmapById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "complete"
  && roadmapById.get("P135")?.status === "complete"
  && COMPLETED_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && roadmapById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "planned"
  && roadmapById.get("P136.2")?.status === "planned";
const p136SafeHandoffState = p1357FinalState || p1361StartedState;

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract closes P135", contract.status === "complete" && contract.currentSubphase === "P135.7" && contract.previousSubphase === "P135.6" && contract.nextSubphase === "P136" && p1357.status === "complete");
addCheck("P135.7 records expected base commit", p1357.expectedBaseCommit === "986d1e47");
addCheck("P135.7 records validation commands", VALIDATION_COMMANDS.every((command) => p1357.validationCommands?.includes(command)));
addCheck("P135.1-P135.7 contract entries complete", COMPLETED_SUBPHASES.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("prior P135 reports pass", [
  "reports/p1356-identity-tenant-roles-permissions-docs-roadmap-report.md",
  "reports/p1355-identity-tenant-roles-permissions-tests-checkers-report.md",
  "reports/p1354-auth-governance-command-center-ux-report.md",
  "reports/p1353-permission-preview-report.md",
  "reports/p1352-auth-tenant-model-report.md",
  "reports/p1351-identity-tenant-roles-permissions-report.md",
].every((reportPath) => reportPassed(reportPath)));
addCheck("P135.6 checker accepts P135.7", p1356Checker.includes("p1357FinalState") && p1356Checker.includes('status.currentPhase === "P135.7"') && p1356Checker.includes('status.nextPhase === "P136"'));
addCheck("enterprise checker accepts P135.7", enterpriseChecker.includes("p1357FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P135 plan records P135.7", /## P135\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P135.7", /P135\.7 identity\/tenant\/RBAC final validation/i.test(readme) && (/P136 secrets,\s+providers,\s+and tool governance is planned-only next/i.test(readme) || /P136\.1 secrets\/providers\/tool governance contract/i.test(readme)));
addCheck("platform roadmap records P135.7", /P135\.7 identity\/tenant\/RBAC final validation is complete/i.test(platformRoadmap) && (/P136 Secrets,\s+Providers,\s+and Tool Governance is planned-only next/i.test(platformRoadmap) || /P136\.1 secrets\/providers\/tool governance contract is complete/i.test(platformRoadmap)));
addCheck("enterprise roadmap records P135 closure", /P135\.1 through P135\.7\s+are\s+now complete/i.test(enterpriseRoadmap) && (/P136 is the next executable phase/i.test(enterpriseRoadmap) || /P136\.1 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status closes P135", p136SafeHandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P135 entries have required fields", [statusById.get("P135"), statusById.get("P135.7"), roadmapById.get("P135"), roadmapById.get("P135.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P136 handoff remains safe", (p136Status.status === "planned" && p136Status.commit === "" && Array.isArray(p136Status.checksRun) && p136Status.checksRun.length === 0 && (p136Status.knownLimitations || []).join(" ").toLowerCase().includes("planned-only")) || p1361StartedState);
addCheck(
  "changed files stay in P135.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P135.7 forbidden path check relaxed for ${status.currentPhase}`,
);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/sign in now|log in now|assign role now|grant permission now|revoke permission now|enforce permission now|create tenant now|connect provider now|execute now|dispatch agent now|mutate project now|deploy now|export now|package now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /login is enabled|sessions are enabled|tenant writes are enabled|role assignment is enabled|permission grants are enabled|permission enforcement is enabled|access decisions are live|RBAC is live|auth provider is connected|DB writes are enabled|runtime writes are enabled|provider calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P135 closure, P135.1-P135.6 reports, checker handoffs, OS status, roadmap, and documentation.",
        "- Confirms P136 remains safely handed off and no identity, tenant, role, permission, auth provider, DB/runtime, provider/model, agent dispatch, project mutation, deploy, release, export, package, network, or spend behavior is enabled by P135.7.",
        "- Confirms this subphase does not change Command Center source, project source, DB/runtime source, provider/tool source, deploy/release/export/package files, or environment files.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P135.7 is final validation only. It does not enable login, sessions, tenant mutation, role assignment, permission grants, permission revokes, permission enforcement, access decisions as live authority, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P136 remains governed by its own implementation-grade subphase contract.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P135.7 Identity Tenant Roles Permissions Final Validation Report", phase: "P135.7" },
);

printCheckReport("P135.7 Identity Tenant Roles Permissions Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
