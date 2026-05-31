import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES,
  buildBillingMeteringCustomerOperationsModel,
  validateBillingMeteringCustomerOperationsModel,
} from "../shared/billingMeteringCustomerOperationsModel.js";
import {
  buildBillingMeteringCustomerOperationsPreview,
  validateBillingMeteringCustomerOperationsPreview,
} from "../shared/billingMeteringCustomerOperationsPreview.js";
import { buildBillingCustomerOperationsReadinessViewModel } from "../dashboard/src/data/billingCustomerOperationsReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1445-billing-metering-customer-operations-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p144-billing-metering-customer-operations-contracts.json";
const PLAN_PATH = "docs/architecture/P144_BILLING_METERING_CUSTOMER_OPERATIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1445-billing-metering-customer-operations";
const PRIOR_SCRIPT = "check:p1444-billing-metering-customer-operations";
const NEXT_SCRIPT = "check:p1446-billing-metering-customer-operations-docs-roadmap";
const FINAL_SCRIPT = "check:p1447-billing-metering-customer-operations-final-validation";
const EXPECTED_BASE_COMMIT = "97dd7d58";
const PRIOR_REPORTS = [
  "reports/p1441-billing-metering-customer-operations-report.md",
  "reports/p1442-billing-metering-customer-operations-report.md",
  "reports/p1443-billing-metering-customer-operations-report.md",
  "reports/p1444-billing-metering-customer-operations-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1445-billing-metering-customer-operations",
  "npm run check:p1444-billing-metering-customer-operations",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P144.5\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|aggregate|coverage|tests?)\b/i.test(context);
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
const p1445 = subphaseById.get("P144.5") || {};
const p1446 = subphaseById.get("P144.6") || {};
const p1447 = subphaseById.get("P144.7") || {};
const checkerSource = readText("scripts/check-p1445-billing-metering-customer-operations.js");
const p1444Checker = readText("scripts/check-p1444-billing-metering-customer-operations.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const costCenterSource = commandCenterSource.slice(
  commandCenterSource.indexOf("function BillingCustomerOperationsReadinessPanel"),
  commandCenterSource.indexOf("/* ─── Policy Center Page"),
);
const model = buildBillingMeteringCustomerOperationsModel({ createdAt: "2026-05-31T14:55:00.000Z" });
const preview = buildBillingMeteringCustomerOperationsPreview({ sourceModel: model });
const readiness = buildBillingCustomerOperationsReadinessViewModel({ preview });
const modelValidation = validateBillingMeteringCustomerOperationsModel(model);
const previewValidation = validateBillingMeteringCustomerOperationsPreview(preview);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P144.5";
const allowedFiles = new Set(p1445.allowedFiles || []);
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
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const displayBundle = [
  JSON.stringify(model),
  JSON.stringify(preview),
  JSON.stringify(readiness),
  costCenterSource,
].join("\n");

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

