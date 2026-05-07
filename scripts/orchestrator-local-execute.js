import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { runControlledLocalExecutionPlan } from "../orchestrator/localExecutionPlan.js";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/controlled-local-execution-report.md");
const RUNTIME_FILES = [
  "local-state/runtime/tasks.json",
  "local-state/runtime/evidence.jsonl",
  "local-state/runtime/audit.jsonl",
  "local-state/runtime/events.jsonl",
  "local-state/runtime/approvals.jsonl",
  "local-state/runtime/incidents.jsonl",
];

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function writeFile(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), content, "utf8");
}

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
    // Ignore metadata failures in local-only execution.
  }

  return metadata;
}

function snapshotRuntimeFiles() {
  return Object.fromEntries(
    RUNTIME_FILES.map((relativePath) => [relativePath, readFile(relativePath)])
  );
}

function restoreRuntimeFiles(snapshot) {
  for (const [relativePath, content] of Object.entries(snapshot)) {
    writeFile(relativePath, content);
  }
}

function countJsonlRecords(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function countTasks(content) {
  try {
    return Array.isArray(JSON.parse(content).tasks)
      ? JSON.parse(content).tasks.length
      : 0;
  } catch {
    return 0;
  }
}

function createWriteSummary(beforeSnapshot) {
  const afterSnapshot = snapshotRuntimeFiles();

  return {
    tasks: countTasks(afterSnapshot["local-state/runtime/tasks.json"]) -
      countTasks(beforeSnapshot["local-state/runtime/tasks.json"]),
    evidence:
      countJsonlRecords(afterSnapshot["local-state/runtime/evidence.jsonl"]) -
      countJsonlRecords(beforeSnapshot["local-state/runtime/evidence.jsonl"]),
    audit:
      countJsonlRecords(afterSnapshot["local-state/runtime/audit.jsonl"]) -
      countJsonlRecords(beforeSnapshot["local-state/runtime/audit.jsonl"]),
    events:
      countJsonlRecords(afterSnapshot["local-state/runtime/events.jsonl"]) -
      countJsonlRecords(beforeSnapshot["local-state/runtime/events.jsonl"]),
    approvals:
      countJsonlRecords(afterSnapshot["local-state/runtime/approvals.jsonl"]) -
      countJsonlRecords(beforeSnapshot["local-state/runtime/approvals.jsonl"]),
    incidents:
      countJsonlRecords(afterSnapshot["local-state/runtime/incidents.jsonl"]) -
      countJsonlRecords(beforeSnapshot["local-state/runtime/incidents.jsonl"]),
  };
}

function scenarioLabel(taskType) {
  switch (taskType) {
    case "demo.local_execution":
      return "Controlled DemoApp task";
    case "deploy.plan":
      return "Approval required deploy";
    case "ai.integration_blocked_review":
      return "Secret data blocked";
    default:
      return taskType || "Unknown scenario";
  }
}

function validatePlan(plan) {
  const failures = [];
  const resultByType = new Map(
    plan.results.map((result) => [
      result.agentContext?.normalizedTask?.taskType,
      result.result,
    ])
  );

  if (plan.executionMode !== "controlled-local") {
    failures.push("Plan did not report controlled-local mode.");
  }

  if (plan.scenarioCount !== 3) {
    failures.push("Plan did not run the expected three scenarios.");
  }

  if (resultByType.get("demo.local_execution") !== "PASS") {
    failures.push("Controlled DemoApp task must PASS.");
  }

  if (resultByType.get("deploy.plan") !== "REQUIRE_APPROVAL") {
    failures.push("Approval required deploy must REQUIRE_APPROVAL.");
  }

  if (resultByType.get("ai.integration_blocked_review") !== "BLOCKED") {
    failures.push("Secret data task must be BLOCKED.");
  }

  if (plan.results.some((result) => result.result === "FAIL")) {
    failures.push("Controlled local execution produced an unexpected FAIL.");
  }

  return failures;
}

function writeReport(metadata, plan, writeSummary, failures) {
  const lines = [
    "# NEXUS Controlled Local Execution",
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
    `- Mode: ${plan.executionMode}`,
    `- Scenario count: ${plan.scenarioCount}`,
    `- Pass: ${plan.pass}`,
    `- Require approval: ${plan.requireApproval}`,
    `- Blocked: ${plan.blocked}`,
    `- Fail: ${plan.fail}`,
    "",
    "## Runtime Write Summary",
    "",
    `- Tasks appended: ${writeSummary.tasks}`,
    `- Audit records appended: ${writeSummary.audit}`,
    `- Evidence records appended: ${writeSummary.evidence}`,
    `- Runtime events appended: ${writeSummary.events}`,
    `- Approval records appended: ${writeSummary.approvals}`,
    `- Incident records appended: ${writeSummary.incidents}`,
    "",
    "## Scenario Results",
    "",
    ...plan.results.map((result) => {
      const taskType = result.agentContext?.normalizedTask?.taskType;
      return `- ${scenarioLabel(taskType)}: ${result.result}`;
    }),
    "",
    "## Notes",
    "",
    "- Local runtime writes were performed only under `local-state/runtime/`.",
    "- Runtime seed files were restored after execution to keep local validation deterministic.",
    "- No provider calls, tool calls, project mutations, API calls, or DB writes were performed.",
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((failure) => `- ${failure}`) : ["- None"]),
    "",
    `Result: ${failures.length === 0 ? "PASS" : "FAIL"}`,
    "",
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function printConsole(plan, writeSummary) {
  const lines = [
    "NEXUS Controlled Local Execution",
    "================================",
    "",
    "Mode: controlled-local",
    "Project: DemoApp",
    "Provider calls: disabled",
    "Tool execution: disabled",
    "Project mutation: disabled",
    "Local state writes: enabled under local-state/runtime",
    "",
    "Scenarios:",
    ...plan.results.map((result) => {
      const taskType = result.agentContext?.normalizedTask?.taskType;
      return `- ${scenarioLabel(taskType)}: ${result.result}`;
    }),
    "",
    "Writes:",
    `- tasks: ${writeSummary.tasks}`,
    `- audit: ${writeSummary.audit}`,
    `- evidence: ${writeSummary.evidence}`,
    `- runtime events: ${writeSummary.events}`,
    `- approvals: ${writeSummary.approvals}`,
    `- incidents: ${writeSummary.incidents}`,
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

function main() {
  const metadata = getGitMetadata();
  const runtimeSnapshot = snapshotRuntimeFiles();
  let plan;
  let writeSummary = {
    tasks: 0,
    evidence: 0,
    audit: 0,
    events: 0,
    approvals: 0,
    incidents: 0,
  };
  let failures = [];

  try {
    plan = runControlledLocalExecutionPlan();
    writeSummary = createWriteSummary(runtimeSnapshot);
    failures = validatePlan(plan);
  } catch (error) {
    failures = [error.message];
    plan = {
      executionMode: "controlled-local",
      scenarioCount: 0,
      pass: 0,
      requireApproval: 0,
      blocked: 0,
      fail: 1,
      results: [],
    };
  } finally {
    restoreRuntimeFiles(runtimeSnapshot);
  }

  writeReport(metadata, plan, writeSummary, failures);
  printConsole(plan, writeSummary);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
