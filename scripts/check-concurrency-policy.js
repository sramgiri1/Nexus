import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildCheckTable,
  formatCheckLine,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  assertConcurrencyPreviewOnly,
  buildConcurrencyPolicySummary,
  getConcurrencyLimits,
  loadConcurrencyPolicy,
  validateConcurrencyPolicy,
} from "../concurrency/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/concurrency-policy-report.md");

const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "policy", name: "Policy", status: "PASS", details: "" },
  { key: "limits", name: "Limits", status: "PASS", details: "" },
  { key: "previewOnly", name: "Preview only", status: "PASS", details: "" },
  { key: "reports", name: "Report written", status: "PASS", details: "" },
];
const failures = [];

function fail(key, message) {
  const check = checks.find((entry) => entry.key === key);
  if (check) {
    check.status = "FAIL";
    check.details = message;
  }
  failures.push(message);
}

function check(condition, key, message) {
  if (!condition) fail(key, message);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

console.log("NEXUS Concurrency Policy Check\n==============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const filePath of [
  "concurrency/concurrencyPolicy.js",
  "concurrency/concurrencySchema.js",
  "concurrency/index.js",
  "policy/concurrency-policy.json",
]) {
  check(existsSync(join(ROOT, filePath)), "modules", `Missing ${filePath}`);
}

const policy = loadConcurrencyPolicy();
const validation = validateConcurrencyPolicy(policy);
check(validation.valid, "policy", validation.errors.join("; "));
check(assertConcurrencyPreviewOnly(policy), "previewOnly", "Policy must be preview-only");

const limits = getConcurrencyLimits(policy);
check(limits.maxConcurrentTasksPerProject === 1, "limits", "Project concurrency limit must be 1");
check(limits.maxConcurrentTasksPerRepo === 1, "limits", "Repo concurrency limit must be 1");
check(limits.maxConcurrentTasksPerAgent === 1, "limits", "Agent concurrency limit must be 1");
check(policy.providerCallsAllowed === false, "previewOnly", "Provider calls must remain disabled");
check(policy.toolExecutionAllowed === false, "previewOnly", "Tool execution must remain disabled");
check(policy.projectMutationAllowed === false, "previewOnly", "Project mutation must remain disabled");
check(policy.dbWritesAllowed === false, "previewOnly", "DB writes must remain disabled");

const summary = buildConcurrencyPolicySummary(policy);
const result = checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL";

writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body: "P61.1 defines a preview-only concurrency policy. It does not enable parallel execution.",
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: [
        `- Preview only: ${summary.previewOnly ? "yes" : "no"}`,
        `- Concurrency execution enabled: ${summary.concurrencyExecutionEnabled ? "yes" : "no"}`,
        `- Provider calls allowed: ${summary.providerCallsAllowed ? "yes" : "no"}`,
        `- DB writes allowed: ${summary.dbWritesAllowed ? "yes" : "no"}`,
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "NEXUS Concurrency Policy Report", metadata: { branch, head, phase: "P61.1" } },
);

for (const entry of checks) console.log(formatCheckLine(entry.name, entry.status, entry.details));
console.log(`Result: ${result}`);
process.exit(result === "PASS" ? 0 : 1);