const p1446CurrentState =
  status.currentPhase === "P144.6"
  && status.previousPhase === "P144.5"
  && status.nextPhase === "P144.7"
  && roadmap.currentPhase === "P144.6"
  && roadmap.previousPhase === "P144.5"
  && roadmap.nextPhase === "P144.7"
  && status.current?.phaseId === "P144.6"
  && status.previous?.phaseId === "P144.5"
  && status.next?.phaseId === "P144.7"
  && roadmap.current?.phaseId === "P144.6"
  && roadmap.previous?.phaseId === "P144.5"
  && roadmap.next?.phaseId === "P144.7"
  && statusById.get("P144")?.status === "in_progress"
  && roadmapById.get("P144")?.status === "in_progress"
  && ["P144.1", "P144.2", "P144.3", "P144.4", "P144.5", "P144.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P144.7")?.status === "planned"
  && roadmapById.get("P144.7")?.status === "planned"
  && statusById.get("P145")?.status === "planned"
  && roadmapById.get("P145")?.status === "planned";

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
  && statusById.get("P144")?.status === "complete"
  && roadmapById.get("P144")?.status === "complete"
  && ["P144.1", "P144.2", "P144.3", "P144.4", "P144.5", "P144.6", "P144.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P145")?.status === "planned"
  && roadmapById.get("P145")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1445-billing-metering-customer-operations.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P144.1-P144.4 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("billing model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("billing preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("readiness view model exposes aggregate UX", readiness.rowCount >= 14 && readiness.blockedRowCount === readiness.rowCount && readiness.runnableActionCount === 0 && readiness.previewRows.length === preview.rows.length && readiness.statusCards.length >= 4 && readiness.sectionRows.length >= 3);
addCheck("all safety flags remain blocked across model and preview", BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false && preview[flag] === false && preview.safetyFlags?.[flag] === false && preview.rows.every((row) => row[flag] === false && row.safetyFlags?.[flag] === false && row.authorityFlags?.[flag] === false)));
addCheck("preview rows keep null executable and mutation payloads", preview.rows.every((row) => row.executionAllowed === false && row.executablePayload === null && row.billingMutationPayload === null && row.usageWritePayload === null && row.invoiceCreationPayload === null && row.paymentCollectionPayload === null && row.supportTicketPayload === null && row.customerContactPayload === null && row.customerOperationPayload === null && row.dbRuntimeMutationPayload === null && row.providerPayload === null && row.networkPayload === null));
addCheck("Cost Center projection stays display-only", readiness.rawPayloadVisible === false && readiness.rawPrivateIdsVisible === false && readiness.rawInternalPayloadsVisible === false && readiness.safetyRows.every((row) => row.value === "Blocked" || row.value === "Display-only") && !/P144\.\d/.test(costCenterSource));
addCheck("model, preview, and display remain public-safe", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support|meter|usage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(displayBundle) && !/Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\//i.test(displayBundle) && !hasUnsafePositiveClaim(displayBundle, /raw JSON|raw logs?|raw policy dump/i));
addCheck("model, preview, and display have no fake runnable actions", !/create invoice now|collect payment now|charge now|subscribe now|cancel subscription now|grant entitlement now|revoke entitlement now|record usage now|write usage now|create ticket now|contact customer now|run customer operation now|write db now|call payment provider now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(displayBundle));
addCheck("cost impact remains zero-spend", model.costImpact.providerSpendAllowed === false && preview.costImpact.providerSpendAllowed === false && readiness.costImpact.includes("$0.00") && /no provider/i.test(readiness.costImpact));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("P144.5 Playwright aggregate coverage exists", routeTests.includes("P144.5 aggregate coverage keeps billing customer operations display-only") && (
  (routeTests.includes("P144.6") && routeTests.includes("Docs / Roadmap / Status"))
  || (routeTests.includes("P144.7") && routeTests.includes("Final Validation"))
));
addCheck("contract advances through P144.5 safely", contract.phaseId === "P144" && ["P144.1", "P144.2", "P144.3", "P144.4", "P144.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete") && (
  (contract.status === "in_progress" && contract.currentSubphase === "P144.5" && contract.previousSubphase === "P144.4" && contract.nextSubphase === "P144.6" && p1446.status === "planned")
  || (contract.status === "in_progress" && contract.currentSubphase === "P144.6" && contract.previousSubphase === "P144.5" && contract.nextSubphase === "P144.7" && p1446.status === "complete" && p1447.status === "planned")
  || (contract.status === "complete" && contract.currentSubphase === "P144.7" && contract.previousSubphase === "P144.6" && contract.nextSubphase === "P145" && p1446.status === "complete" && p1447.status === "complete")
));
addCheck("contract records expected base commit", p1445.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1445.validationCommands?.includes(command)));
addCheck("contract scope stays aggregate-checker only", /aggregate/i.test(p1445.dataShape || "") && p1445.forbiddenFiles?.includes("projects/**") && p1445.forbiddenFiles?.includes("db/**") && p1445.forbiddenFiles?.includes("providers/**"));
addCheck("P144.4 checker accepts P144.5 handoff", p1444Checker.includes("p1445CurrentState") && p1444Checker.includes('status.currentPhase === "P144.5"') && p1444Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P144.5", enterpriseChecker.includes("p1445CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P144.6 handoff", osStatusChecker.includes('"P144.5"') && osStatusChecker.includes('"P144.6"') && osStatusChecker.includes('"P144.7"'));
addCheck("docs record P144.5 and P144.6 handoff", /## P144\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan) && /P144\.5 Tests \/ Checkers/i.test(readme) && /P144\.5\s+Tests \/ Checkers is complete/i.test(platformRoadmap) && /P144\.5 is now complete as aggregate tests\/checkers only/i.test(enterpriseRoadmap) && (/P144\.6 is planned-only next/i.test(enterpriseRoadmap) || /P144\.6 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances through P144.5", p1445CurrentState || p1446CurrentState || p1447FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P144.5 entries have required fields", [p144, p144Roadmap, statusById.get("P144.5"), roadmapById.get("P144.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P144.6 handoff remains valid", (p1445CurrentState && [statusById.get("P144.6"), roadmapById.get("P144.6")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || ((p1446CurrentState || p1447FinalState) && [statusById.get("P144.6"), roadmapById.get("P144.6")].every((entry) => entry?.status === "complete" && Boolean(entry.branch) && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${NEXT_SCRIPT}`))));
addCheck("P144.7 handoff remains valid after P144.6", (p1446CurrentState && [statusById.get("P144.7"), roadmapById.get("P144.7")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)) || (p1447FinalState && [statusById.get("P144.7"), roadmapById.get("P144.7")].every((entry) => entry?.status === "complete" && Boolean(entry.branch) && Boolean(entry.commit) && Array.isArray(entry.checksRun) && entry.checksRun.includes(`npm run ${FINAL_SCRIPT}`))) || (!p1446CurrentState && !p1447FinalState));
addCheck("P145 remains planned-only", [statusById.get("P145"), roadmapById.get("P145")].every((entry) => entry?.status === "planned" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("changed files stay in P144.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
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
        "- Adds aggregate P144.5 checker and Playwright coverage for billing, metering, invoice preview, entitlement, support handoff, customer operation, and Cost Center Customer Ops surfaces.",
        "- Verifies P144.1-P144.4 reports, P144.2 model, P144.3 preview, P144.4 Command Center UX, route-wide safety coverage, docs/status, and P144.6 handoff compatibility.",
        "- Does not write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Coverage Summary",
      body: [
        `- Model rows: ${model.billingAccounts.length + model.usageMeters.length + model.invoicePreviews.length + model.entitlements.length + model.supportHandoffs.length + model.customerOperations.length}`,
        `- Preview rows: ${preview.rows.length}`,
        `- Customer Ops UX rows: ${readiness.previewRows.length}`,
        `- Blocked rows: ${readiness.blockedRowCount}`,
        `- Runnable actions: ${readiness.runnableActionCount}`,
        `- Cost impact: ${readiness.costImpact}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P144.5 is tests/checkers hardening only. It does not enable live billing, usage writes, invoice creation, payment collection, subscription or entitlement mutation, support ticket creation, customer contact, customer operation execution, DB/runtime writes, provider/model calls, payment-provider calls, tool execution, agent dispatch, project mutation, network calls, deploy/release/export/package actions, or spend. P144.6 may now be complete as docs/status closure while P144.7 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P144.5 Billing Metering Customer Operations Report", phase: "P144.5" },
);

printCheckReport("P144.5 Billing Metering Customer Operations Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
