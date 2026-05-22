import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import {
  P101_FOUNDER_LIVE_USE_PHASE,
  P101_LIVE_USE_HARDENING_STATES,
  P101_LIVE_USE_SAFETY_FLAGS,
  buildFounderLiveUseReadiness,
  validateFounderLiveUseReadiness,
} from "../live-ready/founderLiveUseReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1012-founder-live-use-readiness-model-report.md";

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
const contract = readJson("contracts/os-roadmap/p101-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p1012 = contract.subphases?.find((entry) => entry.phaseId === "P101.2");
const p1013 = contract.subphases?.find((entry) => entry.phaseId === "P101.3");
const modelText = readText("live-ready/founderLiveUseReadiness.js");
const docs = readText("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");

const readyEnvelope = buildFounderLiveUseReadiness();
const needsContextEnvelope = buildFounderLiveUseReadiness({
  runtimeApproval: {},
  operatorApproval: false,
  rollbackAccepted: false,
  auditAccepted: false,
  validationCommandsAccepted: false,
  mode: "preview",
  enableWrites: false,
});
const readyValidation = validateFounderLiveUseReadiness(readyEnvelope);
const needsContextValidation = validateFounderLiveUseReadiness(needsContextEnvelope);
const envelopeValidation = validateResultEnvelope(readyEnvelope);

function allUnsafeFlagsFalse(envelope) {
  const data = envelope.data || {};
  return P101_LIVE_USE_SAFETY_FLAGS.every((flag) => data[flag] === false && data.safetyFlags?.[flag] === false)
    && (data.liveUseLanes || []).every((lane) => P101_LIVE_USE_SAFETY_FLAGS.every((flag) => lane[flag] === false));
}

const serialized = JSON.stringify([readyEnvelope.data, needsContextEnvelope.data]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1012-founder-live-use-readiness-model"]));
addCheck("phase constant is P101.2", P101_FOUNDER_LIVE_USE_PHASE === "P101.2");
addCheck("result envelope validates", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("ready model validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("needs-context model validates", needsContextValidation.valid, needsContextValidation.errors.join("; "));
addCheck("ready state is local review only", readyEnvelope.data.currentState === P101_LIVE_USE_HARDENING_STATES.LOCAL_REVIEW_READY_EXECUTION_BLOCKED && readyEnvelope.data.founderWorkflowReadiness.localReviewReady === true);
addCheck("needs-context state blocks readiness", needsContextEnvelope.data.currentState === P101_LIVE_USE_HARDENING_STATES.NEEDS_FOUNDER_CONTEXT && needsContextEnvelope.data.founderWorkflowReadiness.localReviewReady === false);
addCheck("model has required lanes", readyEnvelope.data.liveUseLanes.length === 6 && ["Founder Q&A", "Local PRD", "Agent Workstream Plan", "Local DB Readiness", "Execution Admission Review", "Live Readiness Gate"].every((label) => readyEnvelope.data.liveUseLanes.some((lane) => lane.label === label)));
addCheck("execution remains blocked", readyEnvelope.data.founderWorkflowReadiness.executableLaneCount === 0 && readyEnvelope.data.founderWorkflowReadiness.dispatchableLaneCount === 0 && readyEnvelope.data.founderWorkflowReadiness.projectMutationLaneCount === 0);
addCheck("unsafe runtime flags remain false", allUnsafeFlagsFalse(readyEnvelope) && allUnsafeFlagsFalse(needsContextEnvelope));
addCheck("model reuses existing live-ready helpers", ["buildFounderRuntimeAdmission", "buildFounderPrdSafeAuthoring", "buildFounderBusinessBuildPersistenceSnapshot", "buildFounderBusinessBuildDryRunAdmission", "buildLocalFounderWorkstreamRuntimeEnvelope"].every((term) => modelText.includes(term)));
addCheck("contract marks P101.2 complete", p1012?.status === "complete" && ["planned", "complete"].includes(p1013?.status));
addCheck("contract expected exports retained", ["P101_FOUNDER_LIVE_USE_PHASE", "P101_LIVE_USE_HARDENING_STATES", "P101_LIVE_USE_SAFETY_FLAGS", "buildFounderLiveUseReadiness"].every((term) => JSON.stringify(contract).includes(term)));
addCheck("docs record P101.2", /P101\.2 Founder Live-Use Readiness Model[\s\S]*Status:\s+complete/.test(docs) && docs.includes("check:p1012-founder-live-use-readiness-model"));
addCheck("platform roadmap records P101.2", /P101\.2 is\s+complete/.test(platformRoadmap) && /P101\.3 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced within P101",
  ["P101.2", "P101.3", "P101.4", "P101.5", "P101.6"].includes(status.currentPhase)
    && ["P101.1", "P101.2", "P101.3", "P101.4", "P101.5"].includes(status.previousPhase)
    && ["P101.3", "P101.4", "P101.5", "P101.6", "P101.7"].includes(status.nextPhase)
    && statusById.get("P101.2")?.status === "complete"
    && roadmapById.get("P101.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P101.3 handoff planned or complete", ["planned", "complete"].includes(statusById.get("P101.3")?.status) && ["planned", "complete"].includes(roadmapById.get("P101.3")?.status));
addCheck("no raw private IDs exposed", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("no unsafe runnable actions invented", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized));
addCheck("P101.2 avoids forbidden file scope", !p1012.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("dashboard/src/") || file.startsWith("dashboard/tests/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P101.2 founder live-use readiness model.",
        "- Confirms the model composes existing local founder runtime, PRD, workstream, DB readiness, dry-run admission, and Live Readiness evidence.",
        "- Confirms P101.2 does not render Command Center UI, dispatch agents, execute workers/tools, mutate projects, call providers/models, write hosted DB state, deploy, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1012-founder-live-use-readiness-model",
        "- npm run check:p1011-founder-live-use-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P101.2 is a local readiness model only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P101.2 Founder Live Use Readiness Model Report", phase: "P101.2" },
);

printCheckReport("P101.2 Founder Live Use Readiness Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
