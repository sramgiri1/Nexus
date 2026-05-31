import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1416-security-privacy-compliance-controls-docs-roadmap-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json";
const PLAN_PATH = "docs/architecture/P141_SECURITY_PRIVACY_COMPLIANCE_CONTROLS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1416-security-privacy-compliance-controls-docs-roadmap";
const EXPECTED_BASE_COMMIT = "14ecdc56";
const PRIOR_REPORTS = [
  "reports/p1411-security-privacy-compliance-controls-report.md",
  "reports/p1412-security-privacy-compliance-controls-report.md",
  "reports/p1413-security-privacy-compliance-controls-report.md",
  "reports/p1414-security-privacy-compliance-controls-report.md",
  "reports/p1415-security-privacy-compliance-controls-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1416-security-privacy-compliance-controls-docs-roadmap",
  "npm run check:p1415-security-privacy-compliance-controls",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P141.6|Compliance|Command Center route-wide UX\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|read-only|display-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|validation-only|zero-spend|hidden|coverage|tests?|ux|closure)\b/i.test(context);
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
const p1416 = subphaseById.get("P141.6") || {};
const p1417 = subphaseById.get("P141.7") || {};
const checkerSource = readText("scripts/check-p1416-security-privacy-compliance-controls-docs-roadmap.js");
const p1415Checker = readText("scripts/check-p1415-security-privacy-compliance-controls.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P141.6";
const allowedFiles = new Set(p1416.allowedFiles || []);
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
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;

const p1416CurrentState =
  status.currentPhase === "P141.6"
  && status.previousPhase === "P141.5"
  && status.nextPhase === "P141.7"
  && roadmap.currentPhase === "P141.6"
  && roadmap.previousPhase === "P141.5"
  && roadmap.nextPhase === "P141.7"
  && status.current?.phaseId === "P141.6"
  && status.previous?.phaseId === "P141.5"
  && status.next?.phaseId === "P141.7"
  && roadmap.current?.phaseId === "P141.6"
  && roadmap.previous?.phaseId === "P141.5"
  && roadmap.next?.phaseId === "P141.7"
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141.7")?.status === "planned"
  && roadmapById.get("P141.7")?.status === "planned";
const p1417FinalState =
  status.currentPhase === "P141.7"
  && status.previousPhase === "P141.6"
  && status.nextPhase === "P142"
  && roadmap.currentPhase === "P141.7"
  && roadmap.previousPhase === "P141.6"
  && roadmap.nextPhase === "P142"
  && statusById.get("P141")?.status === "complete"
  && roadmapById.get("P141")?.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "planned"
  && roadmapById.get("P142")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1416-security-privacy-compliance-controls-docs-roadmap.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P141.1-P141.5 reports pass", PRIOR_REPORTS.every(reportPassed));
addCheck("P141.5 checker accepts P141.6", p1415Checker.includes("p1416CurrentState") && p1415Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P141.6", enterpriseChecker.includes("p1416CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P141.7 handoff", osStatusChecker.includes('"P141.7"'));
addCheck("contract marks P141.6 complete", contract.phaseId === "P141" && p1416.status === "complete" && ((contract.status === "in_progress" && contract.currentSubphase === "P141.6" && contract.previousSubphase === "P141.5" && contract.nextSubphase === "P141.7" && p1417.status === "planned") || p1417FinalState));
addCheck("contract records expected base commit", p1416.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1416.validationCommands?.includes(command)));
addCheck("contract scope stays docs/status-only", /docs|roadmap|status/i.test(p1416.dataShape || "") && p1416.expectedExports?.length === 0 && p1416.forbiddenFiles?.includes("dashboard/src/**") && p1416.forbiddenFiles?.includes("projects/**"));
addCheck("docs record P141.6", /## P141\.6 Docs \/ Roadmap \/ Status[\s\S]*Status:\s+complete/.test(plan) && /P141\.6 Docs\s*\/\s*Roadmap\s*\/\s*Status is complete/i.test(readme) && /P141\.6 docs\/status closure is complete/i.test(platformRoadmap) && /P141\.6 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P141.6", p1416CurrentState || p1417FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P141.6 entries have required fields", [statusById.get("P141"), statusById.get("P141.6"), roadmapById.get("P141"), roadmapById.get("P141.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P141.7 handoff remains valid", (p1416CurrentState && statusById.get("P141.7")?.status === "planned" && roadmapById.get("P141.7")?.status === "planned" && !(statusById.get("P141.7")?.checksRun || []).length && !(roadmapById.get("P141.7")?.checksRun || []).length) || p1417FinalState);
addCheck("P141.6 Playwright coverage exists", routeTests.includes("P141.6 docs status closure keeps roadmap and Compliance display-only") && routeTests.includes("pending-final-commit") && routeTests.includes("P141.6 closes security, privacy, and compliance controls docs"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage", "Compliance route renders readiness without runnable certification actions"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P141.6 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), enforceCurrentDiffScope ? changed.join(", ") : `P141.6 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage|control|evidence|compliance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or export URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|export|package|compliance|storage|secret)/i.test(docsBundle));
addCheck("docs avoid fake runnable security actions", !/certify now|attest now|export audit now|export logs now|create package now|enforce policy now|handle credentials now|read secret now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /credentials are handled|raw data is exposed|policy enforcement is enabled|certification is enabled|legal attestation is enabled|audit export is enabled|raw log export is enabled|compliance package creation is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|tool execution is enabled|MCP startup is enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw compliance payload|raw audit payload|raw evidence payload|raw secret/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P141.6 docs, roadmap, OS phase status, reports, and checker handoffs for security, privacy, and compliance controls.",
        "- Confirms P141.1-P141.5 reports still pass and the P141.7 handoff remains valid.",
        "- Does not handle credentials, expose raw data, enforce policy, certify compliance, sign attestations, export audits, export logs, create compliance packages, write DB/runtime state, call providers/models, execute tools, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Docs Status Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Prior P141 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P141.6 is docs/status/checker closure only. It does not handle credentials, expose raw data, enforce policy at runtime, certify compliance, sign legal attestations, export audits, export raw logs, create compliance packages, write DB/runtime state, run live CRUD, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P141.6 Security Privacy Compliance Controls Docs Roadmap Report", phase: "P141.6" },
);

printCheckReport("P141.6 Security Privacy Compliance Controls Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
