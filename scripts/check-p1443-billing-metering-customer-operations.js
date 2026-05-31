import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE,
  BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES,
  BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_VERSION,
  buildBillingMeteringCustomerOperationsPreview,
  buildBillingMeteringCustomerOperationsPreviewEnvelope,
  buildPreviewRow,
  validateBillingMeteringCustomerOperationsPreview,
  validatePreviewRow,
} from "../shared/billingMeteringCustomerOperationsPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1443-billing-metering-customer-operations-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p144-billing-metering-customer-operations-contracts.json";
const PLAN_PATH = "docs/architecture/P144_BILLING_METERING_CUSTOMER_OPERATIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1443-billing-metering-customer-operations";
const PRIOR_SCRIPT = "check:p1442-billing-metering-customer-operations";
const EXPECTED_BASE_COMMIT = "1fb7bb64";
const EXPECTED_EXPORTS = [
  "BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE",
  "BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_VERSION",
  "BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES",
  "buildPreviewRow",
  "validatePreviewRow",
  "buildBillingMeteringCustomerOperationsPreview",
  "validateBillingMeteringCustomerOperationsPreview",
  "buildBillingMeteringCustomerOperationsPreviewEnvelope",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1443-billing-metering-customer-operations",
  "npm run check:p1442-billing-metering-customer-operations",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P144.3|Command Center route-wide UX\"",
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
const p1441 = subphaseById.get("P144.1") || {};
const p1442 = subphaseById.get("P144.2") || {};
const p1443 = subphaseById.get("P144.3") || {};
const p1444 = subphaseById.get("P144.4") || {};
const checkerSource = readText("scripts/check-p1443-billing-metering-customer-operations.js");
const p1442Checker = readText("scripts/check-p1442-billing-metering-customer-operations.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const helperSource = readText("shared/billingMeteringCustomerOperationsPreview.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P144.3";
const allowedFiles = new Set(p1443.allowedFiles || []);
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
const previewRow = buildPreviewRow({ sequence: 1 });
const preview = buildBillingMeteringCustomerOperationsPreview({ createdAt: "2026-05-31T14:15:00.000Z" });
const rowValidation = validatePreviewRow(previewRow);
const previewValidation = validateBillingMeteringCustomerOperationsPreview(preview);
const envelope = buildBillingMeteringCustomerOperationsPreviewEnvelope({ preview });
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const previewAndDocs = `${JSON.stringify(preview)}\n${docsBundle}`;

const p1443CurrentState =
  status.currentPhase === "P144.3"
  && status.previousPhase === "P144.2"
  && status.nextPhase === "P144.4"
  && roadmap.currentPhase === "P144.3"
  && roadmap.previousPhase === "P144.2"
  && roadmap.nextPhase === "P144.4"
  && status.current?.phaseId === "P144.3"
  && status.previous?.phaseId === "P144.2"
  && status.next?.phaseId === "P144.4"
  && roadmap.current?.phaseId === "P144.3"
  && roadmap.previous?.phaseId === "P144.2"
  && roadmap.next?.phaseId === "P144.4"
  && statusById.get("P143")?.status === "complete"
  && roadmapById.get("P143")?.status === "complete"
  && statusById.get("P144")?.status === "in_progress"
  && roadmapById.get("P144")?.status === "in_progress"
  && ["P144.1", "P144.2", "P144.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P144.4")?.status === "planned"
  && roadmapById.get("P144.4")?.status === "planned"
  && statusById.get("P145")?.status === "planned"
  && roadmapById.get("P145")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1443-billing-metering-customer-operations.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("preview exports expected API", EXPECTED_EXPORTS.every((entry) => helperSource.includes(`export const ${entry}`) || helperSource.includes(`export function ${entry}`)));
addCheck("preview reuses P144.2 model and shared helpers", ["./billingMeteringCustomerOperationsModel.js", "./modeGuard.js", "./redaction.js", "./resultEnvelope.js"].every((target) => helperSource.includes(target)));
addCheck("preview helper does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb|stripe|paymentIntent|invoiceCreate|subscriptionCreate)\b/.test(helperSource));
addCheck("preview constants are correct", BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE === "P144.3" && BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_VERSION === "1.0" && BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES.length >= 20);
addCheck("preview row validator passes", rowValidation.valid, rowValidation.errors.join("; "));
addCheck("preview validator passes", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("preview envelope passes", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P144.3" && envelope.envelopeValid === true);
addCheck("preview maps all P144.2 source rows", preview.rows.length >= 14 && ["billing_account", "usage_meter", "invoice_preview", "entitlement", "support_handoff", "customer_operation"].every((type) => preview.rows.some((row) => row.sourceType === type)));
addCheck("preview rows are non-runnable", preview.rows.every((row) => row.executablePayload === null && row.billingMutationPayload === null && row.usageWritePayload === null && row.invoiceCreationPayload === null && row.paymentCollectionPayload === null && row.entitlementMutationPayload === null && row.supportTicketPayload === null && row.customerContactPayload === null && row.customerOperationPayload === null && row.dbRuntimeMutationPayload === null && row.providerPayload === null && row.paymentProviderPayload === null && row.toolPayload === null && row.agentDispatchPayload === null && row.projectMutationPayload === null && row.executionAllowed === false));
addCheck("preview hides raw internals", preview.rows.every((row) => row.rawPayloadVisible === false && row.rawPrivateIdsVisible === false && row.rawInternalPayloadsVisible === false) && preview.redaction.rawPrivateIdsVisible === false && preview.redaction.rawInternalPayloadsVisible === false);
addCheck("readiness summary blocks runtime candidates", preview.readinessSummary.runnableActionCount === 0 && preview.readinessSummary.billingMutationCandidateCount === 0 && preview.readinessSummary.usageWriteCandidateCount === 0 && preview.readinessSummary.invoiceCreationCandidateCount === 0 && preview.readinessSummary.paymentCollectionCandidateCount === 0 && preview.readinessSummary.entitlementMutationCandidateCount === 0 && preview.readinessSummary.supportTicketCandidateCount === 0 && preview.readinessSummary.customerContactCandidateCount === 0 && preview.readinessSummary.customerOperationExecutionCandidateCount === 0 && preview.readinessSummary.providerSpendCandidateCount === 0);
addCheck("all authority flags remain blocked", BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES.every((flag) => preview[flag] === false && preview.safetyFlags?.[flag] === false && preview.rows.every((row) => row[flag] === false && row.safetyFlags?.[flag] === false && row.authorityFlags?.[flag] === false)));
addCheck("cost impact remains zero-spend", preview.costImpact.estimatedUsd === 0 && preview.costImpact.actualUsd === 0 && preview.costImpact.providerSpendAllowed === false && preview.costImpact.paymentProviderSpendAllowed === false && preview.costImpact.networkCallsAllowed === false && preview.rows.every((row) => row.costImpact.estimatedUsd === 0 && row.costImpact.actualUsd === 0 && row.costImpact.providerSpendAllowed === false && row.costImpact.paymentProviderSpendAllowed === false));
addCheck("P144.2 report passes", reportPassed("reports/p1442-billing-metering-customer-operations-report.md"));
addCheck("contract advances to P144.3 safely", contract.phaseId === "P144" && contract.status === "in_progress" && p1441.status === "complete" && p1442.status === "complete" && p1443.status === "complete" && contract.currentSubphase === "P144.3" && contract.previousSubphase === "P144.2" && contract.nextSubphase === "P144.4" && p1444.status === "planned");
addCheck("contract records expected base commit", p1443.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1443.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1443.validationCommands?.includes(command)));
addCheck("contract scope stays preview-only", /non-runnable billing/i.test(p1443.dataShape || "") && p1443.forbiddenFiles?.includes("dashboard/src/**") && p1443.forbiddenFiles?.includes("projects/**") && p1443.forbiddenFiles?.includes("db/**") && p1443.forbiddenFiles?.includes("providers/**"));
addCheck("P144.2 checker accepts P144.3 handoff", p1442Checker.includes("p1443CurrentState") && p1442Checker.includes('status.currentPhase === "P144.3"') && p1442Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P144.3 active state", enterpriseChecker.includes("p1443CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P144.4 handoff", osStatusChecker.includes('"P144.3"') && osStatusChecker.includes('"P144.4"') && osStatusChecker.includes('"P144.7"'));
addCheck("docs record P144.3 and P144.4 handoff", /## P144\.3 Billing Preview[\s\S]*Status:\s+complete/.test(plan) && /P144\.3\s+Billing\s+Preview\s+is\s+complete/i.test(readme) && /P144\.3\s+billing preview\s+is\s+complete/i.test(platformRoadmap) && /P144\.3 is now complete as a non-runnable billing preview/i.test(enterpriseRoadmap) && /P144\.4 is planned-only next/i.test(enterpriseRoadmap));
addCheck("phase status advances to P144.3", p1443CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P144 parent records active status", [p144, p144Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1443-billing-metering-customer-operations") && entry.commandCenterVisible === true));
addCheck("completed P144.3 entries have required fields", [statusById.get("P144.3"), roadmapById.get("P144.3")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("next P144.4/P145 handoff remains planned-only", [statusById.get("P144.4"), roadmapById.get("P144.4"), statusById.get("P145"), roadmapById.get("P145")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("P144.3 Playwright coverage exists", routeTests.includes("P144.3 billing preview keeps roadmap current") && routeTests.includes("P144.3") && routeTests.includes("Billing Preview") && routeTests.includes("P144.4") && routeTests.includes("Customer Operations Command Center UX"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P144.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("preview and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support|meter|usage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(previewAndDocs));
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
        "- Adds the P144.3 display-safe billing, metering, invoice, entitlement, support, and customer operations preview.",
        "- Confirms P144.2 remains complete and P144.4/P145 remain planned-only.",
        "- Does not write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Preview Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Preview validation: ${previewValidation.valid ? "PASS" : "FAIL"}`,
        `- Preview rows: ${preview.rows.length}`,
        `- Authority flags: ${BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES.every((flag) => preview[flag] === false) ? "blocked" : "unsafe"}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P144.3 is a non-runnable local preview only. It does not render a new Command Center billing/customer page, write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P144.4-P144.7 remain planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P144.3 Billing Metering Customer Operations Report", phase: "P144.3" },
);

printCheckReport("P144.3 Billing Metering Customer Operations Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
