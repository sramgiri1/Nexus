import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFounderIntakeViewModel } from "../dashboard/src/data/founderIntake.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p805-tests-checkers-docs-report.md";

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

export function checkP80ValidationAggregation() {
  const packageJson = readJson("package.json");
  const status = readJson("os-roadmap/phase-status.json");
  const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
  const docs = readText("docs/architecture/P80_FOUNDER_INTAKE_RUNTIME_PLAN.md");
  const tests = readText("dashboard/tests/routes.spec.js");
  const vm = buildFounderIntakeViewModel();
  const vmText = JSON.stringify(vm);
  const requiredScripts = [
    "check:p80-execution-plan",
    "check:p801-founder-intake-schema",
    "check:p802-founder-intake-session",
    "check:p803-founder-intake-qna",
    "check:p804-command-center-founder-intake-ux",
    "check:p805-tests-checkers-docs",
  ];
  const requiredReports = [
    "reports/p80-execution-plan-report.md",
    "reports/p801-founder-intake-schema-report.md",
    "reports/p802-founder-intake-session-report.md",
    "reports/p803-founder-intake-qna-report.md",
    "reports/p804-command-center-founder-intake-ux-report.md",
  ];

  addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])), requiredScripts.join(", "));
  addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
  addCheck("completed subphase status present", ["P80.1", "P80.2", "P80.3", "P80.4", "P80.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete"));
  addCheck("prior commits present", ["P80.1", "P80.2", "P80.3", "P80.4"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
  addCheck("P80.5 status advanced", statusById.get("P80.5")?.status === "complete" && status.currentPhase === "P80.5" && status.nextPhase === "P80.6");
  addCheck("docs list validation commands", ["check:p804-command-center-founder-intake-ux", "check:p803-founder-intake-qna", "check:p802-founder-intake-session", "check:p801-founder-intake-schema"].every((script) => docs.includes(script)));
  addCheck("Playwright founder route coverage present", tests.includes("Founder Intake route renders local intake posture without runnable actions"));
  addCheck("route-wide DemoApp coverage includes founder intake", tests.includes("/command-center/founder-intake"));
  addCheck("dashboard build command recorded", statusById.get("P80.5")?.checksRun?.includes("cd dashboard && npm run build"));
  addCheck("dashboard unit command recorded", statusById.get("P80.5")?.checksRun?.includes("cd dashboard && npm run test:unit"));
  addCheck("founder intake UX remains display-only", vm.safety.executionEnabled === false && vm.safety.projectMutationAllowed === false && vm.safety.providerSpendAllowed === false);
  addCheck("no DemoApp/private IDs in founder intake UX", !vmText.includes("DemoApp") && !vmText.includes("private-project-01") && !vmText.includes("private-project-governed-build-mission"));
  addCheck("no fake runnable founder actions", !/run now|execute now|deploy now|apply now|call provider now|create project now/i.test(vmText));
  addCheck("report path is distinct", REPORT_PATH.endsWith("p805-tests-checkers-docs-report.md"));

  const failed = checks.filter((check) => check.status === "FAIL");
  writeMarkdownReport(
    join(ROOT, REPORT_PATH),
    [
      {
        title: "Scope",
        body: [
          "- Aggregates P80.1-P80.4 tests, checkers, docs, reports, roadmap, phase status, Playwright coverage, dashboard unit, and dashboard build evidence.",
          "- Does not enable providers, tools, workers, project mutation, DB writes, network calls, deploy, export, package creation, auth mutation, or provider spend.",
        ].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(checks) },
      {
        title: "Validation Commands",
        body: [
          "- npm run check:p805-tests-checkers-docs",
          "- npm run check:p804-command-center-founder-intake-ux",
          "- npm run check:p803-founder-intake-qna",
          "- npm run check:p802-founder-intake-session",
          "- npm run check:p801-founder-intake-schema",
          "- npm run check:p80-execution-plan",
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
        body: "- P80.5 aggregates validation only. Docs/roadmap closure starts in P80.6.",
      },
      { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
    ],
    { title: "P80.5 Tests Checkers Docs Report", phase: "P80.5" },
  );
  return { checks, failed, result: failed.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP80ValidationAggregation();
printCheckReport("P80.5 Tests Checkers Docs Check", result.checks, result.result);
if (result.failed.length > 0) process.exit(1);
