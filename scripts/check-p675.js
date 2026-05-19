import {
  P67_5_REQUIRED_FIELDS,
  P67_5_SAMPLE_READINESS_CARDS,
  buildControlledMutationReadinessEnvelope,
  createControlledMutationReadinessCard,
  validateControlledMutationReadinessCard,
} from "../controlled-mutation/p67-5-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p675-report.md";

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sampleCard = P67_5_SAMPLE_READINESS_CARDS[0];
const generatedCard = createControlledMutationReadinessCard();
const envelope = buildControlledMutationReadinessEnvelope();
const cards = [sampleCard, generatedCard];
const validations = cards.map((card) => validateControlledMutationReadinessCard(card));
const allErrors = validations.flatMap((validation) => validation.errors);

addCheck("required fields listed", P67_5_REQUIRED_FIELDS.length >= 19, `${P67_5_REQUIRED_FIELDS.length} fields`);
addCheck("sample readiness card exists", Boolean(sampleCard), sampleCard?.cardId || "missing");
addCheck("readiness cards validate", validations.every((validation) => validation.valid), allErrors.join("; "));
addCheck("projects forbidden", cards.every((card) => card.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", cards.every((card) => !card.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("blockers visible", cards.every((card) => card.blockers.length > 0));
addCheck("apply disabled", cards.every((card) => card.applyAllowed === false));
addCheck("mutation disabled", cards.every((card) => card.mutationAllowed === false && card.projectMutationAllowed === false));
addCheck("execution disabled", cards.every((card) => card.executionAllowed === false));
addCheck("provider/tool/worker disabled", cards.every((card) => card.providerDispatchAllowed === false && card.toolExecutionAllowed === false && card.workerExecutionAllowed === false));
addCheck("db/deploy/spend disabled", cards.every((card) => card.dbWritesAllowed === false && card.deployAllowed === false && card.providerSpendAllowed === false));
addCheck("no internal phase label in primary copy", cards.every((card) => !/P67\\./.test(`${card.title} ${card.intent} ${card.nextAction}`)));
addCheck("no fake runnable apply", cards.every((card) => !/apply now|run now|execute now/i.test(card.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P67.5" && envelope.data.card.applyAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body: [
        "- Validates P67.5 Command Center controlled mutation readiness data.",
        "- Does not add runnable apply actions, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget.",
        "- Reuses P67.4 scope gates plus shared result envelope, report writer, and checker formatter helpers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Readiness Shape", body: P67_5_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    {
      title: "Sample Cards",
      body: cards
        .map((card) => `- ${card.cardId}: state=${card.currentState}; apply=${card.applyAllowed}; next=${card.nextAction}`)
        .join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P67.5 Controlled Mutation Readiness UX Report", phase: "P67.5" },
);

printCheckReport("P67.5 Controlled Mutation Readiness UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
