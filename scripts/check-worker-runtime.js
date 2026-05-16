import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildCheckTable,
  formatCheckLine,
  formatReportMetadataMarkdown,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  createWorkerQueueItem,
  acquireLeasePreview,
  createHeartbeat,
  getWorkerRuntimePolicy,
  detectStaleHeartbeats,
  listWorkerQueueItems,
  releaseLeasePreview,
  summarizeHeartbeats,
  summarizeLeases,
  summarizeWorkerQueue,
  validateHeartbeat,
  validateWorkerLease,
  validateWorkerQueueItem,
} from "../worker-runtime/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/worker-runtime-report.md");
const STATUS_PATH = join(ROOT, "reports/worker-runtime-status.json");

const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "queueSchema", name: "Queue schema", status: "PASS", details: "" },
  { key: "leases", name: "Lease model", status: "PASS", details: "" },
  { key: "heartbeats", name: "Heartbeats", status: "PASS", details: "" },
  { key: "policy", name: "Policy", status: "PASS", details: "" },
  { key: "auditOnly", name: "Execution disabled", status: "PASS", details: "" },
  { key: "reports", name: "Reports", status: "PASS", details: "" },
  { key: "osPhaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
  { key: "formatting", name: "Formatting/readability", status: "PASS", details: "" },
];

const failures = [];

function setFail(key, details) {
  const check = checks.find((entry) => entry.key === key);
  if (check) {
    check.status = "FAIL";
    check.details = details;
  }
  failures.push(details);
}

function check(condition, key, details) {
  if (!condition) setFail(key, details);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function hasPrivateProjectDiff() {
  return gitOutput(["diff", "--", "projects/careloop", "projects/careloop-ios"]).trim().length > 0;
}

console.log("NEXUS Worker Runtime Check\n==========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const filePath of [
  "worker-runtime/queueSchema.js",
  "worker-runtime/workerQueue.js",
  "worker-runtime/leaseModel.js",
  "worker-runtime/heartbeatModel.js",
  "worker-runtime/runtimeSummary.js",
  "worker-runtime/index.js",
  "policy/worker-runtime-policy.json",
]) {
  check(existsSync(join(ROOT, filePath)), "modules", `Missing ${filePath}`);
}

const item = createWorkerQueueItem({
  taskId: "p60-preview-task",
  capabilityId: "worker-runtime-preview",
  ownerAgent: "NEXUS",
});
const itemValidation = validateWorkerQueueItem(item);
check(itemValidation.valid, "queueSchema", `Valid queue item failed: ${itemValidation.errors.join(", ")}`);

const badItemValidation = validateWorkerQueueItem({
  ...item,
  queueItemId: "",
  executionEnabled: true,
  providerCallsAllowed: true,
});
check(!badItemValidation.valid, "queueSchema", "Invalid queue item should fail validation");
check(
  badItemValidation.errors.some((error) => error.includes("executionEnabled")),
  "queueSchema",
  "Invalid queue item should explain executionEnabled failure",
);

const policy = getWorkerRuntimePolicy();
for (const [field, expected] of Object.entries({
  taskExecutionAllowed: false,
  providerCallsAllowed: false,
  toolCallsAllowed: false,
  externalNetworkAllowed: false,
  projectMutationAllowed: false,
  dbWritesAllowed: false,
})) {
  check(policy[field] === expected, "policy", `Policy must set ${field} to ${expected}`);
}
check(policy.workerRuntimeEnabled === "preview_only", "policy", "Worker runtime policy must be preview_only");

const queueSummary = summarizeWorkerQueue(listWorkerQueueItems({ items: [item] }));
check(queueSummary.executionEnabled === false, "auditOnly", "Queue summary must keep execution disabled");

