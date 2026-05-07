import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(
  ROOT,
  "reports/local-approval-workflow-report.md"
);
const REQUIRED_MODULES = [
  "local-state/approvalStore.js",
  "local-state/writeLocalState.js",
  "orchestrator/localExecutor.js",
  "orchestrator/localExecutionPlan.js",
];
const REQUIRED_SCRIPTS = [
  "scripts/approvals-list.js",
  "scripts/approvals-decide.js",
];
const REQUIRED_DOCS = ["docs/architecture/LOCAL_APPROVAL_WORKFLOW.md"];
const REQUIRED_POLICY = "policy/local-approval-workflow-policy.json";
const RUNTIME_FILES = [
  "local-state/runtime/tasks.json",
  "local-state/runtime/evidence.jsonl",
  "local-state/runtime/audit.jsonl",
  "local-state/runtime/events.jsonl",
  "local-state/runtime/approvals.jsonl",
  "local-state/runtime/incidents.jsonl",
];
const PHASE_FILES = [
  ...REQUIRED_MODULES,
  ...REQUIRED_SCRIPTS,
  ...REQUIRED_DOCS,
  REQUIRED_POLICY,
  "README.md",
  "docs/architecture/CONTROLLED_LOCAL_EXECUTION.md",
  "docs/architecture/LOCAL_STATE_MACHINE_ENFORCEMENT.md",
  "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "package.json",
];
const EXPORT_MAP = {
  "local-state/approvalStore.js": [
    "appendApprovalRequest",
    "listApprovals",
    "getApprovalById",
    "decideApproval",
    "validateApprovalRequest",
    "validateApprovalDecision",
  ],
};
const PRIVATE_NAME_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERNS = [
  new RegExp([["OPENAI", "_", "API", "_", "KEY"].join(""), "="].join("")),
  new RegExp(
    [["ANTHROPIC", "_", "API", "_", "KEY"].join(""), "="].join("")
  ),
  new RegExp([["DATABASE", "_", "URL"].join(""), "="].join("")),
  new RegExp([["sk", "-"].join(""), "[A-Za-z0-9]{10,}"].join("")),
  new RegExp([["sk", "-", "ant", "-"].join(""), "[A-Za-z0-9_-]{6,}"].join("")),
  new RegExp(["-----BEGIN ", "[A-Z ]+", "PRIVATE KEY", "-----"].join("")),
];
const PRIVATE_EXECUTION_KEY = ["care", "loop", "ExecutionAllowed"].join("");

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function writeFile(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), content, "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function parseJsonl(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
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
    // Ignore git metadata failures.
  }

  return metadata;
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function checkLongLines(relativePath) {
  return readFile(relativePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
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

async function loadModules() {
  const modules = {};
  for (const relativePath of REQUIRED_MODULES) {
    const moduleUrl = `${pathToFileURL(path.join(ROOT, relativePath)).href}?ts=${Date.now()}`;
    modules[relativePath] = await import(moduleUrl);
  }
  return modules;
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Local Approval Workflow Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Approval request and decisions: ${statusLabel(sections.approvalWorkflow)}`,
    `State transition evidence: ${statusLabel(sections.transitionEvidence)}`,
    `Controlled execution: ${statusLabel(sections.controlledExecution)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `No forbidden writes: ${statusLabel(sections.noForbiddenWrites)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((failure) => `- ${failure}`) : ["- None"]),
    "",
    `Result: ${statusLabel(failures.length === 0)}`,
    "",
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function printConsole(sections, overallPass) {
  const lines = [
    "NEXUS Local Approval Workflow Check",
    "===================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Approval request and decisions: ${statusLabel(sections.approvalWorkflow)}`,
    `State transition evidence: ${statusLabel(sections.transitionEvidence)}`,
    `Controlled execution: ${statusLabel(sections.controlledExecution)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `No forbidden writes: ${statusLabel(sections.noForbiddenWrites)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(overallPass)}`,
  ];

  console.log(lines.join("\n"));
}

function createApprovalTask(taskId, capabilityId) {
  return {
    taskId,
    projectId: "demoapp",
    sourceAgent: "nexus",
    targetAgent: "forge",
    taskType: "deploy.plan",
    objective: "Approval workflow validation task.",
    state: "awaiting_approval",
    riskLevel: "critical",
    blocking: true,
    dependsOn: [],
    capabilityId,
    contractId: "approval-test-contract",
    evidenceIds: [],
    auditEventIds: [],
    redacted: true,
  };
}

function createApprovalRequest(taskId, type = "deploy") {
  return {
    requestedBy: "forge",
    projectId: "demoapp",
    taskId,
    riskLevel: "critical",
    reason: `Approval required for ${type} validation.`,
    evidence: [{ type: "request_context", reference: taskId }],
    decision: "requested",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    redacted: true,
    type,
  };
}

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    exports: true,
    approvalWorkflow: true,
    transitionEvidence: true,
    controlledExecution: true,
    policy: true,
    docs: true,
    noForbiddenWrites: true,
    publicSafety: true,
    formattingReadability: true,
  };

  for (const relativePath of [
    ...REQUIRED_MODULES,
    ...REQUIRED_SCRIPTS,
    ...REQUIRED_DOCS,
    REQUIRED_POLICY,
  ]) {
    if (!exists(relativePath)) {
      failures.push(`Missing required file: ${relativePath}`);
      if (REQUIRED_MODULES.includes(relativePath) || REQUIRED_SCRIPTS.includes(relativePath)) {
        sections.modules = false;
      } else if (REQUIRED_DOCS.includes(relativePath)) {
        sections.docs = false;
      } else {
        sections.policy = false;
      }
    }
  }

  let packageJson = null;
  let policy = null;
  try {
    packageJson = readJson("package.json");
  } catch (error) {
    failures.push(`Invalid package.json: ${error.message}`);
    sections.modules = false;
  }
  try {
    policy = readJson(REQUIRED_POLICY);
  } catch (error) {
    failures.push(`Invalid JSON in ${REQUIRED_POLICY}: ${error.message}`);
    sections.policy = false;
  }

  if (packageJson?.scripts) {
    for (const scriptName of [
      "approvals:list",
      "approvals:approve",
      "approvals:reject",
      "check:local-approval-workflow",
    ]) {
      if (!packageJson.scripts[scriptName]) {
        failures.push(`Missing package script: ${scriptName}`);
        sections.modules = false;
      }
    }
  }

  let modules;
  try {
    modules = await loadModules();
  } catch (error) {
    failures.push(`Module load failed: ${error.message}`);
    sections.modules = false;
    const metadata = getGitMetadata();
    writeReport(metadata, sections, failures);
    printConsole(sections, false);
    process.exitCode = 1;
    return;
  }

  for (const [relativePath, exportsList] of Object.entries(EXPORT_MAP)) {
    for (const exportName of exportsList) {
      if (!(exportName in modules[relativePath])) {
        failures.push(`Missing export ${exportName} from ${relativePath}`);
        sections.exports = false;
      }
    }
  }

  const {
    appendApprovalRequest,
    listApprovals,
    getApprovalById,
    decideApproval,
  } = modules["local-state/approvalStore.js"];
  const { writeLocalStateEvent } = modules["local-state/writeLocalState.js"];
  const { runControlledLocalExecutionPlan } =
    modules["orchestrator/localExecutionPlan.js"];

  const runtimeSnapshot = snapshotRuntimeFiles();

  try {
    const taskAId = `approval-test-${Date.now()}`;
    const taskBId = `approval-reject-${Date.now()}`;

    const createTaskA = writeLocalStateEvent({
      type: "task",
      record: createApprovalTask(taskAId, "platform.deploy_plan"),
      dryRun: false,
    });
    const createTaskB = writeLocalStateEvent({
      type: "task",
      record: createApprovalTask(taskBId, "platform.deploy_plan"),
      dryRun: false,
    });

    if (!createTaskA.ok || !createTaskB.ok) {
      failures.push("Failed to create approval test tasks.");
      sections.approvalWorkflow = false;
    }

    const blockedWithoutApproval = writeLocalStateEvent({
      type: "task_state",
      record: {
        taskId: taskAId,
        nextState: "running",
        actorId: "forge",
        actorType: "agent",
        agentId: "forge",
        capabilityId: "platform.deploy_plan",
        policyDecisionId: "policy-test",
        runtime: "node-local",
        evidence: [],
        context: { taskType: "deploy.plan" },
        redacted: true,
      },
      dryRun: false,
    });

    if (blockedWithoutApproval.ok || blockedWithoutApproval.blocked !== true) {
      failures.push("awaiting_approval -> running must be blocked without approval evidence.");
      sections.transitionEvidence = false;
    }

    const requestWrite = appendApprovalRequest(createApprovalRequest(taskAId, "deploy"));
    const rejectRequestWrite = appendApprovalRequest(
      createApprovalRequest(taskBId, "deploy")
    );

    if (!requestWrite.ok || !rejectRequestWrite.ok) {
      failures.push("Approval request should append to approvals.jsonl.");
      sections.approvalWorkflow = false;
    }

    const approvalsList = listApprovals({ decision: "requested" });
    if (
      !approvalsList.ok ||
      !approvalsList.approvals.some(
        (approval) => approval.approvalId === requestWrite.record?.approvalId
      )
    ) {
      failures.push("Approval requests should be listed as requested.");
      sections.approvalWorkflow = false;
    }

    const approved = decideApproval({
      approvalId: requestWrite.record?.approvalId,
      decision: "approved",
      decidedBy: "local-operator",
      reason: "Approved for local state-machine validation.",
      redacted: true,
    });
    const rejected = decideApproval({
      approvalId: rejectRequestWrite.record?.approvalId,
      decision: "rejected",
      decidedBy: "local-operator",
      reason: "Rejected for negative local validation.",
      redacted: true,
    });

    if (!approved.ok || approved.evidence?.type !== "approval_granted") {
      failures.push("Approve flow must append approval_granted evidence.");
      sections.approvalWorkflow = false;
    }
    if (!rejected.ok || rejected.evidence?.type !== "approval_rejected") {
      failures.push("Reject flow must append approval_rejected evidence.");
      sections.approvalWorkflow = false;
    }
    if (!approved.audit || !rejected.audit) {
      failures.push("Approve and reject flows must append audit records.");
      sections.approvalWorkflow = false;
    }

    const approvalLookup = getApprovalById(requestWrite.record?.approvalId);
    const rejectionLookup = getApprovalById(rejectRequestWrite.record?.approvalId);
    if (
      !approvalLookup.ok ||
      approvalLookup.approval?.decision !== "approved" ||
      !rejectionLookup.ok ||
      rejectionLookup.approval?.decision !== "rejected"
    ) {
      failures.push("Approval lookup should reflect the latest approval decision.");
      sections.approvalWorkflow = false;
    }

    const allowedWithApproval = writeLocalStateEvent({
      type: "task_state",
      record: {
        taskId: taskAId,
        nextState: "running",
        actorId: "forge",
        actorType: "agent",
        agentId: "forge",
        capabilityId: "platform.deploy_plan",
        policyDecisionId: "policy-test",
        runtime: "node-local",
        evidence: [approved.evidence],
        context: { taskType: "deploy.plan" },
        redacted: true,
      },
      dryRun: false,
    });

    if (!allowedWithApproval.ok || allowedWithApproval.blocked) {
      failures.push("awaiting_approval -> running must be allowed with approval_granted evidence.");
      sections.transitionEvidence = false;
    }

    const blockedWithRejectedEvidence = writeLocalStateEvent({
      type: "task_state",
      record: {
        taskId: taskBId,
        nextState: "running",
        actorId: "forge",
        actorType: "agent",
        agentId: "forge",
        capabilityId: "platform.deploy_plan",
        policyDecisionId: "policy-test",
        runtime: "node-local",
        evidence: [rejected.evidence],
        context: { taskType: "deploy.plan" },
        redacted: true,
      },
      dryRun: false,
    });

    if (blockedWithRejectedEvidence.ok || blockedWithRejectedEvidence.blocked !== true) {
      failures.push("Rejected approval evidence must not unlock awaiting_approval -> running.");
      sections.transitionEvidence = false;
    }

    const tasksAfter = readJson("local-state/runtime/tasks.json");
    const taskAAfter = tasksAfter.tasks.find((task) => task.taskId === taskAId);
    const taskBAfter = tasksAfter.tasks.find((task) => task.taskId === taskBId);
    if (taskAAfter?.state !== "running") {
      failures.push("Approved task should transition to running.");
      sections.transitionEvidence = false;
    }
    if (taskBAfter?.state !== "awaiting_approval") {
      failures.push("Rejected task should remain awaiting_approval.");
      sections.transitionEvidence = false;
    }

    const plan = runControlledLocalExecutionPlan();
    const approvalScenario = plan.results.find(
      (result) => result.agentContext?.normalizedTask?.taskType === "deploy.plan"
    );
    const blockedScenario = plan.results.find(
      (result) =>
        result.agentContext?.normalizedTask?.taskType ===
        "ai.integration_blocked_review"
    );
    if (
      approvalScenario?.result !== "REQUIRE_APPROVAL" ||
      !approvalScenario?.localWrites.some(
        (write) => write.label === "approval" && write.written
      )
    ) {
      failures.push("Controlled execution approval scenario must create a local approval request.");
      sections.controlledExecution = false;
    }
    if (blockedScenario?.localWrites.some((write) => write.label === "task")) {
      failures.push("Blocked secret scenario must still block before task creation.");
      sections.controlledExecution = false;
    }
  } catch (error) {
    failures.push(`Local approval workflow validation failed: ${error.message}`);
    sections.approvalWorkflow = false;
    sections.transitionEvidence = false;
    sections.controlledExecution = false;
  } finally {
    restoreRuntimeFiles(runtimeSnapshot);
  }

  if (policy) {
    if (policy.localApprovalsEnabled !== true) {
      failures.push("Policy must enable local approvals.");
      sections.policy = false;
    }
    if (policy.approvalRecordsAppendOnly !== true) {
      failures.push("Policy must keep approval records append-only.");
      sections.policy = false;
    }
    if (policy.approvalEvidenceRequiredForTransition !== true) {
      failures.push("Policy must require approval evidence for transition.");
      sections.policy = false;
    }
    if (policy.selfApprovalAllowed !== false) {
      failures.push("Policy must block self approval.");
      sections.policy = false;
    }
    if (policy.projectWritesAllowed !== false) {
      failures.push("Policy must keep project writes disabled.");
      sections.policy = false;
    }
    if (policy.dbWritesAllowed !== false || policy.apiCallsAllowed !== false) {
      failures.push("Policy must keep DB and API calls disabled.");
      sections.policy = false;
    }
    if (policy[PRIVATE_EXECUTION_KEY] !== false) {
      failures.push("Policy must keep private product execution disabled.");
      sections.policy = false;
    }
  }

  const docsText = REQUIRED_DOCS.map((relativePath) => readFile(relativePath)).join("\n");
  if (!/approval_granted/.test(docsText)) {
    failures.push("Docs must mention approval_granted evidence.");
    sections.docs = false;
  }
  if (!/approve|reject|expire/.test(docsText)) {
    failures.push("Docs must describe approve, reject, and expire states.");
    sections.docs = false;
  }
  if (!/no UI mutation yet/i.test(docsText)) {
    failures.push("Docs must state that UI mutation is not implemented.");
    sections.docs = false;
  }

  const forbiddenStatus = execFileSync(
    "git",
    ["status", "--short", "--", "projects", "memory", "config", ".env", ".env.local"],
    {
      cwd: ROOT,
      encoding: "utf8",
    }
  ).trim();
  if (forbiddenStatus) {
    failures.push("Validation touched forbidden project, memory, config, or env paths.");
    sections.noForbiddenWrites = false;
  }

  const runtimeContent = RUNTIME_FILES.map((relativePath) => readFile(relativePath)).join("\n");
  if (PRIVATE_NAME_PATTERN.test(runtimeContent)) {
    failures.push("Runtime files contain a private project reference.");
    sections.noForbiddenWrites = false;
  }
  if (SECRET_PATTERNS.some((pattern) => pattern.test(runtimeContent))) {
    failures.push("Runtime files contain secret-like content.");
    sections.noForbiddenWrites = false;
  }

  for (const relativePath of PHASE_FILES) {
    if (!exists(relativePath)) {
      continue;
    }
    const content = readFile(relativePath);
    if (relativePath !== "package.json" && PRIVATE_NAME_PATTERN.test(content)) {
      failures.push(`Private project reference found in ${relativePath}`);
      sections.publicSafety = false;
    }
    if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
      failures.push(`Secret-like content found in ${relativePath}`);
      sections.publicSafety = false;
    }
    const longLines = checkLongLines(relativePath);
    if (longLines.length > 0) {
      failures.push(...longLines.map((entry) => `Line too long: ${entry}`));
      sections.formattingReadability = false;
    }
  }

  const metadata = getGitMetadata();
  const overallPass = failures.length === 0;
  writeReport(metadata, sections, failures);
  printConsole(sections, overallPass);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

await main();
