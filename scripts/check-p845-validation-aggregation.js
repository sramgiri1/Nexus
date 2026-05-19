import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderAgentPlanAdmission, validateFounderAgentPlanAdmission } from "../live-ready/founderAgentPlanAdmission.js";
import { buildLiveReadyActivationViewModel } from "../dashboard/src/data/liveReadyActivation.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p845-validation-aggregation-report.md";

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
const docs = readText("docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md");
const roadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const agentAdmission = buildFounderAgentPlanAdmission();
const agentValidation = validateFounderAgentPlanAdmission(agentAdmission);
const activation = buildLiveReadyActivationViewModel();
const activationText = JSON.stringify(activation);

const requiredScripts = [
  "check:p84-execution-plan",
  "check:p841-founder-runtime-admission",
  "check:p842-command-center-lite",
  "check:p843-agent-plan-admission-preview",
  "check:p844-command-center-runtime-ux",
  "check:p845-validation-aggregation",
];

const requiredReports = [
  "reports/p84-execution-plan-report.md",
  "reports/p841-founder-runtime-admission-report.md",
  "reports/p842-command-center-lite-report.md",
  "reports/p843-agent-plan-admission-preview-report.md",
  "reports/p844-command-center-runtime-ux-report.md",
];

const p84Subphases = ["P84.1", "P84.2", "P84.3", "P84.4"];

addCheck("required P84 scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("required P84 reports exist", requiredReports.every(fileExists));
addCheck("P84.1-P84.4 complete", p84Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck(
  "P84.5 status advanced",
  statusById.get("P84.5")?.status === "complete" &&
    ["P84.5", "P84.6", "P84.7"].includes(status.currentPhase),
);
addCheck("agent admission still validates", agentValidation.valid, agentValidation.errors.join("; "));
addCheck("Command Center runtime UX still visible", activation.readinessRows.some((row) => row.label === "Founder Agent Plan Admission"));
addCheck("coverage report exists", fileExists("reports/phase-validation-coverage-report.md"));
addCheck("docs mention validation aggregation", docs.includes("P84.5 Validation Aggregation") && docs.includes("npm run check:p845-validation-aggregation"));
addCheck("roadmap mentions P84.5", roadmap.includes("P84.5 is complete"));
addCheck("no fake runnable actions", !/dispatch now|run agent|execute now|call provider now|write project now|deploy now|spend now/i.test(activationText));
addCheck("unsafe runtime remains blocked", activation.safety.executionEnabled === false && activation.safety.providerSpendAllowed === false && activation.safety.projectMutationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P84.1-P84.4 validation evidence.",
        "- Confirms P84 scripts, reports, phase status, Command Center runtime visibility, and non-execution safety posture.",
        "- Does not add runtime behavior or Command Center routes.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p845-validation-aggregation",
        "- npm run check:p844-command-center-runtime-ux",
        "- npm run check:p843-agent-plan-admission-preview",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P84.5 is validation aggregation only. Runtime execution, provider/model calls, agent dispatch, worker execution, project mutation, DB writes, deploy, release, export, package creation, network calls, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P84.5 Validation Aggregation Report", phase: "P84.5" },
);

printCheckReport("P84.5 Validation Aggregation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
