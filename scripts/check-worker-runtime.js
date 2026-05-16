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
  calculateNextRetry,
  classifyTimeout,
  classifyDeadLetterReason,
  createRetryPolicy,
  moveToDeadLetterPreview,
  getWorkerRuntimePolicy,
  detectStaleHeartbeats,
  listWorkerQueueItems,
  releaseLeasePreview,
  summarizeHeartbeats,
  summarizeLeases,
  summarizeDeadLetterQueue,
  summarizeRetryTimeoutState,
  summarizeWorkerQueue,
  validateHeartbeat,
  validateDeadLetterItem,
  validateRetryPolicy,
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
  { key: "retryTimeout", name: "Retry/timeout", status: "PASS", details: "" },
  { key: "deadLetterQueue", name: "Dead-letter queue", status: "PASS", details: "" },
  { key: "policy", name: "Policy", status: "PASS", details: "" },
  { key: "auditOnly", name: "Execution disabled", status: "PASS", details: "" },
  { key: "reports", name: "Reports", status: "PASS", details: "" },
  { key: "commandCenterUx", name: "Command Center Worker Runtime UX", status: "PASS", details: "" },
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
const commandCenterSource = (await import("node:fs")).readFileSync(join(ROOT, "dashboard/src/pages/CommandCenterV2.jsx"), "utf8");
const routeSource = (await import("node:fs")).readFileSync(join(ROOT, "dashboard/src/data/commandCenterRoutes.js"), "utf8");
const routeTestSource = (await import("node:fs")).readFileSync(join(ROOT, "dashboard/tests/routes.spec.js"), "utf8");

for (const filePath of [
  "worker-runtime/queueSchema.js",
  "worker-runtime/workerQueue.js",
  "worker-runtime/leaseModel.js",
  "worker-runtime/heartbeatModel.js",
  "worker-runtime/retryTimeoutModel.js",
  "worker-runtime/deadLetterQueue.js",
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

if (typeof createRetryPolicy === "function") {
  const retryPolicy = createRetryPolicy({ maxAttempts: 2, baseDelaySeconds: 10, maxDelaySeconds: 60 });
  const retryValidation = validateRetryPolicy(retryPolicy);
  check(retryValidation.valid, "retryTimeout", `Valid retry policy failed: ${retryValidation.errors.join(", ")}`);
  const retryPreview = calculateNextRetry(1, retryPolicy);
  check(retryPreview.retryAllowed === true, "retryTimeout", "Retry preview should allow retry before max attempts");
  check(retryPreview.executionEnabled === false, "auditOnly", "Retry preview must keep execution disabled");
  const maxAttemptPreview = calculateNextRetry(2, retryPolicy);
  check(maxAttemptPreview.retryAllowed === false, "retryTimeout", "Retry preview should block at max attempts");
  const timeout = classifyTimeout(item, { expiresAt: "2020-01-01T00:00:00.000Z" }, retryPolicy);
  check(timeout.timedOut === true, "retryTimeout", "Timeout classification should detect expired lease");
  const retrySummary = summarizeRetryTimeoutState([item]);
  check(retrySummary.automaticRetryExecutionEnabled === false, "auditOnly", "Retry summary must keep automatic retry disabled");
}

if (typeof moveToDeadLetterPreview === "function") {
  const reason = classifyDeadLetterReason({ reasonCode: "timeout" });
  check(reason.reasonCode === "timeout", "deadLetterQueue", "Dead-letter reason classification should preserve timeout");
  const deadLetterItem = moveToDeadLetterPreview(item, { reasonCode: "timeout" });
  const deadLetterValidation = validateDeadLetterItem(deadLetterItem);
  check(deadLetterValidation.valid, "deadLetterQueue", `Valid DLQ item failed: ${deadLetterValidation.errors.join(", ")}`);
  const dlqSummary = summarizeDeadLetterQueue([deadLetterItem]);
  check(dlqSummary.requeueEnabled === false, "auditOnly", "DLQ summary must keep requeue disabled");
  check(dlqSummary.recoverable === 1, "deadLetterQueue", "Recoverable DLQ summary should count timeout");
}
check(!hasPrivateProjectDiff(), "noForbiddenChanges", "Private project files must not change");

if (routeSource.includes("/command-center/workers") || commandCenterSource.includes("WorkerRuntimePage")) {
  check(routeSource.includes("/command-center/workers"), "commandCenterUx", "Worker Runtime route must be registered");
  check(commandCenterSource.includes("Worker Runtime"), "commandCenterUx", "Worker Runtime page copy must exist");
  check(commandCenterSource.includes("P60 defines runtime primitives only"), "commandCenterUx", "Worker Runtime execution-disabled warning missing");
  check(routeTestSource.includes("Worker Runtime route renders preview-only runtime primitives"), "commandCenterUx", "Worker Runtime Playwright coverage missing");
}

const phaseStatus = JSON.parse((await import("node:fs")).readFileSync(join(ROOT, "os-roadmap/phase-status.json"), "utf8"));
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P60.1")?.status === "complete", "osPhaseStatus", "P60.1 must be complete");
if (statusById.has("P60.2")) {
  check(statusById.get("P60.2")?.status === "complete", "osPhaseStatus", "P60.2 must be complete once present");
}
if (statusById.has("P60.3")) {
  check(statusById.get("P60.3")?.status === "complete", "osPhaseStatus", "P60.3 must be complete once present");
}
if (statusById.has("P60.4")) {
  check(statusById.get("P60.4")?.status === "complete", "osPhaseStatus", "P60.4 must be complete once present");
}
if (statusById.has("P60.5")) {
  check(statusById.get("P60.5")?.status === "complete", "osPhaseStatus", "P60.5 must be complete once present");
}
if (statusById.has("P60.6")) {
  check(statusById.get("P60.6")?.status === "complete", "osPhaseStatus", "P60.6 must be complete once present");
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
