import { existsSync } from "node:fs";
import {
  P67_6_REQUIRED_CHECKS,
  P67_6_REQUIRED_REPORTS,
  buildP676ValidationEnvelope,
  buildP676ValidationMatrix,
  validateP676ValidationMatrix,
} from "../controlled-mutation/p67-6-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p676-report.md";

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const matrix = buildP676ValidationMatrix();
const validation = validateP676ValidationMatrix(matrix);
const envelope = buildP676ValidationEnvelope();

addCheck("required checks listed", P67_6_REQUIRED_CHECKS.length >= 10, `${P67_6_REQUIRED_CHECKS.length} checks`);
addCheck("required reports listed", P67_6_REQUIRED_REPORTS.length >= 8, `${P67_6_REQUIRED_REPORTS.length} reports`);
addCheck("matrix validates", validation.valid, validation.errors.join("; "));
addCheck("reports exist", P67_6_REQUIRED_REPORTS.every((report) => existsSync(report)));
addCheck("command center coverage included", matrix.commandCenterCoverage === true);
addCheck("docs and status coverage included", matrix.docsCoverage === true && matrix.statusCoverage === true);
addCheck("apply disabled", matrix.applyAllowed === false);
addCheck("mutation disabled", matrix.mutationAllowed === false && matrix.projectMutationAllowed === false);
addCheck("execution disabled", matrix.executionAllowed === false);
addCheck("provider/tool/worker disabled", matrix.providerDispatchAllowed === false && matrix.toolExecutionAllowed === false && matrix.workerExecutionAllowed === false);
addCheck("db/deploy/spend disabled", matrix.dbWritesAllowed === false && matrix.deployAllowed === false && matrix.providerSpendAllowed === false);
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P67.6");

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P67 validation coverage before final validation.",
        "- Does not add runnable apply actions, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget.",
        "- Keeps P67.7 as the final closeout subphase.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Required Commands", body: P67_6_REQUIRED_CHECKS.map((command) => `- ${command}`).join("\n") },
    { title: "Required Reports", body: P67_6_REQUIRED_REPORTS.map((report) => `- ${report}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P67.6 Tests Checkers Docs Report", phase: "P67.6" },
);

printCheckReport("P67.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
