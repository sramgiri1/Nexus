import {
  P69_2_REQUIRED_FIELDS,
  P69_2_SAMPLE_INTENTS,
  buildReleaseIntentEnvelope,
  createReleaseIntentContract,
  validateReleaseIntentContract,
} from "../release-governance/p69-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p692-report.md";
const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedIntent = createReleaseIntentContract({
  allowedFiles: ["release-governance/p69-2-placeholder.js"],
  evidenceRefs: ["reports/p692-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P69.2"],
});
const intents = [...P69_2_SAMPLE_INTENTS, generatedIntent];
const validations = intents.map((intent) => validateReleaseIntentContract(intent));
const envelope = buildReleaseIntentEnvelope({
  allowedFiles: ["release-governance/p69-2-placeholder.js"],
  evidenceRefs: ["reports/p692-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P69.2"],
});

addCheck("required fields listed", P69_2_REQUIRED_FIELDS.length >= 24, `${P69_2_REQUIRED_FIELDS.length} fields`);
addCheck("intents validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("projects forbidden", intents.every((intent) => intent.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", intents.every((intent) => !intent.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("release execution disabled", intents.every((intent) => intent.releaseExecutionAllowed === false));
addCheck("deploy execution disabled", intents.every((intent) => intent.deployExecutionAllowed === false));
addCheck("project mutation disabled", intents.every((intent) => intent.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", intents.every((intent) => intent.providerDispatchAllowed === false && intent.toolExecutionAllowed === false && intent.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", intents.every((intent) => intent.dbWritesAllowed === false && intent.networkCallsAllowed === false && intent.providerSpendAllowed === false));
addCheck("approval required", intents.every((intent) => intent.approvalRequired === true && intent.approvalState === "not_requested"));
addCheck("rollback required", intents.every((intent) => intent.rollbackPlan?.state === "required_before_execution"));
addCheck("blockers visible", intents.every((intent) => intent.blockers.length >= 3));
addCheck("evidence and activity visible", intents.every((intent) => intent.evidenceRefs.length > 0 && intent.activityRefs.length > 0));
addCheck("cost impact visible", intents.every((intent) => intent.costImpact.includes("No provider calls")));
addCheck("no fake runnable action", intents.every((intent) => !/release now|deploy now|execute now/i.test(intent.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P69.2" && envelope.data.intent.deployExecutionAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P69.2 display-safe release intent records.\n- Does not release, deploy, mutate project source, dispatch providers/tools/workers, write DB state, call network services, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Intent Shape", body: P69_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P69.2 Release Intent Report", phase: "P69.2" },
);

printCheckReport("P69.2 Release Intent Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
