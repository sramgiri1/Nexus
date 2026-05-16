import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  buildSecretAccessDecision,
  createSecretAccessRequest,
  getSecretAccessPolicy,
  summarizeSecretAccessDecisions,
} from "../secrets/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/secret-access-policy-report.md");
const checks = [
  { key: "policy", name: "Policy", status: "PASS", details: "" },
  { key: "decisions", name: "Decisions", status: "PASS", details: "" },
  { key: "phaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];
function fail(key, details) { const row = checks.find((item) => item.key === key); if (row) { row.status = "FAIL"; row.details = details; } failures.push(details); }
function check(condition, key, details) { if (!condition) fail(key, details); }
function gitOutput(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); }

const policy = getSecretAccessPolicy();
check(policy.valueAccessAllowed === false, "policy", "Value access must be disabled");
const policyFile = JSON.parse(readFileSync(join(ROOT, "policy/secret-access-policy.json"), "utf8"));
check(policyFile.resolveValueAllowed === false, "policy", "Resolve value must be disabled");
check(policyFile.providerDispatchAllowed === false, "policy", "Provider dispatch must be disabled");

const decisions = [
  buildSecretAccessDecision(createSecretAccessRequest({ actionType: "read_reference_metadata" }), policy),
  buildSecretAccessDecision(createSecretAccessRequest({ actionType: "resolve_value" }), policy),
  buildSecretAccessDecision(createSecretAccessRequest({ mode: "public" }), policy),
  buildSecretAccessDecision(createSecretAccessRequest({ actionType: "read_reference_metadata" }), policy, { environment: "production-placeholder" }),
];
check(decisions[0].decision === "ALLOW_METADATA", "decisions", "Metadata access should be allowed");
check(decisions[1].decision === "BLOCK_VALUE_ACCESS", "decisions", "Value resolution must be blocked");
check(decisions[2].decision === "DENY", "decisions", "Public/demo access must be denied");
check(decisions[3].decision === "REQUIRE_APPROVAL", "decisions", "Production placeholder must require approval");
check(decisions.every((decision) => decision.valueAccessAllowed === false), "decisions", "No decision may allow value access");
const summary = summarizeSecretAccessDecisions(decisions);
check(summary.valueAccessAllowed === 0, "decisions", "Summary reports value access");

const phaseStatus = JSON.parse(readFileSync(join(ROOT, "os-roadmap/phase-status.json"), "utf8"));
const p592 = phaseStatus.phases.find((phase) => phase.phaseId === "P59.2");
check(p592?.status === "complete", "phaseStatus", "P59.2 must be complete");
check(p592?.nextPhase === "P59.3", "phaseStatus", "P59.2 nextPhase must be P59.3");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Summary", body: `- Decisions evaluated: ${summary.total}\n- Raw value access allowed: ${summary.valueAccessAllowed}\n- Provider dispatch remains disabled.` },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Secret Access Policy Report", metadata: { phase: "P59.2 - Secret Access Policy" } },
);
console.log("NEXUS Secret Access Policy Check");
console.log("================================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
