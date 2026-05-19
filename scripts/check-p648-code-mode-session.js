import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { createCodeModeSession, validateCodeModeSession } from "../code-mode/codeModeSession.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "code-mode/fixtures/code-mode-session-fixtures.json";
const REPORT_PATH = "reports/p648-code-mode-session-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const checks = [];
const failures = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
  if (!passed) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

const fixtures = readJson(FIXTURE_PATH).fixtures || [];
const status = readJson(STATUS_PATH);
const sessions = fixtures.map((fixture) => ({ name: fixture.name, session: createCodeModeSession(fixture.input) }));
const validations = sessions.map((entry) => validateCodeModeSession(entry.session));

addCheck("fixture count", fixtures.length >= 1, `${fixtures.length} fixtures`);
addCheck("session validation", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck(
  "execution disabled",
  sessions.every((entry) =>
    entry.session.executionAllowed === false &&
    entry.session.codeExecutionAllowed === false &&
    entry.session.providerDispatchAllowed === false &&
    entry.session.toolExecutionAllowed === false
  ),
);
addCheck(
  "mutation boundaries disabled",
  sessions.every((entry) =>
    entry.session.projectMutationAllowed === false &&
    entry.session.dbWritesAllowed === false &&
    entry.session.deployAllowed === false &&
    entry.session.externalNetworkAllowed === false &&
    entry.session.workerExecutionAllowed === false
  ),
);
addCheck(
  "lazy context bounded",
  sessions.every((entry) =>
    entry.session.allToolSchemasAllowed === false &&
    entry.session.allMcpSchemasAllowed === false &&
    entry.session.contextBudget.allowed === true
  ),
);
addCheck(
  "display safe labels",
  sessions.every((entry) => !JSON.stringify(entry.session.safeSummary).includes("projects/")),
);
const p6482 = status.phases?.find((phase) => phase.phaseId === "P64.8.2");
addCheck("P64.8.2 phase status", p6482?.status === "complete", p6482?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates preview-only code-mode session records.",
        "- Does not execute code, providers, tools, project mutation, DB writes, deploy, network calls, workers, or bulk schema loading.",
        "- Reuses dispatch dry-run and context budget helpers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Sessions", body: sessions.map((entry) => `- ${entry.name}: ${entry.session.state}; contracts=${entry.session.selectedContractCount}`).join("\n") },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P64.8 Code Mode Session Report", phase: "P64.8.2" },
);

printCheckReport("P64.8 Code Mode Session Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
