import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  RECOVERY_POINT_STATES,
  buildRecoveryChain,
  validateRecoveryPoint,
} from "../ai-recovery/recoveryPointModel.js";
import {
  classifyRecoveryPoint,
  classifyRecoveryPoints,
} from "../ai-recovery/recoveryClassifier.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "ai-recovery/fixtures/recovery-point-fixtures.json";
const REPORT_PATH = "reports/ai-recovery-point-model-report.md";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const fixtures = readJson(FIXTURE_PATH);
const points = fixtures.points || [];
const classified = classifyRecoveryPoints(points);

for (const state of RECOVERY_POINT_STATES) {
  addCheck(`state covered ${state}`, points.some((point) => point.expectedState === state));
}

for (let index = 0; index < points.length; index += 1) {
  const fixture = points[index];
  const point = classified[index];
  const validation = validateRecoveryPoint(point);
  addCheck(`fixture state ${fixture.expectedState}`, point.state === fixture.expectedState, `actual ${point.state}`);
  addCheck(`fixture validates ${fixture.expectedState}`, validation.valid, validation.errors.join(", "));
  addCheck(`fixture execution disabled ${fixture.expectedState}`, point.executionEnabled === false && point.restoreEnabled === false && point.replayEnabled === false && point.resumeEnabled === false);
}

const chain = buildRecoveryChain(classified.slice(0, 3));
addCheck("recovery chain links children", chain[1].parentRecoveryPointId === chain[0].recoveryPointId && chain[2].parentRecoveryPointId === chain[1].recoveryPointId);

const blocked = classifyRecoveryPoint({
  snapshot: {
    snapshotId: "snapshot_policy_blocked",
    displayTitle: "Policy blocked snapshot",
    recoveryEligibility: "resume_plan_available",
  },
  blockedReasons: ["Tool dispatch is disabled."],
});
addCheck("blocked overrides resume eligibility", blocked.state === "blocked" && blocked.resumeEnabled === false);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Phase: P63.3",
        "- Recovery point model and deterministic classification only.",
        "- No restore, replay, resume, provider dispatch, tool dispatch, project mutation, DB write, deploy, or queue mutation is enabled.",
      ].join("\n"),
    },
    {
      title: "States",
      body: RECOVERY_POINT_STATES.map((state) => `- ${state}`).join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Failures",
      body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n"),
    },
    {
      title: "Reuse",
      body: [
        "- Reused P63 snapshot eligibility vocabulary.",
        "- Matched state-machine style by keeping transitions/classification pure and side-effect free.",
        "- No queue, activity, evidence, or phase-status helper was duplicated.",
      ].join("\n"),
    },
    {
      title: "Result",
      body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)`,
    },
  ],
  {
    title: "AI Recovery Point Model Report",
    phase: "P63.3",
  },
);

printCheckReport("AI Recovery Point Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) process.exit(1);
