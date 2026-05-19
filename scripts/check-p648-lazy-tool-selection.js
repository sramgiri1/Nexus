import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLazyToolSelectionPacket,
  validateLazyToolSelectionPacket,
} from "../code-mode/lazyToolSelectionPacket.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "code-mode/fixtures/lazy-tool-selection-fixtures.json";
const REPORT_PATH = "reports/p648-lazy-tool-selection-report.md";
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
const packets = fixtures.map((fixture) => ({
  name: fixture.name,
  expectAllowed: fixture.expectAllowed,
  packet: buildLazyToolSelectionPacket(fixture.input),
}));
const validations = packets.map((entry) => validateLazyToolSelectionPacket(entry.packet));

addCheck("fixture count", fixtures.length >= 2, `${fixtures.length} fixtures`);
addCheck("packet validation", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck(
  "allowed and blocked cases",
  packets.some((entry) => entry.packet.budgetAllowed === true) && packets.some((entry) => entry.packet.budgetAllowed === false),
);
addCheck(
  "expectations match",
  packets.every((entry) => entry.packet.budgetAllowed === entry.expectAllowed),
);
addCheck(
  "execution disabled",
  packets.every((entry) =>
    entry.packet.executionAllowed === false &&
    entry.packet.codeExecutionAllowed === false &&
    entry.packet.providerDispatchAllowed === false &&
    entry.packet.toolExecutionAllowed === false
  ),
);
addCheck(
  "mutation boundaries disabled",
  packets.every((entry) =>
    entry.packet.projectMutationAllowed === false &&
    entry.packet.dbWritesAllowed === false &&
    entry.packet.deployAllowed === false &&
    entry.packet.externalNetworkAllowed === false &&
    entry.packet.workerExecutionAllowed === false
  ),
);
addCheck(
  "bulk loading blocked",
  packets.every((entry) => entry.packet.allToolSchemasAllowed === false && entry.packet.allMcpSchemasAllowed === false) &&
    packets.some((entry) => entry.packet.blockedReasons.some((reason) => reason.includes("All tool schemas"))),
);
addCheck(
  "selected summaries only",
  packets.every((entry) =>
    entry.packet.selectedContracts.every((contract) => !contract.inputSchema && !contract.outputSchema && !contract.examples)
  ),
);
addCheck(
  "display safe labels",
  packets.every((entry) => !JSON.stringify(entry.packet.safeSummary).includes("projects/")),
);
const p6483 = status.phases?.find((phase) => phase.phaseId === "P64.8.3");
addCheck("P64.8.3 phase status", p6483?.status === "complete", p6483?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates selected lazy tool contract packets for code-mode preview.",
        "- Stores contract summaries only; raw input/output schemas and raw MCP schemas are excluded.",
        "- Does not execute code, providers, tools, project mutation, DB writes, deploy, network calls, workers, or bulk schema loading.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Packets",
      body: packets
        .map(
          (entry) =>
            `- ${entry.name}: state=${entry.packet.state}; selected=${entry.packet.contractCount}; budgetAllowed=${entry.packet.budgetAllowed}`,
        )
        .join("\n"),
    },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P64.8 Lazy Tool Selection Report", phase: "P64.8.3" },
);

printCheckReport("P64.8 Lazy Tool Selection Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