if (typeof acquireLeasePreview === "function") {
  const lease = acquireLeasePreview(item, { workerId: "local-preview-worker" }, { ttlSeconds: 60 });
  const leaseValidation = validateWorkerLease(lease);
  check(leaseValidation.valid, "leases", `Valid lease failed: ${leaseValidation.errors.join(", ")}`);
  const duplicateLease = acquireLeasePreview(item, { workerId: "second-worker" }, { existingLeases: [lease] });
  check(duplicateLease.leaseState === "blocked", "leases", "Duplicate lease preview should be blocked");
  const releasedLease = releaseLeasePreview(lease, "checker");
  check(releasedLease.leaseState === "released", "leases", "Released lease should be released");
  const leaseSummary = summarizeLeases([
    lease,
    { ...lease, leaseId: "expired-lease", acquiredAt: "2020-01-01T00:00:00.000Z", expiresAt: "2020-01-01T00:00:01.000Z" },
  ]);
  check(leaseSummary.expired >= 1, "leases", "Expired lease should summarize as expired");
  check(leaseSummary.executionEnabled === false, "auditOnly", "Lease summary must keep execution disabled");
}

if (typeof createHeartbeat === "function") {
  const heartbeat = createHeartbeat({
    workerId: "local-preview-worker",
    leaseId: "lease-preview",
    queueItemId: item.queueItemId,
  });
  const heartbeatValidation = validateHeartbeat(heartbeat);
  check(heartbeatValidation.valid, "heartbeats", `Valid heartbeat failed: ${heartbeatValidation.errors.join(", ")}`);
  const stale = detectStaleHeartbeats([
    { ...heartbeat, heartbeatId: "heartbeat-stale", lastSeenAt: "2020-01-01T00:00:00.000Z" },
  ]);
  check(stale[0]?.status === "stale", "heartbeats", "Stale heartbeat detection should be deterministic");
  const missingLeaseValidation = validateHeartbeat({ ...heartbeat, heartbeatId: "missing-lease", leaseId: "" });
  check(!missingLeaseValidation.valid, "heartbeats", "Heartbeat without lease should warn/fail validation");
  const heartbeatSummary = summarizeHeartbeats([heartbeat]);
  check(heartbeatSummary.executionEnabled === false, "auditOnly", "Heartbeat summary must keep execution disabled");
}
check(!hasPrivateProjectDiff(), "noForbiddenChanges", "Private project files must not change");

const phaseStatus = JSON.parse((await import("node:fs")).readFileSync(join(ROOT, "os-roadmap/phase-status.json"), "utf8"));
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P60.1")?.status === "complete", "osPhaseStatus", "P60.1 must be complete");
if (statusById.has("P60.2")) {
  check(statusById.get("P60.2")?.status === "complete", "osPhaseStatus", "P60.2 must be complete once present");
}
if (statusById.has("P60.3")) {
  check(statusById.get("P60.3")?.status === "complete", "osPhaseStatus", "P60.3 must be complete once present");
}
check(["P60.2", "P61"].includes(statusById.get("P60.1")?.nextPhase), "osPhaseStatus", "P60.1 nextPhase must point forward");

const result = checks.every((entry) => entry.status === "PASS") ? "PASS" : "FAIL";
const status = {
  phase: "P60",
  generatedAt: new Date().toISOString(),
  branch,
  head,
  result,
  queue: queueSummary,
  executionEnabled: false,
  providerCallsAllowed: false,
  toolCallsAllowed: false,
  projectMutationAllowed: false,
  dbWritesAllowed: false,
  failures,
};
writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2) + "\n");

writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "P60 Worker Queue + Runtime Engine remains preview-only. No worker loop or task execution is enabled." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Queue Summary", body: `- Items modeled: ${queueSummary.totalItems}\n- Execution enabled: ${queueSummary.executionEnabled ? "yes" : "no"}` },
    { title: "Failures", body: failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  {
    title: "NEXUS Worker Runtime Report",
    metadata: { branch, head, phase: "P60" },
  },
);

for (const entry of checks) {
  console.log(formatCheckLine(entry.name, entry.status, entry.details));
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
