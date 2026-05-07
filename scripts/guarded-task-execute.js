import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { runGuardedTaskPlan } from "../orchestrator/guardedTaskPlan.js";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/guarded-task-execution-report.md");

function getGitMetadata() {
  const metadata = {
    generatedAt: new Date().toISOString(),
    branch: "unknown",
    head: "unknown",
  };

  try {
    metadata.branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
    metadata.head = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim() || "unknown";
  } catch {
    // Ignore metadata failures for local CLI execution.
  }

  return metadata;
}

function writeReport(metadata, plan) {
  const lines = [
    "# NEXUS Guarded Local Agent Task Execution",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    `- Mode: ${plan.executionMode}`,
    `- Scenarios: ${plan.scenarioCount}`,
    `- Pass: ${plan.pass}`,
    `- Blocked: ${plan.blocked}`,
    `- Fail: ${plan.fail}`,
    `- Transitions attempted: ${plan.transitionsAttempted}`,
    `- Transitions allowed: ${plan.transitionsAllowed}`,
    `- Transitions blocked: ${plan.transitionsBlocked}`,
    `- Transition evidence count: ${plan.transitionEvidenceCount}`,
    "",
    "## Scenario Results",
    "",
    ...plan.results.map(
      (result) =>
        `- ${result.agentContext?.agentId || "unknown"} :: ${result.taskContract?.allowedLocalAction || "unknown"} :: ${result.result}`
    ),
    "",
    "## Summary",
    "",
    `- ${plan.summary}`,
    "",
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function printPlan(plan) {
  const lines = [
    "NEXUS Guarded Local Agent Task Execution",
    "========================================",
    "",
    "Mode: guarded-local",
    "Provider calls: disabled",
    "Tool execution: deterministic local only",
    "Project mutation: disabled",
    "",
    "Scenarios:",
    ...plan.results.map(
      (result) =>
        `- ${result.agentContext?.agentId || "unknown"} ${result.taskContract?.allowedLocalAction || "unknown"}: ${result.result}`
    ),
    "",
    "Summary:",
    `- scenarios: ${plan.scenarioCount}`,
    `- pass: ${plan.pass}`,
    `- blocked: ${plan.blocked}`,
    `- fail: ${plan.fail}`,
    `- transitions attempted: ${plan.transitionsAttempted}`,
    `- transitions allowed: ${plan.transitionsAllowed}`,
    `- transitions blocked: ${plan.transitionsBlocked}`,
    `- transition evidence count: ${plan.transitionEvidenceCount}`,
    "",
    "Refresh Command Center snapshot with:",
    "- npm run generate:command-center-snapshot",
  ];

  console.log(lines.join("\n"));
}

function main() {
  const plan = runGuardedTaskPlan();
  const metadata = getGitMetadata();

  writeReport(metadata, plan);
  printPlan(plan);

  if (
    plan.scenarioCount !== 5 ||
    plan.pass !== 4 ||
    plan.blocked !== 1 ||
    plan.fail !== 0
  ) {
    process.exitCode = 1;
  }
}

main();
