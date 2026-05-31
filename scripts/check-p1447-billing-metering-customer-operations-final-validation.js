import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1447-billing-metering-customer-operations-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p144-billing-metering-customer-operations-contracts.json";
const PLAN_PATH = "docs/architecture/P144_BILLING_METERING_CUSTOMER_OPERATIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1447-billing-metering-customer-operations-final-validation";
const PRIOR_SCRIPT = "check:p1446-billing-metering-customer-operations-docs-roadmap";
const EXPECTED_BASE_COMMIT = "4c13376b";
const PRIOR_REPORTS = [
  "reports/p1441-billing-metering-customer-operations-report.md",
  "reports/p1442-billing-metering-customer-operations-report.md",
  "reports/p1443-billing-metering-customer-operations-report.md",
  "reports/p1444-billing-metering-customer-operations-report.md",
  "reports/p1445-billing-metering-customer-operations-report.md",
  "reports/p1446-billing-metering-customer-operations-docs-roadmap-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1447-billing-metering-customer-operations-final-validation",
  "npm run check:p1446-billing-metering-customer-operations-docs-roadmap",
  "npm run check:p1445-billing-metering-customer-operations",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P144.7\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|aggregate|coverage|closure|final validation|closed|complete)\b/i.test(context);
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
const p144 = statusById.get("P144") || {};
const p144Roadmap = roadmapById.get("P144") || {};
const p1447 = subphaseById.get("P144.7") || {};
const checkerSource = readText("scripts/check-p1447-billing-metering-customer-operations-final-validation.js");
const p1446Checker = readText("scripts/check-p1446-billing-metering-customer-operations-docs-roadmap.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P144.7";
const allowedFiles = new Set(p1447.allowedFiles || []);
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

const p1447FinalState =
  status.currentPhase === "P144.7"
  && status.previousPhase === "P144.6"
  && status.nextPhase === "P145"
  && roadmap.currentPhase === "P144.7"
  && roadmap.previousPhase === "P144.6"
  && roadmap.nextPhase === "P145"
  && status.current?.phaseId === "P144.7"
  && status.previous?.phaseId === "P144.6"
  && status.next?.phaseId === "P145"
  && roadmap.current?.phaseId === "P144.7"
  && roadmap.previous?.phaseId === "P144.6"
  && roadmap.next?.phaseId === "P145"
  && p144.status === "complete"
  && p144Roadmap.status === "complete"
  && ["P144.1", "P144.2", "P144.3", "P144.4", "P144.5", "P144.6", "P144.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P145")?.status === "planned"
  && roadmapById.get("P145")?.status === "planned";
const p1451StartedState =
  status.currentPhase === "P145.1"
  && status.previousPhase === "P144.7"
  && status.nextPhase === "P145.2"
  && roadmap.currentPhase === "P145.1"
  && roadmap.previousPhase === "P144.7"
  && roadmap.nextPhase === "P145.2"
  && status.current?.phaseId === "P145.1"
  && status.previous?.phaseId === "P144.7"
  && status.next?.phaseId === "P145.2"
  && roadmap.current?.phaseId === "P145.1"
  && roadmap.previous?.phaseId === "P144.7"
  && roadmap.next?.phaseId === "P145.2"
  && p144.status === "complete"
  && p144Roadmap.status === "complete"
  && ["P144.1", "P144.2", "P144.3", "P144.4", "P144.5", "P144.6", "P144.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P145")?.status === "in_progress"
  && roadmapById.get("P145")?.status === "in_progress"
  && statusById.get("P145.1")?.status === "complete"
  && roadmapById.get("P145.1")?.status === "complete"
  && statusById.get("P145.2")?.status === "planned"
  && roadmapById.get("P145.2")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1447-billing-metering-customer-operations-final-validation.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P144 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("P144.6 checker accepts P144.7 final state", p1446Checker.includes("p1447FinalState") && p1446Checker.includes('status.currentPhase === "P144.7"') && p1446Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P144.7 final state", enterpriseChecker.includes("p1447FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P145 handoff", osStatusChecker.includes('"P145"'));
addCheck("contract closes P144.7", contract.phaseId === "P144" && contract.status === "complete" && contract.currentSubphase === "P144.7" && contract.previousSubphase === "P144.6" && contract.nextSubphase === "P145" && p1447.status === "complete");
addCheck("contract records expected base commit", p1447.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1447.validationCommands?.includes(command)));
addCheck("contract scope stays final-validation-only", /final validation|validation-only|status|report/i.test(p1447.dataShape || "") && p1447.expectedExports?.length === 0 && p1447.forbiddenFiles?.includes("dashboard/src/**") && p1447.forbiddenFiles?.includes("projects/**") && p1447.forbiddenFiles?.includes("db/**"));
addCheck("docs record P144.7 and P145 handoff", /## P144\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P144\.7 Final Validation is complete/i.test(readme) && /P144\.7 final validation is complete/i.test(platformRoadmap) && /P144\.7 is now complete/i.test(enterpriseRoadmap) && (/P145 is planned-only next/i.test(enterpriseRoadmap) || p1451StartedState));
addCheck("phase status closes P144.7", p1447FinalState || p1451StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P144/P144.7 entries have required fields", [p144, statusById.get("P144.7"), p144Roadmap, roadmapById.get("P144.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P144.7 remains on OS Roadmap track", [status.current, roadmap.current, statusById.get("P144.7"), roadmapById.get("P144.7")].every((entry) => entry?.track === "NEXUS_OS"));
addCheck("P145 handoff remains valid", p1447FinalState
  ? [statusById.get("P145"), roadmapById.get("P145")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)
  : p1451StartedState);
addCheck("P144.7 Playwright coverage exists", routeTests.includes("P144.7 billing customer operations final validation closes P144") && routeTests.includes("P144.7") && routeTests.includes("Final Validation") && routeTests.includes("P145") && routeTests.includes("Enterprise Certification and GA Readiness"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P144.7 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), enforceCurrentDiffScope ? changed.join(", ") : `P144.7 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support|meter|usage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or payment URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|billing|payment|invoice|subscription|customer|support|storage|secret|artifact)/i.test(docsBundle));
addCheck("docs avoid fake runnable billing actions", !/create invoice now|collect payment now|charge now|subscribe now|cancel subscription now|grant entitlement now|revoke entitlement now|record usage now|write usage now|create ticket now|contact customer now|run customer operation now|write db now|call payment provider now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /billing account mutation is enabled|usage writes are enabled|usage rollups are enabled|invoice creation is enabled|payment collection is enabled|subscription mutation is enabled|entitlement grants are enabled|entitlement revokes are enabled|support ticket creation is enabled|customer contact is enabled|customer operations are enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|payment provider calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw billing payload|raw payment payload|raw customer payload|raw invoice payload|raw usage payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P144.7 final validation for billing, metering, and customer operations.",
        `- Confirms P144.1-P144.6 reports still pass and ${p1451StartedState ? "P145.1 is complete with P145.2 planned-only next" : "P145 remains planned-only"}.`,
        "- Does not write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Final Validation Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next phase/subphase: ${status.nextPhase}`,
        `- Prior P144 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: `- P144.7 is final validation only. It closes P144 but does not enable live billing, usage writes, invoice creation, payment collection, subscription or entitlement mutation, support ticket creation, customer contact, customer operation execution, DB/runtime writes, provider/model calls, payment-provider calls, tool execution, MCP startup, agent dispatch, project mutation, network calls, deploy/release/export/package actions, or spend. ${p1451StartedState ? "P145.1 is complete as contract/certification-boundary work and P145.2-P145.7 remain planned-only." : "P145 remains planned-only."}`,
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P144.7 Billing Metering Customer Operations Final Validation Report", phase: "P144.7" },
);

printCheckReport("P144.7 Billing Metering Customer Operations Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
