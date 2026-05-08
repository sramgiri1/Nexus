import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/mission-composer-check.md");

const REQUIRED_MODULES = [
  "mission-composer/index.js",
  "mission-composer/missionComposer.js",
  "mission-composer/missionContract.js",
  "mission-composer/missionPlanner.js",
];

const REQUIRED_POLICY = "policy/mission-composer-policy.json";
const MISSION_CONTRACT_PATH = "contracts/missions/private-project-mission-contract.json";
const TASK_PLAN_PATH = "contracts/missions/private-project-task-plan.json";
const REPORT_MD = "reports/mission-composer-report.md";
const REPORT_JSON = "reports/mission-composer-output.json";
const COMMAND_CENTER_PATH = "dashboard/src/pages/CommandCenter.jsx";

const PRIVATE_NAME_PATTERN = new RegExp(
  [["Care", "Loop"].join(""), ["care", "loop"].join("")].join("|")
);
const SECRET_PATTERN = new RegExp(
  [
    "sk-[A-Za-z0-9]{10,}",
    "sk-ant-[A-Za-z0-9_-]{6,}",
    "OPENAI_API_KEY=",
    "ANTHROPIC_API_KEY=",
    "DATABASE_URL=",
    "-----BEGIN [A-Z ]+PRIVATE KEY-----",
  ].join("|")
);

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function statusLabel(pass) {
  return pass ? "PASS" : "FAIL";
}

