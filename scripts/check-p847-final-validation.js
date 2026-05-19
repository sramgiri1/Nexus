import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderAgentPlanAdmission, validateFounderAgentPlanAdmission } from "../live-ready/founderAgentPlanAdmission.js";
import { buildLiveReadyActivationViewModel } from "../dashboard/src/data/liveReadyActivation.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p847-final-validation-report.md";
const REQUIRED_PHASES = ["P84.1", "P84.2", "P84.3", "P84.4", "P84.5", "P84.6", "P84.7"];
const REQUIRED_REPORTS = [
  "reports/p841-founder-runtime-admission-report.md",
  "reports/p842-command-center-lite-report.md",
  "reports/p843-agent-plan-admission-preview-report.md",
  "reports/p844-command-center-runtime-ux-report.md",
  "reports/p845-validation-aggregation-report.md",
  "reports/p846-docs-roadmap-report.md",
];
const REQUIRED_SCRIPTS = [
  "check:p84-execution-plan",
  "check:p841-founder-runtime-admission",
  "check:p842-command-center-lite",
  "check:p843-agent-plan-admission-preview",
  "check:p844-command-center-runtime-ux",
  "check:p845-validation-aggregation",
  "check:p846-docs-roadmap",
  "check:p847-final-validation",
];

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

const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md");
const roadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const contract = readText("contracts/os-roadmap/p84-execution-contracts.json");
const agentAdmission = buildFounderAgentPlanAdmission();
const agentValidation = validateFounderAgentPlanAdmission(agentAdmission);
const activation = buildLiveReadyActivationViewModel();
const activationText = JSON.stringify(activation);

addCheck("P84 root is complete", statusById.get("P84")?.status === "complete");
addCheck("all P84 subphases are complete", REQUIRED_PHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("status closes on P84.7", status.currentPhase === "P84.7" && status.nextPhase === "P85");
addCheck("required P84 reports exist", REQUIRED_REPORTS.every(fileExists));
addCheck("package scripts include P84 checkers", REQUIRED_SCRIPTS.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("agent admission validates", agentValidation.valid, agentValidation.errors.join("; "));
addCheck("Command Center founder runtime rows visible", activation.readinessRows.some((row) => row.label === "Founder Q&A to PRD Runtime") && activation.readinessRows.some((row) => row.label === "Founder Agent Plan Admission"));
addCheck("runtime flags remain disabled", Object.values(activation.safety || {}).every((value) => value === false));
addCheck("docs close P84", docs.includes("Status: complete. P84.7") && roadmap.includes("P84 is complete"));
addCheck("contract references final validation", contract.includes("check:p847-final-validation"));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now|spend now/i.test(activationText));
addCheck("no raw private IDs", !/(?:private-project-|private_project_|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_)/.test(activationText));
addCheck("blocked actions remain explicit", ["providerSpendAllowed", "deployExecutionAllowed", "workerExecutionAllowed", "dbWritesAllowed"].every((flag) => activationText.includes(`"${flag}":false`)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P84 Governed Founder Runtime Admission.",
        "- Confirms founder runtime admission, Command Center Lite, local agent plan admission, Live Readiness UX, validation aggregation, docs, and roadmap evidence are complete.",
        "- Confirms unsafe execution, mutation, deploy, package, network, and spend surfaces remain disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p847-final-validation",
        "- npm run check:p846-docs-roadmap",
        "- npm run check:p845-validation-aggregation",
        "- npm run check:p844-command-center-runtime-ux",
        "- npm run check:p843-agent-plan-admission-preview",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready\"",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P84 completes governed local founder runtime admission and visibility only.",
        "- Provider/model calls, agent dispatch, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain disabled until a later explicit admission phase.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P84.7 Final Validation Report", phase: "P84.7" },
);

printCheckReport("P84.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
