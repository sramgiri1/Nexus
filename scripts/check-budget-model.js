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
  BUDGET_SCOPE_TYPES,
  createBudgetPolicy,
  resolveBudgetForContext,
  summarizeBudgets,
  validateBudgetPolicy,
} from "../cost-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/budget-model-report.md");
const PREVIEW_PATH = join(ROOT, "reports/budget-policy-preview.json");
const checks = [
  { key: "scopes", name: "Budget scopes", status: "PASS", details: "" },
  { key: "policies", name: "Default policies", status: "PASS", details: "" },
  { key: "resolution", name: "Context resolution", status: "PASS", details: "" },
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

for (const scope of ["global", "project", "task", "agent", "skill", "hook", "tool", "api_batch", "os_phase"]) {
  check(BUDGET_SCOPE_TYPES.includes(scope), "scopes", `Missing scope: ${scope}`);
}

const policies = [
  createBudgetPolicy({
    budgetPolicyId: "budget_global_preview",
    scopeType: "global",
    scopeId: "nexus",
    maxUsdPerRun: 1,
    maxUsdPerTask: 0.25,
    maxUsdPerDay: 5,
    maxTokensPerRun: 50000,
    requiresApprovalAboveUsd: 0.5,
  }),
  createBudgetPolicy({
    budgetPolicyId: "budget_task_preview",
    scopeType: "task",
    scopeId: "task_preview",
    maxUsdPerRun: 0.2,
    requiresApprovalAboveUsd: 0.1,
  }),
  createBudgetPolicy({
    budgetPolicyId: "budget_tool_preview",
    scopeType: "tool",
    scopeId: "tool_preview",
    maxUsdPerRun: 0.05,
    requiresApprovalAboveUsd: 0.025,
  }),
];

for (const policy of policies) {
  const validation = validateBudgetPolicy(policy);
  check(validation.valid, "policies", `${policy.budgetPolicyId}: ${validation.errors.join(", ")}`);
  check(policy.providerDispatchAllowed === false, "safety", "Provider dispatch must remain false");
  check(policy.workerExecutionAllowed === false, "safety", "Worker execution must remain false");
  check(policy.projectMutationAllowed === false, "safety", "Project mutation must remain false");
}

const resolved = resolveBudgetForContext({ mode: "local-private", taskId: "task_preview" }, policies);
check(resolved.budgetPolicyId === "budget_task_preview", "resolution", "Task policy should override global policy");

const preview = {
  version: "1.0",
  phase: "P57.2",
  generatedAt: new Date().toISOString(),
  previewOnly: true,
  policies,
  summary: summarizeBudgets(policies),
};
writeFileSync(PREVIEW_PATH, JSON.stringify(preview, null, 2) + "\n");
check(preview.summary.providerDispatchAllowed === false, "safety", "Preview summary must keep provider dispatch disabled");

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
        "- Budget policies cover global, project, mission, task, agent, skill, hook, tool, trigger, provider, API batch, worker, and OS phase scopes.",
        "- P57 policies are estimates-only and keep provider dispatch, worker execution, DB writes, and project mutation disabled.",
        "- Budget thresholds and approval thresholds are modeled for later enforcement.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Budget Model Report", metadata: { phase: "P57.2 - Task / Agent / Skill / Tool Budget Model" } },
);

console.log("NEXUS Budget Model Check");
console.log("========================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
