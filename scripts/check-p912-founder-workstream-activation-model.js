import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import {
  buildFounderWorkstreamActivationPlan,
  P91_WORKSTREAM_ACTIVATION_LANES,
  validateFounderWorkstreamActivationPlan,
} from "../live-ready/founderWorkstreamActivationPlan.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p912-founder-workstream-activation-model-report.md";

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
const contract = readText("contracts/os-roadmap/p91-execution-contracts.json");
const docs = readText("docs/architecture/P91_GOVERNED_FOUNDER_WORKSTREAM_ACTIVATION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const source = readText("live-ready/founderWorkstreamActivationPlan.js");

const envelope = buildFounderWorkstreamActivationPlan({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const envelopeValidation = validateResultEnvelope(envelope);
const planValidation = validateFounderWorkstreamActivationPlan(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(data);

addCheck("result envelope valid", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("activation plan validation passes", planValidation.valid, planValidation.errors.join("; "));
addCheck("workstream lanes exported", P91_WORKSTREAM_ACTIVATION_LANES.length === 8 && P91_WORKSTREAM_ACTIVATION_LANES.some((lane) => lane.lane === "engineering"));
addCheck("source PRD retained", data.sourcePrd?.title?.includes("Snake") && data.sourcePrd?.reviewState === "ready_for_operator_review");
addCheck("workstream lanes complete", Array.isArray(data.workstreamLanes) && data.workstreamLanes.length === P91_WORKSTREAM_ACTIVATION_LANES.length);
addCheck("snake game activation lanes useful", serialized.includes("SpriteKit") && serialized.includes("App Store") && serialized.includes("casual iPhone players"));
addCheck("activation readiness present", data.activationReadiness?.ready === true && data.activationReadiness?.readyLaneCount === P91_WORKSTREAM_ACTIVATION_LANES.length);
addCheck("local operations are non-mutating", data.allowedLocalOperations?.every((entry) => !/dispatch|write project|create project|deploy|package/i.test(entry)));
addCheck("lane dispatch and mutation blocked", data.workstreamLanes?.every((lane) => lane.agentDispatchAllowed === false && lane.projectMutationAllowed === false));
addCheck("unsafe runtime flags blocked", ["providerCallsAllowed", "modelCallsAllowed", "agentDispatchAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectCreationAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "exportExecutionAllowed", "packageCreationAllowed", "providerSpendAllowed"].every((flag) => data[flag] === false && data.runtimeFlags?.[flag] === false));
addCheck("no unsafe imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|prisma|deploy|packages|projects)\//.test(source));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p912-founder-workstream-activation-model"]));
addCheck("contract tracks P91.2 files", contract.includes("P91.2") && contract.includes("live-ready/founderWorkstreamActivationPlan.js") && contract.includes("check:p912-founder-workstream-activation-model"));
addCheck("docs record P91.2", docs.includes("P91.2 is complete") && docs.includes("npm run check:p912-founder-workstream-activation-model"));
addCheck("platform roadmap records P91.2", platformRoadmap.includes("P91.2 is complete") && platformRoadmap.includes("P91.3 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P91")?.status === "in_progress"
    && statusById.get("P91.2")?.status === "complete"
    && status.currentPhase === "P91.2"
    && status.previousPhase === "P91.1"
    && status.nextPhase === "P91.3",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P91.2", roadmapById.get("P91.2")?.track === "NEXUS_OS" && roadmapById.get("P91.2")?.status === "complete");
addCheck("P91.3 planned handoff exists", statusById.get("P91.3")?.status === "planned" && roadmapById.get("P91.3")?.status === "planned");
addCheck("status checker accepts P91.3", statusChecker.includes("\"P91.3\""));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P91.2 local founder workstream activation planning model.",
        "- Confirms the P90 PRD artifact maps into deterministic workstream activation review lanes.",
        "- Confirms provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p912-founder-workstream-activation-model",
        "- npm run check:p911-founder-workstream-activation-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P91.2 is a local model only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P91.2 Founder Workstream Activation Model Report", phase: "P91.2" },
);

printCheckReport("P91.2 Founder Workstream Activation Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
