import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildFounderWorkstreamActivationPlan,
  validateFounderWorkstreamActivationPlan,
} from "../live-ready/founderWorkstreamActivationPlan.js";
import {
  buildFounderActivationReviewPacket,
  validateFounderActivationReviewPacket,
} from "../live-ready/founderActivationReviewPacket.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p915-tests-checkers-report.md";

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
    if (key !== "activationReviewAllowed" && /Allowed$|CanRun$|CanMutate$|CanExecute$|activationAllowed$|executionAllowed$/.test(key) && nested !== false) {
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
const contract = readText("contracts/os-roadmap/p91-execution-contracts.json");
const docs = readText("docs/architecture/P91_GOVERNED_FOUNDER_WORKSTREAM_ACTIVATION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const businessBuildData = readText("dashboard/src/data/businessBuild.js");
const commandCenterPage = readText("dashboard/src/pages/CommandCenterV2.jsx");
const implementationSources = [businessBuildData, commandCenterPage].join("\n");
const p911Report = readText("reports/p911-founder-workstream-activation-contract-report.md");
const p912Report = readText("reports/p912-founder-workstream-activation-model-report.md");
const p913Report = readText("reports/p913-founder-activation-review-packet-report.md");
const p914Report = readText("reports/p914-command-center-workstream-activation-ux-report.md");

const activationPlan = buildFounderWorkstreamActivationPlan();
const reviewPacket = buildFounderActivationReviewPacket({ activationPlan });
const activationValidation = validateFounderWorkstreamActivationPlan(activationPlan);
const reviewValidation = validateFounderActivationReviewPacket(reviewPacket);
const runtimeFlagFailures = [
  ...allRuntimeFlagsFalse(activationPlan.data, "activationPlan"),
  ...allRuntimeFlagsFalse(reviewPacket.data, "reviewPacket"),
];

const requiredScripts = [
  "check:p911-founder-workstream-activation-contract",
  "check:p912-founder-workstream-activation-model",
  "check:p913-founder-activation-review-packet",
  "check:p914-command-center-workstream-activation-ux",
  "check:p915-tests-checkers",
];
const requiredReports = [
  "reports/p911-founder-workstream-activation-contract-report.md",
  "reports/p912-founder-workstream-activation-model-report.md",
  "reports/p913-founder-activation-review-packet-report.md",
  "reports/p914-command-center-workstream-activation-ux-report.md",
];
const completedSubphases = ["P91.1", "P91.2", "P91.3", "P91.4"];
const trackedSubphases = [...completedSubphases, "P91.5"];

addCheck("package registers all P91 scripts", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P91 reports exist", requiredReports.every(fileExists));
addCheck("P91 reports pass", [p911Report, p912Report, p913Report, p914Report].every((report) => /Result: PASS|PASS \(/.test(report)));
addCheck("P91.1-P91.4 statuses complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P91.1-P91.4 commits stamped", completedSubphases.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && !String(statusById.get(phaseId)?.commit).includes("pending")));
addCheck("P91.5 status complete", statusById.get("P91.5")?.status === "complete");
addCheck("roadmap tracks P91.1-P91.5", trackedSubphases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("contract tracks P91.1-P91.5", trackedSubphases.every((phaseId) => contract.includes(phaseId)) && contract.includes("check:p915-tests-checkers"));
addCheck("docs list P91.5 validation", docs.includes("P91.5 Tests / Checkers") && docs.includes("npm run check:p915-tests-checkers"));
addCheck(
  "platform roadmap records P91.5",
  platformRoadmap.includes("P91.5 is complete")
    && (platformRoadmap.includes("P91.6 is next") || platformRoadmap.includes("P91.6 is complete")),
);
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P91")?.status)
    && statusById.get("P91.5")?.status === "complete"
    && ["P91.5", "P91.6", "P91.7", "P92.7"].includes(status.currentPhase)
    && ["P91.4", "P91.5", "P91.6", "P92.6"].includes(status.previousPhase)
    && ["P91.6", "P91.7", "P92", "P93"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P91.6 handoff exists", ["planned", "complete"].includes(statusById.get("P91.6")?.status) && ["planned", "complete"].includes(roadmapById.get("P91.6")?.status));
addCheck("P91.7 handoff exists", ["planned", "complete"].includes(statusById.get("P91.7")?.status) && ["planned", "complete"].includes(roadmapById.get("P91.7")?.status));
addCheck("status checker accepts P91.6 and P91.7", statusChecker.includes("\"P91.6\"") && statusChecker.includes("\"P91.7\""));
addCheck("activation plan validates", activationValidation.valid, activationValidation.errors.join("; "));
addCheck("activation review packet validates", reviewValidation.valid, reviewValidation.errors.join("; "));
addCheck("runtime flags remain false", runtimeFlagFailures.length === 0, runtimeFlagFailures.join("; "));
addCheck("Playwright activation review coverage present", routeTests.includes("Business Build Activation Review tab shows packet without execution") && routeTests.includes("Provider/model calls, agent dispatch"));
addCheck("Command Center activation review remains wired", businessBuildData.includes("buildFounderActivationReviewPacket") && commandCenterPage.includes('tabId="activationReview"'));
addCheck("no forbidden project imports", !/from\s+["'][^"']*(projects|careloop|generated-projects\/[^/]+\/(?:Sources|Tests)|providers|tools|worker-runtime|db|prisma|migrations|deploy|release|exports|packages)\//.test(implementationSources));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(implementationSources));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(implementationSources));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P91.1-P91.4 backend, UX, Playwright, docs, roadmap, and safety validation evidence.",
        "- Confirms the founder workstream activation plan and review packet remain local review data only.",
        "- Confirms Business Build Activation Review stays display-safe and does not expose runnable dispatch, project mutation, provider, DB, deploy, package, or spend actions.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p915-tests-checkers",
        "- npm run check:p914-command-center-workstream-activation-ux",
        "- npm run check:p913-founder-activation-review-packet",
        "- npm run check:p912-founder-workstream-activation-model",
        "- npm run check:p911-founder-workstream-activation-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build Activation Review\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P91.5 is validation aggregation only. It does not run an executor, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P91.5 Tests Checkers Report", phase: "P91.5" },
);

printCheckReport("P91.5 Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
