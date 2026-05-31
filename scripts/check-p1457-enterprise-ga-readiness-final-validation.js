import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1457-enterprise-ga-readiness-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p145-enterprise-certification-ga-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P145_ENTERPRISE_CERTIFICATION_GA_READINESS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1457-enterprise-ga-readiness-final-validation";
const PRIOR_SCRIPT = "check:p1456-enterprise-ga-readiness-docs-roadmap";
const EXPECTED_BASE_COMMIT = "611da15b";
const PRIOR_REPORTS = [
  "reports/p1451-enterprise-certification-ga-readiness-report.md",
  "reports/p1452-enterprise-certification-matrix-report.md",
  "reports/p1453-enterprise-e2e-rehearsal-report.md",
  "reports/p1454-enterprise-command-center-ux-report.md",
  "reports/p1455-enterprise-ga-readiness-tests-report.md",
  "reports/p1456-enterprise-ga-readiness-docs-roadmap-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1457-enterprise-ga-readiness-final-validation",
  "npm run check:p1456-enterprise-ga-readiness-docs-roadmap",
  "npm run check:p1455-enterprise-ga-readiness-tests",
  "npm run check:p1454-enterprise-command-center-ux",
  "npm run check:p1453-enterprise-e2e-rehearsal",
  "npm run check:p1452-enterprise-certification-matrix",
  "npm run check:p1451-enterprise-certification-ga-readiness",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P145.7\"",
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

function allBooleanValuesFalse(value) {
  return Object.values(value || {})
    .filter((entry) => typeof entry === "boolean")
    .every((entry) => entry === false);
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    if (/^\s*expect\(|^\s*addCheck\(|^\s*\.replace\(|not\.toMatch|not\.toContain|must not|No raw|avoid raw/i.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|aggregate|coverage|closure|final validation|closed|complete|terminal)\b/i.test(context);
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
const p145 = statusById.get("P145") || {};
const p145Roadmap = roadmapById.get("P145") || {};
const p1457 = subphaseById.get("P145.7") || {};
const checkerSource = readText("scripts/check-p1457-enterprise-ga-readiness-final-validation.js");
const p1456Checker = readText("scripts/check-p1456-enterprise-ga-readiness-docs-roadmap.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const commandCenter = readText("dashboard/src/pages/CommandCenterV2.jsx");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P145.7";
const allowedFiles = new Set(p1457.allowedFiles || []);
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
const docsBundle = [
  JSON.stringify(contract),
  plan,
  readme,
  platformRoadmap,
  enterpriseRoadmap,
].join("\n");

const p1457FinalState =
  status.currentPhase === "P145.7"
  && status.previousPhase === "P145.6"
  && status.nextPhase === ""
  && roadmap.currentPhase === "P145.7"
  && roadmap.previousPhase === "P145.6"
  && roadmap.nextPhase === ""
  && status.current?.phaseId === "P145.7"
  && status.previous?.phaseId === "P145.6"
  && !status.next
  && roadmap.current?.phaseId === "P145.7"
  && roadmap.previous?.phaseId === "P145.6"
  && !roadmap.next
  && p145.status === "complete"
  && p145Roadmap.status === "complete"
  && ["P145.1", "P145.2", "P145.3", "P145.4", "P145.5", "P145.6", "P145.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete");

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1457-enterprise-ga-readiness-final-validation.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P145 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("P145.6 checker accepts P145.7 final state", p1456Checker.includes("p1457FinalState") && p1456Checker.includes('status.currentPhase === "P145.7"') && p1456Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P145.7 final state", enterpriseChecker.includes("p1457FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes terminal P145.7", osStatusChecker.includes("P145.7 terminal") && osStatusChecker.includes('phaseStatus.currentPhase === "P145.7"'));
addCheck("contract closes P145.7", contract.phaseId === "P145" && contract.status === "complete" && contract.currentSubphase === "P145.7" && contract.previousSubphase === "P145.6" && contract.nextSubphase === "" && p1457.status === "complete");
addCheck("contract records expected base commit", p1457.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1457.validationCommands?.includes(command)));
addCheck("contract scope stays final-validation-only", /final validation|validation-only|status|report|terminal/i.test(p1457.dataShape || "") && p1457.expectedExports?.length === 0 && p1457.forbiddenFiles?.includes("dashboard/src/**") && p1457.forbiddenFiles?.includes("projects/**") && p1457.forbiddenFiles?.includes("db/**"));
addCheck("authority flags remain blocked", allBooleanValuesFalse(contract.authorityFlags), JSON.stringify(contract.authorityFlags || {}));
addCheck("docs record P145.7 and P145 closure", /## P145\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P145\.7 Final Validation is complete/i.test(readme) && /P145\.7 final validation is complete/i.test(platformRoadmap) && /P145\.7 is now complete/i.test(enterpriseRoadmap) && /P145 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status closes P145.7", p1457FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase || "terminal"}`);
addCheck("completed P145/P145.7 entries have required fields", [p145, statusById.get("P145.7"), p145Roadmap, roadmapById.get("P145.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${REQUIRED_SCRIPT}`) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P145.7 remains on OS Roadmap track", [status.current, roadmap.current, statusById.get("P145.7"), roadmapById.get("P145.7")].every((entry) => entry?.track === "NEXUS_OS"));
addCheck("terminal next phase remains explicit", status.nextPhase === "" && roadmap.nextPhase === "" && !status.next && !roadmap.next);
addCheck("P145.7 Playwright coverage exists", routeTests.includes("P145.7 enterprise GA final validation closes P145") && routeTests.includes("P145.7") && routeTests.includes("Final Validation") && routeTests.includes("Enterprise GA Readiness"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("Command Center keeps enterprise readiness non-runnable", !/certify now|issue certification now|attest now|sign attestation now|run security scan now|mutate finding now|run load test now|run recovery now|restore now|failover now|release now|deploy now|export now|package now|write db now|call provider now|call model now|run tool now|dispatch agent now|mutate project now|spend now|generate prd now|start build now|build project now/i.test(commandCenter));
addCheck("changed files stay in P145.7 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), enforceCurrentDiffScope ? changed.join(", ") : `P145.7 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|certification|attestation|scan|load|recovery|release|deploy|export|package|evidence)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or provider URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|storage|secret|artifact|certification|attestation|scan|load|recovery|release|deploy|export|package)|postgres(?:ql)?:\/\//i.test(docsBundle));
addCheck("docs avoid fake runnable enterprise actions", !/certify now|issue certification now|attest now|sign attestation now|run security scan now|mutate finding now|run load test now|run recovery now|restore now|failover now|release now|deploy now|export now|package now|write db now|call provider now|call model now|run tool now|dispatch agent now|mutate project now|spend now|generate prd now|start build now|build project now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /certification is enabled|certification issuance is enabled|attestation is enabled|security scanning is enabled|finding mutation is enabled|load execution is enabled|recovery execution is enabled|restore execution is enabled|failover is enabled|release is enabled|deploy is enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs?|raw policy dump|raw certification payload|raw attestation payload|raw scan payload|raw load payload|raw recovery payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P145.7 final validation for enterprise certification and GA readiness.",
        "- Confirms P145.1-P145.6 reports still pass and P145 is complete as a governed readiness gate.",
        "- Does not issue certification, sign attestations, run scans, mutate findings, run load checks, execute recovery, restore, fail over, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Final Validation Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next phase/subphase: ${status.nextPhase || "terminal"}`,
        `- Prior P145 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P145.7 is final validation only. It closes P145 but does not enable certification issuance, attestation signing, security scan execution, finding mutation, load execution, recovery execution, restore, failover, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, network calls, deploy/release/export/package actions, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P145.7 Enterprise GA Readiness Final Validation Report", phase: "P145.7", current: status.currentPhase, next: status.nextPhase || "terminal" },
);

printCheckReport("P145.7 Enterprise GA Readiness Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
