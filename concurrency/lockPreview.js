import { buildCheckTable, writeMarkdownReport } from "../shared/index.js";
import { buildLockSummary, createLockProposal, findConflictingLocks, validateLockRecord } from "./lockModel.js";
import { listLockPreviewRecords, writeLockPreviewRecords } from "./lockStore.js";

export function buildLockPreview(input = {}, existingLocks = listLockPreviewRecords()) {
  const lock = createLockProposal(input);
  const conflicts = findConflictingLocks(lock, existingLocks);
  const previewLock = conflicts.length
    ? { ...lock, status: "blocked_preview", reason: "Preview conflict detected. No runtime lock was enforced." }
    : { ...lock, status: "active_preview" };
  const records = [...existingLocks, previewLock];
  return {
    previewOnly: true,
    lock: previewLock,
    conflicts,
    records,
    summary: buildLockSummary(records),
    validation: validateLockRecord(previewLock),
  };
}

export function writeLockPreviewReport(result, filePath = "reports/concurrency-locks-report.md", metadata = {}) {
  const checks = [
    { name: "Lock preview", status: result.validation.valid ? "PASS" : "FAIL", details: result.validation.errors.join("; ") },
    { name: "Conflicts", status: "PASS", details: `${result.conflicts.length} preview conflict(s)` },
    { name: "Execution", status: "PASS", details: "No locks are enforced in runtime" },
  ];
  writeMarkdownReport(filePath, [
    { title: "Scope", body: "P61.2 lock records are redacted preview records only. They do not block workers or files." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Summary", body: `- Total preview locks: ${result.summary.totalLocks}\n- Blocked preview: ${result.summary.blockedPreview}` },
  ], {
    title: "NEXUS Concurrency Locks Report",
    metadata,
  });
  return filePath;
}

export { listLockPreviewRecords, writeLockPreviewRecords };
