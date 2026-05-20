import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import {
  buildFounderActivationReviewPacket,
  validateFounderActivationReviewPacket,
} from "../live-ready/founderActivationReviewPacket.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p913-founder-activation-review-packet-report.md";

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
const source = readText("live-ready/founderActivationReviewPacket.js");

const envelope = buildFounderActivationReviewPacket({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const envelopeValidation = validateResultEnvelope(envelope);
const packetValidation = validateFounderActivationReviewPacket(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(data);

addCheck("result envelope valid", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("review packet validation passes", packetValidation.valid, packetValidation.errors.join("; "));
addCheck("source PRD retained", data.sourcePrd?.title?.includes("Snake") && data.sourcePrd?.reviewState === "ready_for_operator_review");
addCheck("review items complete", Array.isArray(data.reviewItems) && data.reviewItems.length === 8);
addCheck("operator checklist present", Array.isArray(data.operatorChecklist) && data.operatorChecklist.length >= 4);
addCheck("review packet useful", serialized.includes("Product") || serialized.includes("product"));
addCheck("review readiness present", data.reviewReadiness?.ready === true && data.reviewReadiness?.totalItemCount === 8);
addCheck("all review items remain non-activating", data.reviewItems?.every((item) => item.activationAllowed === false));
addCheck("local operations are non-mutating", data.allowedLocalOperations?.every((entry) => !/dispatch|write project|create project|deploy|package/i.test(entry)));
addCheck("unsafe runtime flags blocked", ["providerCallsAllowed", "modelCallsAllowed", "agentDispatchAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectCreationAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "exportExecutionAllowed", "packageCreationAllowed", "providerSpendAllowed"].every((flag) => data[flag] === false && data.runtimeFlags?.[flag] === false));
addCheck("no unsafe imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|prisma|deploy|packages|projects)\//.test(source));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p913-founder-activation-review-packet"]));
addCheck("contract tracks P91.3 files", contract.includes("P91.3") && contract.includes("live-ready/founderActivationReviewPacket.js") && contract.includes("check:p913-founder-activation-review-packet"));
addCheck("docs record P91.3", docs.includes("P91.3 is complete") && docs.includes("npm run check:p913-founder-activation-review-packet"));
addCheck(
  "platform roadmap records P91.3",
  platformRoadmap.includes("P91.3 is complete") &&
    (platformRoadmap.includes("P91.4 is next") || platformRoadmap.includes("P91.4 is complete")),
);
addCheck(
  "phase status advanced",
  statusById.get("P91")?.status === "in_progress"
    && statusById.get("P91.3")?.status === "complete"
    && ["P91.3", "P91.4", "P91.5", "P91.6", "P91.7"].includes(status.currentPhase)
    && ["P91.2", "P91.3", "P91.4", "P91.5", "P91.6"].includes(status.previousPhase)
    && ["P91.4", "P91.5", "P91.6", "P91.7", "P92"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P91.3", roadmapById.get("P91.3")?.track === "NEXUS_OS" && roadmapById.get("P91.3")?.status === "complete");
addCheck(
  "P91.4 handoff exists",
  ["planned", "complete"].includes(statusById.get("P91.4")?.status) &&
    ["planned", "complete"].includes(roadmapById.get("P91.4")?.status),
);
addCheck("status checker accepts P91.4", statusChecker.includes("\"P91.4\""));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    { title: "Scope", body: "- Validates P91.3 local founder activation review packet.\n- Confirms review items and operator checklist are local-only.\n- Confirms unsafe runtime operations remain blocked." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: "- npm run check:p913-founder-activation-review-packet\n- npm run check:p912-founder-workstream-activation-model\n- npm run check:p911-founder-workstream-activation-contract\n- npm run check:os-phase-status\n- npm run check:phase-validation-coverage\n- git diff --check" },
    { title: "Known Limitations", body: "- P91.3 is a local review packet only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P91.3 Founder Activation Review Packet Report", phase: "P91.3" },
);

printCheckReport("P91.3 Founder Activation Review Packet Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
