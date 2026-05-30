import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1366-secrets-providers-tool-governance-docs-roadmap-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json";
const PLAN_PATH = "docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md";
const ENTERPRISE_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";
const PLATFORM_PATH = "docs/architecture/NEXUS_PLATFORM_ROADMAP.md";
const REQUIRED_SCRIPT = "check:p1366-secrets-providers-tool-governance-docs-roadmap";
const VALIDATION_COMMANDS = [
  "npm run check:p1366-secrets-providers-tool-governance-docs-roadmap",
  "npm run check:p1365-secrets-providers-tool-governance-tests-checkers",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|review-only|model|checker|report|docs?|roadmap|status|boundary|non-runnable|zero-spend|display-safe|tests?|coverage|final validation)\b/i.test(context);
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
const p1366 = subphaseById.get("P136.6") || {};
const p1367 = subphaseById.get("P136.7") || {};
const checkerSource = readText("scripts/check-p1366-secrets-providers-tool-governance-docs-roadmap.js");
const p1365Checker = readText("scripts/check-p1365-secrets-providers-tool-governance-tests-checkers.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText(PLATFORM_PATH);
const enterpriseRoadmap = readText(ENTERPRISE_PATH);
const changed = changedFiles();
const allowedFiles = new Set(p1366.allowedFiles || []);
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
const p1366CurrentState =
  status.currentPhase === "P136.6"
  && status.previousPhase === "P136.5"
  && status.nextPhase === "P136.7"
  && roadmap.currentPhase === "P136.6"
  && roadmap.previousPhase === "P136.5"
  && roadmap.nextPhase === "P136.7"
  && status.current?.phaseId === "P136.6"
  && status.previous?.phaseId === "P136.5"
  && status.next?.phaseId === "P136.7"
  && roadmap.current?.phaseId === "P136.6"
  && roadmap.previous?.phaseId === "P136.5"
  && roadmap.next?.phaseId === "P136.7"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5", "P136.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136.7")?.status === "planned"
  && roadmapById.get("P136.7")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract marks P136.6 complete", contract.status === "in_progress" && contract.currentSubphase === "P136.6" && contract.previousSubphase === "P136.5" && contract.nextSubphase === "P136.7" && p1366.status === "complete" && p1367.status === "planned");
addCheck("P136.6 records expected base commit", p1366.expectedBaseCommit === "febd58f5");
addCheck("P136.7 remains planned-only", p1367.status === "planned" && statusById.get("P136.7")?.status === "planned" && roadmapById.get("P136.7")?.status === "planned" && !(statusById.get("P136.7")?.checksRun || []).length);
addCheck("P136.6 allowed files include docs status and checker files", [
  PLAN_PATH,
  ENTERPRISE_PATH,
  PLATFORM_PATH,
  "README.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1366-secrets-providers-tool-governance-docs-roadmap.js",
  "scripts/check-p1365-secrets-providers-tool-governance-tests-checkers.js",
].every((file) => p1366.allowedFiles?.includes(file)));
addCheck("P136.6 forbids project dashboard db runtime provider tool paths", [
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
].every((path) => p1366.forbiddenFiles?.includes(path)));
addCheck("P136.6 records validation commands", VALIDATION_COMMANDS.every((command) => p1366.validationCommands?.includes(command)));
addCheck("P136.1-P136.5 reports pass", [
  "reports/p1361-secrets-providers-tool-governance-report.md",
  "reports/p1362-secret-provider-model-report.md",
  "reports/p1363-provider-dry-run-report.md",
  "reports/p1364-provider-governance-command-center-ux-report.md",
  "reports/p1365-secrets-providers-tool-governance-tests-checkers-report.md",
].every((reportPath) => reportPassed(reportPath)));
addCheck("P136.5 checker accepts P136.6 handoff", p1365Checker.includes("p1366CurrentState") && p1365Checker.includes('status.currentPhase === "P136.6"') && p1365Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P136.6", enterpriseChecker.includes("p1366CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P136.7 handoff", ["P136.5", "P136.6", "P136.7"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("plan records P136.6 implementation", /### P136\.6 Docs \/ Roadmap \/ Status[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P136.6", /P136\.6 secrets\/providers\/tool governance docs\/roadmap/i.test(readme));
addCheck("platform roadmap records P136.6", /P136\.6 secrets\/providers\/tool governance docs\/roadmap/i.test(platformRoadmap) && /P136\.7\s+Final Validation is planned-only next/i.test(platformRoadmap));
addCheck("enterprise roadmap records P136.6", /P136\.6 is now complete/i.test(enterpriseRoadmap) && /P136\.7 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status advanced", p1366CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P136.6 entries have required fields", [statusById.get("P136"), statusById.get("P136.6"), roadmapById.get("P136.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P136.6 allowed scope", status.currentPhase !== "P136.6" || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), status.currentPhase === "P136.6" ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", status.currentPhase !== "P136.6" || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), status.currentPhase === "P136.6" ? changed.join(", ") : `P136.6 forbidden path check relaxed for ${status.currentPhase}`);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable provider/tool actions", !/call provider now|call model now|run tool now|execute tool now|start mcp now|rotate secret now|create secret now|validate secret now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /secret values are stored|provider calls are enabled|model calls are enabled|tool execution is enabled|MCP servers are enabled|network calls are enabled|provider spend is enabled|budget spending is enabled|approval writes are enabled|DB writes are enabled|runtime writes are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P136.6 secrets/providers/tool governance docs, README, roadmap, and OS phase status closure.",
        "- Confirms P136.1-P136.5 evidence remains passing and P136.7 stays planned-only.",
        "- Confirms no Command Center source, dashboard tests, project source, DB/runtime, provider/tool, worker, deploy, release, export, package, env, network, or spend paths changed.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1366.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P136.6 is docs/roadmap/status only. It does not create secret stores, provider adapters, model clients, tool executors, MCP servers, approval writers, budget ledgers, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P136.6 Secrets Providers Tool Governance Docs Roadmap Report", phase: "P136.6" },
);

printCheckReport("P136.6 Secrets Providers Tool Governance Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
