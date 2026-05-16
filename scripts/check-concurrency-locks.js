import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildCheckTable, formatCheckLine, writeMarkdownReport } from "../shared/index.js";
import {
  buildLockPreview,
  buildLockSummary,
  createLockProposal,
  findConflictingLocks,
  listLockPreviewRecords,
  validateLockRecord,
  writeLockPreviewRecords,
} from "../concurrency/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/concurrency-locks-report.md");
const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "lockModel", name: "Lock model", status: "PASS", details: "" },
  { key: "conflicts", name: "Conflict preview", status: "PASS", details: "" },
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

console.log("NEXUS Concurrency Locks Check\n=============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const filePath of [
  "concurrency/lockModel.js",
  "concurrency/lockStore.js",
  "concurrency/lockPreview.js",
  "local-state/runtime/concurrency-locks.jsonl",
]) {
  check(existsSync(join(ROOT, filePath)), "modules", `Missing ${filePath}`);
}

const seedLock = createLockProposal({
  scope: "path",
  projectId: "private-project",
  repoId: "local-repo",
  pathPattern: "dashboard/src/**",
  taskId: "p61-lock-preview",
  agentId: "NEXUS",
  capabilityId: "concurrency.preview",
});
const validation = validateLockRecord(seedLock);
check(validation.valid, "lockModel", validation.errors.join("; "));

const conflictingLock = { ...seedLock, lockId: "lock_preview_conflict", status: "active_preview" };
const conflicts = findConflictingLocks(seedLock, [conflictingLock]);
check(conflicts.length === 1, "conflicts", "Expected one preview conflict");

const preview = buildLockPreview(seedLock, [conflictingLock]);
check(preview.lock.status === "blocked_preview", "conflicts", "Conflicting preview should be blocked");
check(preview.lock.previewOnly === true, "previewOnly", "Lock preview must remain previewOnly");
check(preview.lock.redacted === true, "previewOnly", "Lock preview must remain redacted");

const existingRecords = listLockPreviewRecords();
const safeRecords = existingRecords.length ? existingRecords : [seedLock];
writeLockPreviewRecords(safeRecords);
const summary = buildLockSummary(safeRecords);
check(summary.executionEnabled === false, "previewOnly", "Lock summary must keep execution disabled");

const result = checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "P61.2 models redacted preview locks only. No worker or file locking is enforced." },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: `- Preview lock records: ${summary.totalLocks}\n- Conflicts detected: ${conflicts.length}\n- Runtime enforcement: disabled`,
    },
    { title: "Failures", body: failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "NEXUS Concurrency Locks Report", metadata: { branch, head, phase: "P61.2" } },
);

for (const entry of checks) console.log(formatCheckLine(entry.name, entry.status, entry.details));
console.log(`Result: ${result}`);
process.exit(result === "PASS" ? 0 : 1);
