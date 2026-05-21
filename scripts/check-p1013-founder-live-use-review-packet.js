import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import {
  P101_FOUNDER_LIVE_USE_REVIEW_PACKET_PHASE,
  buildFounderLiveUseReviewPacket,
  validateFounderLiveUseReviewPacket,
} from "../live-ready/founderLiveUseReviewPacket.js";
import { P101_LIVE_USE_SAFETY_FLAGS } from "../live-ready/founderLiveUseReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1013-founder-live-use-review-packet-report.md";

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
const p1013 = contract.subphases?.find((entry) => entry.phaseId === "P101.3");
const p1014 = contract.subphases?.find((entry) => entry.phaseId === "P101.4");
const packetText = readText("live-ready/founderLiveUseReviewPacket.js");
const docs = readText("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");

const packet = buildFounderLiveUseReviewPacket();
const blockedPacket = buildFounderLiveUseReviewPacket({
  runtimeApproval: {},
  operatorApproval: false,
  rollbackAccepted: false,
  auditAccepted: false,
  validationCommandsAccepted: false,
  mode: "preview",
  enableWrites: false,
});
const packetValidation = validateFounderLiveUseReviewPacket(packet);
const blockedValidation = validateFounderLiveUseReviewPacket(blockedPacket);
const envelopeValidation = validateResultEnvelope(packet);

function allUnsafeFlagsFalse(envelope) {
  const data = envelope.data || {};
  return P101_LIVE_USE_SAFETY_FLAGS.every((flag) => data[flag] === false)
    && (data.laneReviews || []).every((lane) => P101_LIVE_USE_SAFETY_FLAGS.every((flag) => lane[flag] === false));
}

const serialized = JSON.stringify([packet.data, blockedPacket.data]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1013-founder-live-use-review-packet"]));
addCheck("phase constant is P101.3", P101_FOUNDER_LIVE_USE_REVIEW_PACKET_PHASE === "P101.3");
addCheck("result envelope validates", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("ready packet validates", packetValidation.valid, packetValidation.errors.join("; "));
addCheck("blocked packet validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("packet is display-safe local review", packet.data.reviewMode === "display-safe-local-review-only" && packet.data.ready === true);
addCheck("blocked packet needs context", blockedPacket.data.currentState === "founder_live_use_review_packet_needs_context" && blockedPacket.data.ready === false);
addCheck("packet has checklist and lanes", packet.data.checklist.length >= 4 && packet.data.laneReviews.length === 6);
addCheck("execution remains blocked", packet.data.executableLaneCount === 0 && packet.data.dispatchableLaneCount === 0 && packet.data.projectMutationLaneCount === 0);
addCheck("lane reviews are not executable", packet.data.laneReviews.every((lane) => lane.executable === false && lane.dispatchable === false && lane.projectMutationAllowed === false));
addCheck("unsafe runtime flags remain false", allUnsafeFlagsFalse(packet) && allUnsafeFlagsFalse(blockedPacket));
addCheck("packet reuses P101.2 readiness model", packetText.includes("buildFounderLiveUseReadiness") && packet.data.sourceReadinessPhase === "P101.2");
addCheck("contract marks P101.3 complete", p1013?.status === "complete" && p1014?.status === "planned");
addCheck("docs record P101.3", /P101\.3 Founder Live-Use Review Packet[\s\S]*Status:\s+complete/.test(docs) && docs.includes("check:p1013-founder-live-use-review-packet"));
addCheck("platform roadmap records P101.3", /P101\.3 is\s+complete/.test(platformRoadmap) && /P101\.4 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P101.3"
    && status.previousPhase === "P101.2"
    && status.nextPhase === "P101.4"
    && statusById.get("P101.3")?.status === "complete"
    && roadmapById.get("P101.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P101.4 handoff remains planned", statusById.get("P101.4")?.status === "planned" && roadmapById.get("P101.4")?.status === "planned");
addCheck("no raw private IDs exposed", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("no unsafe runnable actions invented", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized));
addCheck("P101.3 avoids forbidden file scope", !p1013.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("dashboard/src/") || file.startsWith("dashboard/tests/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P101.3 founder live-use review packet.",
        "- Confirms the packet is built from the P101.2 readiness model and exposes checklist plus lane review rows for Command Center rendering.",
        "- Confirms P101.3 does not render Command Center UI, dispatch agents, execute workers/tools, mutate projects, call providers/models, write hosted DB state, deploy, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1013-founder-live-use-review-packet",
        "- npm run check:p1012-founder-live-use-readiness-model",
        "- npm run check:p1011-founder-live-use-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P101.3 is a display-safe review packet only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P101.3 Founder Live Use Review Packet Report", phase: "P101.3" },
);

printCheckReport("P101.3 Founder Live Use Review Packet Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
