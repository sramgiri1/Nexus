import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE,
  BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_VERSION,
  BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES,
  buildBillingAccount,
  buildBillingMeteringCustomerOperationsEnvelope,
  buildBillingMeteringCustomerOperationsModel,
  buildCustomerOperation,
  buildEntitlement,
  buildInvoicePreview,
  buildSupportHandoff,
  buildUsageMeter,
  validateBillingAccount,
  validateBillingMeteringCustomerOperationsModel,
  validateCustomerOperation,
  validateEntitlement,
  validateInvoicePreview,
  validateSupportHandoff,
  validateUsageMeter,
} from "../shared/billingMeteringCustomerOperationsModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1442-billing-metering-customer-operations-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p144-billing-metering-customer-operations-contracts.json";
const PLAN_PATH = "docs/architecture/P144_BILLING_METERING_CUSTOMER_OPERATIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1442-billing-metering-customer-operations";
const PRIOR_SCRIPT = "check:p1441-billing-metering-customer-operations";
const EXPECTED_BASE_COMMIT = "8d4cfdac";
const EXPECTED_EXPORTS = [
  "BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE",
  "BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_VERSION",
  "BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES",
  "buildBillingAccount",
  "validateBillingAccount",
  "buildUsageMeter",
  "validateUsageMeter",
  "buildInvoicePreview",
  "validateInvoicePreview",
  "buildEntitlement",
  "validateEntitlement",
  "buildSupportHandoff",
  "validateSupportHandoff",
  "buildCustomerOperation",
  "validateCustomerOperation",
  "buildBillingMeteringCustomerOperationsModel",
  "validateBillingMeteringCustomerOperationsModel",
  "buildBillingMeteringCustomerOperationsEnvelope",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1442-billing-metering-customer-operations",
  "npm run check:p1441-billing-metering-customer-operations",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P144.2|Command Center route-wide UX\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|local-only)\b/i.test(context);
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
const p1441 = subphaseById.get("P144.1") || {};
const p1442 = subphaseById.get("P144.2") || {};
const p1443 = subphaseById.get("P144.3") || {};
const checkerSource = readText("scripts/check-p1442-billing-metering-customer-operations.js");
const p1441Checker = readText("scripts/check-p1441-billing-metering-customer-operations.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const modelSource = readText("shared/billingMeteringCustomerOperationsModel.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P144.2";
const allowedFiles = new Set(p1442.allowedFiles || []);
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
const billingAccount = buildBillingAccount({ sequence: 1 });
const usageMeter = buildUsageMeter({ sequence: 1 });
const invoicePreview = buildInvoicePreview({ sequence: 1 });
const entitlement = buildEntitlement({ sequence: 1 });
const supportHandoff = buildSupportHandoff({ sequence: 1 });
const customerOperation = buildCustomerOperation({ sequence: 1 });
const model = buildBillingMeteringCustomerOperationsModel({ createdAt: "2026-05-31T13:40:00.000Z" });
const envelope = buildBillingMeteringCustomerOperationsEnvelope({ model });
const modelValidation = validateBillingMeteringCustomerOperationsModel(model);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const modelAndDocs = `${JSON.stringify(model)}\n${docsBundle}`;

const p1442CurrentState =
  status.currentPhase === "P144.2"
  && status.previousPhase === "P144.1"
  && status.nextPhase === "P144.3"
  && roadmap.currentPhase === "P144.2"
  && roadmap.previousPhase === "P144.1"
  && roadmap.nextPhase === "P144.3"
  && status.current?.phaseId === "P144.2"
  && status.previous?.phaseId === "P144.1"
  && status.next?.phaseId === "P144.3"
  && roadmap.current?.phaseId === "P144.2"
  && roadmap.previous?.phaseId === "P144.1"
  && roadmap.next?.phaseId === "P144.3"
  && statusById.get("P143")?.status === "complete"
  && roadmapById.get("P143")?.status === "complete"
  && statusById.get("P144")?.status === "in_progress"
  && roadmapById.get("P144")?.status === "in_progress"
  && statusById.get("P144.1")?.status === "complete"
  && roadmapById.get("P144.1")?.status === "complete"
  && statusById.get("P144.2")?.status === "complete"
  && roadmapById.get("P144.2")?.status === "complete"
  && statusById.get("P144.3")?.status === "planned"
  && roadmapById.get("P144.3")?.status === "planned"
  && statusById.get("P145")?.status === "planned"
  && roadmapById.get("P145")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1442-billing-metering-customer-operations.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("model exports expected API", EXPECTED_EXPORTS.every((entry) => modelSource.includes(`export const ${entry}`) || modelSource.includes(`export function ${entry}`)));
addCheck("model reuses mode guard, redaction, and result envelope helpers", ["./modeGuard.js", "./redaction.js", "./resultEnvelope.js"].every((target) => modelSource.includes(target)));
addCheck("model does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb|stripe|charge|paymentIntent|invoiceCreate|subscriptionCreate)\b/.test(modelSource));
addCheck("model constants are correct", BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE === "P144.2" && BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_VERSION === "1.0" && BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES.length >= 20);
addCheck("billing account validator passes", validateBillingAccount(billingAccount).valid, validateBillingAccount(billingAccount).errors.join("; "));
addCheck("usage meter validator passes", validateUsageMeter(usageMeter).valid, validateUsageMeter(usageMeter).errors.join("; "));
addCheck("invoice preview validator passes", validateInvoicePreview(invoicePreview).valid, validateInvoicePreview(invoicePreview).errors.join("; "));
addCheck("entitlement validator passes", validateEntitlement(entitlement).valid, validateEntitlement(entitlement).errors.join("; "));
addCheck("support handoff validator passes", validateSupportHandoff(supportHandoff).valid, validateSupportHandoff(supportHandoff).errors.join("; "));
addCheck("customer operation validator passes", validateCustomerOperation(customerOperation).valid, validateCustomerOperation(customerOperation).errors.join("; "));
addCheck("aggregate model validator passes", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("result envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P144.2" && envelope.envelopeValid === true);
addCheck("model is read-only local and hidden from direct Command Center rendering", model.modelOnly === true && model.readOnly === true && model.localOnly === true && model.commandCenterVisible === false);
addCheck("model has required billing/customer rows", model.billingAccounts.length >= 2 && model.usageMeters.length >= 3 && model.invoicePreviews.length >= 2 && model.entitlements.length >= 2 && model.supportHandoffs.length >= 2 && model.customerOperations.length >= 3);
addCheck("readiness summary blocks runtime candidates", model.readinessSummary.runnableActionCount === 0 && model.readinessSummary.billingMutationCandidateCount === 0 && model.readinessSummary.usageWriteCandidateCount === 0 && model.readinessSummary.invoiceCreationCandidateCount === 0 && model.readinessSummary.paymentCollectionCandidateCount === 0 && model.readinessSummary.entitlementMutationCandidateCount === 0 && model.readinessSummary.supportTicketCandidateCount === 0 && model.readinessSummary.customerContactCandidateCount === 0 && model.readinessSummary.customerOperationExecutionCandidateCount === 0 && model.readinessSummary.providerSpendCandidateCount === 0);
addCheck("all authority flags remain blocked", BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false));
addCheck("cost impact remains zero-spend", model.costImpact.estimatedUsd === 0 && model.costImpact.actualUsd === 0 && model.costImpact.providerSpendAllowed === false && model.costImpact.paymentProviderSpendAllowed === false && model.costImpact.networkCallsAllowed === false);
addCheck("P144.1 report passes", reportPassed("reports/p1441-billing-metering-customer-operations-report.md"));
addCheck("contract advances to P144.2 safely", contract.phaseId === "P144" && contract.status === "in_progress" && contract.currentSubphase === "P144.2" && contract.previousSubphase === "P144.1" && contract.nextSubphase === "P144.3" && p1441.status === "complete" && p1442.status === "complete" && p1443.status === "planned");
addCheck("contract records expected base commit", p1442.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1442.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1442.validationCommands?.includes(command)));
addCheck("contract scope stays model-only", /read-only billing/i.test(p1442.dataShape || "") && p1442.forbiddenFiles?.includes("dashboard/src/**") && p1442.forbiddenFiles?.includes("projects/**") && p1442.forbiddenFiles?.includes("db/**") && p1442.forbiddenFiles?.includes("providers/**"));
addCheck("P144.1 checker accepts P144.2 handoff", p1441Checker.includes("p1442CurrentState") && p1441Checker.includes('status.currentPhase === "P144.2"') && p1441Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P144.2 active state", enterpriseChecker.includes("p1442CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P144.3 handoff", osStatusChecker.includes('"P144.2"') && osStatusChecker.includes('"P144.3"') && osStatusChecker.includes('"P144.7"'));
addCheck("docs record P144.2 and P144.3 handoff", /## P144\.2 Billing and Meter Model[\s\S]*Status:\s+complete/.test(plan) && /P144\.2\s+Billing\s+and\s+Meter\s+Model\s+is\s+complete/i.test(readme) && /P144\.2\s+billing\s+and\s+meter\s+model\s+is\s+complete/i.test(platformRoadmap) && /P144\.2 is now complete as a read-only model/i.test(enterpriseRoadmap) && /P144\.3 is planned-only next/i.test(enterpriseRoadmap));
addCheck("phase status advances to P144.2", p1442CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P144 parent records active status", [p144, p144Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1442-billing-metering-customer-operations") && entry.commandCenterVisible === true));
addCheck("completed P144.2 entries have required fields", [statusById.get("P144.2"), roadmapById.get("P144.2")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("next P144.3/P145 handoff remains planned-only", [statusById.get("P144.3"), roadmapById.get("P144.3"), statusById.get("P145"), roadmapById.get("P145")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("P144.2 Playwright coverage exists", routeTests.includes("P144.2 billing meter model keeps roadmap current") && routeTests.includes("P144.2") && routeTests.includes("Billing and Meter Model") && routeTests.includes("P144.3") && routeTests.includes("Billing Preview"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P144.2 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("model and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support|meter|usage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(modelAndDocs));
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
        "- Adds the P144.2 read-only billing, metering, invoice-preview, entitlement, support handoff, and customer-operations model.",
        "- Confirms P144.1 remains complete and P144.3/P145 remain planned-only.",
        "- Does not write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Model Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Model validation: ${modelValidation.valid ? "PASS" : "FAIL"}`,
        `- Authority flags: ${BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false) ? "blocked" : "unsafe"}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P144.2 is read-only model work only. It does not write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P144.3-P144.7 remain planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P144.2 Billing Metering Customer Operations Report", phase: "P144.2" },
);

printCheckReport("P144.2 Billing Metering Customer Operations Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
