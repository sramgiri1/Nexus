import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildHealingSafetyGateEnvelope,
  evaluateHealingSafetyGate,
  validateHealingSafetyGate,
} from "../self-healing/healingSafetyGate.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "self-healing/fixtures/healing-safety-gate-fixtures.json";
const REPORT_PATH = "reports/p66-healing-safety-gate-report.md";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

const fixtures = readJson(FIXTURE_PATH);
const gates = fixtures.map((fixture) => evaluateHealingSafetyGate(fixture));
const envelopes = fixtures.map((fixture) => buildHealingSafetyGateEnvelope(fixture));

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

addCheck("fixtures present", fixtures.length >= 3, `${fixtures.length} fixtures`);
addCheck(
  "gates valid",
  gates.every((gate) => validateHealingSafetyGate(gate).valid),
  gates.flatMap((gate) => validateHealingSafetyGate(gate).errors).join("; "),
);
addCheck("review allowed path exists", gates.some((gate) => gate.decision === "review_allowed" && gate.reviewAllowed === true));
addCheck("blocked path exists", gates.some((gate) => gate.decision === "blocked" && gate.reviewAllowed === false));
addCheck("loop guard blocks", gates.some((gate) => gate.loopGuard.blocked === true && gate.decision === "blocked"));
addCheck("approval required", gates.every((gate) => gate.approvalRequired === true));
addCheck("execution disabled", gates.every((gate) => gate.executionAllowed === false && gate.loopGuard.executionEnabled === false));
addCheck("mutation disabled", gates.every((gate) => gate.mutationAllowed === false));
addCheck("automatic retry disabled", gates.every((gate) => gate.automaticRetryAllowed === false));
addCheck("provider spend disabled", gates.every((gate) => gate.providerSpendAllowed === false));
addCheck("db deploy disabled", gates.every((gate) => gate.dbWriteAllowed === false && gate.deployAllowed === false));
addCheck("blockers visible", gates.every((gate) => gate.blockers.length > 0));
addCheck("envelopes pass", envelopes.every((envelope) => envelope.status === "PASS" && envelope.phase === "P66.4"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P66.4 healing safety gates and loop guards.",
        "- Does not execute recovery, automatic retry, provider calls, tools, workers, DB writes, deploy, network calls, or project mutation.",
        "- Gate decisions are preview-only; review_allowed is not runnable execution.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Gates",
      body: gates
        .map((gate) => `- ${gate.gateId}: ${gate.decision}; execution=${gate.executionAllowed}; next=${gate.nextAction}`)
        .join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P66 Healing Safety Gate Report", phase: "P66.4" },
);

printCheckReport("P66 Healing Safety Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
