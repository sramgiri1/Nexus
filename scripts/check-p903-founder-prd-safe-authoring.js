import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import {
  buildFounderPrdSafeAuthoring,
  P90_SAFE_AUTHORING_SECTIONS,
  validateFounderPrdSafeAuthoring,
} from "../live-ready/founderPrdSafeAuthoring.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p903-founder-prd-safe-authoring-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
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
const contract = readText("contracts/os-roadmap/p90-execution-contracts.json");
const docs = readText("docs/architecture/P90_GOVERNED_FOUNDER_PRD_LIVE_AUTHORING_LANE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const source = readText("live-ready/founderPrdSafeAuthoring.js");

const envelope = buildFounderPrdSafeAuthoring({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const envelopeValidation = validateResultEnvelope(envelope);
const authoringValidation = validateFounderPrdSafeAuthoring(envelope);
const data = envelope.data || {};
const artifact = data.prdArtifact || {};
const serialized = JSON.stringify(data);

addCheck("result envelope valid", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("safe authoring validation passes", authoringValidation.valid, authoringValidation.errors.join("; "));
addCheck("safe authoring sections exported", P90_SAFE_AUTHORING_SECTIONS.length === 8 && P90_SAFE_AUTHORING_SECTIONS.includes("founderIdea"));
addCheck("local authoring enabled only in memory", data.localAuthoring?.allowed === true && data.localAuthoring?.writesFiles === false && data.localAuthoring?.mutatesProjects === false);
addCheck("no provider/agent/network/spend in local authoring", ["dispatchesAgents", "callsProviders", "usesNetwork", "spendsBudget"].every((field) => data.localAuthoring?.[field] === false));
addCheck("artifact markdown produced", typeof artifact.markdown === "string" && artifact.markdown.includes("# PRD -") && artifact.markdown.includes("## Operator Review"));
addCheck("snake game artifact useful", artifact.markdown?.includes("Snake") && artifact.markdown?.includes("App Store") && artifact.markdown?.includes("casual iPhone players"));
addCheck("acceptance criteria present", Array.isArray(artifact.acceptanceCriteria) && artifact.acceptanceCriteria.length >= 3);
addCheck("artifact sections complete", Array.isArray(artifact.sections) && artifact.sections.length === P90_SAFE_AUTHORING_SECTIONS.length);
addCheck("unsafe runtime flags blocked", ["providerCallsAllowed", "modelCallsAllowed", "agentDispatchAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "exportExecutionAllowed", "packageCreationAllowed", "providerSpendAllowed"].every((flag) => data[flag] === false && data.runtimeFlags?.[flag] === false));
addCheck("no unsafe imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|prisma|deploy|packages)\//.test(source));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p903-founder-prd-safe-authoring"]));
addCheck("contract tracks P90.3 files", contract.includes("P90.3") && contract.includes("live-ready/founderPrdSafeAuthoring.js") && contract.includes("check:p903-founder-prd-safe-authoring"));
addCheck("docs record P90.3", docs.includes("P90.3 is complete") && docs.includes("npm run check:p903-founder-prd-safe-authoring"));
addCheck(
  "platform roadmap records P90.3",
  platformRoadmap.includes("P90.3 is complete")
    && (platformRoadmap.includes("P90.4 is next") || platformRoadmap.includes("P90.4 is complete")),
);
addCheck(
  "phase status advanced",
  statusById.get("P90")?.status === "in_progress"
    && statusById.get("P90.3")?.status === "complete"
    && ["P90.3", "P90.4", "P90.5", "P90.6", "P90.7"].includes(status.currentPhase)
    && ["P90.2", "P90.3", "P90.4", "P90.5", "P90.6"].includes(status.previousPhase)
    && ["P90.4", "P90.5", "P90.6", "P90.7", "P91"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P90.3", roadmapById.get("P90.3")?.track === "NEXUS_OS" && roadmapById.get("P90.3")?.status === "complete");
addCheck("status checker accepts P90.4", statusChecker.includes("\"P90.4\""));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P90.3 safe local founder PRD authoring.",
        "- Confirms a deterministic in-memory PRD artifact is produced.",
        "- Confirms project writes, provider/model calls, agent dispatch, DB writes, deploy, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p903-founder-prd-safe-authoring",
        "- npm run check:p902-founder-prd-local-model",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P90.3 authors a deterministic PRD artifact in memory only. It does not write project files, dispatch agents, execute tools/workers, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P90.3 Founder PRD Safe Authoring Report", phase: "P90.3" },
);

printCheckReport("P90.3 Founder PRD Safe Authoring Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
