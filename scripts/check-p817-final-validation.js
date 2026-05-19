import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildBusinessBuildPlan } from "../business-build/businessBuildPlan.js";
import { buildBusinessBuildWorkstreams } from "../business-build/businessBuildWorkstreams.js";
import { createBusinessBuildPrdDraft } from "../business-build/businessBuildPrdSchema.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p817-final-validation-report.md";
const P81_PHASES = ["P81", "P81.1", "P81.2", "P81.3", "P81.4", "P81.5", "P81.6", "P81.7"];

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

export function checkP81FinalValidation() {
  const packageJson = readJson("package.json");
  const phases = readJson("os-roadmap/nexus-phases.json").phases || [];
  const status = readJson("os-roadmap/phase-status.json");
  const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
  const phaseById = new Map(phases.map((entry) => [entry.phaseId, entry]));
  const planDoc = readText("docs/architecture/P81_BUSINESS_BUILD_ORCHESTRATION_PLAN.md");
  const routes = readText("dashboard/src/data/commandCenterRoutes.js");
  const tabs = readText("dashboard/src/data/commandCenterTabs.js");
  const page = readText("dashboard/src/pages/CommandCenterV2.jsx");
  const tests = readText("dashboard/tests/routes.spec.js");
  const statusChecker = readText("scripts/check-os-phase-status.js");
  const runtimeSources = [
    "business-build/businessBuildPrdSchema.js",
    "business-build/businessBuildWorkstreams.js",
    "business-build/businessBuildPlan.js",
    "dashboard/src/data/businessBuild.js",
  ].map(readText).join("\n");
  const prdDraft = createBusinessBuildPrdDraft({
    founderIdeaSummary: "Founder wants to validate a workflow automation startup.",
    answers: {
      targetCustomer: "operations leaders",
      problem: "manual handoffs slow launches",
      currentAlternatives: "spreadsheets and status meetings",
      proposedSolution: "guided automation workspace",
      businessModel: "seat-based SaaS",
      goToMarket: "founder-led sales to operations teams",
      constraints: "small founding team and limited budget",
      successCriteria: "reduce launch handoff time by 30 percent",
    },
  });
  const workstreams = buildBusinessBuildWorkstreams({ prdDraft });
  const buildPlan = buildBusinessBuildPlan({ prdDraft, workstreamPlan: workstreams });
  const businessBuildView = buildBusinessBuildViewModel();
  const primaryUxText = JSON.stringify(businessBuildView);
  const planText = JSON.stringify(buildPlan.data);
  const requiredScripts = [
    "check:p81-execution-plan",
    "check:p812-prd-schema",
    "check:p813-agent-workstreams",
    "check:p814-business-build-plan",
    "check:p815-command-center-business-build-ux",
    "check:p816-tests-checkers-docs",
    "check:p817-final-validation",
  ];
  const requiredReports = [
    "reports/p812-prd-schema-report.md",
    "reports/p813-agent-workstreams-report.md",
    "reports/p814-business-build-plan-report.md",
    "reports/p815-command-center-business-build-ux-report.md",
    "reports/p816-tests-checkers-docs-report.md",
    "reports/p81-execution-plan-report.md",
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
    "agentDispatchAllowed: true",
  ];

  addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])), requiredScripts.join(", "));
  addCheck("prior reports exist", requiredReports.every(fileExists), `${requiredReports.length} reports`);
  addCheck("P81 phases complete in roadmap", P81_PHASES.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
  addCheck("P81 phases complete in phase status", P81_PHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
  addCheck("prior P81 commits stamped", ["P81.1", "P81.2", "P81.3", "P81.4", "P81.5", "P81.6"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
  addCheck("final P81 entries are stampable", ["P81", "P81.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
  addCheck("P81 handoff to P82", phaseById.get("P81")?.nextPhase === "P82" && statusById.get("P81")?.nextPhase === "P82");
  const p82ActivePhases = ["P82", "P82.1", "P82.2", "P82.3", "P82.4", "P82.5", "P82.6", "P82.7"];
  const p82ActiveHandoff =
    p82ActivePhases.includes(status.currentPhase) &&
    (status.previousPhase === "P81.7" || p82ActivePhases.includes(status.previousPhase)) &&
    (p82ActivePhases.includes(status.nextPhase) || status.nextPhase === "P83");
  addCheck(
    "root status handoff to P82",
    (status.currentPhase === "P81.7" && status.previousPhase === "P81.6" && status.nextPhase === "P82") || p82ActiveHandoff,
    `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
  );
  addCheck("P82 handoff exists", ["planned", "in_progress"].includes(phaseById.get("P82")?.status) && ["planned", "in_progress"].includes(statusById.get("P82")?.status));
  addCheck("status checker accepts P82", statusChecker.includes('"P82"'));
  addCheck("docs close P81", planDoc.includes("P81 is complete") && planDoc.includes("hands off to P82"));
  addCheck("Command Center route preserved", routes.includes("key: \"businessBuild\"") && routes.includes("/command-center/business-build"));
  addCheck("Command Center tabs preserved", tabs.includes("BUSINESS_BUILD_TABS") && tabs.includes("Disabled Actions"));
  addCheck("Command Center renderer preserved", page.includes("BusinessBuildPage") && page.includes("buildBusinessBuildViewModel"));
  addCheck("Business Build Playwright route test preserved", tests.includes("Business Build route renders dry-run plan without runnable actions"));
  addCheck("Business Build route-wide safety preserved", tests.includes("/command-center/business-build") && tests.includes("DemoApp"));
  addCheck("PRD draft is ready for workstreams", prdDraft.data?.readyForWorkstreams === true && prdDraft.data?.missingFields?.length === 0);
  addCheck("workstreams are ready", workstreams.currentState === "workstreams_ready_for_dry_run" && workstreams.workstreams?.length === 8);
  addCheck("dry-run plan is ready", buildPlan.data?.currentState === "dry_run_business_build_plan_ready" && buildPlan.data?.milestones?.length === 5);
  addCheck("Business Build UX remains display-only", businessBuildView.safety?.executionEnabled === false && businessBuildView.safety?.projectMutationAllowed === false && businessBuildView.safety?.providerSpendAllowed === false);
  addCheck("Business Build UX hides DemoApp/private ids", !primaryUxText.includes("DemoApp") && !primaryUxText.includes("private-project"));
  addCheck("Business Build UX hides internal phase labels", !/P81\./.test(primaryUxText));
  addCheck("Business Build UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i.test(primaryUxText));
  addCheck("business build plan runtime remains blocked", planText.includes('"providerCallsAllowed":false') && planText.includes('"projectMutationAllowed":false') && planText.includes('"providerSpendAllowed":false'));
  addCheck("runtime sources do not enable dangerous flags", dangerousTrueFlags.every((flag) => !runtimeSources.includes(flag)));
  addCheck("runtime sources avoid provider/tool/project imports", !runtimeSources.includes("../providers") && !runtimeSources.includes("../tools") && !runtimeSources.includes("../projects"));
  addCheck("final report path is distinct", REPORT_PATH.endsWith("p817-final-validation-report.md"));

  const failed = checks.filter((check) => check.status === "FAIL");
  writeMarkdownReport(
    join(ROOT, REPORT_PATH),
    [
      {
        title: "Scope",
        body: [
          "- Closes P81 Business Build Orchestration Contract for NEXUS OS.",
          "- Validates PRD draft, workstreams, dry-run plan, Command Center UX, docs, roadmap, reports, and phase status.",
          "- Does not enable provider calls, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, or provider spend.",
        ].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(checks) },
      {
        title: "Validation Commands",
        body: [
          "- npm run check:p817-final-validation",
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
        body: [
          "- P81 closes local business build orchestration only.",
          "- Provider calls, autonomous provider Q&A, PRD generation execution, agent dispatch, project creation, DB writes, deploy/release/export/package behavior, auth/session/user/workspace mutation, and provider spend remain disabled.",
          "- P82 may be planned or in progress; it must define its own contract before enabling live execution.",
        ].join("\n"),
      },
      { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
    ],
    { title: "P81.7 Final Validation Report", phase: "P81.7" },
  );
  return { checks, failed, result: failed.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP81FinalValidation();
printCheckReport("P81.7 Final Validation Check", result.checks, result.result);
if (result.failed.length > 0) process.exit(1);
