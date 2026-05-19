import {
  P68_4_REQUIRED_FIELDS,
  P68_4_SAMPLE_GATES,
  buildSelfUpdateGateEnvelope,
  createSelfUpdateGate,
  validateSelfUpdateGate,
} from "../self-update/p68-4-placeholder.js";
import { createSelfUpdateProposalPreview } from "../self-update/p68-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p684-report.md";
const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sampleGate = P68_4_SAMPLE_GATES[0];
const generatedGate = createSelfUpdateGate({
  proposal: createSelfUpdateProposalPreview({
    allowedFiles: ["self-update/p68-4-placeholder.js"],
    evidenceRefs: ["reports/p684-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P68.4"],
  }),
});
const gates = [sampleGate, generatedGate];
const validations = gates.map((gate) => validateSelfUpdateGate(gate));
const envelope = buildSelfUpdateGateEnvelope({
  allowedFiles: ["self-update/p68-4-placeholder.js"],
  evidenceRefs: ["reports/p684-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P68.4"],
});

addCheck("required fields listed", P68_4_REQUIRED_FIELDS.length >= 23, `${P68_4_REQUIRED_FIELDS.length} fields`);
addCheck("gates validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("projects forbidden", gates.every((gate) => gate.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", gates.every((gate) => !gate.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("approval required", gates.every((gate) => gate.approvalRequired === true && gate.approvalState === "not_requested"));
addCheck("scope review ready", gates.every((gate) => gate.scopeAllowed === true && gate.rollbackReady === true && gate.validationReady === true));
addCheck("safety still blocks apply", gates.every((gate) => gate.safetyAllowed === false && gate.applyAllowed === false));
addCheck("self-update apply disabled", gates.every((gate) => gate.selfUpdateAllowed === false));
addCheck("mutation disabled", gates.every((gate) => gate.projectMutationAllowed === false));
addCheck("execution disabled", gates.every((gate) => gate.executionAllowed === false));
addCheck("provider/tool/worker disabled", gates.every((gate) => gate.providerDispatchAllowed === false && gate.toolExecutionAllowed === false && gate.workerExecutionAllowed === false));
addCheck("db/deploy/spend disabled", gates.every((gate) => gate.dbWritesAllowed === false && gate.deployAllowed === false && gate.providerSpendAllowed === false));
addCheck("required evidence visible", gates.every((gate) => gate.requiredEvidence.length >= 4));
addCheck("evidence and activity visible", gates.every((gate) => gate.evidenceRefs.length > 0 && gate.activityRefs.length > 0));
addCheck("no fake runnable apply", gates.every((gate) => !/apply now|run now|execute now/i.test(gate.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P68.4" && envelope.data.gate.applyAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P68.4 preview-only approval and rollback gates.\n- Does not approve, generate, apply, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Gate Shape", body: P68_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P68.4 Approval Rollback Gate Report", phase: "P68.4" },
);

printCheckReport("P68.4 Approval Rollback Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
