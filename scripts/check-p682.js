import {
  P68_2_REQUIRED_FIELDS,
  P68_2_SAMPLE_INTENTS,
  buildSelfUpdateIntentEnvelope,
  createSelfUpdateIntentContract,
  validateSelfUpdateIntentContract,
} from "../self-update/p68-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p682-report.md";
const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sampleIntent = P68_2_SAMPLE_INTENTS[0];
const redactedIntent = createSelfUpdateIntentContract({
  privateProjectId: "private-project-raw-id",
  allowedFiles: ["self-update/p68-2-placeholder.js"],
  evidenceRefs: ["reports/p682-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P68.2"],
});
const intents = [sampleIntent, redactedIntent];
const validations = intents.map((intent) => validateSelfUpdateIntentContract(intent));
const envelope = buildSelfUpdateIntentEnvelope({
  allowedFiles: ["self-update/p68-2-placeholder.js"],
  evidenceRefs: ["reports/p682-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P68.2"],
});

addCheck("required fields listed", P68_2_REQUIRED_FIELDS.length >= 20, `${P68_2_REQUIRED_FIELDS.length} fields`);
addCheck("intents validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("target stays NEXUS OS", intents.every((intent) => intent.targetKind === "nexus_os"));
addCheck("projects forbidden", intents.every((intent) => intent.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", intents.every((intent) => !intent.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("self-update apply disabled", intents.every((intent) => intent.selfUpdateAllowed === false));
addCheck("mutation disabled", intents.every((intent) => intent.projectMutationAllowed === false));
addCheck("execution disabled", intents.every((intent) => intent.executionAllowed === false));
addCheck("provider/tool/worker disabled", intents.every((intent) => intent.providerDispatchAllowed === false && intent.toolExecutionAllowed === false && intent.workerExecutionAllowed === false));
addCheck("db/deploy/spend disabled", intents.every((intent) => intent.dbWritesAllowed === false && intent.deployAllowed === false && intent.providerSpendAllowed === false));
addCheck("private IDs redacted", redactedIntent.scope.displaySafe === true && redactedIntent.scope.redacted === true);
addCheck("no fake runnable apply", intents.every((intent) => !/apply now|run now|execute now/i.test(intent.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P68.2" && envelope.data.intent.selfUpdateAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P68.2 display-safe self-update intent records.\n- Does not enable self-update apply, project mutation, provider/tool execution, worker execution, DB writes, deploy, release, network calls, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Intent Shape", body: P68_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P68.2 Self-Update Intent Contract Report", phase: "P68.2" },
);

printCheckReport("P68.2 Self-Update Intent Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
