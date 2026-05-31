import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  BILLING_CUSTOMER_OPERATIONS_READINESS_PHASE,
  BILLING_CUSTOMER_OPERATIONS_READINESS_VERSION,
  buildBillingCustomerOperationsReadinessViewModel,
} from "../dashboard/src/data/billingCustomerOperationsReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1444-billing-metering-customer-operations-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p144-billing-metering-customer-operations-contracts.json";
const PLAN_PATH = "docs/architecture/P144_BILLING_METERING_CUSTOMER_OPERATIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1444-billing-metering-customer-operations";
const PRIOR_SCRIPT = "check:p1443-billing-metering-customer-operations";
const NEXT_SCRIPT = "check:p1445-billing-metering-customer-operations";
const EXPECTED_BASE_COMMIT = "8ac59cde";
const EXPECTED_EXPORTS = [
  "BILLING_CUSTOMER_OPERATIONS_READINESS_PHASE",
  "BILLING_CUSTOMER_OPERATIONS_READINESS_VERSION",
  "buildBillingCustomerOperationsReadinessViewModel",
  "billingCustomerOperationsReadinessViewModel",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1444-billing-metering-customer-operations",
  "npm run check:p1443-billing-metering-customer-operations",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P144.4\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|local-only)\b/i.test(context);
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
const p1444 = subphaseById.get("P144.4") || {};
const p1445 = subphaseById.get("P144.5") || {};
const p1446 = subphaseById.get("P144.6") || {};
const checkerSource = readText("scripts/check-p1444-billing-metering-customer-operations.js");
const p1443Checker = readText("scripts/check-p1443-billing-metering-customer-operations.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const viewModelSource = readText("dashboard/src/data/billingCustomerOperationsReadiness.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const costCenterSource = commandCenterSource.slice(
  commandCenterSource.indexOf("function BillingCustomerOperationsReadinessPanel"),
  commandCenterSource.indexOf("/* ─── Policy Center Page"),
);
const tabSource = readText("dashboard/src/data/commandCenterTabs.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P144.4";
const allowedFiles = new Set(p1444.allowedFiles || []);
const allowedDashboardFiles = new Set([
  "dashboard/src/data/billingCustomerOperationsReadiness.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
]);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
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
const readiness = buildBillingCustomerOperationsReadinessViewModel();
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const uxBundle = `${JSON.stringify(readiness)}\n${costCenterSource}\n${tabSource}`;

const p1444CurrentState =
  status.currentPhase === "P144.4"
  && status.previousPhase === "P144.3"
  && status.nextPhase === "P144.5"
  && roadmap.currentPhase === "P144.4"
  && roadmap.previousPhase === "P144.3"
  && roadmap.nextPhase === "P144.5"
  && status.current?.phaseId === "P144.4"
  && status.previous?.phaseId === "P144.3"
  && status.next?.phaseId === "P144.5"
  && roadmap.current?.phaseId === "P144.4"
  && roadmap.previous?.phaseId === "P144.3"
  && roadmap.next?.phaseId === "P144.5"
  && statusById.get("P143")?.status === "complete"
  && roadmapById.get("P143")?.status === "complete"
  && statusById.get("P144")?.status === "in_progress"
  && roadmapById.get("P144")?.status === "in_progress"
  && ["P144.1", "P144.2", "P144.3", "P144.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P144.5")?.status === "planned"
  && roadmapById.get("P144.5")?.status === "planned"
  && statusById.get("P145")?.status === "planned"
  && roadmapById.get("P145")?.status === "planned";

const p1445CurrentState =
  status.currentPhase === "P144.5"
  && status.previousPhase === "P144.4"
  && status.nextPhase === "P144.6"
  && roadmap.currentPhase === "P144.5"
  && roadmap.previousPhase === "P144.4"
  && roadmap.nextPhase === "P144.6"
  && status.current?.phaseId === "P144.5"
  && status.previous?.phaseId === "P144.4"
  && status.next?.phaseId === "P144.6"
  && roadmap.current?.phaseId === "P144.5"
  && roadmap.previous?.phaseId === "P144.4"
  && roadmap.next?.phaseId === "P144.6"
  && statusById.get("P143")?.status === "complete"
  && roadmapById.get("P143")?.status === "complete"
  && statusById.get("P144")?.status === "in_progress"
  && roadmapById.get("P144")?.status === "in_progress"
  && ["P144.1", "P144.2", "P144.3", "P144.4", "P144.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P144.6")?.status === "planned"
  && roadmapById.get("P144.6")?.status === "planned"
  && statusById.get("P145")?.status === "planned"
  && roadmapById.get("P145")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1444-billing-metering-customer-operations.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("view model exports expected API", EXPECTED_EXPORTS.every((entry) => viewModelSource.includes(`export const ${entry}`) || viewModelSource.includes(`export function ${entry}`)));
addCheck("view model reuses P144.3 preview helper", viewModelSource.includes("../../../shared/billingMeteringCustomerOperationsPreview.js") && viewModelSource.includes("buildBillingMeteringCustomerOperationsPreview"));
addCheck("view model does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb|stripe|paymentIntent|invoiceCreate|subscriptionCreate)\b/.test(viewModelSource));
addCheck("view model constants are correct", BILLING_CUSTOMER_OPERATIONS_READINESS_PHASE === "P144.4" && BILLING_CUSTOMER_OPERATIONS_READINESS_VERSION === "1.0");
addCheck("view model exposes required UX shape", [
  "whatChanged",
  "currentState",
  "nextAction",
  "blocker",
  "disabledReason",
  "ownerCapability",
  "evidenceLocation",
  "activityLocation",
  "costImpact",
  "statusCards",
  "sectionRows",
  "previewRows",
  "safetyRows",
  "blockedActions",
].every((field) => field in readiness));
addCheck("view model maps P144.3 preview rows", readiness.previewRows.length >= 14 && ["Billing Account", "Usage Meter", "Invoice Preview", "Entitlement", "Support Handoff", "Customer Operation"].every((type) => readiness.previewRows.some((row) => row.type === type)));
addCheck("view model keeps all rows non-runnable", readiness.runnableActionCount === 0 && readiness.blockedRowCount === readiness.rowCount && readiness.safetyRows.every((row) => row.value === "Blocked" || row.value === "Display-only") && readiness.blockedActions.length >= 12);
addCheck("view model hides raw internals", readiness.rawPayloadVisible === false && readiness.rawPrivateIdsVisible === false && readiness.rawInternalPayloadsVisible === false && readiness.previewRows.every((row) => !("sourceRef" in row) && !("rowRef" in row) && !("executablePayload" in row)));
addCheck("view model cost impact remains zero-spend", /\$0\.00/.test(readiness.costImpact) && /no provider/i.test(readiness.costImpact));
addCheck("Cost Center tab is registered", tabSource.includes('{ id: "customer-ops", label: "Customer Ops"') && tabSource.includes("Display-only billing and customer operation readiness"));
addCheck("Cost Center renders Customer Ops panel", commandCenterSource.includes("buildBillingCustomerOperationsReadinessViewModel") && commandCenterSource.includes("BillingCustomerOperationsReadinessPanel") && commandCenterSource.includes('tabId="customer-ops"') && commandCenterSource.includes("Customer Operations Readiness"));
addCheck("Cost Center UX keeps phase labels out of primary page source", !/P144\.\d/.test(costCenterSource));
addCheck("prior P144.3 report passes", reportPassed("reports/p1443-billing-metering-customer-operations-report.md"));
addCheck("contract advances through P144.4 safely", contract.phaseId === "P144" && contract.status === "in_progress" && p1444.status === "complete" && (
  (contract.currentSubphase === "P144.4" && contract.previousSubphase === "P144.3" && contract.nextSubphase === "P144.5" && p1445.status === "planned")
  || (contract.currentSubphase === "P144.5" && contract.previousSubphase === "P144.4" && contract.nextSubphase === "P144.6" && p1445.status === "complete" && p1446.status === "planned")
));
addCheck("contract records expected base commit", p1444.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1444.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1444.validationCommands?.includes(command)));
addCheck("contract scope stays UX-only", /Display-only Command Center view model/i.test(p1444.dataShape || "") && p1444.forbiddenFiles?.includes("projects/**") && p1444.forbiddenFiles?.includes("db/**") && p1444.forbiddenFiles?.includes("providers/**") && p1444.forbiddenFiles?.includes("billing, invoice, subscription, customer, entitlement, usage, or support-ticket mutation paths"));
addCheck("P144.3 checker accepts P144.4 handoff", p1443Checker.includes("p1444CurrentState") && p1443Checker.includes('status.currentPhase === "P144.4"') && p1443Checker.includes(REQUIRED_SCRIPT));
addCheck("P144.5 checker registered when handed off", packageJson.scripts?.[NEXT_SCRIPT] === "node scripts/check-p1445-billing-metering-customer-operations.js");
addCheck("enterprise checker accepts P144.4/P144.5 active state", enterpriseChecker.includes("p1444CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT) && (!p1445CurrentState || (enterpriseChecker.includes("p1445CurrentState") && enterpriseChecker.includes(NEXT_SCRIPT))));
addCheck("OS checker recognizes P144.5 handoff", osStatusChecker.includes('"P144.4"') && osStatusChecker.includes('"P144.5"') && osStatusChecker.includes('"P144.7"'));
addCheck("docs record P144.4 and P144.5 handoff", /## P144\.4 Customer Operations Command Center UX[\s\S]*Status:\s+complete/.test(plan) && /P144\.4\s+Customer\s+Operations\s+Command\s+Center\s+UX\s+is\s+complete/i.test(readme) && /P144\.4\s+Customer\s+Operations\s+Command\s+Center\s+UX\s+is\s+complete/i.test(platformRoadmap) && /P144\.4 is now complete as a Cost Center Customer Ops UX/i.test(enterpriseRoadmap) && (/P144\.5 is planned-only next/i.test(enterpriseRoadmap) || /P144\.5 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances through P144.4", p1444CurrentState || p1445CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P144 parent records active status", [p144, p144Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1444-billing-metering-customer-operations") && entry.commandCenterVisible === true));
addCheck("completed P144.4 entries have required fields", [statusById.get("P144.4"), roadmapById.get("P144.4")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P144.5/P145 handoff remains safe", (p1444CurrentState && [statusById.get("P144.5"), roadmapById.get("P144.5"), statusById.get("P145"), roadmapById.get("P145")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1445CurrentState && [statusById.get("P144.5"), roadmapById.get("P144.5")].every((entry) => entry?.status === "complete" && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`)) && [statusById.get("P144.6"), roadmapById.get("P144.6"), statusById.get("P145"), roadmapById.get("P145")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)));
addCheck("P144.4 Playwright coverage exists", routeTests.includes("P144.4 customer operations UX keeps Cost Center useful and non-runnable") && routeTests.includes("Customer Operations Readiness") && routeTests.includes("P144.4") && routeTests.includes("P144.5") && routeTests.includes("P144.6"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P144.4 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => {
  if (file.startsWith("dashboard/src/")) return allowedDashboardFiles.has(file);
  return !forbiddenPrefixes.some((prefix) => file.startsWith(prefix));
}), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("UX and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support|meter|usage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(`${uxBundle}\n${docsBundle}`));
addCheck("UX and docs avoid raw storage or payment URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|billing|payment|invoice|subscription|customer|support|storage|secret|artifact)/i.test(`${uxBundle}\n${docsBundle}`));
addCheck("UX and docs avoid fake runnable billing actions", !/create invoice now|collect payment now|charge now|subscribe now|cancel subscription now|grant entitlement now|revoke entitlement now|record usage now|write usage now|create ticket now|contact customer now|run customer operation now|write db now|call payment provider now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(`${uxBundle}\n${docsBundle}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /billing account mutation is enabled|usage writes are enabled|usage rollups are enabled|invoice creation is enabled|payment collection is enabled|subscription mutation is enabled|entitlement grants are enabled|entitlement revokes are enabled|support ticket creation is enabled|customer contact is enabled|customer operations are enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|payment provider calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|network calls are enabled|spend is enabled/i));
addCheck("UX and docs avoid raw dumps", !hasUnsafePositiveClaim(`${uxBundle}\n${docsBundle}`, /raw JSON|raw logs|raw policy dump|raw billing payload|raw payment payload|raw customer payload|raw invoice payload|raw usage payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds the P144.4 Cost Center Customer Ops UX for display-safe billing, metering, invoice, entitlement, support, and customer operations readiness.",
        "- Confirms P144.1-P144.4 remain complete and later P144/P145 handoffs keep billing and customer authority blocked.",
        "- Does not write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Command Center UX Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Customer Ops rows: ${readiness.previewRows.length}`,
        `- Blocked rows: ${readiness.blockedRowCount}`,
        `- Cost impact: ${readiness.costImpact}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P144.4 is a display-only Command Center UX subphase. It does not enable live billing, usage writes, invoice creation, payment collection, entitlement changes, support ticket creation, customer contact, customer operation execution, DB/runtime writes, provider/model calls, payment-provider calls, tool execution, agent dispatch, project mutation, network calls, deploy/release/export/package actions, or spend. Later P144 subphases must preserve this blocked authority boundary.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P144.4 Billing Metering Customer Operations Report", phase: "P144.4" },
);

printCheckReport("P144.4 Billing Metering Customer Operations Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
