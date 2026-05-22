import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1036-founder-live-work-admission-docs-roadmap-report.md";

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
const contract = readJson("contracts/os-roadmap/p103-founder-live-work-admission-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const readme = readText("README.md");
const guide = readText("docs/usage/COMMAND_CENTER_GUIDE.md");
const plan = readText("docs/architecture/P103_FOUNDER_LIVE_WORK_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1036 = subphaseById.get("P103.6") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1036-founder-live-work-admission-docs-roadmap"]));
addCheck("P103.6 contract complete", p1036.status === "complete");
addCheck("README current status updated", /Current Status Through P103\.6/.test(readme) && /P103 founder live work admission/.test(readme));
addCheck("README records blocked execution", /Approval and executable counts remain `0`/.test(readme) && /provider\/model calls[\s\S]*remain blocked/.test(readme));
addCheck("Command Center guide includes P103 section", /Founder Live Work Admission/.test(guide) && /Current P103 posture/.test(guide));
addCheck("Command Center guide records evidence", /p1032-founder-live-work-admission-model-report/.test(guide) && /p1035-founder-live-work-admission-validation-report/.test(guide));
addCheck("Command Center guide records UX safety", /Approval blocked/.test(guide) && /fake working actions/.test(guide));
addCheck("plan records P103.6", /P103\.6 Docs \/ Roadmap[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P103.6", /P103\.6 is\s+complete/.test(platformRoadmap) && /P103\.7 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ["P103.6", "P103.7"].includes(status.currentPhase)
    && ["P103.5", "P103.6"].includes(status.previousPhase)
    && ["P103.7", "P104"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P103")?.status)
    && statusById.get("P103.6")?.status === "complete"
    && roadmapById.get("P103.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P103.7 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P103.7")?.status));
addCheck("docs avoid unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(readme + guide + plan + platformRoadmap));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(readme + guide));
addCheck("P103.6 avoids forbidden file scope", !(p1036.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P103.6 README, Command Center guide, roadmap, plan, package script, phase status, and docs safety.",
        "- Confirms founder live work admission is documented as local admission/review only with approval and execution blocked.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1036-founder-live-work-admission-docs-roadmap",
        "- npm run check:p1035-founder-live-work-admission-validation",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P103.6 is documentation and roadmap closure only. It does not approve work, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P103.6 Founder Live Work Admission Docs Roadmap Report", phase: "P103.6" },
);

printCheckReport("P103.6 Founder Live Work Admission Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
