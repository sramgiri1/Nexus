import {
  P67_2_REQUIRED_FIELDS,
  P67_2_SAMPLE_INTENTS,
  buildMutationIntentEnvelope,
  createMutationIntentContract,
  validateMutationIntentContract,
} from "../controlled-mutation/p67-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p672-report.md";

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sampleIntent = P67_2_SAMPLE_INTENTS[0];
const privateInputIntent = createMutationIntentContract({
  intentId: "p67-2-redaction-intent",
  privateProjectId: "private-project-raw-id-123",
  rawProjectId: "project_raw_internal_456",
  allowedFiles: ["controlled-mutation/p67-2-placeholder.js"],
  evidenceRefs: ["reports/p672-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P67.2"],
});
const envelope = buildMutationIntentEnvelope({
  allowedFiles: ["controlled-mutation/p67-2-placeholder.js"],
  evidenceRefs: ["reports/p672-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P67.2"],
});

const validations = [sampleIntent, privateInputIntent].map((intent) => validateMutationIntentContract(intent));
const allErrors = validations.flatMap((validation) => validation.errors);

addCheck("required fields listed", P67_2_REQUIRED_FIELDS.length >= 20, `${P67_2_REQUIRED_FIELDS.length} fields`);
addCheck("sample intent exists", Boolean(sampleIntent), sampleIntent?.intentId || "missing");
addCheck("intents validate", validations.every((validation) => validation.valid), allErrors.join("; "));
addCheck("target stays NEXUS OS", [sampleIntent, privateInputIntent].every((intent) => intent.targetKind === "nexus_os"));
addCheck("projects forbidden", [sampleIntent, privateInputIntent].every((intent) => intent.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", [sampleIntent, privateInputIntent].every((intent) => !intent.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("mutation disabled", [sampleIntent, privateInputIntent].every((intent) => intent.mutationAllowed === false && intent.projectMutationAllowed === false));
addCheck("execution disabled", [sampleIntent, privateInputIntent].every((intent) => intent.executionAllowed === false));
addCheck("provider/tool/worker disabled", [sampleIntent, privateInputIntent].every((intent) => intent.providerDispatchAllowed === false && intent.toolExecutionAllowed === false && intent.workerExecutionAllowed === false));
addCheck("db/deploy/spend disabled", [sampleIntent, privateInputIntent].every((intent) => intent.dbWritesAllowed === false && intent.deployAllowed === false && intent.providerSpendAllowed === false));
addCheck("approval required", [sampleIntent, privateInputIntent].every((intent) => intent.approvalRequired === true));
addCheck("diff preview not built", [sampleIntent, privateInputIntent].every((intent) => intent.diffPreview.state === "not_built"));
addCheck("evidence and activity visible", [sampleIntent, privateInputIntent].every((intent) => intent.evidenceRefs.length > 0 && intent.activityRefs.length > 0));
addCheck("private raw IDs redacted", privateInputIntent.scope.displaySafe === true && privateInputIntent.scope.redacted === true);
addCheck("no fake runnable apply", [sampleIntent, privateInputIntent].every((intent) => !/apply now|run now|execute now/i.test(intent.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P67.2" && envelope.data.intent.mutationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body: [
        "- Validates P67.2 display-safe mutation intent records.",
        "- Does not enable project mutation, provider dispatch, tool execution, worker execution, automatic source apply, DB writes, deploy, release, network calls, or provider spend.",
        "- Uses shared result envelope, redaction, report writer, and checker formatter helpers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Intent Shape",
      body: P67_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n"),
    },
    {
      title: "Sample Intents",
      body: [sampleIntent, privateInputIntent]
        .map((intent) => `- ${intent.intentId}: state=${intent.currentState}; mutation=${intent.mutationAllowed}; next=${intent.nextAction}`)
        .join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P67.2 Mutation Intent Contract Report", phase: "P67.2" },
);

printCheckReport("P67.2 Mutation Intent Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
