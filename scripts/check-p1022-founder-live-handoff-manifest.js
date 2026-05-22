import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P102_FOUNDER_LIVE_HANDOFF_PHASE,
  P102_HANDOFF_SAFETY_FLAGS,
  P102_HANDOFF_STATES,
  buildFounderLiveHandoffManifest,
  validateFounderLiveHandoffManifest,
} from "../live-ready/founderLiveHandoffManifest.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1022-founder-live-handoff-manifest-report.md";

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
const contract = readJson("contracts/os-roadmap/p102-founder-live-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P102_FOUNDER_LIVE_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const source = readText("live-ready/founderLiveHandoffManifest.js");
const envelope = buildFounderLiveHandoffManifest({
  founderIdea: "Build a simple iOS Snake game for the App Store",
});
const validation = validateFounderLiveHandoffManifest(envelope);
const data = envelope.data || {};
const p1022 = subphaseById.get("P102.2") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1022-founder-live-handoff-manifest"]));
addCheck("manifest exports exist", source.includes("buildFounderLiveHandoffManifest") && source.includes("validateFounderLiveHandoffManifest"));
addCheck("phase constant", P102_FOUNDER_LIVE_HANDOFF_PHASE === "P102.2");
addCheck("handoff states exported", Object.values(P102_HANDOFF_STATES).includes("founder_live_handoff_manifest_ready_execution_blocked"));
addCheck("safety flags cover execution boundaries", ["agentDispatchAllowed", "projectMutationAllowed", "agentWorkOrderDispatchAllowed", "businessBuildExecutionAllowed"].every((flag) => P102_HANDOFF_SAFETY_FLAGS.includes(flag)));
addCheck("manifest validates", validation.valid, validation.errors.join("; "));
addCheck("manifest shape", data.schemaVersion === "1.0" && Boolean(data.founderContextSummary) && Boolean(data.approvalBoundary));
addCheck("handoff lanes useful", data.handoffLanes?.length === 6 && data.handoffReadiness?.totalLaneCount === 6);
addCheck("founder context captured display-safe", data.founderContextSummary?.founderIdea?.includes("iOS Snake game") && !/founder_[A-Za-z0-9_-]*\d/.test(data.founderContextSummary?.founderIdea || ""));
addCheck("execution remains blocked", data.handoffReadiness?.executableLaneCount === 0 && data.handoffReadiness?.dispatchableLaneCount === 0 && data.handoffReadiness?.projectMutationLaneCount === 0);
addCheck("work order dry run not created early", data.handoffReadiness?.workOrderDryRunCount === 0);
addCheck("all safety flags false", P102_HANDOFF_SAFETY_FLAGS.every((flag) => data[flag] === false && data.approvalBoundary?.[flag] === false && data.handoffLanes.every((lane) => lane[flag] === false)));
addCheck("reuses P101 review packet", source.includes("buildFounderLiveUseReviewPacket") && source.includes("buildFounderLiveUseReadiness"));
addCheck("contract marks P102.2 complete", p1022.status === "complete");
addCheck("P102.3 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P102.3")?.status));
addCheck("docs record P102.2", /P102\.2 Founder Handoff Manifest Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P102.2", /P102\.2 is\s+complete/.test(platformRoadmap) && /P102\.3 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ["P102.2", "P102.3", "P102.4"].includes(status.currentPhase)
    && ["P102.1", "P102.2", "P102.3"].includes(status.previousPhase)
    && ["P102.3", "P102.4", "P102.5"].includes(status.nextPhase)
    && statusById.get("P102")?.status === "in_progress"
    && statusById.get("P102.2")?.status === "complete"
    && roadmapById.get("P102.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(data)));
addCheck("no unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify(data)));
addCheck("P102.2 avoids forbidden file scope", !(p1022.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P102.2 local founder live handoff manifest model.",
        "- Confirms the manifest reuses P101 readiness/review evidence, exposes display-safe founder context and handoff lanes, and keeps all unsafe runtime flags false.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1022-founder-live-handoff-manifest",
        "- npm run check:p1021-founder-live-handoff-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P102.2 is a local handoff manifest model only. It does not create live work orders, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P102.2 Founder Live Handoff Manifest Report", phase: "P102.2" },
);

printCheckReport("P102.2 Founder Live Handoff Manifest Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
