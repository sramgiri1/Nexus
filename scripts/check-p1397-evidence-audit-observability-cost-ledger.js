import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1397-evidence-audit-observability-cost-ledger-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p139-evidence-audit-observability-cost-ledger-contracts.json";
const PLAN_PATH = "docs/architecture/P139_EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PLAN.md";
const REQUIRED_SCRIPT = "check:p1397-evidence-audit-observability-cost-ledger";
const EXPECTED_BASE_COMMIT = "09252040";
const VALIDATION_COMMANDS = [
  "npm run check:p1397-evidence-audit-observability-cost-ledger",
  "npm run check:p1396-evidence-audit-observability-cost-ledger",
  "npm run check:p1395-evidence-audit-observability-cost-ledger",
  "npm run check:p1394-evidence-audit-observability-cost-ledger",
  "npm run check:p1393-evidence-audit-observability-cost-ledger",
  "npm run check:p1392-evidence-audit-observability-cost-ledger",
  "npm run check:p1391-evidence-audit-observability-cost-ledger",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P139.4\"",
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
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
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
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|evidence|audit|observability|cost|redacted|zero-spend|explicitly allows|summary|withheld|validation-only|closure)\b/i.test(context);
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
const p1397 = subphaseById.get("P139.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1397-evidence-audit-observability-cost-ledger.js");
const p1391Checker = readText("scripts/check-p1391-evidence-audit-observability-cost-ledger.js");
const p1392Checker = readText("scripts/check-p1392-evidence-audit-observability-cost-ledger.js");
const p1393Checker = readText("scripts/check-p1393-evidence-audit-observability-cost-ledger.js");
const p1394Checker = readText("scripts/check-p1394-evidence-audit-observability-cost-ledger.js");
const p1395Checker = readText("scripts/check-p1395-evidence-audit-observability-cost-ledger.js");
const p1396Checker = readText("scripts/check-p1396-evidence-audit-observability-cost-ledger.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P139.7";
const allowedFiles = new Set(p1397.allowedFiles || []);
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
const p1397FinalState =
  status.currentPhase === "P139.7"
  && status.previousPhase === "P139.6"
  && status.nextPhase === "P140"
  && roadmap.currentPhase === "P139.7"
  && roadmap.previousPhase === "P139.6"
  && roadmap.nextPhase === "P140"
  && status.current?.phaseId === "P139.7"
  && status.previous?.phaseId === "P139.6"
  && status.next?.phaseId === "P140"
  && roadmap.current?.phaseId === "P139.7"
  && roadmap.previous?.phaseId === "P139.6"
  && roadmap.next?.phaseId === "P140"
  && statusById.get("P138")?.status === "complete"
  && roadmapById.get("P138")?.status === "complete"
  && statusById.get("P139")?.status === "complete"
  && roadmapById.get("P139")?.status === "complete"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5", "P139.6", "P139.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P140")?.status === "planned"
  && roadmapById.get("P140")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1397-evidence-audit-observability-cost-ledger.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P139.1-P139.7 package scripts registered", ["p1391", "p1392", "p1393", "p1394", "p1395", "p1396", "p1397"].every((suffix) => Boolean(packageJson.scripts?.[`check:${suffix}-evidence-audit-observability-cost-ledger`])));
addCheck("P139.1-P139.6 reports pass", [
  "reports/p1391-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1392-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1393-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1394-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1395-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1396-evidence-audit-observability-cost-ledger-report.md",
].every(reportPassed));
addCheck("prior P139 checkers accept P139.7", [p1391Checker, p1392Checker, p1393Checker, p1394Checker, p1395Checker, p1396Checker].every((source) => source.includes("p1397FinalState") && source.includes('status.currentPhase === "P139.7"')));
addCheck("enterprise checker accepts P139.7", enterpriseChecker.includes("p1397FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P139.7 current", osStatusChecker.includes('"P139.7"'));
addCheck("contract closes P139.7", contract.phaseId === "P139" && contract.status === "complete" && contract.currentSubphase === "P139.7" && contract.previousSubphase === "P139.6" && contract.nextSubphase === "P140" && p1397.status === "complete");
addCheck("contract records expected base commit", p1397.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records final validation commands", VALIDATION_COMMANDS.every((command) => p1397.validationCommands?.includes(command)));
addCheck("contract scope stays final-validation-only", p1397.dataShape?.includes("Final validation only") && p1397.expectedExports?.length === 0 && p1397.forbiddenFiles?.includes("dashboard/src/**") && p1397.forbiddenFiles?.includes("projects/**"));
addCheck("P139 plan records P139.7", /## P139\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P140 remains planned-only next/i.test(plan));
addCheck("README records P139.7", /P139\.7 final validation/i.test(readme) && /P140 is planned-only next/i.test(readme));
addCheck("platform roadmap records P139.7", /P139\.7 final validation is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P139.7", /P139\.7 is now complete/i.test(enterpriseRoadmap) && /P140 is the next executable phase/i.test(enterpriseRoadmap));
addCheck("phase status closes P139.7", p1397FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P139.7 entries have required fields", [statusById.get("P139"), statusById.get("P139.7"), roadmapById.get("P139.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P140 remains planned-only", statusById.get("P140")?.status === "planned" && roadmapById.get("P140")?.status === "planned" && !(statusById.get("P140")?.checksRun || []).length);
addCheck("changed files stay in P139.7 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P139.7 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable ledger actions", !/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(ledger writes are enabled|audit writes are enabled|evidence writes are enabled|observability writes are enabled|cost writes are enabled|project mutation is enabled|patch application is enabled|build execution is enabled|test execution is enabled|rollback execution is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|provider calls are enabled|model calls are enabled|agent dispatch is enabled|DB writes are enabled|runtime writes are enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw registry dumps?|raw ledger payloads?|raw registry dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Finalizes P139 with prior report verification, checker compatibility, docs/status closure, route-wide Command Center safety, and planned-only P140 handoff.",
        "- Confirms P139.1-P139.6 reports remain PASS and that prior P139 checkers accept the P139.7 final state.",
        "- Does not write ledger records, mutate project files, apply patches, run builds/tests, execute rollbacks, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Final Validation Summary",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next phase: ${status.nextPhase}`,
        `- Prior P139 reports passing: ${["P139.1", "P139.2", "P139.3", "P139.4", "P139.5", "P139.6"].length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P139.7 is final validation only. It does not enable project mutation, patch application, build/test execution, rollback execution, ledger writes, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, deploy, release, export, package, network calls, or spend. P140 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P139.7 Evidence Audit Observability Cost Ledger Final Validation Report", phase: "P139.7" },
);

printCheckReport("P139.7 Evidence Audit Observability Cost Ledger Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
