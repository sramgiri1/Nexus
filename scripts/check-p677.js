import { existsSync, readFileSync } from "node:fs";
import {
  P67_7_FINAL_CHECKS,
  buildP677FinalValidationEnvelope,
  buildP677FinalValidationSummary,
  validateP677FinalValidationSummary,
} from "../controlled-mutation/p67-7-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p677-report.md";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const summary = buildP677FinalValidationSummary();
const validation = validateP677FinalValidationSummary(summary);
const envelope = buildP677FinalValidationEnvelope();
const phaseStatus = readJson("os-roadmap/phase-status.json");
const statusById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));

addCheck("final checks listed", P67_7_FINAL_CHECKS.length >= 14, `${P67_7_FINAL_CHECKS.length} checks`);
addCheck("summary validates", validation.valid, validation.errors.join("; "));
addCheck("reports exist", summary.reports.filter((report) => report !== REPORT_PATH).every((report) => existsSync(report)));
addCheck("P67 status closing", ["in_progress", "complete"].includes(statusById.get("P67")?.status));
addCheck("P67.1-P67.6 complete", ["P67.1", "P67.2", "P67.3", "P67.4", "P67.5", "P67.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P68 handoff known", statusById.has("P68"));
addCheck("apply disabled", summary.applyAllowed === false);
addCheck("mutation disabled", summary.mutationAllowed === false && summary.projectMutationAllowed === false);
addCheck("execution disabled", summary.executionAllowed === false);
addCheck("provider/tool/worker disabled", summary.providerDispatchAllowed === false && summary.toolExecutionAllowed === false && summary.workerExecutionAllowed === false);
addCheck("db/deploy/spend disabled", summary.dbWritesAllowed === false && summary.deployAllowed === false && summary.providerSpendAllowed === false);
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P67.7");

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body: [
        "- Validates and closes P67 with controlled source mutation still disabled.",
        "- Does not add runnable apply actions, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget.",
        "- Hands off to P68 for the next implementation-grade phase.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Final Commands", body: P67_7_FINAL_CHECKS.map((command) => `- ${command}`).join("\n") },
    { title: "Known Limitations", body: summary.knownLimitations.map((item) => `- ${item}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P67.7 Final Validation Report", phase: "P67.7" },
);

printCheckReport("P67.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
