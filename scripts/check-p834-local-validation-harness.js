import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p834-local-validation-harness-report.md";
const GENERATED_ROOT = "generated-projects/snake-ios";
const VALIDATION_PATH = `${GENERATED_ROOT}/validation/local-validation.json`;

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

function runLocalCommand(commandSpec) {
  const [command, ...args] = commandSpec.command.split(" ");
  const result = spawnSync(command, args, {
    cwd: join(ROOT, commandSpec.cwd),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    name: commandSpec.name,
    command: commandSpec.command,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const validation = readJson(VALIDATION_PATH);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const validCurrentPhases = ["P83.4", "P83.5", "P83.6", "P83.7"];
const expectedNextByCurrent = new Map([
  ["P83.4", "P83.5"],
  ["P83.5", "P83.6"],
  ["P83.6", "P83.7"],
  ["P83.7", "P84"],
]);
const docs = readText("docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p83-execution-contracts.json");
const serializedCommands = JSON.stringify(validation.commands);
const commandResults = validation.commands.map(runLocalCommand);
const forbiddenTokens = ["curl", "http://", "https://", "xcodebuild", "testflight", "deploy", "release", "supabase", "provider", "stripe"];

addCheck("validation manifest exists", fileExists(VALIDATION_PATH));
addCheck("validation stays in generated root", validation.workspaceRoot === GENERATED_ROOT && validation.commands.every((command) => command.cwd === GENERATED_ROOT));
addCheck("commands are local Swift commands", validation.commands.map((command) => command.command).join("|") === "swift run SnakeIOSAppTests|swift build");
addCheck("forbidden actions are documented", ["provider calls", "worker execution", "DB writes", "network calls", "deploy", "provider spend"].every((action) => validation.forbiddenActions.includes(action)));
addCheck("commands avoid external/deploy tokens", forbiddenTokens.every((token) => !serializedCommands.toLowerCase().includes(token)));
for (const result of commandResults) {
  addCheck(`${result.name} command passes`, result.status === 0, result.stderr || result.stdout);
}
addCheck("build artifacts are ignored", readText(`${GENERATED_ROOT}/.gitignore`).includes(".build/"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p834-local-validation-harness"]));
addCheck("contract references P83.4 files", contract.includes(VALIDATION_PATH) && contract.includes("check:p834-local-validation-harness"));
addCheck("docs mention P83.4 validation", docs.includes("P83.4 Local Validation Harness") && docs.includes("Status: complete. P83.4"));
addCheck(
  "phase status remains valid after P83.4",
  statusById.get("P83.4")?.status === "complete"
    && validCurrentPhases.includes(status.currentPhase)
    && status.nextPhase === expectedNextByCurrent.get(status.currentPhase),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P83.4 local validation harness for the generated Snake iOS workspace.",
        "- Runs only local Swift commands inside `generated-projects/snake-ios`.",
        "- Does not mutate existing projects, call providers/tools, start workers, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Command Results",
      body: commandResults.map((result) => `- ${result.command}: ${result.status === 0 ? "PASS" : "FAIL"}`).join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p834-local-validation-harness",
        "- npm run check:p833-approved-local-file-creation",
        "- npm run check:p83-execution-plan",
        "- npm run check:os-phase-status",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P83.4 validates local Swift build/test behavior only. It does not deploy, package, sign, or run on a simulator." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P83.4 Local Validation Harness Report", phase: "P83.4" },
);

printCheckReport("P83.4 Local Validation Harness Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
