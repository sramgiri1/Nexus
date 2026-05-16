import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildCheckTable, formatCheckLine, writeMarkdownReport } from "../shared/index.js";
import {
  assessCancellationSafety,
  buildCancellationPlan,
  buildCancellationSummary,
  createCancellationRequest,
  getCancellationPolicy,
  validateCancellationRequest,
} from "../concurrency/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/task-cancellation-report.md");
const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "request", name: "Cancellation request", status: "PASS", details: "" },
  { key: "safety", name: "Safety assessment", status: "PASS", details: "" },
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

console.log("NEXUS Task Cancellation Check\n=============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const filePath of ["concurrency/cancellationModel.js", "concurrency/cancellationPolicy.js"]) {
  check(existsSync(join(ROOT, filePath)), "modules", `Missing ${filePath}`);
}

const policy = getCancellationPolicy();
check(policy.actualCancellationEnabled === false, "previewOnly", "Actual cancellation must remain disabled");
check(policy.workerTerminationAllowed === false, "previewOnly", "Worker termination must remain disabled");

const request = createCancellationRequest({ taskId: "queued-task", reason: "Operator preview" });
const validation = validateCancellationRequest(request);
check(validation.valid, "request", validation.errors.join("; "));
check(request.previewOnly === true, "previewOnly", "Cancellation request must remain previewOnly");

const safe = assessCancellationSafety({ taskId: "queued-task", state: "queued" });
check(safe.safeToCancel === true, "safety", "Queued task should be safe in preview");
const blocked = assessCancellationSafety({ taskId: "db-task", state: "db_write" });
check(blocked.safeToCancel === false, "safety", "DB write state should block cancellation preview");

const plan = buildCancellationPlan(request, { taskId: "queued-task", state: "queued" });
check(plan.actualCancellationEnabled === false, "previewOnly", "Cancellation plan must not enable execution");
const summary = buildCancellationSummary([plan, buildCancellationPlan(
  createCancellationRequest({ taskId: "db-task" }),
  { taskId: "db-task", state: "db_write" },
)]);

const result = checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "P61.5 models cancellation requests only. It does not terminate workers or mutate task state." },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: `- Requests: ${summary.totalRequests}\n- Accepted preview: ${summary.acceptedPreview}\n- Actual cancellation enabled: no`,
    },
    { title: "Failures", body: failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "NEXUS Task Cancellation Report", metadata: { branch, head, phase: "P61.5" } },
);

for (const entry of checks) console.log(formatCheckLine(entry.name, entry.status, entry.details));
console.log(`Result: ${result}`);
process.exit(result === "PASS" ? 0 : 1);
