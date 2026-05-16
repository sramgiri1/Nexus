import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  createBudgetCheckRequest,
  createBudgetPolicy,
  createCostEstimateRequest,
  estimateTaskCost,
  evaluateBudgetCheck,
  summarizeBudgetDecision,
  validateBudgetCheckRequest,
} from "../cost-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/budget-enforcer-report.md");
const checks = [
  { key: "requests", name: "Budget check requests", status: "PASS", details: "" },
  { key: "decisions", name: "Decision cases", status: "PASS", details: "" },
  { key: "ledger", name: "Decision ledger", status: "PASS", details: "" },
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

const policy = createBudgetPolicy({ budgetPolicyId: "budget_enforcer_preview", maxUsdPerRun: 0.3, requiresApprovalAboveUsd: 0.15 });
const baseEstimate = estimateTaskCost(createCostEstimateRequest({ estimateId: "estimate_enforcer_preview", estimatedInputTokens: 1000, estimatedOutputTokens: 500 }));
const overThresholdEstimate = { ...baseEstimate, estimatedUsd: 0.2 };

const requests = [
  createBudgetCheckRequest({ budgetCheckId: "budget_check_record", requestedAction: "estimate", estimateId: baseEstimate.estimateId }),
  createBudgetCheckRequest({ budgetCheckId: "budget_check_block", requestedAction: "dispatch", sourceType: "provider", estimateId: baseEstimate.estimateId }),
  createBudgetCheckRequest({ budgetCheckId: "budget_check_approval", requestedAction: "execute", estimateId: overThresholdEstimate.estimateId }),
  createBudgetCheckRequest({ budgetCheckId: "budget_check_allow", requestedAction: "execute", estimateId: baseEstimate.estimateId }),
];

for (const request of requests) {
  const validation = validateBudgetCheckRequest(request);
  check(validation.valid, "requests", `${request.budgetCheckId}: ${validation.errors.join(", ")}`);
}

const recordOnly = evaluateBudgetCheck(requests[0], policy, baseEstimate);
const blocked = evaluateBudgetCheck(requests[1], policy, baseEstimate);
const approval = evaluateBudgetCheck(requests[2], policy, overThresholdEstimate);
const allowed = evaluateBudgetCheck(requests[3], policy, baseEstimate);

check(recordOnly.decision === "RECORD_ONLY", "decisions", "Estimate-only request should be RECORD_ONLY");
check(blocked.decision === "BLOCK", "decisions", "Provider dispatch should be BLOCK");
check(approval.decision === "REQUIRE_APPROVAL", "decisions", "Threshold exceedance should REQUIRE_APPROVAL");
check(allowed.decision === "ALLOW", "decisions", "Within-budget preview should ALLOW");

for (const decision of [recordOnly, blocked, approval, allowed]) {
  check(decision.providerDispatchAllowed === false, "safety", "Provider dispatch must remain false");
  check(decision.executionAllowed === false, "safety", "Execution must remain false");
  check(Boolean(decision.ledgerRecord?.eventType), "ledger", `${decision.budgetCheckId} missing ledger event`);
  check(summarizeBudgetDecision(decision).providerDispatchAllowed === false, "safety", "Summary cannot allow provider dispatch");
}

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
        "- Budget enforcer previews RECORD_ONLY, BLOCK, REQUIRE_APPROVAL, and ALLOW decisions.",
        "- Decisions are user-facing preview decisions only; execution remains disabled.",
        "- Provider dispatch, worker runtime, external network, DB writes, and project mutation remain disabled.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Budget Enforcer Report", metadata: { phase: "P57.5 - Budget Block / Approval Threshold" } },
);

console.log("NEXUS Budget Enforcer Check");
console.log("===========================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
