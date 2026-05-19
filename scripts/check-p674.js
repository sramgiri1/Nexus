import {
  P67_4_REQUIRED_FIELDS,
  P67_4_SAMPLE_SCOPE_GATES,
  buildMutationScopeGateEnvelope,
  createMutationScopeGate,
  validateMutationScopeGate,
} from "../controlled-mutation/p67-4-placeholder.js";
import { createPatchPlanPreview } from "../controlled-mutation/p67-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p674-report.md";

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sampleGate = P67_4_SAMPLE_SCOPE_GATES[0];
const generatedGate = createMutationScopeGate({
  plan: createPatchPlanPreview({
    allowedFiles: ["controlled-mutation/p67-4-placeholder.js"],
    evidenceRefs: ["reports/p674-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P67.4"],
  }),
});
const envelope = buildMutationScopeGateEnvelope({
  allowedFiles: ["controlled-mutation/p67-4-placeholder.js"],
  evidenceRefs: ["reports/p674-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P67.4"],
});

const gates = [sampleGate, generatedGate];
const validations = gates.map((gate) => validateMutationScopeGate(gate));
const allErrors = validations.flatMap((validation) => validation.errors);

addCheck("required fields listed", P67_4_REQUIRED_FIELDS.length >= 23, `${P67_4_REQUIRED_FIELDS.length} fields`);
addCheck("sample gate exists", Boolean(sampleGate), sampleGate?.gateId || "missing");
addCheck("scope gates validate", validations.every((validation) => validation.valid), allErrors.join("; "));
addCheck("projects forbidden", gates.every((gate) => gate.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", gates.every((gate) => !gate.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("approval required", gates.every((gate) => gate.approvalRequired === true && gate.approvalState === "not_requested"));
addCheck("scope review ready", gates.every((gate) => gate.scopeAllowed === true && gate.validationReady === true && gate.rollbackReady === true));
addCheck("safety still blocks apply", gates.every((gate) => gate.safetyAllowed === false && gate.applyAllowed === false));
addCheck("mutation disabled", gates.every((gate) => gate.mutationAllowed === false && gate.projectMutationAllowed === false));
addCheck("execution disabled", gates.every((gate) => gate.executionAllowed === false));
addCheck("provider/tool/worker disabled", gates.every((gate) => gate.providerDispatchAllowed === false && gate.toolExecutionAllowed === false && gate.workerExecutionAllowed === false));
addCheck("db/deploy/spend disabled", gates.every((gate) => gate.dbWritesAllowed === false && gate.deployAllowed === false && gate.providerSpendAllowed === false));
addCheck("required evidence visible", gates.every((gate) => gate.requiredEvidence.length >= 4));
addCheck("evidence and activity visible", gates.every((gate) => gate.evidenceRefs.length > 0 && gate.activityRefs.length > 0));
addCheck("no fake runnable apply", gates.every((gate) => !/apply now|run now|execute now/i.test(gate.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P67.4" && envelope.data.gate.applyAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body: [
        "- Validates P67.4 preview-only approval and scope gates.",
        "- Does not approve, generate, apply, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget.",
        "- Reuses the P67.3 patch plan preview plus shared result envelope, report writer, and checker formatter helpers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Gate Shape", body: P67_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    {
      title: "Sample Gates",
      body: gates
        .map((gate) => `- ${gate.gateId}: state=${gate.currentState}; apply=${gate.applyAllowed}; next=${gate.nextAction}`)
        .join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P67.4 Approval Scope Gate Report", phase: "P67.4" },
);

printCheckReport("P67.4 Approval Scope Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