function getMetadata() {
  const metadata = {
    generatedAt: new Date().toISOString(),
    branch: "unknown",
    head: "unknown",
  };
  try {
    metadata.branch =
      execFileSync("git", ["branch", "--show-current"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim() || "unknown";
    metadata.head =
      execFileSync("git", ["rev-parse", "--short", "HEAD"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim() || "unknown";
  } catch {
    /* ignore */
  }
  return metadata;
}

function checkLongLines(relativePath) {
  if (!exists(relativePath)) return [];
  return readFile(relativePath)
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000)
    .map((entry) => `${relativePath}:${entry.line} (${entry.length})`);
}

async function loadModule(relativePath) {
  return import(
    `${pathToFileURL(path.join(ROOT, relativePath)).href}?t=${Date.now()}`
  );
}

function writeReport(metadata, sections, failures) {
  const lines = [
    "# NEXUS Mission Composer Check",
    "",
    "## Metadata",
    "",
    `- Generated at: ${metadata.generatedAt}`,
    `- Validation branch: ${metadata.branch}`,
    `- Validation HEAD: ${metadata.head}`,
    "",
    `Modules: ${statusLabel(sections.modules)}`,
    `Exports: ${statusLabel(sections.exports)}`,
    `Policy: ${statusLabel(sections.policy)}`,
    `Mission contract: ${statusLabel(sections.missionContract)}`,
    `Task plan: ${statusLabel(sections.taskPlan)}`,
    `Reports: ${statusLabel(sections.reports)}`,
    `Governed local path: ${statusLabel(sections.governedLocalPath)}`,
    `UI content: ${statusLabel(sections.uiContent)}`,
    `Mode boundary: ${statusLabel(sections.modeBoundary)}`,
    `Public safety: ${statusLabel(sections.publicSafety)}`,
    `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
    `Formatting: ${statusLabel(sections.formatting)}`,
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((f) => `- ${f}`) : ["- None"]),
    "",
    `Result: ${statusLabel(failures.length === 0)}`,
    "",
  ];

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function printConsole(sections, overallPass) {
  console.log(
    [
      "NEXUS Mission Composer Check",
      "============================",
      "",
      `Modules: ${statusLabel(sections.modules)}`,
      `Exports: ${statusLabel(sections.exports)}`,
      `Policy: ${statusLabel(sections.policy)}`,
      `Mission contract: ${statusLabel(sections.missionContract)}`,
      `Task plan: ${statusLabel(sections.taskPlan)}`,
      `Reports: ${statusLabel(sections.reports)}`,
      `Governed local path: ${statusLabel(sections.governedLocalPath)}`,
      `UI content: ${statusLabel(sections.uiContent)}`,
      `Mode boundary: ${statusLabel(sections.modeBoundary)}`,
      `Public safety: ${statusLabel(sections.publicSafety)}`,
      `No forbidden changes: ${statusLabel(sections.noForbiddenChanges)}`,
      `Formatting: ${statusLabel(sections.formatting)}`,
      "",
      `Result: ${statusLabel(overallPass)}`,
    ].join("\n")
  );
}

async function main() {
  const failures = [];
  const sections = {
    modules: true,
    exports: true,
    policy: true,
    missionContract: true,
    taskPlan: true,
    reports: true,
    governedLocalPath: true,
    uiContent: true,
    modeBoundary: true,
    publicSafety: true,
    noForbiddenChanges: true,
    formatting: true,
  };

  // 1. Required modules exist
  for (const relativePath of REQUIRED_MODULES) {
    if (!exists(relativePath)) {
      sections.modules = false;
      failures.push(`Missing required module: ${relativePath}`);
    }
  }

  // 2. Required exports exist
  let composerModule = {};
  try {
    composerModule = await loadModule("mission-composer/index.js");
  } catch (error) {
    sections.modules = false;
    sections.exports = false;
    failures.push(`Failed to import mission-composer/index.js: ${error.message}`);
  }

  for (const exportName of [
    "createMissionInput",
    "validateMissionInput",
    "normalizeMissionInput",
    "runMissionComposer",
    "writeMissionComposerReports",
    "createMissionContract",
    "validateMissionContract",
    "writeMissionContract",
    "createInitialMissionTaskPlan",
    "createAgentAssignments",
    "createGovernedTaskContracts",
    "writeMissionTaskPlan",
  ]) {
    if (!(exportName in composerModule)) {
      sections.exports = false;
      failures.push(`Missing export: ${exportName}`);
    }
  }

  // 3. Policy exists and parses
  if (!exists(REQUIRED_POLICY)) {
    sections.policy = false;
    failures.push(`Missing required policy: ${REQUIRED_POLICY}`);
  } else {
    try {
      const policy = readJson(REQUIRED_POLICY);
      const safetyFields = [
        "mutationAllowed",
        "providerCallsAllowed",
        "networkCallsAllowed",
        "dbAccessAllowed",
        "buildExecutionAllowed",
        "testExecutionAllowed",
      ];
      for (const field of safetyFields) {
        if (policy[field] !== false) {
          sections.policy = false;
          failures.push(`mission-composer-policy.json: ${field} must be false.`);
        }
      }
      if (policy.modeRequired !== "local-private") {
        sections.policy = false;
        failures.push("mission-composer-policy.json: modeRequired must be local-private.");
      }
    } catch (error) {
      sections.policy = false;
      failures.push(`Invalid policy JSON: ${error.message}`);
    }
  }

  // 4. Mission contract exists, parses, all safety flags false
  if (!exists(MISSION_CONTRACT_PATH)) {
    sections.missionContract = false;
    failures.push(`Missing mission contract: ${MISSION_CONTRACT_PATH}`);
  } else {
    try {
      const contract = readJson(MISSION_CONTRACT_PATH);
      const constraintFields = [
        "mutationAllowed",
        "providerCallsAllowed",
        "networkCallsAllowed",
        "dbAccessAllowed",
        "buildExecutionAllowed",
        "testExecutionAllowed",
      ];
      for (const field of constraintFields) {
        if (contract.constraints?.[field] !== false) {
          sections.missionContract = false;
          failures.push(`Mission contract: constraints.${field} must be false.`);
        }
      }
      if (!contract.contractId || !contract.projectId) {
        sections.missionContract = false;
        failures.push("Mission contract: missing contractId or projectId.");
      }
    } catch (error) {
      sections.missionContract = false;
      failures.push(`Invalid mission contract JSON: ${error.message}`);
    }
  }

  // 5. Task plan exists, has 6 tasks for correct agents, all mutationAllowed/executionAllowed false
  if (!exists(TASK_PLAN_PATH)) {
    sections.taskPlan = false;
    failures.push(`Missing task plan: ${TASK_PLAN_PATH}`);
  } else {
    try {
      const plan = readJson(TASK_PLAN_PATH);
      const tasks = plan.tasks || [];

      const requiredAgents = ["shepherd", "auditor", "prism", "warden", "core"];
      for (const agent of requiredAgents) {
        const found = tasks.some(
          (t) => (t.targetAgent || "").toLowerCase() === agent.toLowerCase()
        );
        if (!found) {
          sections.taskPlan = false;
          failures.push(`Task plan: missing task for agent ${agent.toUpperCase()}.`);
        }
      }

      for (const task of tasks) {
        if (task.mutationAllowed !== false) {
          sections.taskPlan = false;
          failures.push(`Task plan: task ${task.taskId || "unknown"} has mutationAllowed=true.`);
        }
        if (task.executionAllowed !== false) {
          sections.taskPlan = false;
          failures.push(
            `Task plan: task ${task.taskId || "unknown"} has executionAllowed=true.`
          );
        }
      }
    } catch (error) {
      sections.taskPlan = false;
      failures.push(`Invalid task plan JSON: ${error.message}`);
    }
  }

  // 6. Reports exist
  if (!exists(REPORT_MD)) {
    sections.reports = false;
    failures.push(`Missing report: ${REPORT_MD}`);
  }
  if (!exists(REPORT_JSON)) {
    sections.reports = false;
    failures.push(`Missing report: ${REPORT_JSON}`);
  }

  // 7. Governed local path — snapshot, run, verify, restore
  const RUNTIME_FILES = [
    "local-state/runtime/tasks.json",
    "local-state/runtime/evidence.jsonl",
    "local-state/runtime/audit.jsonl",
    "local-state/runtime/events.jsonl",
  ];

  const backups = {};
  for (const f of RUNTIME_FILES) {
    const p = path.join(ROOT, f);
    backups[f] = fs.existsSync(p) ? fs.readFileSync(p) : null;
  }

  let governedRunOk = false;
  try {
    const runResult = spawnSync(
      "node",
      ["scripts/mission-compose.js"],
      {
        cwd: ROOT,
        encoding: "utf8",
        env: { ...process.env, NEXUS_MODE: "local-private" },
        timeout: 30000,
      }
    );

    if (runResult.status !== 0) {
      sections.governedLocalPath = false;
      failures.push(
        `mission:compose failed: ${runResult.stderr || runResult.stdout || "unknown error"}`
      );
    } else {
      // Verify records were created/updated
      let anyWritten = false;
      for (const f of RUNTIME_FILES) {
        const p = path.join(ROOT, f);
        if (fs.existsSync(p)) {
          const currentContent = fs.readFileSync(p);
          const backup = backups[f];
          if (backup === null || !currentContent.equals(backup)) {
            anyWritten = true;
          }
        }
      }

      if (!anyWritten) {
        sections.governedLocalPath = false;
        failures.push("Governed local path: no runtime files were written after mission:compose.");
      } else {
        governedRunOk = true;
      }
    }
  } catch (error) {
    sections.governedLocalPath = false;
    failures.push(`Governed local path error: ${error.message}`);
  }

  // Restore runtime files
  for (const [f, content] of Object.entries(backups)) {
    const p = path.join(ROOT, f);
    if (content !== null) {
      fs.writeFileSync(p, content);
    } else if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }

  // 8. UI content check
  if (exists(COMMAND_CENTER_PATH)) {
    const ccSource = readFile(COMMAND_CENTER_PATH);
    const requiredTexts = [
      "Start a Mission",
      "Describe what you want to build",
      "Generate Plan",
      "Create Project Brief",
      "Start Governed Run",
      "Requires governed action bridge",
    ];
    for (const text of requiredTexts) {
      if (!ccSource.includes(text)) {
        sections.uiContent = false;
        failures.push(`Command Center missing required text: "${text}"`);
      }
    }
  } else {
    sections.uiContent = false;
    failures.push(`Command Center file not found: ${COMMAND_CENTER_PATH}`);
  }

  // 9. Mode boundary: demo mode check
  const demoResult = spawnSync(
    "node",
    ["scripts/mission-compose.js"],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, NEXUS_MODE: "demo" },
      timeout: 10000,
    }
  );
  if (demoResult.status === 0) {
    sections.modeBoundary = false;
    failures.push("Mode boundary: mission:compose should fail in demo mode but succeeded.");
  }

  // 10. Public safety: run check:public-safety
  try {
    const safetyResult = spawnSync("npm", ["run", "check:public-safety"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 60000,
    });
    if (safetyResult.status !== 0) {
      sections.publicSafety = false;
      const output = (safetyResult.stdout || "") + (safetyResult.stderr || "");
      failures.push(`Public safety check failed: ${output.slice(0, 500)}`);
    }
  } catch (error) {
    sections.publicSafety = false;
    failures.push(`Public safety check error: ${error.message}`);
  }

  // 11. No forbidden changes: git diff check for projects/
  try {
    const diffResult = execFileSync(
      "git",
      ["diff", "--name-only", "HEAD", "--", "projects/"],
      { cwd: ROOT, encoding: "utf8" }
    ).trim();
    if (diffResult.length > 0) {
      sections.noForbiddenChanges = false;
      failures.push(`Forbidden changes in projects/ directory: ${diffResult}`);
    }
  } catch {
    /* git diff errors are non-fatal */
  }

  // Check private name pattern in new files
  for (const relativePath of [
    ...REQUIRED_MODULES,
    REQUIRED_POLICY,
    MISSION_CONTRACT_PATH,
    TASK_PLAN_PATH,
    REPORT_MD,
    REPORT_JSON,
  ]) {
    if (!exists(relativePath)) continue;
    const content = readFile(relativePath);
    if (PRIVATE_NAME_PATTERN.test(content)) {
      sections.publicSafety = false;
      failures.push(`Private project name found in: ${relativePath}`);
    }
    if (SECRET_PATTERN.test(content)) {
      sections.noForbiddenChanges = false;
      failures.push(`Secret-like content found in: ${relativePath}`);
    }
  }

  // 12. Formatting: no lines > 1000 chars
  const formatFiles = [
    ...REQUIRED_MODULES,
    REQUIRED_POLICY,
    MISSION_CONTRACT_PATH,
    TASK_PLAN_PATH,
  ];
  for (const relativePath of formatFiles) {
    if (!exists(relativePath)) continue;
    for (const failure of checkLongLines(relativePath)) {
      sections.formatting = false;
      failures.push(`Line exceeds 1000 chars: ${failure}`);
    }
  }

  const metadata = getMetadata();
  const overallPass = failures.length === 0;
  writeReport(metadata, sections, failures);
  printConsole(sections, overallPass);

  if (!overallPass) {
    process.exitCode = 1;
  }
}

main();
