import {
  P69_4_REQUIRED_FIELDS,
  P69_4_SAMPLE_GATES,
  buildDeployReadinessGateEnvelope,
  createDeployReadinessGate,
  validateDeployReadinessGate,
} from "../release-governance/p69-4-placeholder.js";
import { createReleaseCandidatePreview } from "../release-governance/p69-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p694-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedGate = createDeployReadinessGate({
  candidate: createReleaseCandidatePreview({
    allowedFiles: ["release-governance/p69-4-placeholder.js"],
    evidenceRefs: ["reports/p694-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P69.4"],
  }),
});
const gates = [...P69_4_SAMPLE_GATES, generatedGate];
const validations = gates.map((gate) => validateDeployReadinessGate(gate));
const envelope = buildDeployReadinessGateEnvelope({
  allowedFiles: ["release-governance/p69-4-placeholder.js"],
  evidenceRefs: ["reports/p694-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P69.4"],
});

addCheck("required fields listed", P69_4_REQUIRED_FIELDS.length >= 29, `${P69_4_REQUIRED_FIELDS.length} fields`);
addCheck("deploy readiness gates validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("approval required", gates.every((gate) => gate.approvalRequired === true && gate.approvalState === "not_requested"));
addCheck("validation ready", gates.every((gate) => gate.validationReady === true));
addCheck("rollback ready", gates.every((gate) => gate.rollbackReady === true));
addCheck("evidence ready", gates.every((gate) => gate.evidenceReady === true));
addCheck("cost reviewed", gates.every((gate) => gate.costReviewed === true));
addCheck("safety disabled", gates.every((gate) => gate.safetyAllowed === false));
addCheck("package creation disabled", gates.every((gate) => gate.packageCreated === false));
addCheck("release execution disabled", gates.every((gate) => gate.releaseExecutionAllowed === false));
addCheck("deploy execution disabled", gates.every((gate) => gate.deployExecutionAllowed === false));
addCheck("project mutation disabled", gates.every((gate) => gate.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", gates.every((gate) => gate.providerDispatchAllowed === false && gate.toolExecutionAllowed === false && gate.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", gates.every((gate) => gate.dbWritesAllowed === false && gate.networkCallsAllowed === false && gate.providerSpendAllowed === false));
addCheck("blockers visible", gates.every((gate) => gate.blockers.length >= 3));
addCheck("required evidence visible", gates.every((gate) => gate.requiredEvidence.length >= 5));
addCheck("evidence and activity visible", gates.every((gate) => gate.evidenceRefs.length > 0 && gate.activityRefs.length > 0));
addCheck("cost impact visible", gates.every((gate) => gate.costImpact.includes("No provider calls")));
addCheck("no fake runnable deploy action", gates.every((gate) => !/deploy now|release now|execute now/i.test(gate.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P69.4" && envelope.data.gate.deployExecutionAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P69.4 deploy readiness gates.\n- Does not create packages, release, deploy, mutate project source, dispatch providers/tools/workers, write DB state, call network services, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Gate Shape", body: P69_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P69.4 Deploy Readiness Gate Report", phase: "P69.4" },
);

printCheckReport("P69.4 Deploy Readiness Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
