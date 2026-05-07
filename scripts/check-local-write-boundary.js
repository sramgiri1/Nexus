import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/local-write-boundary-report.md");

const REQUIRED_MODULES = [
  "local-state/writeLocalState.js",
  "local-state/appendAuditEvent.js",
  "local-state/appendEvidence.js",
  "local-state/taskStore.js",
  "local-state/stateStore.js",
  "local-state/writeGuards.js",
  "local-state/index.js",
  "local-state/schema.js",
];

const REQUIRED_RUNTIME_FILES = [
  "local-state/runtime/tasks.json",
  "local-state/runtime/evidence.jsonl",
  "local-state/runtime/audit.jsonl",
  "local-state/runtime/events.jsonl",
  "local-state/runtime/approvals.jsonl",
  "local-state/runtime/incidents.jsonl",
  "local-state/runtime/README.md",
];

const REQUIRED_DOCS = [
  "docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md",
  "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md",
  "docs/architecture/LOCAL_STATE_ADAPTER.md",
  "docs/architecture/READ_API_BOUNDARY.md",
  "docs/architecture/RUNTIME_TRAFFIC_PLANE.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
];

const REQUIRED_POLICIES = [
  "policy/local-state-write-policy.json",
  "policy/local-orchestrator-integration-policy.json",
];

const EXPORT_MAP = {
  "local-state/writeLocalState.js": [
    "writeLocalStateEvent",
    "validateLocalWrite",
  ],
  "local-state/appendAuditEvent.js": ["appendAuditEvent", "validateAuditEvent"],
  "local-state/appendEvidence.js": ["appendEvidence", "validateEvidence"],
  "local-state/taskStore.js": [
    "readTasks",
    "writeTasks",
    "addTask",
    "updateTaskState",
    "validateTask",
  ],
  "local-state/stateStore.js": [
    "appendRuntimeEvent",
    "appendApprovalRecord",
    "appendIncidentRecord",
    "readJsonl",
  ],
  "local-state/writeGuards.js": [
    "assertWritePathAllowed",
    "assertNoSecretLikeContent",
    "assertNoPrivateProjectReference",
    "sanitizeRecord",
    "createWriteGuardResult",
  ],
  "local-state/schema.js": [
    "LOCAL_RUNTIME_DIR",
    "LOCAL_TASKS_FILE",
    "LOCAL_EVIDENCE_FILE",
    "LOCAL_AUDIT_FILE",
    "LOCAL_EVENTS_FILE",
    "LOCAL_APPROVALS_FILE",
    "LOCAL_INCIDENTS_FILE",
    "ALLOWED_WRITE_DIRS",
    "BLOCKED_WRITE_DIRS",
  ],
  "local-state/index.js": [
    "readLocalStateSnapshot",
    "validateLocalStateSnapshot",
    "readValidationReports",
    "summarizeValidationReports",
    "readDemoContracts",
    "readDemoReports",
    "summarizeDemoArtifacts",
    "getRuntimeTrafficPlaneStatus",
    "getCapabilityStatus",
    "getPolicyStatus",
    "getReadinessSummary",
    "readJsonSafe",
    "readTextSafe",
    "listFilesSafe",
    "isPathAllowed",
    "writeLocalStateEvent",
    "validateLocalWrite",
    "appendAuditEvent",
    "validateAuditEvent",
    "appendEvidence",
    "validateEvidence",
    "readTasks",
    "writeTasks",
    "addTask",
    "updateTaskState",
    "validateTask",
    "appendRuntimeEvent",
    "appendApprovalRecord",
    "appendIncidentRecord",
    "readJsonl",
    "assertWritePathAllowed",
    "assertNoSecretLikeContent",
    "assertNoPrivateProjectReference",
    "sanitizeRecord",
  ],
};

const PHASE_FILES = [
  ...REQUIRED_MODULES,
  ...REQUIRED_RUNTIME_FILES,
  ...REQUIRED_DOCS,
  ...REQUIRED_POLICIES,
  "README.md",
  "scripts/check-local-write-boundary.js",
];

const PUBLIC_SCAN_FILES = PHASE_FILES.filter(
  (relativePath) => relativePath !== "package.json"
);

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

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
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
    // ignore git metadata failures
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

