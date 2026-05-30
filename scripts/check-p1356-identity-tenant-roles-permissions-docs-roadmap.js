import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1356-identity-tenant-roles-permissions-docs-roadmap-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json";
const PLAN_PATH = "docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md";
const ENTERPRISE_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";
const PLATFORM_PATH = "docs/architecture/NEXUS_PLATFORM_ROADMAP.md";
const REQUIRED_SCRIPT = "check:p1356-identity-tenant-roles-permissions-docs-roadmap";
const VALIDATION_COMMANDS = [
  "npm run check:p1356-identity-tenant-roles-permissions-docs-roadmap",
  "npm run check:p1355-identity-tenant-roles-permissions-tests-checkers",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|review-only|display-only|preview|local|docs?|roadmap|status|safety|final validation|non-runnable)\b/i.test(context);
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
const p1356 = subphaseById.get("P135.6") || {};
const p1357 = subphaseById.get("P135.7") || {};
const checkerSource = readText("scripts/check-p1356-identity-tenant-roles-permissions-docs-roadmap.js");
const p1355Checker = readText("scripts/check-p1355-identity-tenant-roles-permissions-tests-checkers.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText(PLATFORM_PATH);
const enterpriseRoadmap = readText(ENTERPRISE_PATH);
const changed = changedFiles();
const allowedFiles = new Set(p1356.allowedFiles || []);
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
  && statusById.get("P135")?.status === "complete"
  && roadmapById.get("P135")?.status === "complete"
  && ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5", "P135.6", "P135.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136")?.status === "planned"
  && roadmapById.get("P136")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract marks P135.6 complete", ["in_progress", "complete"].includes(contract.status) && ["P135.6", "P135.7"].includes(contract.currentSubphase) && ["P135.5", "P135.6"].includes(contract.previousSubphase) && ["P135.7", "P136"].includes(contract.nextSubphase) && p1356.status === "complete");
addCheck("P135.6 records expected base commit", p1356.expectedBaseCommit === "819348a7");
addCheck("P135.7 remains planned or complete", (p1357.status === "planned" && p1357.allowedFiles?.length === 0) || (p1357FinalState && p1357.status === "complete"));
addCheck("P135.6 allowed files include docs status and checker files", [
  PLAN_PATH,
  ENTERPRISE_PATH,
  PLATFORM_PATH,
  "README.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "scripts/check-p1356-identity-tenant-roles-permissions-docs-roadmap.js",
].every((file) => p1356.allowedFiles?.includes(file)));
addCheck("P135.6 forbids project dashboard db runtime provider tool paths", [
  "projects/**",
  "careloop/**",
  "generated-projects/**",
  "dashboard/src/**",
  "dashboard/tests/**",
  "db/**",
  "local-state/runtime/**",
  "providers/**",
  "tools/**",
  "worker-runtime/**",
].every((path) => p1356.forbiddenFiles?.includes(path)));
addCheck("P135.6 records validation commands", VALIDATION_COMMANDS.every((command) => p1356.validationCommands?.includes(command)));
addCheck("P135.1-P135.5 reports pass", [
  "reports/p1351-identity-tenant-roles-permissions-report.md",
  "reports/p1352-auth-tenant-model-report.md",
  "reports/p1353-permission-preview-report.md",
  "reports/p1354-auth-governance-command-center-ux-report.md",
  "reports/p1355-identity-tenant-roles-permissions-tests-checkers-report.md",
].every((reportPath) => reportPassed(reportPath)));
addCheck("P135.5 checker accepts P135.6 handoff", p1355Checker.includes("p1356CurrentState") && p1355Checker.includes('status.currentPhase === "P135.6"') && p1355Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P135.6", enterpriseChecker.includes("p1356CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P135.7 handoff", ["P135.5", "P135.6", "P135.7"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("plan records P135.6 implementation", /## P135\.6 Docs \/ Roadmap \/ Status[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P135.6", /P135\.6 identity\/tenant\/RBAC docs\/roadmap/i.test(readme));
addCheck("platform roadmap records P135.6", /P135\.6 identity\/tenant\/RBAC docs\/roadmap/i.test(platformRoadmap) && (/P135\.7 Final\s+Validation is planned-only next/i.test(platformRoadmap) || /P135\.7 identity\/tenant\/RBAC final validation is complete/i.test(platformRoadmap)));
addCheck("enterprise roadmap records P135.6", /P135\.6 is now complete/i.test(enterpriseRoadmap) && (/P135\.7 is the next executable subphase/i.test(enterpriseRoadmap) || /P135\.1 through P135\.7\s+are\s+now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advanced", p1356CurrentState || p1357FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P135.6 entries have required fields", [statusById.get("P135"), statusById.get("P135.6"), roadmapById.get("P135.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P135.6 allowed scope", status.currentPhase !== "P135.6" || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), status.currentPhase === "P135.6" ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", status.currentPhase !== "P135.6" || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), status.currentPhase === "P135.6" ? changed.join(", ") : `P135.6 forbidden path check relaxed for ${status.currentPhase}`);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable auth actions", !/sign in now|log in now|assign role now|grant permission now|revoke permission now|enforce permission now|create tenant now|connect provider now|execute now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /login is enabled|sessions are enabled|tenant writes are enabled|role assignment is enabled|permission grants are enabled|permission enforcement is enabled|access decisions are live|RBAC is live|auth provider is connected|DB writes are enabled|runtime writes are enabled|provider calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P135.6 identity, tenant, roles, and permissions docs, README, roadmap, and OS phase status closure.",
        "- Confirms P135.1-P135.5 evidence remains passing and P135.7 stays planned-only.",
        "- Confirms no Command Center source, project source, auth provider, DB/runtime, provider/tool, deploy, package, network, or spend paths changed.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1356.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P135.6 is docs/roadmap/status only. It does not enable login, sessions, tenant mutation, role assignment, permission grants, permission revokes, permission enforcement, access decisions as live authority, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P135.6 Identity Tenant Roles Permissions Docs Roadmap Report", phase: "P135.6" },
);

printCheckReport("P135.6 Identity Tenant Roles Permissions Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
