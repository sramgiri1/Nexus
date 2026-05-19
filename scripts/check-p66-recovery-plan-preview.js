import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRecoveryPlanEnvelope,
  createRecoveryPlanPreview,
  validateRecoveryPlanPreview,
} from "../self-healing/recoveryPlanPreview.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "self-healing/fixtures/recovery-plan-preview-fixtures.json";
const REPORT_PATH = "reports/p66-recovery-plan-preview-report.md";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

const fixtures = readJson(FIXTURE_PATH);
const plans = fixtures.map((fixture) => createRecoveryPlanPreview(fixture));
const envelopes = fixtures.map((fixture) => buildRecoveryPlanEnvelope(fixture));

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

addCheck("fixtures present", fixtures.length >= 3, `${fixtures.length} fixtures`);
addCheck(
  "plans valid",
  plans.every((plan) => validateRecoveryPlanPreview(plan).valid),
  plans.flatMap((plan) => validateRecoveryPlanPreview(plan).errors).join("; "),
);
addCheck("proposed recovery exists", plans.every((plan) => plan.proposedRecovery.length >= 3));
addCheck("execution disabled", plans.every((plan) => plan.executionAllowed === false && plan.retryPreview.executionEnabled === false));
addCheck("mutation disabled", plans.every((plan) => plan.mutationAllowed === false));
addCheck("automatic retry disabled", plans.every((plan) => plan.automaticRetryAllowed === false));
addCheck("provider spend disabled", plans.every((plan) => plan.providerSpendAllowed === false));
addCheck("approval required", plans.every((plan) => plan.approvalRequired === true && plan.retryPreview.requiresApproval === true));
addCheck("blockers visible", plans.every((plan) => Array.isArray(plan.blockers) && plan.blockers.length > 0));
addCheck("evidence linked", plans.every((plan) => plan.evidenceRefs.length > 0 && plan.activityRefs.length > 0));
addCheck("next action routes to gate", plans.every((plan) => plan.nextAction.includes("P66.4")));
addCheck("envelopes pass", envelopes.every((envelope) => envelope.status === "PASS" && envelope.phase === "P66.3"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P66.3 preview-only recovery plans.",
        "- Does not execute recovery, automatic retry, provider calls, tools, workers, DB writes, deploy, network calls, or project mutation.",
        "- Uses P66.2 failure classification plus existing retry timeout preview helpers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Plans",
      body: plans
        .map((plan) => `- ${plan.planId}: ${plan.failureLabel}; execution=${plan.executionAllowed}; next=${plan.nextAction}`)
        .join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P66 Recovery Plan Preview Report", phase: "P66.3" },
);

printCheckReport("P66 Recovery Plan Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
