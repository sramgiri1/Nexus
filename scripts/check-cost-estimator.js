import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  createBudgetPolicy,
  createCostEstimateRequest,
  estimateBatchCost,
  estimateTaskCost,
  estimateToolCost,
  summarizeCostEstimate,
  validateCostEstimateRequest,
} from "../cost-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/cost-estimator-report.md");
const PREVIEW_PATH = join(ROOT, "reports/cost-estimates-preview.json");
const checks = [
  { key: "requests", name: "Estimate requests", status: "PASS", details: "" },
  { key: "estimates", name: "Estimate outputs", status: "PASS", details: "" },
  { key: "ledger", name: "Ledger records", status: "PASS", details: "" },
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

const budgetPolicy = createBudgetPolicy({ budgetPolicyId: "budget_estimator_preview", maxUsdPerRun: 1, requiresApprovalAboveUsd: 0.5 });
const requests = [
  createCostEstimateRequest({ estimateId: "estimate_task_preview", sourceType: "task", sourceId: "task_preview", estimatedInputTokens: 1800, estimatedOutputTokens: 800, estimatedToolCalls: 1, budgetPolicyId: budgetPolicy.budgetPolicyId }),
  createCostEstimateRequest({ estimateId: "estimate_batch_preview", sourceType: "api_batch", sourceId: "batch_preview", estimatedInputTokens: 20000, estimatedOutputTokens: 5000, providerProfile: "openai-preview", budgetPolicyId: budgetPolicy.budgetPolicyId }),
  createCostEstimateRequest({ estimateId: "estimate_test_preview", sourceType: "test_suite", sourceId: "test_suite_preview", estimatedRuntimeSeconds: 90, providerProfile: "local", budgetPolicyId: budgetPolicy.budgetPolicyId }),
];

for (const request of requests) {
  const validation = validateCostEstimateRequest(request);
  check(validation.valid, "requests", `${request.estimateId}: ${validation.errors.join(", ")}`);
}

const estimates = [
  estimateTaskCost(requests[0], { budgetPolicy }),
  estimateBatchCost(requests[1], { budgetPolicy }),
  estimateToolCost({ ...requests[2], sourceType: "tool", estimatedToolCalls: 2 }, { budgetPolicy }),
];

for (const estimate of estimates) {
  check(estimate.ok === true, "estimates", `${estimate.estimateId} should be ok`);
  check(estimate.estimateOnly === true, "safety", `${estimate.estimateId} must be estimate-only`);
  check(estimate.providerDispatchAllowed === false, "safety", `${estimate.estimateId} must not allow provider dispatch`);
  check(estimate.costLedgerRecord?.eventType === "cost_estimate_created", "ledger", `${estimate.estimateId} missing ledger record`);
}

const preview = {
  version: "1.0",
  phase: "P57.3",
  generatedAt: new Date().toISOString(),
  previewOnly: true,
  providerDispatchAllowed: false,
  estimates,
  summaries: estimates.map(summarizeCostEstimate),
};
writeFileSync(PREVIEW_PATH, JSON.stringify(preview, null, 2) + "\n");
check(!JSON.stringify(preview).includes("sk-"), "safety", "Preview must not contain secret-like values");

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
        "- Estimate requests are redacted and preview-only.",
        "- Task, batch, and tool/test estimates use static assumptions only.",
        "- Provider dispatch remains disabled and no external network calls are made.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Cost Estimator Report", metadata: { phase: "P57.3 - Estimate Before Run" } },
);

console.log("NEXUS Cost Estimator Check");
console.log("==========================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
