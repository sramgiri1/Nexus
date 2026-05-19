import {
  P72_4_REQUIRED_FIELDS,
  P72_4_SAMPLE_GATES,
  buildDbReadinessGateEnvelope,
  createDbReadinessGate,
  validateDbReadinessGate,
} from "../db-runtime/p72-4-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p724-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedGate = createDbReadinessGate({
  evidenceRefs: ["reports/p724-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P72.4"],
});
const gates = [...P72_4_SAMPLE_GATES, generatedGate];
const validations = gates.map((gate) => validateDbReadinessGate(gate));
const envelope = buildDbReadinessGateEnvelope({
  evidenceRefs: ["reports/p724-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P72.4"],
});
const serialized = JSON.stringify(gates);

addCheck("required fields listed", P72_4_REQUIRED_FIELDS.length >= 31, `${P72_4_REQUIRED_FIELDS.length} fields`);
addCheck("gates validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("readiness remains blocked", gates.every((gate) => gate.readinessDecision === "not_ready_for_execution" && gate.gateState.includes("blocked")));
addCheck("DB writes migrations schema disabled", gates.every((gate) => gate.dbWritesAllowed === false && gate.migrationsAllowed === false && gate.schemaMutationAllowed === false));
addCheck("project mutation disabled", gates.every((gate) => gate.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", gates.every((gate) => gate.providerDispatchAllowed === false && gate.toolExecutionAllowed === false && gate.workerExecutionAllowed === false));
addCheck("network/spend disabled", gates.every((gate) => gate.networkCallsAllowed === false && gate.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", gates.every((gate) => gate.deployExecutionAllowed === false && gate.releaseExecutionAllowed === false && gate.exportExecutionAllowed === false && gate.packageCreationAllowed === false));
addCheck("preconditions visible", gates.every((gate) => gate.preconditions.length >= 4));
addCheck("blocked operations visible", gates.every((gate) => gate.blockedOperations.length >= 5));
addCheck("blockers visible", gates.every((gate) => gate.blockers.length >= 5));
addCheck("safety posture visible", gates.every((gate) => gate.safetyPosture === "preview_only_blocked_gate"));
addCheck("private IDs and DB URLs hidden", !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/postgres(?:ql)?:\/\//i.test(serialized));
addCheck("evidence and activity visible", gates.every((gate) => gate.evidenceRefs.length > 0 && gate.activityRefs.length > 0));
addCheck("cost impact visible", gates.every((gate) => gate.costImpact.includes("No DB service calls")));
addCheck("command center visibility prepared", gates.every((gate) => gate.commandCenterVisible === true && gate.nextAction.includes("P72.5")));
addCheck("no fake runnable DB action", gates.every((gate) => !/enable now|migrate now|write now|schema now|run db|execute now/i.test(gate.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P72.4" && envelope.data.gate.dbWritesAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P72.4 preview-only DB readiness gate records.\n- Does not write DB state, create migrations, mutate schema, mutate projects, dispatch providers/tools/workers, call network services, deploy, release, export, package, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Gate Shape", body: P72_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P72.4 DB Readiness Gate Report", phase: "P72.4" },
);

printCheckReport("P72.4 DB Readiness Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
