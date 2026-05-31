import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1441-billing-metering-customer-operations-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p144-billing-metering-customer-operations-contracts.json";
const PLAN_PATH = "docs/architecture/P144_BILLING_METERING_CUSTOMER_OPERATIONS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1441-billing-metering-customer-operations";
const EXPECTED_BASE_COMMIT = "5034d56a";
const EXPECTED_SUBPHASES = ["P144.1", "P144.2", "P144.3", "P144.4", "P144.5", "P144.6", "P144.7"];
const VALIDATION_COMMANDS = [
  "npm run check:p1441-billing-metering-customer-operations",
  "npm run check:p1437-release-deploy-export-package-pipeline-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P144.1|Command Center route-wide UX\"",
  "git diff --check",
];
const REQUIRED_PLAN_FIELDS = [
  "narrow scope",
  "starting branch and expected base commit",
  "allowed files",
  "forbidden files",
  "exact files/modules",
  "expected exports/schemas/data shapes",
  "Command Center UX requirements",
  "dark/light/system theme requirements",
  "Playwright tests",
  "checker updates",
  "docs/README/roadmap updates",
  "OS phase status update",
  "validation commands",
  "final safety checks",
  "git add/commit/push commands",
  "final response checklist",
];
const REQUIRED_BILLING_ACCOUNT_FIELDS = ["accountRef", "displayName", "planState", "billingStatus", "invoiceStatus", "paymentProviderStatus", "mutationAllowed", "disabledReason", "ownerCapability", "evidenceRefs", "blockers"];
const REQUIRED_USAGE_METER_FIELDS = ["meterRef", "displayName", "meterCategory", "unit", "captureState", "writeAllowed", "rollupAllowed", "costImpact", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_INVOICE_PREVIEW_FIELDS = ["invoiceRef", "displayName", "billingPeriod", "previewState", "chargeComputationAllowed", "invoiceCreationAllowed", "paymentCollectionAllowed", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_ENTITLEMENT_FIELDS = ["entitlementRef", "displayName", "currentState", "grantAllowed", "revokeAllowed", "sourceOfTruth", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_SUPPORT_HANDOFF_FIELDS = ["handoffRef", "displayName", "handoffType", "currentState", "ticketCreationAllowed", "customerContactAllowed", "ownerCapability", "evidenceRefs", "disabledReason"];
const REQUIRED_CUSTOMER_OPERATION_FIELDS = ["operationRef", "displayName", "operationType", "currentState", "executionAllowed", "requiresApproval", "ownerCapability", "evidenceRefs", "disabledReason", "blockers"];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
}

function hasFields(actual = [], required = []) {
  return required.every((field) => actual.includes(field));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|coverage|tests?|ux|handoff)\b/i.test(context);
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
const checkerSource = readText("scripts/check-p1441-billing-metering-customer-operations.js");
const p1437Checker = readText("scripts/check-p1437-release-deploy-export-package-pipeline-final-validation.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P144.1";
const allowedFiles = new Set(p1441.allowedFiles || []);
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

const p1441StartedState =
  status.currentPhase === "P144.1"
  && status.previousPhase === "P143.7"
  && status.nextPhase === "P144.2"
  && roadmap.currentPhase === "P144.1"
  && roadmap.previousPhase === "P143.7"
  && roadmap.nextPhase === "P144.2"
  && status.current?.phaseId === "P144.1"
  && status.previous?.phaseId === "P143.7"
  && status.next?.phaseId === "P144.2"
  && roadmap.current?.phaseId === "P144.1"
  && roadmap.previous?.phaseId === "P143.7"
  && roadmap.next?.phaseId === "P144.2"
  && statusById.get("P143")?.status === "complete"
  && roadmapById.get("P143")?.status === "complete"
  && statusById.get("P143.7")?.status === "complete"
  && roadmapById.get("P143.7")?.status === "complete"
  && statusById.get("P144")?.status === "in_progress"
  && roadmapById.get("P144")?.status === "in_progress"
  && statusById.get("P144.1")?.status === "complete"
  && roadmapById.get("P144.1")?.status === "complete"
  && statusById.get("P144.2")?.status === "planned"
  && roadmapById.get("P144.2")?.status === "planned"
  && statusById.get("P145")?.status === "planned"
  && roadmapById.get("P145")?.status === "planned";

const allAuthorityFlagsFalse = Object.values(contract.authorityFlags || {}).every((value) => value === false);

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1441-billing-metering-customer-operations.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P143.7 report still passes", reportPassed("reports/p1437-release-deploy-export-package-pipeline-final-validation-report.md"));
addCheck("contract keeps P144.1 complete", contract.phaseId === "P144" && contract.status === "in_progress" && contract.currentSubphase === "P144.1" && contract.previousSubphase === "P143.7" && contract.nextSubphase === "P144.2" && p1441.status === "complete" && p1442.status === "planned");
addCheck("contract records expected base commit", p1441.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records seven subphases", EXPECTED_SUBPHASES.every((phaseId) => subphaseById.has(phaseId)));
addCheck("subphases include implementation plan fields", EXPECTED_SUBPHASES.every((phaseId) => {
  const subphase = subphaseById.get(phaseId) || {};
  const required = subphase.requiredPlanFields || REQUIRED_PLAN_FIELDS;
  return Boolean(subphase.narrowGoal) && subphase.scopeClassification === "NEXUS_OS_CHANGE" && REQUIRED_PLAN_FIELDS.every((field) => required.includes(field) || JSON.stringify(subphase).toLowerCase().includes(field.toLowerCase()));
}));
addCheck("P144.1 records allowed and forbidden files", p1441.allowedFiles?.includes(CONTRACT_PATH) && p1441.allowedFiles?.includes("scripts/check-p1441-billing-metering-customer-operations.js") && p1441.forbiddenFiles?.includes("projects/**") && p1441.forbiddenFiles?.includes("dashboard/src/**") && p1441.forbiddenFiles?.includes("db/**") && p1441.forbiddenFiles?.includes("providers/**") && p1441.forbiddenFiles?.includes("tools/**"));
addCheck("P144.1 records validation commands", VALIDATION_COMMANDS.every((command) => p1441.validationCommands?.includes(command)));
addCheck("billing account shape present", hasFields(contract.billingAccountShape, REQUIRED_BILLING_ACCOUNT_FIELDS));
addCheck("usage meter shape present", hasFields(contract.usageMeterShape, REQUIRED_USAGE_METER_FIELDS));
addCheck("invoice preview shape present", hasFields(contract.invoicePreviewShape, REQUIRED_INVOICE_PREVIEW_FIELDS));
addCheck("entitlement shape present", hasFields(contract.entitlementShape, REQUIRED_ENTITLEMENT_FIELDS));
addCheck("support handoff shape present", hasFields(contract.supportHandoffShape, REQUIRED_SUPPORT_HANDOFF_FIELDS));
addCheck("customer operation shape present", hasFields(contract.customerOperationShape, REQUIRED_CUSTOMER_OPERATION_FIELDS));
addCheck("authority flags block billing/customer authority", allAuthorityFlagsFalse, JSON.stringify(contract.authorityFlags || {}));
addCheck("P144.2 handoff is safe", p1442.status === "planned" && p1442.expectedBaseCommit === "after-P144.1" && p1442.commit === "" && Array.isArray(p1442.checksRun) && p1442.checksRun.length === 0);
addCheck("P143.7 checker preserves P144 handoff", p1437Checker.includes("P144") && p1437Checker.includes("P143.7"));
addCheck("enterprise checker accepts P144.1 active state", enterpriseChecker.includes("p1441StartedState") && enterpriseChecker.includes("p144ActiveState") && enterpriseChecker.includes("currentP144CheckCommand") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P144 subphases", osStatusChecker.includes('"P144.1"') && osStatusChecker.includes('"P144.2"') && osStatusChecker.includes('"P144.7"'));
addCheck("docs record P144.1 and P144.2 handoff", /## P144\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan) && /P144\.1\s+Billing\s+Metering\s+Customer\s+Operations\s+Contract\s+is\s+complete/i.test(readme) && /P144\.1\s+billing\s+customer-ops\s+contract\s+is\s+complete/i.test(platformRoadmap) && /P144\.1 is now complete as contract\/policy\/safety-boundary only/i.test(enterpriseRoadmap) && /P144\.2 is planned-only next/i.test(enterpriseRoadmap));
addCheck("phase status starts P144.1", p1441StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P144 parent records active status", [p144, p144Roadmap].every((entry) => entry.status === "in_progress" && entry.commit && Array.isArray(entry.checksRun) && entry.checksRun.includes("npm run check:p1441-billing-metering-customer-operations") && entry.commandCenterVisible === true));
addCheck("P144.1 records required status fields", [statusById.get("P144.1"), roadmapById.get("P144.1")].every((entry) => Boolean(entry?.phaseId) && entry.track === "NEXUS_OS" && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("next P144/P145 handoff remains safe", [statusById.get("P144.2"), roadmapById.get("P144.2"), statusById.get("P145"), roadmapById.get("P145")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("P144.1 Playwright coverage exists", routeTests.includes("P144.1 billing customer operations contract keeps roadmap current") && routeTests.includes("P144.1") && routeTests.includes("P144.2") && routeTests.includes("Billing, Metering, and Customer Operations"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P144.1 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => file === "dashboard/tests/routes.spec.js" || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|billing|payment|invoice|subscription|entitlement|customer|support)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
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
        "- Starts P144.1 as contract/policy/safety-boundary work for billing, metering, customer operations, support handoff, entitlements, invoice previews, and payment-safety boundaries.",
        "- Confirms P143.7 remains complete and P144.2/P145 remain planned-only.",
        "- Does not write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Contract Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Authority flags blocked: ${allAuthorityFlagsFalse}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P144.1 is contract/policy/safety-boundary work only. It does not write billing accounts, record usage, create invoices, collect payments, mutate subscriptions or entitlements, create support tickets, contact customers, execute customer operations, write DB/runtime state, call providers/models, call payment providers, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend. P144.2-P144.7 remain planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P144.1 Billing Metering Customer Operations Report", phase: "P144.1" },
);

printCheckReport("P144.1 Billing Metering Customer Operations Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
