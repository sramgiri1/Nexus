import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  COST_EVENT_TYPES,
  COST_SOURCE_TYPES,
  COST_UNITS,
  createCostLedgerRecord,
  sanitizeCostLedgerRecord,
  summarizeCostLedger,
  validateCostLedgerRecord,
  writeCostLedgerPreview,
} from "../cost-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/cost-center-ledger-report.md");
const checks = [
  { key: "schema", name: "Schema exports", status: "PASS", details: "" },
  { key: "sample", name: "Sample record", status: "PASS", details: "" },
  { key: "sanitize", name: "Sanitization", status: "PASS", details: "" },
  { key: "preview", name: "Preview ledger", status: "PASS", details: "" },
  { key: "policy", name: "Policy", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];

function fail(key, details) {
  const check = checks.find((item) => item.key === key);
  if (check) {
    check.status = "FAIL";
    check.details = details;
  }
  failures.push(details);
}

function check(condition, key, details) {
  if (!condition) fail(key, details);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

check(COST_EVENT_TYPES.includes("cost_estimate_created"), "schema", "Missing cost_estimate_created");
check(COST_SOURCE_TYPES.includes("api_batch"), "schema", "Missing api_batch source type");
check(COST_UNITS.includes("token"), "schema", "Missing token unit");

const sample = createCostLedgerRecord({
  eventType: "cost_estimate_created",
  sourceType: "task",
  sourceId: "task_preview",
  projectId: "private-project",
  taskId: "task_preview",
  phaseId: "P57.1",
  estimatedUsd: 0.0125,
  estimatedTokens: 2500,
  decision: "RECORD_ONLY",
  metadata: { apiKey: "sk-redacted-preview", note: "estimate only" },
});
const sanitized = sanitizeCostLedgerRecord(sample);
const validation = validateCostLedgerRecord(sanitized);
check(validation.valid, "sample", validation.errors.join(", "));
check(sanitized.redacted === true, "sanitize", "Record must be redacted");
check(!JSON.stringify(sanitized).includes("sk-redacted-preview"), "sanitize", "Secret-like value was not redacted");

const preview = writeCostLedgerPreview([sanitized], { phase: "P57.1" });
check(preview.previewOnly === true, "preview", "Preview file must be previewOnly");
check(preview.providerDispatchAllowed === false, "preview", "Provider dispatch must remain disabled");
check(summarizeCostLedger(preview.records).records === 1, "preview", "Summary must count sample record");

const policy = JSON.parse(readFileSync(join(ROOT, "policy/cost-center-policy.json"), "utf8"));
check(policy.providerCallsAllowed === false, "policy", "Provider calls must be disabled");
check(policy.dbWritesAllowed === false, "policy", "DB writes must be disabled");
check(policy.realProviderSpendAllowed === false, "policy", "Real provider spend must be disabled");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");
check(existsSync(join(ROOT, "reports/cost-ledger-preview.json")), "preview", "Preview JSON was not written");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Summary",
      body: [
        "- Cost ledger schema supports estimates, actuals, budget checks, approvals, and supersession events.",
        "- Preview ledger is redacted and report-backed only.",
        "- No provider calls, external network, DB writes, worker execution, or project mutation are enabled.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Cost Center Ledger Report", metadata: { phase: "P57.1 - Cost Ledger Schema" } },
);

console.log("NEXUS Cost Center Ledger Check");
console.log("==============================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
