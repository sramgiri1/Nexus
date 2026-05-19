import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildLiveReadinessViewModel } from "../dashboard/src/data/liveReadiness.js";
import { buildLiveReadyActivationViewModel } from "../dashboard/src/data/liveReadyActivation.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p835-command-center-build-ux-report.md";

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

const activation = buildLiveReadyActivationViewModel();
const readiness = buildLiveReadinessViewModel();
const activationText = JSON.stringify(activation);
const readinessText = JSON.stringify(readiness);
const buildRow = activation.readinessRows.find((row) => row.label === "Generated Snake iOS Build");
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p83-execution-contracts.json");
const testsSource = readText("dashboard/tests/routes.spec.js");

addCheck("local build row exists", Boolean(buildRow));
addCheck("local build row is ready", buildRow?.readinessLabel === "Ready" && buildRow?.currentState === "local_build_validated");
addCheck("operator fields are present", ["nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceLocation", "activityLocation", "costImpact"].every((field) => Object.hasOwn(buildRow || {}, field)));
addCheck("evidence points to P83.4 report", buildRow?.evidenceLocation === "reports/p834-local-validation-harness-report.md");
addCheck("activation summary includes build row", readiness.activationRows.some((row) => row.label === "Generated Snake iOS Build"));
addCheck("runtime remains display-only", Object.values(activation.safety || {}).every((value) => value === false));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(`${activationText}\n${readinessText}`));
addCheck("no DemoApp or raw private IDs", !`${activationText}\n${readinessText}`.includes("DemoApp") && !/(?:private-project-|private_project_|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_)/.test(`${activationText}\n${readinessText}`));
addCheck("Playwright covers local build row", testsSource.includes("Generated Snake iOS Build") && testsSource.includes("local-build validated"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p835-command-center-build-ux"]));
addCheck("contract references P83.5 checker", contract.includes("check:p835-command-center-build-ux"));
addCheck("docs mention P83.5 validation", docs.includes("P83.5 Command Center Build UX") && docs.includes("Status: complete. P83.5"));
addCheck("phase status advanced", statusById.get("P83.5")?.status === "complete" && status.currentPhase === "P83.5" && status.nextPhase === "P83.6");
addCheck("P83.4 report prerequisite exists", fileExists("reports/p834-local-validation-harness-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P83.5 Command Center local Snake iOS build UX.",
        "- Reuses existing Live Readiness activation rows and cards.",
        "- Keeps provider calls, tool execution, worker execution, project mutation, DB writes, deploy, release, export, package creation, network calls, auth/session/user/workspace mutation, and provider spend disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "UX Row",
      body: buildRow
        ? [
            `- Label: ${buildRow.label}`,
            `- Readiness: ${buildRow.readinessLabel}`,
            `- Evidence: ${buildRow.evidenceLocation}`,
            `- Cost: ${buildRow.costImpact}`,
          ].join("\n")
        : "- Missing Generated Snake iOS Build row.",
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p835-command-center-build-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready\"",
        "- cd dashboard && npm run build",
        "- npm run check:p834-local-validation-harness",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P83.5 is display-only. It does not add mutation controls or live deploy/provider actions." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P83.5 Command Center Build UX Report", phase: "P83.5" },
);

printCheckReport("P83.5 Command Center Build UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
