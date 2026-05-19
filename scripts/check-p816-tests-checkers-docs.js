import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildBusinessBuildPlan } from "../business-build/businessBuildPlan.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p816-tests-checkers-docs-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

export function checkP81ValidationAggregation() {
  const packageJson = readJson("package.json");
  const docs = readText("docs/architecture/P81_BUSINESS_BUILD_ORCHESTRATION_PLAN.md");
  const tests = readText("dashboard/tests/routes.spec.js");
  const status = readJson("os-roadmap/phase-status.json");
  const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
  const businessBuildView = JSON.stringify(buildBusinessBuildViewModel());
  const businessBuildPlan = JSON.stringify(buildBusinessBuildPlan().data);
  const requiredScripts = [
    "check:p81-execution-plan",
    "check:p812-prd-schema",
    "check:p813-agent-workstreams",
    "check:p814-business-build-plan",
    "check:p815-command-center-business-build-ux",
    "check:p816-tests-checkers-docs",
  ];
  const requiredReports = [
    "reports/p81-execution-plan-report.md",
    "reports/p812-prd-schema-report.md",
    "reports/p813-agent-workstreams-report.md",
    "reports/p814-business-build-plan-report.md",
    "reports/p815-command-center-business-build-ux-report.md",
  ];
  const completedSubphases = ["P81.1", "P81.2", "P81.3", "P81.4", "P81.5", "P81.6"];

  addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])), requiredScripts.join(", "));
  addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
  addCheck("completed subphase status present", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
  addCheck("prior commits present", ["P81.1", "P81.2", "P81.3", "P81.4", "P81.5"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
  addCheck(
    "P81.6 status advanced",
    statusById.get("P81.6")?.status === "complete" &&
      ["P81.6", "P81.7"].includes(status.currentPhase) &&
      status.nextPhase === "P81.7",
  );
  addCheck("docs list validation commands", ["check:p815-command-center-business-build-ux", "check:p814-business-build-plan", "check:p813-agent-workstreams", "check:p812-prd-schema"].every((script) => docs.includes(script)));
  addCheck("Playwright business build route coverage present", tests.includes("Business Build route renders dry-run plan without runnable actions"));
  addCheck("route-wide DemoApp coverage includes business build", tests.includes("/command-center/business-build"));
  addCheck("dashboard build command recorded", statusById.get("P81.6")?.checksRun?.includes("cd dashboard && npm run build"));
  addCheck("dashboard unit command recorded", statusById.get("P81.6")?.checksRun?.includes("cd dashboard && npm run test:unit"));
  addCheck("Playwright command recorded", statusById.get("P81.6")?.checksRun?.includes("cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build\""));
  addCheck("business build UX remains display-safe", !businessBuildView.includes("DemoApp") && !businessBuildView.includes("private-project") && !businessBuildView.includes("raw JSON"));
  addCheck("business build UX has no internal phase labels", !/P81\./.test(businessBuildView));
  addCheck("business build UX has no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i.test(businessBuildView));
  addCheck("business build plan runtime remains blocked", businessBuildPlan.includes('"providerCallsAllowed":false') && businessBuildPlan.includes('"projectMutationAllowed":false') && businessBuildPlan.includes('"providerSpendAllowed":false'));
  addCheck("report path is distinct", REPORT_PATH.endsWith("p816-tests-checkers-docs-report.md"));

  const failed = checks.filter((check) => check.status === "FAIL");
  writeMarkdownReport(
    join(ROOT, REPORT_PATH),
    [
      {
        title: "Scope",
        body: [
          "- Aggregates P81.1-P81.5 tests, checkers, docs, reports, roadmap, phase status, Playwright coverage, dashboard unit, and dashboard build evidence.",
          "- Does not enable providers, tools, workers, project mutation, DB writes, network calls, deploy, export, package creation, auth mutation, or provider spend.",
        ].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(checks) },
      {
        title: "Validation Commands",
        body: [
          "- npm run check:p816-tests-checkers-docs",
          "- npm run check:p815-command-center-business-build-ux",
          "- npm run check:p814-business-build-plan",
          "- npm run check:p813-agent-workstreams",
          "- npm run check:p812-prd-schema",
          "- npm run check:p81-execution-plan",
          "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build\"",
          "- cd dashboard && npm run test:unit",
          "- cd dashboard && npm run build",
          "- npm run check:phase-validation-coverage",
          "- npm run check:os-phase-status",
          "- npm run check:format-readability",
          "- git diff --check",
        ].join("\n"),
      },
      {
        title: "Known Limitations",
        body: "- P81.6 aggregates validation evidence only. Final closure starts in P81.7.",
      },
      { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
    ],
    { title: "P81.6 Tests Checkers Docs Report", phase: "P81.6" },
  );
  return { checks, failed, result: failed.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP81ValidationAggregation();
printCheckReport("P81.6 Tests Checkers Docs Check", result.checks, result.result);
if (result.failed.length > 0) process.exit(1);
