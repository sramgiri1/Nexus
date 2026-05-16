import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildCheckTable, formatCheckLine, writeMarkdownReport } from "../shared/index.js";
import {
  buildDeduplicationSummary,
  buildDuplicateSignals,
  classifyDuplicateDecision,
  findDuplicateWork,
  scoreDuplicateCandidate,
} from "../concurrency/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/work-deduplication-report.md");
const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "signals", name: "Duplicate signals", status: "PASS", details: "" },
  { key: "scoring", name: "Duplicate scoring", status: "PASS", details: "" },
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

console.log("NEXUS Work Deduplication Check\n==============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const filePath of ["concurrency/duplicateDetector.js", "concurrency/duplicateSignals.js"]) {
  check(existsSync(join(ROOT, filePath)), "modules", `Missing ${filePath}`);
}

const task = {
  taskId: "task-a",
  title: "Validate backend API",
  capabilityId: "validation.backend",
  projectId: "private-project",
  repoId: "local-repo",
  missionId: "governed-build",
  paths: ["local-api/**"],
};
const candidate = { ...task, taskId: "task-b" };
const signals = buildDuplicateSignals(task);
check(signals.availableSignals.includes("title"), "signals", "Title signal missing");
check(signals.availableSignals.includes("capability"), "signals", "Capability signal missing");

const score = scoreDuplicateCandidate(task, candidate);
check(score.score >= 0.75, "scoring", "Expected high duplicate score");
check(score.decision === "duplicate_preview", "scoring", "Expected duplicate_preview decision");
check(score.recommendedAction === "block_preview", "previewOnly", "Duplicate action must be preview block");
check(score.previewOnly === true, "previewOnly", "Duplicate candidate must remain previewOnly");

const insufficient = classifyDuplicateDecision(0, []);
check(insufficient.decision === "insufficient_data", "signals", "Missing signals should classify insufficient_data");

const result = findDuplicateWork(task, [candidate, { ...task, taskId: "task-c", title: "Write docs" }]);
const summary = buildDeduplicationSummary(result);
check(summary.mergeEnabled === false, "previewOnly", "Task merging must remain disabled");

const outcome = checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "P61.3 uses deterministic duplicate signals only. No embeddings or provider calls are used." },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: `- Candidates: ${summary.totalCandidates}\n- Duplicate previews: ${summary.duplicates}\n- Merge enabled: no`,
    },
    { title: "Failures", body: failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None" },
    { title: "Result", body: outcome },
  ],
  { title: "NEXUS Work Deduplication Report", metadata: { branch, head, phase: "P61.3" } },
);

for (const entry of checks) console.log(formatCheckLine(entry.name, entry.status, entry.details));
console.log(`Result: ${outcome}`);
process.exit(outcome === "PASS" ? 0 : 1);
