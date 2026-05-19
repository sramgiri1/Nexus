import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SELF_HEALING_FAILURE_CLASSES,
  buildFailureClassificationEnvelope,
  classifySelfHealingFailure,
  validateSelfHealingFailureClassification,
} from "../self-healing/failureClassification.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "self-healing/fixtures/failure-classification-fixtures.json";
const REPORT_PATH = "reports/p66-failure-classification-report.md";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

const fixtures = readJson(FIXTURE_PATH);
const classifications = fixtures.map((fixture) => classifySelfHealingFailure(fixture));
const envelopes = fixtures.map((fixture) => buildFailureClassificationEnvelope(fixture));

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

addCheck("failure classes defined", Object.keys(SELF_HEALING_FAILURE_CLASSES).length >= 8, Object.keys(SELF_HEALING_FAILURE_CLASSES).join(", "));
addCheck("fixtures present", fixtures.length >= 3, `${fixtures.length} fixtures`);
addCheck(
  "classifications valid",
  classifications.every((record) => validateSelfHealingFailureClassification(record).valid),
  classifications
    .flatMap((record) => validateSelfHealingFailureClassification(record).errors)
    .join("; "),
);
addCheck(
  "execution disabled",
  classifications.every((record) => record.executionAllowed === false && record.mutationAllowed === false && record.automaticRetryAllowed === false),
);
addCheck("provider spend disabled", classifications.every((record) => record.providerSpendAllowed === false));
addCheck("approval required", classifications.every((record) => record.approvalRequired === true));
addCheck("display safe redaction", classifications.every((record) => record.redaction.displaySafe === true));
addCheck(
  "secret fixture redacted",
  classifications.some((record) => record.redaction.changed === true && record.redaction.redactionCount > 0),
);
addCheck("envelopes pass", envelopes.every((envelope) => envelope.status === "PASS" && envelope.phase === "P66.2"));
addCheck(
  "no raw repair action",
  classifications.every((record) => !/run|execute|apply|mutate|deploy/i.test(record.disabledReason) && record.disabledReason.includes("disabled")),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P66.2 display-safe failure classification.",
        "- Does not execute recovery, retry, provider calls, tools, workers, DB writes, deploy, network calls, or project mutation.",
        "- Uses shared redaction and result envelope helpers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Classifications",
      body: classifications
        .map((record) => `- ${record.failureId}: ${record.failureLabel}; execution=${record.executionAllowed}; next=${record.nextAction}`)
        .join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P66 Failure Classification Report", phase: "P66.2" },
);

printCheckReport("P66 Failure Classification Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
