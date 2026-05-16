import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  createActualCostRecord,
  createCostEstimateRequest,
  estimateTaskCost,
  markCostRecordSuperseded,
  reconcileEstimateWithActual,
  summarizeActualCost,
  validateActualCostRecord,
} from "../cost-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/cost-recorder-report.md");
const checks = [
  { key: "actual", name: "Actual record", status: "PASS", details: "" },
  { key: "reconcile", name: "Reconciliation", status: "PASS", details: "" },
  { key: "supersede", name: "Supersession", status: "PASS", details: "" },
  { key: "safety", name: "Safety boundaries", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];

function fail(key, details) {
  const row = checks.find((check) => check.key === key);
  if (row) {
    row.status = "FAIL";
    row.details = details;
  }
  failures.push(details);
}

function check(condition, key, details) {
  if (!condition) fail(key, details);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

const estimate = estimateTaskCost(createCostEstimateRequest({
  estimateId: "estimate_recorder_preview",
  sourceId: "task_preview",
  estimatedInputTokens: 1000,
  estimatedOutputTokens: 500,
}));
const actual = createActualCostRecord({
  actualCostId: "actual_recorder_preview",
  estimateId: estimate.estimateId,
  sourceType: "task",
  sourceId: "task_preview",
  actualUsd: estimate.estimatedUsd + 0.01,
  actualInputTokens: 1100,
  actualOutputTokens: 600,
  billingSource: "preview",
});
const validation = validateActualCostRecord(actual);
check(validation.valid, "actual", validation.errors.join(", "));
check(actual.providerDispatchOccurred === false, "safety", "Provider dispatch must not occur");
check(actual.billingSource === "preview", "safety", "P57 actuals must be preview records");

const reconciliation = reconcileEstimateWithActual(estimate, actual);
check(reconciliation.exceededEstimate === true, "reconcile", "Reconciliation should warn on estimate exceedance");
check(reconciliation.providerDispatchOccurred === false, "safety", "Reconciliation must not imply provider dispatch");

const superseded = markCostRecordSuperseded(actual, "Preview correction");
check(superseded.superseded === true, "supersede", "Superseded flag missing");
check(superseded.ledgerRecord.eventType === "cost_record_superseded", "supersede", "Supersession ledger event missing");
check(summarizeActualCost([actual]).providerDispatchOccurred === false, "safety", "Summary must keep provider dispatch false");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: [
        "- Actual cost records are preview/mock records only.",
        "- Reconciliation can compare estimates and preview actuals without billing APIs.",
        "- Provider dispatch, external network, DB writes, and real spend remain disabled.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Cost Recorder Report", metadata: { phase: "P57.4 - Actual Cost After Run" } },
);

console.log("NEXUS Cost Recorder Check");
console.log("=========================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
