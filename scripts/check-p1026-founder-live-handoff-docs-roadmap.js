import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1026-founder-live-handoff-docs-roadmap-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return existsSync(join(ROOT, relativePath));
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
const readme = readText("README.md");
const guide = readText("docs/usage/COMMAND_CENTER_GUIDE.md");
const plan = readText("docs/architecture/P102_FOUNDER_LIVE_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const completedSubphases = ["P102.1", "P102.2", "P102.3", "P102.4", "P102.5", "P102.6"];
const validationCommands = [
  "npm run check:p1026-founder-live-handoff-docs-roadmap",
  "npm run check:p1025-founder-live-handoff-validation",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1026-founder-live-handoff-docs-roadmap"]));
addCheck("contract marks P102.1-P102.6 complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P102.7 planned", subphaseById.get("P102.7")?.status === "planned");
addCheck("README records P102.6 current status", readme.includes("Current Status Through P102.6") && readme.includes("P102 founder live handoff"));
addCheck("Command Center guide includes founder live handoff", guide.includes("## Founder Live Handoff") && guide.includes("/command-center/live-readiness"));
addCheck("Command Center guide records evidence", guide.includes("reports/p1022-founder-live-handoff-manifest-report.md") && guide.includes("reports/p1023-founder-live-handoff-work-orders-report.md"));
addCheck("Command Center guide preserves theme requirement", guide.includes("System, Dark, and Light theme behavior"));
addCheck("P102 plan records P102.6 complete", /P102\.6 Docs \/ Roadmap \/ Operator Guide[\s\S]*Status:\s+complete/.test(plan));
addCheck("P102 plan records validation commands", validationCommands.every((command) => plan.includes(command)));
addCheck("platform roadmap records P102.6", /P102\.6 is\s+complete/.test(platformRoadmap) && /P102\.7 is\s+next/.test(platformRoadmap));
addCheck("prior P102 validation report exists", exists("reports/p1025-founder-live-handoff-validation-report.md"));
addCheck(
  "phase status advanced",
  status.currentPhase === "P102.6"
    && status.previousPhase === "P102.5"
    && status.nextPhase === "P102.7"
    && statusById.get("P102")?.status === "in_progress"
    && statusById.get("P102.6")?.status === "complete"
    && roadmapById.get("P102.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P102.7 handoff remains planned", statusById.get("P102.7")?.status === "planned" && roadmapById.get("P102.7")?.status === "planned");
addCheck("docs do not claim unsafe execution", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test([readme, guide, plan, platformRoadmap].join("\n")));
addCheck("docs do not expose raw private ids", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test([readme, guide, plan, platformRoadmap].join("\n")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P102.6 docs, roadmap, and operator-guide closure.",
        "- Confirms README, Command Center guide, P102 plan, platform roadmap, reports, and OS status are aligned.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P102.6 is documentation and roadmap closure only. Final P102 closure remains P102.7, and unsafe execution remains blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P102.6 Founder Live Handoff Docs Roadmap Report", phase: "P102.6" },
);

printCheckReport("P102.6 Founder Live Handoff Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
