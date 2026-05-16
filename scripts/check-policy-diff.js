import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import { createPolicyDiff, summarizePolicyDiff, validatePolicyDiff } from "../policy-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/policy-diff-report.md");
const checks = [
  { key: "module", name: "Module", status: "PASS", details: "" },
  { key: "classification", name: "Risk classification", status: "PASS", details: "" },
  { key: "validation", name: "Diff validation", status: "PASS", details: "" },
  { key: "reportSafety", name: "Report safety", status: "PASS", details: "" },
  { key: "phaseStatus", name: "OS phase status", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
];
const failures = [];

function fail(key, details) {
  const row = checks.find((item) => item.key === key);
  if (row) {
    row.status = "FAIL";
    row.details = details;
  }
  failures.push(details);
}

function check(condition, key, details) {
  if (!condition) fail(key, details);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

check(existsSync(join(ROOT, "policy-center/policyDiff.js")), "module", "Missing policyDiff.js");

const samples = [
  createPolicyDiff({ policyId: "docs", version: "1" }, { policyId: "docs", version: "2", wording: "clearer operator copy" }, { summary: "wording/docs-only changes" }),
  createPolicyDiff({ policyId: "scope", riskLevel: "low" }, { policyId: "scope", riskLevel: "medium", approvalThreshold: "operator" }, { summary: "approval threshold changed" }),
  createPolicyDiff({ policyId: "tools", allowedTools: [] }, { policyId: "tools", allowedTools: ["preview-tool"] }, { summary: "tool permission expansion" }),
  createPolicyDiff({ policyId: "provider", providerCallsAllowed: false }, { policyId: "provider", providerCallsAllowed: true }, { summary: "provider/network enabling" }),
];
const expected = ["low", "medium", "high", "critical"];
samples.forEach((sample, index) => {
  check(sample.riskLevel === expected[index], "classification", `${sample.policyId} expected ${expected[index]} got ${sample.riskLevel}`);
  const validation = validatePolicyDiff(sample);
  check(validation.valid, "validation", validation.errors.join("; "));
});
check(samples[3].requiresWardenReview === true, "classification", "Critical diff must require WARDEN review");
check(samples[2].requiresApproval === true, "classification", "High diff must require approval");

const summaries = samples.map(summarizePolicyDiff);
const serialized = JSON.stringify(summaries);
check(!serialized.includes("providerCallsAllowed"), "reportSafety", "Report summary should not expose raw policy fields");
check(!serialized.includes("{\\n"), "reportSafety", "Report summary should not be a raw JSON dump");

const phaseStatus = JSON.parse(execFileSync("cat", ["os-roadmap/phase-status.json"], { cwd: ROOT, encoding: "utf8" }));
const p583 = phaseStatus.phases.find((phase) => phase.phaseId === "P58.3");
check(p583?.status === "complete", "phaseStatus", "P58.3 must be complete");
check(p583?.nextPhase === "P58.4", "phaseStatus", "P58.3 nextPhase must be P58.4");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Diff Preview Summary",
      body: [
        "| Policy | Risk | Approval | WARDEN | AUDITOR |",
        "| --- | --- | --- | --- | --- |",
        ...summaries.map((item) => (
          `| ${item.policyId} | ${item.riskLevel} | ${item.requiresApproval ? "yes" : "no"} | ${item.requiresWardenReview ? "yes" : "no"} | ${item.requiresAuditorReview ? "yes" : "no"} |`
        )),
      ].join("\n"),
    },
    { title: "Non-Goals", body: "- No policy edits are applied.\n- No exception or approval workflow is enabled in this subphase." },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Policy Diff Report", metadata: { phase: "P58.3 - Policy Diff Preview" } },
);

console.log("NEXUS Policy Diff Check");
console.log("=======================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
