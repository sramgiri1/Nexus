import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1361-secrets-providers-tool-governance-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json";
const PLAN_PATH = "docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1361-secrets-providers-tool-governance";
const VALIDATION_COMMANDS = [
  "npm run check:p1361-secrets-providers-tool-governance",
  "npm run check:p1357-identity-tenant-roles-permissions-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const EXPECTED_SUBPHASES = ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5", "P136.6", "P136.7"];
const REQUIRED_SUBPHASE_FIELDS = [
  "narrowGoal",
  "startingBranch",
  "expectedBaseCommit",
  "allowedFiles",
  "forbiddenFiles",
  "exactFilesToCreateOrUpdate",
  "expectedExports",
  "dataShape",
  "commandCenterUx",
  "themeRequirements",
  "testsAndCheckers",
  "docsRoadmap",
  "phaseStatusUpdate",
  "validationCommands",
  "finalSafetyChecks",
  "gitCommands",
  "finalResponseChecklist",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|read-only|checker|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence)\b/i.test(context);
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
const p1361 = subphaseById.get("P136.1") || {};
const p1362 = subphaseById.get("P136.2") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1357Checker = readText("scripts/check-p1357-identity-tenant-roles-permissions-final-validation.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1361-secrets-providers-tool-governance.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P136.1";
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1361-secrets-providers-tool-governance.js",
  "scripts/check-p1357-identity-tenant-roles-permissions-final-validation.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1357-identity-tenant-roles-permissions-final-validation-report.md",
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
  && statusById.get("P135")?.status === "complete"
  && roadmapById.get("P135")?.status === "complete"
  && statusById.get("P135.7")?.status === "complete"
  && roadmapById.get("P135.7")?.status === "complete"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && roadmapById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "planned"
  && roadmapById.get("P136.2")?.status === "planned";

const p1362CurrentState =
  status.currentPhase === "P136.2"
  && status.previousPhase === "P136.1"
  && status.nextPhase === "P136.3"
  && roadmap.currentPhase === "P136.2"
  && roadmap.previousPhase === "P136.1"
  && roadmap.nextPhase === "P136.3"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && statusById.get("P136.1")?.status === "complete"
  && roadmapById.get("P136.1")?.status === "complete"
  && statusById.get("P136.2")?.status === "complete"
  && roadmapById.get("P136.2")?.status === "complete"
  && statusById.get("P136.3")?.status === "planned"
  && roadmapById.get("P136.3")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract starts P136 safely", contract.phaseId === "P136" && contract.status === "in_progress" && ((contract.currentSubphase === "P136.1" && contract.previousSubphase === "P135.7" && contract.nextSubphase === "P136.2") || (contract.currentSubphase === "P136.2" && contract.previousSubphase === "P136.1" && contract.nextSubphase === "P136.3")));
addCheck("contract has seven implementation-grade subphases", EXPECTED_SUBPHASES.every((phaseId) => subphaseById.has(phaseId)) && EXPECTED_SUBPHASES.every((phaseId) => subphaseById.get(phaseId)?.scopeClassification === "NEXUS_OS_CHANGE") && EXPECTED_SUBPHASES.every((phaseId) => REQUIRED_SUBPHASE_FIELDS.every((field) => Object.hasOwn(subphaseById.get(phaseId) || {}, field))));
addCheck("P136.1 complete and P136.2 planned or complete", p1361.status === "complete" && ["planned", "complete"].includes(p1362.status));
addCheck("P136.1 records safety boundary", p1361.safetyRules?.join(" ").includes("Do not create, read, print, persist, rotate, validate, or expose secret values") && p1361.safetyRules?.join(" ").includes("Do not connect providers") && p1361.safetyRules?.join(" ").includes("Do not execute tools") && p1361.forbiddenFiles?.includes("providers/**") && p1361.forbiddenFiles?.includes("tools/**") && p1361.forbiddenFiles?.includes("db/**"));
addCheck("P136.1 records validation commands", VALIDATION_COMMANDS.every((command) => p1361.validationCommands?.includes(command)));
addCheck("P135.7 report passes", reportPassed("reports/p1357-identity-tenant-roles-permissions-final-validation-report.md"));
addCheck("P135.7 checker accepts P136.1 handoff", p1357Checker.includes("p1361StartedState") && p1357Checker.includes('status.currentPhase === "P136.1"'));
addCheck("enterprise checker accepts P136.1", enterpriseChecker.includes("p1361StartedState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P136 subphases", ["P136", "P136.1", "P136.2"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P136 plan records P136.1", /## P136\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P136.1", /P136\.1 secrets\/providers\/tool governance contract/i.test(readme));
addCheck("platform roadmap records P136.1", /P136\.1 secrets\/providers\/tool governance contract is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P136.1", /P136\.1 is now complete/i.test(enterpriseRoadmap) && /P136\.2 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status starts P136.1", p1361StartedState || p1362CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P136.1 entries have required fields", [statusById.get("P136"), statusById.get("P136.1"), roadmapById.get("P136.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P136.2 remains planned or safely handed off", (statusById.get("P136.2")?.status === "planned" && roadmapById.get("P136.2")?.status === "planned" && !(statusById.get("P136.2")?.checksRun || []).length) || p1362CurrentState);
addCheck(
  "changed files stay in P136.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P136.1 forbidden path check relaxed for ${status.currentPhase}`,
);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable provider/tool actions", !/call provider now|call model now|run tool now|execute tool now|start mcp now|rotate secret now|create secret now|validate secret now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /secret values are stored|provider calls are enabled|model calls are enabled|tool execution is enabled|MCP servers are enabled|network calls are enabled|provider spend is enabled|budget spending is enabled|approval writes are enabled|DB writes are enabled|runtime writes are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw provider payload|raw secret/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Starts P136 Secrets, Providers, and Tool Governance with contract, policy, safety boundary, checker, docs, status, and report evidence.",
        "- Defines the staged provider/tool governance path without creating secret stores, provider adapters, model clients, tool executors, MCP servers, budget ledgers, approval writers, DB/runtime writers, or live execution.",
        "- Confirms this subphase does not call providers/models, execute tools, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P136.1 is contract/policy/safety-boundary work only. It does not create secret stores, provider adapters, model clients, tool executors, MCP servers, budget ledgers, approval writers, DB/runtime writes, dashboard source, Playwright source, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P136.2 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P136.1 Secrets Providers Tool Governance Report", phase: "P136.1" },
);

printCheckReport("P136.1 Secrets Providers Tool Governance Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
