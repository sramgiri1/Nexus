import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLocalEnterpriseRuntimeHandoffProfile,
  validateLocalEnterpriseRuntimeHandoffProfile,
} from "../live-ready/localEnterpriseRuntimeHandoffProfile.js";
import {
  buildLocalFounderWorkstreamRuntimeEnvelope,
  validateLocalFounderWorkstreamRuntimeEnvelope,
} from "../live-ready/localFounderWorkstreamRuntimeEnvelope.js";
import {
  buildLocalFounderWorkstreamDryRun,
  validateLocalFounderWorkstreamDryRun,
} from "../live-ready/localFounderWorkstreamDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p895-tests-checkers-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

function allRuntimeFlagsFalse(value, path = "root", failures = []) {
  if (!value || typeof value !== "object") return failures;
  for (const [key, nested] of Object.entries(value)) {
    if (/Allowed$|CanRun$|CanMutate$|CanExecute$|handoffCanExecute$|activationAllowed$|executionAllowed$/.test(key) && nested !== false) {
      failures.push(`${path}.${key}`);
    }
    if (nested && typeof nested === "object") allRuntimeFlagsFalse(nested, `${path}.${key}`, failures);
  }
  return failures;
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p89-execution-contracts.json");
const docs = readText("docs/architecture/P89_GOVERNED_LOCAL_ENTERPRISE_RUNTIME_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const businessBuildData = readText("dashboard/src/data/businessBuild.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const statusChecker = readText("scripts/check-os-phase-status.js");

const handoffProfile = buildLocalEnterpriseRuntimeHandoffProfile();
const founderEnvelope = buildLocalFounderWorkstreamRuntimeEnvelope({ handoffProfile });
const dryRun = buildLocalFounderWorkstreamDryRun({ envelope: founderEnvelope });
const handoffValidation = validateLocalEnterpriseRuntimeHandoffProfile(handoffProfile);
const envelopeValidation = validateLocalFounderWorkstreamRuntimeEnvelope(founderEnvelope);
const dryRunValidation = validateLocalFounderWorkstreamDryRun(dryRun);

const requiredScripts = [
  "check:p891-local-enterprise-runtime-handoff-profile",
  "check:p892-local-founder-workstream-runtime-envelope",
  "check:p893-local-founder-workstream-dry-run",
  "check:p894-command-center-founder-workstream-ux",
  "check:p895-tests-checkers",
];
const requiredReports = [
  "reports/p891-local-enterprise-runtime-handoff-profile-report.md",
  "reports/p892-local-founder-workstream-runtime-envelope-report.md",
  "reports/p893-local-founder-workstream-dry-run-report.md",
  "reports/p894-command-center-founder-workstream-ux-report.md",
];
const completedSubphases = ["P89.1", "P89.2", "P89.3", "P89.4"];
const trackedSubphases = [...completedSubphases, "P89.5"];
const runtimeFlagFailures = [
  ...allRuntimeFlagsFalse(handoffProfile.data, "handoffProfile"),
  ...allRuntimeFlagsFalse(founderEnvelope.data, "founderEnvelope"),
  ...allRuntimeFlagsFalse(dryRun.data, "dryRun"),
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P89 reports exist", requiredReports.every(fileExists));
addCheck("P89.1-P89.4 statuses complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P89.1-P89.4 commits stamped", completedSubphases.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && !String(statusById.get(phaseId)?.commit).includes("pending")));
addCheck("P89.5 status complete", statusById.get("P89.5")?.status === "complete");
addCheck("roadmap tracks P89.1-P89.5", trackedSubphases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("contract tracks P89.1-P89.5", trackedSubphases.every((phaseId) => contract.includes(phaseId)) && contract.includes("check:p895-tests-checkers"));
addCheck("docs list P89.5 validation", docs.includes("P89.5 Tests / Checkers") && docs.includes("npm run check:p895-tests-checkers"));
addCheck(
  "platform roadmap records P89.5",
  platformRoadmap.includes("P89.5 is complete")
    && (platformRoadmap.includes("P89.6 is next") || platformRoadmap.includes("P89.6 is complete")),
);
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P89")?.status)
    && ["P89.5", "P89.6", "P89.7"].includes(status.currentPhase)
    && ["P89.4", "P89.5", "P89.6"].includes(status.previousPhase)
    && ["P89.6", "P89.7", "P90"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("status checker accepts P89.6 handoff", statusChecker.includes("\"P89.6\""));
addCheck("runtime builders validate", handoffValidation.valid && envelopeValidation.valid && dryRunValidation.valid, [...handoffValidation.errors, ...envelopeValidation.errors, ...dryRunValidation.errors].join("; "));
addCheck("runtime flags remain false", runtimeFlagFailures.length === 0, runtimeFlagFailures.join("; "));
addCheck("Playwright founder dry-run safety coverage", routeTests.includes("Business Build Founder Dry Run tab keeps live execution disabled") && routeTests.includes("Provider/model calls, agent dispatch"));
addCheck("Command Center dry-run data remains display-only", businessBuildData.includes("founderWorkstreamDryRun") && businessBuildData.includes("Founder Dry Run is display-only"));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(businessBuildData));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(businessBuildData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P89.1-P89.4 backend, UX, Playwright, docs, roadmap, and safety validation evidence.",
        "- Confirms local founder workstream handoff, envelope, and dry-run records remain blocked from execution.",
        "- Confirms Business Build Founder Dry Run coverage stays display-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p895-tests-checkers",
        "- npm run check:p894-command-center-founder-workstream-ux",
        "- npm run check:p893-local-founder-workstream-dry-run",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P89.5 is validation aggregation only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P89.5 Tests Checkers Report", phase: "P89.5" },
);

printCheckReport("P89.5 Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
