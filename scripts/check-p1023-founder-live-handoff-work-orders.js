import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P102_FOUNDER_LIVE_HANDOFF_WORK_ORDERS_PHASE,
  buildFounderLiveHandoffWorkOrders,
  validateFounderLiveHandoffWorkOrders,
} from "../live-ready/founderLiveHandoffWorkOrders.js";
import { P102_HANDOFF_SAFETY_FLAGS } from "../live-ready/founderLiveHandoffManifest.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1023-founder-live-handoff-work-orders-report.md";

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
const source = readText("live-ready/founderLiveHandoffWorkOrders.js");
const envelope = buildFounderLiveHandoffWorkOrders({
  founderIdea: "Build a simple iOS Snake game for the App Store",
});
const validation = validateFounderLiveHandoffWorkOrders(envelope);
const data = envelope.data || {};
const p1023 = subphaseById.get("P102.3") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1023-founder-live-handoff-work-orders"]));
addCheck("work order exports exist", source.includes("buildFounderLiveHandoffWorkOrders") && source.includes("validateFounderLiveHandoffWorkOrders"));
addCheck("phase constant", P102_FOUNDER_LIVE_HANDOFF_WORK_ORDERS_PHASE === "P102.3");
addCheck("work-order dry run validates", validation.valid, validation.errors.join("; "));
addCheck("work-order rows useful", data.workOrderRows?.length === 6 && data.workOrderReadiness?.dryRunRowCount === 6);
addCheck("agent labels present", data.workOrderRows?.every((row) => Boolean(row.proposedAgent) && Boolean(row.proposedWork)));
addCheck("validation command present on rows", data.workOrderRows?.every((row) => row.validationCommand === "npm run check:p1023-founder-live-handoff-work-orders"));
addCheck("execution remains blocked", data.workOrderReadiness?.executableWorkOrderCount === 0 && data.workOrderReadiness?.dispatchableWorkOrderCount === 0 && data.workOrderReadiness?.projectMutationWorkOrderCount === 0);
addCheck("rows are non-executable", data.workOrderRows?.every((row) => row.executable === false && row.dispatchable === false && row.projectMutationAllowed === false));
addCheck("all safety flags false", P102_HANDOFF_SAFETY_FLAGS.every((flag) => data[flag] === false && data.workOrderRows.every((row) => row[flag] === false)));
addCheck("reuses manifest", source.includes("buildFounderLiveHandoffManifest"));
addCheck("contract marks P102.3 complete", p1023.status === "complete");
addCheck("P102.4 remains planned", subphaseById.get("P102.4")?.status === "planned");
addCheck("docs record P102.3", /P102\.3 Governed Work Order Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P102.3", /P102\.3 is\s+complete/.test(platformRoadmap) && /P102\.4 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P102.3"
    && status.previousPhase === "P102.2"
    && status.nextPhase === "P102.4"
    && statusById.get("P102")?.status === "in_progress"
    && statusById.get("P102.3")?.status === "complete"
    && roadmapById.get("P102.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(data)));
addCheck("no unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify(data)));
addCheck("P102.3 avoids forbidden file scope", !(p1023.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P102.3 governed local work-order dry-run rows.",
        "- Confirms the rows are useful for founder review while remaining non-executable, non-dispatchable, and project-safe.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1023-founder-live-handoff-work-orders",
        "- npm run check:p1022-founder-live-handoff-manifest",
        "- npm run check:p1021-founder-live-handoff-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P102.3 is dry-run planning only. It does not create live work orders, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P102.3 Founder Live Handoff Work Orders Report", phase: "P102.3" },
);

printCheckReport("P102.3 Founder Live Handoff Work Orders Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