async function loadModules() {
  const modules = {};

  for (const relativePath of REQUIRED_MODULES) {
    const moduleUrl = pathToFileURL(path.join(ROOT, relativePath)).href;
    modules[relativePath] = await import(moduleUrl);
  }

  return modules;
}

function buildIdentityContext() {
  const now = new Date().toISOString();

  return {
    originatingUser: {
      userId: "demo-user",
      role: "founder",
      authType: "demo",
      scopes: ["demo:read", "demo:write"],
    },
    session: {
      sessionId: "demo-session",
      source: "demo",
      startedAt: now,
    },
    delegationChain: [],
    agent: {
      agentId: "nexus",
      agentVersion: "1.0.0",
      agentGroup: "control",
      agentPlane: "control",
    },
    request: {
      requestId: "demo-request",
      taskId: "demo-task",
      projectId: "demoapp",
      correlationId: "demo-correlation",
      idempotencyKey: "demo-key",
    },
    contextVersion: "1.0",
  };
}

function buildPolicyDecision() {
  return {
    decisionId: "demo-policy-decision",
    result: "ALLOW",
  };
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Local Write Boundary Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Runtime files: ${statusLabel(sections.runtimeFiles)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Write guards: ${statusLabel(sections.writeGuards)}`,
    `Dry-run writes: ${statusLabel(sections.dryRunWrites)}`,
    `Real append tests: ${statusLabel(sections.realAppendTests)}`,
    `Task store: ${statusLabel(sections.taskStore)}`,
    `Snapshot consistency: ${statusLabel(sections.snapshotConsistency)}`,
    `Policies: ${statusLabel(sections.policies)}`,
    `Docs: ${statusLabel(sections.docs)}`,
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

function printConsoleSummary(sections, overallPass) {
  const lines = [
    "NEXUS Local Write Boundary Check",
    "================================",
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Runtime files: ${statusLabel(sections.runtimeFiles)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Write guards: ${statusLabel(sections.writeGuards)}`,
    `Dry-run writes: ${statusLabel(sections.dryRunWrites)}`,
    `Real append tests: ${statusLabel(sections.realAppendTests)}`,
    `Task store: ${statusLabel(sections.taskStore)}`,
    `Snapshot consistency: ${statusLabel(sections.snapshotConsistency)}`,
    `Policies: ${statusLabel(sections.policies)}`,
    `Docs: ${statusLabel(sections.docs)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `Formatting/readability: ${statusLabel(sections.formattingReadability)}`,
    "",
    `Result: ${statusLabel(overallPass)}`,
  ];

  console.log(lines.join("\n"));
}

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    runtimeFiles: true,
    exports: true,
    writeGuards: true,
    dryRunWrites: true,
    realAppendTests: true,
    taskStore: true,
    snapshotConsistency: true,
    policies: true,
    docs: true,
    publicSafety: true,
    formattingReadability: true,
  };

  for (const relativePath of REQUIRED_MODULES) {
    if (!exists(relativePath)) {
      failures.push(`Missing module: ${relativePath}`);
      sections.modules = false;
    }
  }

  for (const relativePath of REQUIRED_RUNTIME_FILES) {
    if (!exists(relativePath)) {
      failures.push(`Missing runtime file: ${relativePath}`);
      sections.runtimeFiles = false;
    }
  }

  for (const relativePath of REQUIRED_DOCS) {
    if (!exists(relativePath)) {
      failures.push(`Missing doc: ${relativePath}`);
      sections.docs = false;
    }
  }

  for (const relativePath of REQUIRED_POLICIES) {
    if (!exists(relativePath)) {
      failures.push(`Missing policy: ${relativePath}`);
      sections.policies = false;
      continue;
    }

    try {
      readJson(relativePath);
    } catch (error) {
      failures.push(`Invalid JSON in ${relativePath}: ${error.message}`);
      sections.policies = false;
    }
  }

  let modules = null;
  if (sections.modules) {
    try {
      modules = await loadModules();
    } catch (error) {
      failures.push(`Unable to import local-state modules: ${error.message}`);
      sections.modules = false;
      sections.exports = false;
      sections.writeGuards = false;
      sections.dryRunWrites = false;
      sections.realAppendTests = false;
      sections.taskStore = false;
      sections.snapshotConsistency = false;
    }
  }

  if (modules) {
    for (const [relativePath, exportsList] of Object.entries(EXPORT_MAP)) {
      const moduleExports = modules[relativePath];
      for (const exportName of exportsList) {
        if (!(exportName in moduleExports)) {
          failures.push(`Missing export ${exportName} from ${relativePath}`);
          sections.exports = false;
        }
      }
    }

    const writeGuards = modules["local-state/writeGuards.js"];
    const allowedPaths = [
      "local-state/runtime/audit.jsonl",
      "local-state/runtime/evidence.jsonl",
    ];
    for (const allowedPath of allowedPaths) {
      if (!writeGuards.assertWritePathAllowed(allowedPath).ok) {
        failures.push(`Expected allowed write path: ${allowedPath}`);
        sections.writeGuards = false;
      }
    }

    const blockedProjectPath = ["projects/", "care", "loop", "/file.json"].join("");
    const blockedPaths = [
      "../package.json",
      ".env",
      blockedProjectPath,
      "memory/task-queue.json",
      "config/secrets.json",
      "node_modules/test.json",
      ".git/config",
    ];
    for (const blockedPath of blockedPaths) {
      if (writeGuards.assertWritePathAllowed(blockedPath).ok) {
        failures.push(`Expected blocked write path: ${blockedPath}`);
        sections.writeGuards = false;
      }
    }

    const secretLikeContent = [
      ["sk", "-"].join(""),
      "testsecretvalue123",
    ].join("");
    const databaseUrlContent = [
      ["DATABASE", "_", "URL"].join(""),
      "=",
      "postgres://demo",
    ].join("");
    const privateContent = [["Care", "Loop"].join(""), " prototype"].join("");

    if (writeGuards.assertNoSecretLikeContent(secretLikeContent).ok) {
      failures.push("Expected secret-like content to be blocked.");
      sections.writeGuards = false;
    }
    if (writeGuards.assertNoSecretLikeContent(databaseUrlContent).ok) {
      failures.push("Expected DATABASE_URL-like content to be blocked.");
      sections.writeGuards = false;
    }
    if (writeGuards.assertNoPrivateProjectReference(privateContent).ok) {
      failures.push("Expected private project references to be blocked.");
      sections.writeGuards = false;
    }

    const writeLocalState = modules["local-state/writeLocalState.js"];
    const identityContext = buildIdentityContext();
    const policyDecision = buildPolicyDecision();

    const dryRunSamples = [
      {
        label: "task",
        input: {
          type: "task",
          record: {
            projectId: "demoapp",
            sourceAgent: "shepherd",
            targetAgent: "core",
            taskType: "implementation.backend",
            objective: "Implement DemoApp API handler.",
            state: "queued",
            riskLevel: "medium",
            blocking: false,
            dependsOn: [],
            capabilityId: "implementation.backend_code",
            contractId: "demo-contract",
            evidenceIds: [],
            auditEventIds: [],
            redacted: true,
          },
          identityContext,
          policyDecision,
          dryRun: true,
        },
      },
      {
        label: "evidence",
        input: {
          type: "evidence",
          record: {
            type: "local_write_boundary_check",
            projectId: "demoapp",
            taskId: "demo-task",
            agentId: "nexus",
            capabilityId: "control.read_system_state",
            result: "INFO",
            summary: "Demo evidence dry run.",
            artifactPaths: ["reports/runtime-traffic-plane-report.md"],
            traceIds: [],
            policyDecisionId: "demo-policy-decision",
            dataClassification: "public",
            redacted: true,
          },
          identityContext,
          policyDecision,
          dryRun: true,
        },
      },
      {
        label: "audit",
        input: {
          type: "audit",
          record: {
            eventType: "local_write_boundary_check",
            actorId: "nexus",
            actorType: "agent",
            projectId: "demoapp",
            taskId: "demo-task",
            capabilityId: "control.read_system_state",
            policyDecisionId: "demo-policy-decision",
            summary: "Demo audit dry run.",
            redacted: true,
          },
          identityContext,
          policyDecision,
          dryRun: true,
        },
      },
      {
        label: "runtime event",
        input: {
          type: "runtime_event",
          record: {
            eventType: "local_write_boundary_check",
            projectId: "demoapp",
            taskId: "demo-task",
            agentId: "nexus",
            runtime: "node-local",
            summary: "Demo runtime event dry run.",
            redacted: true,
          },
          identityContext,
          policyDecision,
          dryRun: true,
        },
      },
      {
        label: "approval",
        input: {
          type: "approval",
          record: {
            type: "deploy_preview",
            requestedBy: "forge",
            projectId: "demoapp",
            taskId: "demo-task",
            riskLevel: "high",
            decision: "requested",
            summary: "Demo approval dry run.",
            redacted: true,
          },
          identityContext,
          policyDecision,
          dryRun: true,
        },
      },
      {
        label: "incident",
        input: {
          type: "incident",
          record: {
            type: "demo_warning",
            severity: "SEV3",
            projectId: "demoapp",
            taskId: "demo-task",
            summary: "Demo incident dry run.",
            status: "open",
            redacted: true,
          },
          identityContext,
          policyDecision,
          dryRun: true,
        },
      },
    ];

    for (const sample of dryRunSamples) {
      const result = writeLocalState.writeLocalStateEvent(sample.input);
      if (!result.ok || result.written !== false) {
        failures.push(`Dry-run write failed for ${sample.label}.`);
        sections.dryRunWrites = false;
      }
    }

    const stateStore = modules["local-state/stateStore.js"];
    const appendAuditModule = modules["local-state/appendAuditEvent.js"];
    const appendEvidenceModule = modules["local-state/appendEvidence.js"];
    const taskStore = modules["local-state/taskStore.js"];
    const readLocalState = modules["local-state/index.js"];

    const runtimeBackups = {
      audit: readFile("local-state/runtime/audit.jsonl"),
      evidence: readFile("local-state/runtime/evidence.jsonl"),
      tasks: readFile("local-state/runtime/tasks.json"),
    };

    try {
      const auditAppend = appendAuditModule.appendAuditEvent({
        eventType: "local_write_boundary_check",
        actorId: "nexus",
        actorType: "agent",
        projectId: "demoapp",
        taskId: "demo-check-task",
        capabilityId: "control.read_system_state",
        policyDecisionId: "demo-policy-decision",
        summary: "Append-only audit validation record.",
        redacted: true,
      });

      const evidenceAppend = appendEvidenceModule.appendEvidence({
        type: "local_write_boundary_check",
        projectId: "demoapp",
        taskId: "demo-check-task",
        agentId: "nexus",
        capabilityId: "control.read_system_state",
        result: "INFO",
        summary: "Append-only evidence validation record.",
        artifactPaths: ["reports/runtime-traffic-plane-report.md"],
        traceIds: [],
        policyDecisionId: "demo-policy-decision",
        dataClassification: "public",
        redacted: true,
      });

      if (!auditAppend.ok || !evidenceAppend.ok) {
        failures.push("Real append tests could not write audit or evidence records.");
        sections.realAppendTests = false;
      } else {
        const auditRecords = stateStore.readJsonl("local-state/runtime/audit.jsonl");
        const evidenceRecords = stateStore.readJsonl(
          "local-state/runtime/evidence.jsonl"
        );

        if (
          !auditRecords.ok ||
          !evidenceRecords.ok ||
          !auditRecords.records.some(
            (record) => record.auditId === auditAppend.record.auditId
          ) ||
          !evidenceRecords.records.some(
            (record) => record.evidenceId === evidenceAppend.record.evidenceId
          )
        ) {
          failures.push("Real append tests did not verify written JSONL records.");
          sections.realAppendTests = false;
        }
      }

      const addTaskResult = taskStore.addTask({
        projectId: "demoapp",
        sourceAgent: "shepherd",
        targetAgent: "core",
        taskType: "implementation.backend",
        objective: "Validate local task store integration.",
        state: "queued",
        riskLevel: "medium",
        blocking: false,
        dependsOn: [],
        capabilityId: "implementation.backend_code",
        contractId: "demo-contract",
        evidenceIds: [],
        auditEventIds: [],
        redacted: true,
      });

      if (!addTaskResult.ok) {
        failures.push("Task store could not add a DemoApp test task.");
        sections.taskStore = false;
      } else {
        const updateTaskResult = taskStore.updateTaskState(
          addTaskResult.record.taskId,
          "running",
          {
            actorId: "shepherd",
            actorType: "agent",
            capabilityId: addTaskResult.record.capabilityId,
            summary: "Move DemoApp validation task to running.",
            evidenceIds: [],
          }
        );

        if (!updateTaskResult.ok) {
          failures.push("Task store could not update the DemoApp task state.");
          sections.taskStore = false;
        } else {
          const taskState = taskStore.readTasks();
          const taskRecord = taskState.document.tasks.find(
            (task) => task.taskId === addTaskResult.record.taskId
          );

          if (!taskRecord || taskRecord.state !== "running") {
            failures.push("Updated DemoApp task was not persisted as running.");
            sections.taskStore = false;
          }

          if (
            !updateTaskResult.audit ||
            !Array.isArray(taskRecord?.auditEventIds) ||
            !taskRecord.auditEventIds.includes(updateTaskResult.audit.auditId)
          ) {
            failures.push("Task state update did not create an audit record.");
            sections.taskStore = false;
          }
        }
      }

      const snapshot = readLocalState.readLocalStateSnapshot();
      const snapshotValidation =
        readLocalState.validateLocalStateSnapshot(snapshot);

      if (
        snapshot.readOnly !== true ||
        snapshot.source !== "local-files" ||
        !snapshot.validation?.summary ||
        !snapshot.demo?.summary ||
        !snapshot.runtime?.runtimeTrafficPlane ||
        !snapshotValidation.valid
      ) {
        failures.push("Local state snapshot did not remain valid after writes.");
        sections.snapshotConsistency = false;
      }
    } finally {
      writeFile("local-state/runtime/audit.jsonl", runtimeBackups.audit);
      writeFile("local-state/runtime/evidence.jsonl", runtimeBackups.evidence);
      writeFile("local-state/runtime/tasks.json", runtimeBackups.tasks);
    }
  }

  const writePolicy = exists("policy/local-state-write-policy.json")
    ? readJson("policy/local-state-write-policy.json")
    : null;
  const integrationPolicy = exists(
    "policy/local-orchestrator-integration-policy.json"
  )
    ? readJson("policy/local-orchestrator-integration-policy.json")
    : null;

  const integrationKey = ["care", "loop", "ExecutionEnabled"].join("");

  if (
    !writePolicy ||
    writePolicy.deletionAllowed !== false ||
    writePolicy.secretsAllowed !== false ||
    writePolicy.privateProjectReferencesAllowed !== false
  ) {
    failures.push("Local state write policy booleans are not configured correctly.");
    sections.policies = false;
  }

  if (
    !integrationPolicy ||
    integrationPolicy.orchestratorDispatchWired !== false ||
    integrationPolicy.providerCallsAllowed !== false ||
    integrationPolicy.dbWritesAllowed !== false ||
    integrationPolicy[integrationKey] !== false
  ) {
    failures.push(
      "Local orchestrator integration policy booleans are not configured correctly."
    );
    sections.policies = false;
  }

  const writeBoundaryDoc = exists(
    "docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md"
  )
    ? readFile("docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md")
    : "";
  const orchestratorDoc = exists(
    "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md"
  )
    ? readFile("docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md")
    : "";

  if (
    !/no DB/i.test(writeBoundaryDoc) ||
    !/no API/i.test(writeBoundaryDoc) ||
    !/no provider calls/i.test(writeBoundaryDoc) ||
    !/does not wire `loop\.js`/i.test(orchestratorDoc)
  ) {
    failures.push(
      "Write-boundary docs must mention no DB, no API, no provider calls, and no orchestrator dispatch wiring."
    );
    sections.docs = false;
  }

  for (const relativePath of PUBLIC_SCAN_FILES) {
    if (!exists(relativePath)) {
      continue;
    }

    const content = readFile(relativePath);
    if (PRIVATE_NAME_PATTERN.test(content)) {
      failures.push(`Private project reference found in ${relativePath}`);
      sections.publicSafety = false;
    }

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        failures.push(`Secret-like pattern found in ${relativePath}`);
        sections.publicSafety = false;
        break;
      }
    }
  }

  const longLineFailures = [];
  for (const relativePath of PHASE_FILES) {
    if (!exists(relativePath)) {
      continue;
    }
    longLineFailures.push(...checkLongLines(relativePath));
  }

  if (longLineFailures.length > 0) {
    failures.push(
      ...longLineFailures.map((entry) => `Line exceeds 1000 characters: ${entry}`)
    );
    sections.formattingReadability = false;
  }

  const metadata = getGitMetadata();
  writeReport(metadata, sections, failures);

  const overallPass = failures.length === 0;
  printConsoleSummary(sections, overallPass);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

await main();
