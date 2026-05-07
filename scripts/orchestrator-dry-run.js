import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { runDefaultDryRunPlan } from "../orchestrator/dryRunPlan.js";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/orchestrator-dry-run-report.md");

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
    // ignore git metadata failures
  }

  return metadata;
}

function scenarioLabel(result = {}) {
  const taskType = result.agentContext?.normalizedTask?.taskType;

  if (taskType === "demo.release_review") {
    return "Demo release review";
  }
  if (taskType === "backend.code_edit") {
    return "Demo backend task";
  }
  if (taskType === "verification_gate") {
    return "Demo QA gate task";
  }
  if (taskType === "deploy.plan") {
    return "Approval required deploy";
  }
  if (taskType === "ai.integration_blocked_review") {
    return "Secret data blocked";
  }

  return result.agentContext?.normalizedTask?.taskType || "Dry-run scenario";
}

function writeReport(plan, metadata) {
  const lines = [
    "# NEXUS Orchestrator Dry-Run",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    "## Summary",
    "",
    "- Mode: DRY-RUN",
    "- Project: DemoApp",
    "- Provider calls: disabled",
    "- Tool execution: disabled",
    "- Project mutation: disabled",
    "",
    "## Scenarios",
    "",
    ...plan.results.map(
      (result) =>
        `- ${scenarioLabel(result)}: ${result.result} (dry-run only; no live execution)`
    ),
    "",
    "## Totals",
    "",
    `- scenarios: ${plan.scenarioCount}`,
    `- pass: ${plan.pass}`,
    `- require approval: ${plan.requireApproval}`,
    `- blocked: ${plan.blocked}`,
    `- fail: ${plan.fail}`,
    "",
    `Result: ${plan.ok ? "PASS" : "FAIL"}`,
    "",
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function printConsole(plan) {
  const lines = [
    "NEXUS Orchestrator Dry-Run",
    "==========================",
    "",
    "Mode: DRY-RUN",
    "Project: DemoApp",
    "Provider calls: disabled",
    "Tool execution: disabled",
    "Project mutation: disabled",
    "",
    "Scenarios:",
    ...plan.results.map((result) => `- ${scenarioLabel(result)}: ${result.result}`),
    "",
    "Summary:",
    `- scenarios: ${plan.scenarioCount}`,
    `- pass: ${plan.pass}`,
    `- require approval: ${plan.requireApproval}`,
    `- blocked: ${plan.blocked}`,
    `- fail: ${plan.fail}`,
  ];

  console.log(lines.join("\n"));
}

function validatePlan(plan) {
  const errors = [];
  const byType = new Map(
    plan.results.map((result) => [
      result.agentContext?.normalizedTask?.taskType,
      result.result,
    ])
  );

  if (plan.dryRun !== true || plan.scenarioCount !== 5) {
    errors.push("Dry-run plan must include exactly five scenarios.");
  }

  if (byType.get("backend.code_edit") !== "PASS") {
    errors.push("Demo backend task must PASS.");
  }

  if (byType.get("verification_gate") !== "PASS") {
    errors.push("Demo QA gate task must PASS.");
  }

  if (byType.get("deploy.plan") !== "REQUIRE_APPROVAL") {
    errors.push("Approval required deploy must REQUIRE_APPROVAL.");
  }

  if (byType.get("ai.integration_blocked_review") !== "BLOCKED") {
    errors.push("Secret data scenario must be BLOCKED.");
  }

  const releaseResult = byType.get("demo.release_review");
  if (!["PASS", "REQUIRE_APPROVAL", "BLOCKED"].includes(releaseResult)) {
    errors.push("Demo release review must stay in dry-run PASS/REQUIRE_APPROVAL/BLOCKED range.");
  }

  if (plan.fail > 0 || plan.results.some((result) => result.result === "FAIL")) {
    errors.push("Unexpected FAIL result found in orchestrator dry-run.");
  }

  return errors;
}

const plan = runDefaultDryRunPlan();
const metadata = getGitMetadata();
writeReport(plan, metadata);
printConsole(plan);

const errors = validatePlan(plan);
if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exitCode = 1;
}
