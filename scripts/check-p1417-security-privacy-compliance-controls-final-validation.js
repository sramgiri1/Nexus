import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1417-security-privacy-compliance-controls-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p141-security-privacy-compliance-controls-contracts.json";
const PLAN_PATH = "docs/architecture/P141_SECURITY_PRIVACY_COMPLIANCE_CONTROLS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1417-security-privacy-compliance-controls-final-validation";
const EXPECTED_BASE_COMMIT = "6d483b96";
const PRIOR_REPORTS = [
  "reports/p1411-security-privacy-compliance-controls-report.md",
  "reports/p1412-security-privacy-compliance-controls-report.md",
  "reports/p1413-security-privacy-compliance-controls-report.md",
  "reports/p1414-security-privacy-compliance-controls-report.md",
  "reports/p1415-security-privacy-compliance-controls-report.md",
  "reports/p1416-security-privacy-compliance-controls-docs-roadmap-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1417-security-privacy-compliance-controls-final-validation",
  "npm run check:p1416-security-privacy-compliance-controls-docs-roadmap",
  "npm run check:p1415-security-privacy-compliance-controls",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P141.7|Compliance|Command Center route-wide UX\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|coverage|tests?|ux|closure|final validation|handoff)\b/i.test(context);
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
const p141 = statusById.get("P141") || {};
const p141Roadmap = roadmapById.get("P141") || {};
const p1417 = subphaseById.get("P141.7") || {};
const checkerSource = readText("scripts/check-p1417-security-privacy-compliance-controls-final-validation.js");
const p1416Checker = readText("scripts/check-p1416-security-privacy-compliance-controls-docs-roadmap.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P141.7";
const allowedFiles = new Set(p1417.allowedFiles || []);
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

const p1417FinalState =
  status.currentPhase === "P141.7"
  && status.previousPhase === "P141.6"
  && status.nextPhase === "P142"
  && roadmap.currentPhase === "P141.7"
  && roadmap.previousPhase === "P141.6"
  && roadmap.nextPhase === "P142"
  && status.current?.phaseId === "P141.7"
  && status.previous?.phaseId === "P141.6"
  && status.next?.phaseId === "P142"
  && roadmap.current?.phaseId === "P141.7"
  && roadmap.previous?.phaseId === "P141.6"
  && roadmap.next?.phaseId === "P142"
  && p141.status === "complete"
  && p141Roadmap.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "planned"
  && roadmapById.get("P142")?.status === "planned";
const p1421StartedState =
  status.currentPhase === "P142.1"
  && status.previousPhase === "P141.7"
  && status.nextPhase === "P142.2"
  && roadmap.currentPhase === "P142.1"
  && roadmap.previousPhase === "P141.7"
  && roadmap.nextPhase === "P142.2"
  && status.current?.phaseId === "P142.1"
  && status.previous?.phaseId === "P141.7"
  && status.next?.phaseId === "P142.2"
  && roadmap.current?.phaseId === "P142.1"
  && roadmap.previous?.phaseId === "P141.7"
  && roadmap.next?.phaseId === "P142.2"
  && p141.status === "complete"
  && p141Roadmap.status === "complete"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5", "P141.6", "P141.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P142")?.status === "in_progress"
  && roadmapById.get("P142")?.status === "in_progress"
  && statusById.get("P142.1")?.status === "complete"
  && roadmapById.get("P142.1")?.status === "complete"
  && statusById.get("P142.2")?.status === "planned"
  && roadmapById.get("P142.2")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1417-security-privacy-compliance-controls-final-validation.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P141 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("P141.6 checker accepts P141.7 final state", p1416Checker.includes("p1417FinalState") && p1416Checker.includes('status.currentPhase === "P141.7"'));
addCheck("enterprise checker accepts P141.7 final state", enterpriseChecker.includes("p1417FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P142 handoff", osStatusChecker.includes('"P142"'));
addCheck("contract closes P141.7", contract.phaseId === "P141" && contract.status === "complete" && contract.currentSubphase === "P141.7" && contract.previousSubphase === "P141.6" && contract.nextSubphase === "P142" && p1417.status === "complete");
addCheck("contract records expected base commit", p1417.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1417.validationCommands?.includes(command)));
addCheck("contract scope stays validation-only", /final validation|validation-only|status|report/i.test(p1417.dataShape || "") && p1417.expectedExports?.length === 0 && p1417.forbiddenFiles?.includes("dashboard/src/**") && p1417.forbiddenFiles?.includes("projects/**"));
addCheck("docs record P141.7 and P142 handoff", /## P141\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P141\.7 final validation is complete/i.test(readme) && /P141\.7 final validation is complete/i.test(platformRoadmap) && /P141\.7 is now complete/i.test(enterpriseRoadmap) && (/P142 is the next executable phase/i.test(enterpriseRoadmap) || /P142\.1 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status closes P141.7", p1417FinalState || p1421StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P141/P141.7 entries have required fields", [p141, statusById.get("P141.7"), p141Roadmap, roadmapById.get("P141.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P141.7 remains on OS Roadmap track", [status.current, roadmap.current, statusById.get("P141.7"), roadmapById.get("P141.7")].every((entry) => entry?.track === "NEXUS_OS"));
addCheck("P142 handoff remains safe", p1417FinalState
  ? [statusById.get("P142"), roadmapById.get("P142")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)
  : p1421StartedState);
addCheck("P141.7 Playwright coverage exists", p1421StartedState
  ? routeTests.includes("P142.1 admin operations contract starts P142 and keeps Compliance display-only") && routeTests.includes("P142.1") && routeTests.includes("Contract / Policy / Safety Boundary") && routeTests.includes("Admin Operations and Runtime Settings")
  : routeTests.includes("P141.7 final validation closes P141 and keeps Compliance display-only") && routeTests.includes("P141.7") && routeTests.includes("Final Validation") && routeTests.includes("Admin Operations and Runtime Settings"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage", "Compliance route renders readiness without runnable certification actions"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P141.7 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
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
        "- Closes P141.7 final validation for security, privacy, and compliance controls.",
        "- Confirms P141.1-P141.6 reports still pass and P142 remains either planned-only or safely started at P142.1 contract-only.",
        "- Does not handle credentials, expose raw data, enforce policy, certify compliance, sign attestations, export audits, export logs, create compliance packages, write DB/runtime state, call providers/models, execute tools, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Final Validation Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next phase/subphase: ${status.nextPhase}`,
        `- Prior P141 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P141.7 is final validation only. It closes P141 but does not handle credentials, expose raw data, enforce policy at runtime, certify compliance, sign legal attestations, export audits, export raw logs, create compliance packages, write DB/runtime state, run live CRUD, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P142 may be safely started at P142.1 contract-only while runtime authority remains blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P141.7 Security Privacy Compliance Controls Final Validation Report", phase: "P141.7" },
);

printCheckReport("P141.7 Security Privacy Compliance Controls Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
