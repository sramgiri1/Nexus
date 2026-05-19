import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { createCodeModeSession, validateCodeModeSession } from "../code-mode/codeModeSession.js";
import {
  buildLazyToolSelectionPacket,
  validateLazyToolSelectionPacket,
} from "../code-mode/lazyToolSelectionPacket.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p648-final-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REQUIRED_REPORTS = [
  "reports/p648-execution-plan-report.md",
  "reports/p648-code-mode-session-report.md",
  "reports/p648-lazy-tool-selection-report.md",
  "reports/p648-command-center-code-mode-ux-report.md",
];
const REQUIRED_CHECKS = [
  "npm run check:p648-execution-plan",
  "npm run check:p648-code-mode-session",
  "npm run check:p648-lazy-tool-selection",
  "npm run check:p648-command-center-code-mode-ux",
  "npm run check:p648-final",
];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function hasPassResult(relativePath) {
  const body = read(relativePath);
  return body.includes("## Result") && body.includes("PASS");
}

export function checkP648Final() {
  const checks = [];
  const failures = [];
  function addCheck(name, passed, details = "") {
    checks.push({ name, status: passed ? "PASS" : "FAIL", details });
    if (!passed) failures.push(`${name}${details ? `: ${details}` : ""}`);
  }

  const status = readJson(STATUS_PATH);
  const phaseById = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
  const session = createCodeModeSession({
    sessionId: "p648_final_session_preview",
    selectedToolContracts: ["git-status", "git-diff"],
    toolSummaries: [{ toolId: "git-status" }, { toolId: "git-diff" }],
    evidenceRefs: [REPORT_PATH],
    activityRefs: ["reports/os-phase-status-report.md"],
    safeSummary: { scope: "NEXUS OS", execution: "disabled" },
  });
  const packet = buildLazyToolSelectionPacket({
    packetId: "p648_final_lazy_packet",
    selectedToolIds: ["git-status", "git-diff"],
    toolSummaries: [{ toolId: "git-status" }, { toolId: "git-diff" }],
    evidenceRefs: [REPORT_PATH],
    activityRefs: ["reports/os-phase-status-report.md"],
    safeSummary: { scope: "NEXUS OS", bulkLoading: "blocked" },
  });
  const sessionValidation = validateCodeModeSession(session);
  const packetValidation = validateLazyToolSelectionPacket(packet);

  addCheck("required reports exist", REQUIRED_REPORTS.every((report) => existsSync(join(ROOT, report))), REQUIRED_REPORTS.filter((report) => !existsSync(join(ROOT, report))).join(", "));
  addCheck("required reports pass", REQUIRED_REPORTS.every(hasPassResult), REQUIRED_REPORTS.filter((report) => !hasPassResult(report)).join(", "));
  addCheck(
    "P64.8 subphase status",
    ["P64.8.1", "P64.8.2", "P64.8.3", "P64.8.4", "P64.8.5"].every((phaseId) => phaseById.get(phaseId)?.status === "complete"),
  );
  addCheck("P64.8 parent status", phaseById.get("P64.8")?.status === "complete", phaseById.get("P64.8")?.status || "missing");
  addCheck("handoff to P65", status.currentPhase === "P65" && status.previousPhase === "P64.8" && status.nextPhase === "P66", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
  addCheck("session valid", sessionValidation.valid, sessionValidation.errors.join("; "));
  addCheck("packet valid", packetValidation.valid, packetValidation.errors.join("; "));
  addCheck(
    "execution disabled",
    session.executionAllowed === false &&
      session.codeExecutionAllowed === false &&
      session.providerDispatchAllowed === false &&
      session.toolExecutionAllowed === false &&
      packet.executionAllowed === false &&
      packet.codeExecutionAllowed === false &&
      packet.providerDispatchAllowed === false &&
      packet.toolExecutionAllowed === false,
  );
  addCheck(
    "mutation boundaries disabled",
    session.projectMutationAllowed === false &&
      session.dbWritesAllowed === false &&
      session.deployAllowed === false &&
      session.externalNetworkAllowed === false &&
      session.workerExecutionAllowed === false &&
      packet.projectMutationAllowed === false &&
      packet.dbWritesAllowed === false &&
      packet.deployAllowed === false &&
      packet.externalNetworkAllowed === false &&
      packet.workerExecutionAllowed === false,
  );
  addCheck(
    "bulk loading disabled",
    session.allToolSchemasAllowed === false &&
      session.allMcpSchemasAllowed === false &&
      packet.allToolSchemasAllowed === false &&
      packet.allMcpSchemasAllowed === false &&
      packet.rawToolSchemasIncluded === false &&
      packet.rawMcpSchemasIncluded === false,
  );
  addCheck(
    "checks recorded",
    REQUIRED_CHECKS.every((command) => phaseById.get("P64.8.5")?.checksRun?.includes(command)),
    REQUIRED_CHECKS.filter((command) => !phaseById.get("P64.8.5")?.checksRun?.includes(command)).join(", "),
  );
  addCheck("Command Center UX preserved", hasPassResult("reports/p648-command-center-code-mode-ux-report.md"));

  writeMarkdownReport(
    join(ROOT, REPORT_PATH),
    [
      {
        title: "Scope",
        body: [
          "- Aggregates P64.8 code-mode runtime and lazy-loading validation.",
          "- Closes P64.8 and hands off to P65.",
          "- Code mode remains preview-only; no execution or mutation is enabled.",
        ].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(checks) },
      {
        title: "Known Limitations",
        body: [
          "- P64.8 does not run code, providers, tools, workers, DB writes, deploys, network calls, or project mutations.",
          "- Lazy packets carry selected metadata summaries only.",
          "- Any future runtime execution requires a later explicit phase and new validation.",
        ].join("\n"),
      },
      { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
      { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
    ],
    { title: "P64.8 Final Validation Report", phase: "P64.8.5" },
  );

  return { checks, failures, result: failures.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP648Final();
printCheckReport("P64.8 Final Validation Check", result.checks, result.result);
if (result.failures.length > 0) process.exit(1);
