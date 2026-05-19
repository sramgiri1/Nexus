import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFounderIntakeViewModel } from "../dashboard/src/data/founderIntake.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p807-final-validation-report.md";
const P80_PHASES = ["P80", "P80.1", "P80.2", "P80.3", "P80.4", "P80.5", "P80.6", "P80.7"];

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

export function checkP80FinalValidation() {
  const packageJson = readJson("package.json");
  const phases = readJson("os-roadmap/nexus-phases.json").phases || [];
  const status = readJson("os-roadmap/phase-status.json");
  const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
  const phaseById = new Map(phases.map((entry) => [entry.phaseId, entry]));
  const plan = readText("docs/architecture/P80_FOUNDER_INTAKE_RUNTIME_PLAN.md");
  const routes = readText("dashboard/src/data/commandCenterRoutes.js");
  const tabs = readText("dashboard/src/data/commandCenterTabs.js");
  const page = readText("dashboard/src/pages/CommandCenterV2.jsx");
  const tests = readText("dashboard/tests/routes.spec.js");
  const statusChecker = readText("scripts/check-os-phase-status.js");
  const runtimeSources = [
    "founder-intake/founderIntakeSchema.js",
    "founder-intake/founderIntakeSession.js",
    "founder-intake/founderIntakeQuestions.js",
    "founder-intake/founderIntakeComprehension.js",
    "dashboard/src/data/founderIntake.js",
  ].map(readText).join("\n");
  const vm = buildFounderIntakeViewModel();
  const vmText = JSON.stringify(vm);

  const requiredScripts = [
    "check:p80-execution-plan",
    "check:p801-founder-intake-schema",
    "check:p802-founder-intake-session",
    "check:p803-founder-intake-qna",
    "check:p804-command-center-founder-intake-ux",
    "check:p805-tests-checkers-docs",
    "check:p806-docs-roadmap",
    "check:p807-final-validation",
  ];
  const requiredReports = [
    "reports/p801-founder-intake-schema-report.md",
    "reports/p802-founder-intake-session-report.md",
    "reports/p803-founder-intake-qna-report.md",
    "reports/p804-command-center-founder-intake-ux-report.md",
    "reports/p805-tests-checkers-docs-report.md",
    "reports/p806-docs-roadmap-report.md",
    "reports/p80-execution-plan-report.md",
  ];
  const dangerousTrueFlags = [
    "providerCallsAllowed: true",
    "toolExecutionAllowed: true",
    "workerExecutionAllowed: true",
    "projectMutationAllowed: true",
    "dbWritesAllowed: true",
    "networkCallsAllowed: true",
    "deployExecutionAllowed: true",
    "providerSpendAllowed: true",
    "autonomousQnaAllowed: true",
    "agentDispatchAllowed: true",
  ];

  addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])), requiredScripts.join(", "));
  addCheck("prior reports exist", requiredReports.every(fileExists), `${requiredReports.length} reports`);
  addCheck("P80 phases complete in roadmap", P80_PHASES.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
  addCheck("P80 phases complete in phase status", P80_PHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
  addCheck("prior P80 commits stamped", ["P80.1", "P80.2", "P80.3", "P80.4", "P80.5", "P80.6"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
  addCheck("final P80 entries are stampable", ["P80", "P80.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
  addCheck("P80 handoff to P81", phaseById.get("P80")?.nextPhase === "P81" && statusById.get("P80")?.nextPhase === "P81");
  addCheck("root status handoff to P81", status.currentPhase === "P81" && status.previousPhase === "P80" && status.nextPhase === "P81", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
  addCheck("P81 placeholder exists", phaseById.get("P81")?.status === "planned" && statusById.get("P81")?.status === "planned");
  addCheck("status checker accepts P81", statusChecker.includes('"P81"'));
  addCheck("docs close P80", plan.includes("P80 is complete") && plan.includes("hands off to P81"));
  addCheck("Command Center route preserved", routes.includes("key: \"founderIntake\"") && routes.includes("/command-center/founder-intake"));
  addCheck("Command Center tabs preserved", tabs.includes("FOUNDER_INTAKE_TABS") && tabs.includes("Disabled Actions"));
  addCheck("Command Center renderer preserved", page.includes("FounderIntakePage") && page.includes("buildFounderIntakeViewModel"));
  addCheck("Founder Intake Playwright route test preserved", tests.includes("Founder Intake route renders local intake posture without runnable actions"));
  addCheck("Founder Intake route-wide safety preserved", tests.includes("/command-center/founder-intake") && tests.includes("DemoApp"));
  addCheck("founder intake has next question", vm.questionState?.prompt?.length > 0 && vm.questionState?.nextAction?.length > 0);
  addCheck("founder intake readiness is local", vm.readiness?.missingCount > 0 && vm.costImpact.includes("No provider calls"));
  addCheck("founder intake UX remains display-only", vm.safety.executionEnabled === false && vm.safety.projectMutationAllowed === false && vm.safety.providerSpendAllowed === false);
  addCheck("founder intake UX hides DemoApp/private ids", !vmText.includes("DemoApp") && !vmText.includes("private-project-01") && !vmText.includes("private-project-governed-build-mission"));
  addCheck("founder intake UX hides phase labels", !vmText.includes("P80"));
  addCheck("no fake runnable founder actions", !/run now|execute now|deploy now|apply now|call provider now|create project now/i.test(vmText));
  addCheck("runtime sources do not enable dangerous flags", dangerousTrueFlags.every((flag) => !runtimeSources.includes(flag)));
  addCheck("runtime sources avoid provider/tool/project imports", !runtimeSources.includes("../providers") && !runtimeSources.includes("../tools") && !runtimeSources.includes("../projects"));
  addCheck("final report path is distinct", REPORT_PATH.endsWith("p807-final-validation-report.md"));

  const failed = checks.filter((check) => check.status === "FAIL");
  writeMarkdownReport(
    join(ROOT, REPORT_PATH),
    [
      {
        title: "Scope",
        body: [
          "- Closes P80 Founder Intake Runtime for NEXUS OS.",
          "- Validates local founder intake schemas, session state, Q&A, Command Center UX, docs, roadmap, reports, and phase status.",
          "- Does not enable provider calls, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, or provider spend.",
        ].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(checks) },
      {
        title: "Validation Commands",
        body: [
          "- npm run check:p807-final-validation",
          "- npm run check:p806-docs-roadmap",
          "- npm run check:p805-tests-checkers-docs",
          "- npm run check:p804-command-center-founder-intake-ux",
          "- npm run check:p803-founder-intake-qna",
          "- npm run check:p802-founder-intake-session",
          "- npm run check:p801-founder-intake-schema",
          "- npm run check:p80-execution-plan",
          "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder Intake\"",
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
        body: [
          "- P80 closes live-local founder intake only.",
          "- Provider calls, autonomous provider Q&A, PRD generation execution, agent dispatch, project creation, DB writes, deploy/release/export/package behavior, auth/session/user/workspace mutation, and provider spend remain disabled.",
          "- P81 is planned only; it must define its own contract before implementation.",
        ].join("\n"),
      },
      { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
    ],
    { title: "P80.7 Final Validation Report", phase: "P80.7" },
  );
  return { checks, failed, result: failed.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP80FinalValidation();
printCheckReport("P80.7 Final Validation Check", result.checks, result.result);
if (result.failed.length > 0) process.exit(1);
