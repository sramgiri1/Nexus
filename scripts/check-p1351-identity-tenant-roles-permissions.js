import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1351-identity-tenant-roles-permissions-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p135-identity-tenant-roles-permissions-contracts.json";
const PLAN_PATH = "docs/architecture/P135_IDENTITY_TENANT_ROLES_PERMISSIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1351-identity-tenant-roles-permissions";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|read-only|checker|report|docs?|roadmap|status|boundary)\b/i.test(context);
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
const p1351 = subphaseById.get("P135.1") || {};
const p1352 = subphaseById.get("P135.2") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1347Checker = readText("scripts/check-p1347-durable-db-crud-runtime-final-validation.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1351-identity-tenant-roles-permissions.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P135.1";
const validationCommands = [
  "npm run check:p1351-identity-tenant-roles-permissions",
  "npm run check:p1347-durable-db-crud-runtime-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const expectedSubphases = ["P135.1", "P135.2", "P135.3", "P135.4", "P135.5", "P135.6", "P135.7"];
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1351-identity-tenant-roles-permissions.js",
  "scripts/check-p1347-durable-db-crud-runtime-final-validation.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1347-durable-db-crud-runtime-final-validation-report.md",
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
const p1351StartedState =
  status.currentPhase === "P135.1"
  && status.previousPhase === "P134.7"
  && status.nextPhase === "P135.2"
  && roadmap.currentPhase === "P135.1"
  && roadmap.previousPhase === "P134.7"
  && roadmap.nextPhase === "P135.2"
  && status.current?.phaseId === "P135.1"
  && status.previous?.phaseId === "P134.7"
  && status.next?.phaseId === "P135.2"
  && roadmap.current?.phaseId === "P135.1"
  && roadmap.previous?.phaseId === "P134.7"
  && roadmap.next?.phaseId === "P135.2"
  && statusById.get("P134")?.status === "complete"
  && roadmapById.get("P134")?.status === "complete"
  && statusById.get("P134.7")?.status === "complete"
  && roadmapById.get("P134.7")?.status === "complete"
  && statusById.get("P135")?.status === "in_progress"
  && roadmapById.get("P135")?.status === "in_progress"
  && statusById.get("P135.1")?.status === "complete"
  && roadmapById.get("P135.1")?.status === "complete"
  && statusById.get("P135.2")?.status === "planned"
  && roadmapById.get("P135.2")?.status === "planned";
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
  && expectedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136")?.status === "planned"
  && roadmapById.get("P136")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract starts P135 safely", contract.phaseId === "P135" && ((contract.status === "in_progress" && ((contract.currentSubphase === "P135.1" && contract.previousSubphase === "P134.7" && contract.nextSubphase === "P135.2") || (contract.currentSubphase === "P135.2" && contract.previousSubphase === "P135.1" && contract.nextSubphase === "P135.3"))) || (p1357FinalState && contract.status === "complete" && contract.currentSubphase === "P135.7" && contract.previousSubphase === "P135.6" && contract.nextSubphase === "P136")));
addCheck("contract has seven implementation-grade subphases", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && expectedSubphases.every((phaseId) => subphaseById.get(phaseId)?.scopeClassification === "NEXUS_OS_CHANGE"));
addCheck("P135.1 complete and P135.2 planned or complete", p1351.status === "complete" && ["planned", "complete"].includes(p1352.status));
addCheck("P135.1 records safety boundary", p1351.safetyRules?.join(" ").includes("Do not enable login") && p1351.safetyRules?.join(" ").includes("Do not mutate tenants") && p1351.safetyRules?.join(" ").includes("Do not enforce permissions") && p1351.forbiddenFiles?.includes("db/**") && p1351.forbiddenFiles?.includes("local-state/runtime/**"));
addCheck("P135.1 records validation commands", validationCommands.every((command) => p1351.validationCommands?.includes(command)));
addCheck("P134.7 report passes", reportPassed("reports/p1347-durable-db-crud-runtime-final-validation-report.md"));
addCheck("P134.7 checker accepts P135.1 handoff", p1347Checker.includes("p1351StartedState") && p1347Checker.includes('status.currentPhase === "P135.1"'));
addCheck("enterprise checker accepts P135.1", enterpriseChecker.includes("p1351StartedState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P135 subphases", ["P135", "P135.1", "P135.2"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P135 plan records P135.1", /## P135\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P135.1", /P135\.1 identity\/tenant\/RBAC contract/i.test(readme));
addCheck("platform roadmap records P135.1", /P135\.1 identity\/tenant\/RBAC contract is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P135.1", /P135\.1 is now complete/i.test(enterpriseRoadmap) && (/P135\.2 is the next executable subphase/i.test(enterpriseRoadmap) || /P135\.2 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status starts P135.1", p1351StartedState || p1352CurrentState || p1357FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P135.1 entries have required fields", [statusById.get("P135"), statusById.get("P135.1"), roadmapById.get("P135.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P135.2 remains planned or safely handed off", (statusById.get("P135.2")?.status === "planned" && roadmapById.get("P135.2")?.status === "planned" && !(statusById.get("P135.2")?.checksRun || []).length) || p1352CurrentState || p1357FinalState);
addCheck(
  "changed files stay in P135.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P135.1 forbidden path check relaxed for ${status.currentPhase}`,
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
        "- Starts P135 Identity, Tenant, Roles, and Permissions with contract, policy, safety boundary, checker, docs, status, and report evidence.",
        "- Defines the staged identity/tenant/RBAC path without creating auth schemas, tenant stores, role stores, permission engines, session adapters, auth providers, DB/runtime writes, or permission execution.",
        "- Confirms this subphase does not call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P135.1 is contract/policy/safety-boundary work only. It does not enable login, sessions, tenant mutation, role mutation, permission grants, permission enforcement, auth providers, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P135.1 Identity Tenant Roles Permissions Report", phase: "P135.1" },
);

printCheckReport("P135.1 Identity Tenant Roles Permissions Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
