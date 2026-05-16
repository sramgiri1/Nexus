import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  buildCheckTable,
  formatCheckLine,
  normalizeCheckStatus,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  listPolicySimulationScenarios,
  runPolicySimulation,
  summarizePolicySimulation,
  validatePolicySimulationRequest,
} from "../policy-center/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/policy-simulation-report.md");
const checks = [
  { key: "modules", name: "Modules", status: "PASS", details: "" },
  { key: "scenarios", name: "Scenarios", status: "PASS", details: "" },
  { key: "decisions", name: "Simulation decisions", status: "PASS", details: "" },
  { key: "safety", name: "Safety boundaries", status: "PASS", details: "" },
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

check(existsSync(join(ROOT, "policy-center/policySimulation.js")), "modules", "Missing policySimulation.js");
check(existsSync(join(ROOT, "policy-center/policySimulationScenarios.json")), "modules", "Missing scenarios JSON");

const scenarios = listPolicySimulationScenarios();
check(scenarios.length >= 7, "scenarios", "Expected required policy simulation scenarios");
const summaries = scenarios.map((scenario) => {
  const validation = validatePolicySimulationRequest(scenario);
  check(validation.valid, "scenarios", `${scenario.scenarioId} invalid: ${validation.errors.join(", ")}`);
  const result = runPolicySimulation(scenario);
  check(result.redacted === true, "decisions", `${scenario.scenarioId} result not redacted`);
  return { label: scenario.label, ...summarizePolicySimulation(result) };
});

for (const type of ["provider_call", "tool_call", "db_write", "demo_public_boundary"]) {
  const scenario = scenarios.find((item) => item.simulationType === type);
  const result = runPolicySimulation(scenario);
  check(result.decision === "DENY", "decisions", `${type} must be denied in preview`);
}
check(summaries.some((item) => item.decision === "REQUIRES_APPROVAL"), "decisions", "Expected approval decision");
check(summaries.some((item) => item.decision === "REQUIRES_REVIEW"), "decisions", "Expected review decision");
const moduleSource = execFileSync("cat", ["policy-center/policySimulation.js"], { cwd: ROOT, encoding: "utf8" });
for (const forbidden of ["fetch(", "https://", "openai.", "anthropic.", "writeFileSync("]) {
  check(!moduleSource.includes(forbidden), "safety", `Forbidden runtime token: ${forbidden}`);
}

const phaseStatus = JSON.parse(execFileSync("cat", ["os-roadmap/phase-status.json"], { cwd: ROOT, encoding: "utf8" }));
const p584 = phaseStatus.phases.find((phase) => phase.phaseId === "P58.4");
check(p584?.status === "complete", "phaseStatus", "P58.4 must be complete");
check(p584?.nextPhase === "P58.5", "phaseStatus", "P58.4 nextPhase must be P58.5");

const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

const result = checks.every((item) => normalizeCheckStatus(item.status) === "PASS") ? "PASS" : "FAIL";
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Scenario Decisions",
      body: [
        "| Scenario | Decision | Approvals | Evidence |",
        "| --- | --- | --- | --- |",
        ...summaries.map((item) => (
          `| ${item.label} | ${item.decision} | ${item.requiredApprovals.join(", ") || "none"} | ${item.requiredEvidenceCount} |`
        )),
      ].join("\n"),
    },
    { title: "Non-Goals", body: "- No simulation executes an action.\n- No provider, tool, DB, network, or project mutation is called." },
    { title: "Failures", body: failures.length ? failures.map((item) => `- ${item}`).join("\n") : "- None" },
    { title: "Result", body: result },
  ],
  { title: "Policy Simulation Report", metadata: { phase: "P58.4 - Policy Simulation Preview" } },
);

console.log("NEXUS Policy Simulation Check");
console.log("=============================");
for (const item of checks) console.log(formatCheckLine(item.name, item.status, item.details));
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
