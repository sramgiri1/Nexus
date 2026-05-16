import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildCheckTable, formatCheckLine, writeMarkdownReport } from "../shared/index.js";
import {
  buildPrioritySummary,
  calculateTaskPriority,
  explainPriorityDecision,
  rankTasksByPriority,
  validatePriorityRecord,
} from "../concurrency/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/queue-priority-report.md");
const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "priority", name: "Priority model", status: "PASS", details: "" },
  { key: "ranking", name: "Task ranking", status: "PASS", details: "" },
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

console.log("NEXUS Queue Priority Check\n==========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const filePath of ["concurrency/priorityModel.js", "concurrency/priorityRules.js"]) {
  check(existsSync(join(ROOT, filePath)), "modules", `Missing ${filePath}`);
}

const tasks = [
  { taskId: "blocked-task", state: "blocked", riskLevel: "medium", costImpact: "low" },
  { taskId: "urgent-task", urgent: true, riskLevel: "high", costImpact: "medium" },
  { taskId: "normal-task", scope: "documentation-only", riskLevel: "low", costImpact: "none" },
];
const priority = calculateTaskPriority(tasks[1], {});
const validation = validatePriorityRecord(priority);
check(validation.valid, "priority", validation.errors.join("; "));
check(priority.previewOnly === true, "previewOnly", "Priority records must remain previewOnly");
check(explainPriorityDecision(priority).includes("No real queue reordering"), "previewOnly", "Explanation must mention no reordering");

const ranked = rankTasksByPriority(tasks, {});
check(ranked[0].priority === "urgent", "ranking", "Urgent task should rank first");
const summary = buildPrioritySummary(ranked);
check(summary.queueReorderingEnabled === false, "previewOnly", "Queue reordering must remain disabled");

const result = checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "P61.4 ranks tasks for preview only. It does not reorder the worker queue." },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: `- Priority records: ${summary.totalRecords}\n- Urgent: ${summary.urgent}\n- Queue reordering enabled: no`,
    },
    { title: "Failures", body: failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "NEXUS Queue Priority Report", metadata: { branch, head, phase: "P61.4" } },
);

for (const entry of checks) console.log(formatCheckLine(entry.name, entry.status, entry.details));
console.log(`Result: ${result}`);
process.exit(result === "PASS" ? 0 : 1);
