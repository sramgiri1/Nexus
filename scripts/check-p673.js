import {
  P67_3_REQUIRED_FIELDS,
  P67_3_SAMPLE_PATCH_PLANS,
  buildPatchPlanEnvelope,
  createPatchPlanPreview,
  validatePatchPlanPreview,
} from "../controlled-mutation/p67-3-placeholder.js";
import { createMutationIntentContract } from "../controlled-mutation/p67-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p673-report.md";

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const samplePlan = P67_3_SAMPLE_PATCH_PLANS[0];
const generatedPlan = createPatchPlanPreview({
  intent: createMutationIntentContract({
    intentId: "p67-3-generated-intent",
    allowedFiles: ["controlled-mutation/p67-3-placeholder.js"],
    evidenceRefs: ["reports/p673-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P67.3"],
  }),
});
const envelope = buildPatchPlanEnvelope({
  allowedFiles: ["controlled-mutation/p67-3-placeholder.js"],
  evidenceRefs: ["reports/p673-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P67.3"],
});

const plans = [samplePlan, generatedPlan];
const validations = plans.map((plan) => validatePatchPlanPreview(plan));
const allErrors = validations.flatMap((validation) => validation.errors);

addCheck("required fields listed", P67_3_REQUIRED_FIELDS.length >= 23, `${P67_3_REQUIRED_FIELDS.length} fields`);
addCheck("sample patch plan exists", Boolean(samplePlan), samplePlan?.planId || "missing");
addCheck("patch plans validate", validations.every((validation) => validation.valid), allErrors.join("; "));
addCheck("target stays NEXUS OS", plans.every((plan) => plan.targetKind === "nexus_os"));
addCheck("projects forbidden", plans.every((plan) => plan.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", plans.every((plan) => !plan.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("proposed changes stay out of projects", plans.every((plan) => !plan.proposedChanges.some((change) => change.filePath.startsWith("projects/"))));
addCheck("validation commands visible", plans.every((plan) => plan.validationCommands.includes("npm run check:p673") && plan.validationCommands.includes("git diff --check")));
addCheck("rollback documented", plans.every((plan) => plan.rollbackPlan.state === "documented" && plan.rollbackPlan.command.includes("git revert")));
addCheck("mutation and apply disabled", plans.every((plan) => plan.mutationAllowed === false && plan.projectMutationAllowed === false && plan.applyAllowed === false));
addCheck("execution disabled", plans.every((plan) => plan.executionAllowed === false));
addCheck("provider/tool/worker disabled", plans.every((plan) => plan.providerDispatchAllowed === false && plan.toolExecutionAllowed === false && plan.workerExecutionAllowed === false));
addCheck("db/deploy/spend disabled", plans.every((plan) => plan.dbWritesAllowed === false && plan.deployAllowed === false && plan.providerSpendAllowed === false));
addCheck("approval required", plans.every((plan) => plan.approvalRequired === true));
addCheck("evidence and activity visible", plans.every((plan) => plan.evidenceRefs.length > 0 && plan.activityRefs.length > 0));
addCheck("display safe scope", plans.every((plan) => plan.scope.displaySafe === true));
addCheck("no fake runnable apply", plans.every((plan) => !/apply now|run now|execute now/i.test(plan.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P67.3" && envelope.data.plan.applyAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body: [
        "- Validates P67.3 preview-only patch plan records.",
        "- Does not generate patches, apply patches, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget.",
        "- Reuses the P67.2 mutation intent contract plus shared result envelope, report writer, and checker formatter helpers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Patch Plan Shape", body: P67_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    {
      title: "Sample Plans",
      body: plans
        .map((plan) => `- ${plan.planId}: state=${plan.currentState}; apply=${plan.applyAllowed}; next=${plan.nextAction}`)
        .join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P67.3 Patch Plan Preview Report", phase: "P67.3" },
);

printCheckReport("P67.3 Patch Plan Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
