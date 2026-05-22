import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1016-founder-live-use-docs-roadmap-report.md";

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
const contract = readJson("contracts/os-roadmap/p101-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const readme = readText("README.md");
const guide = readText("docs/usage/COMMAND_CENTER_GUIDE.md");
const plan = readText("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1016 = subphaseById.get("P101.6") || {};
const p1017 = subphaseById.get("P101.7") || {};
const completedSubphases = ["P101.1", "P101.2", "P101.3", "P101.4", "P101.5", "P101.6"];
const validationCommands = [
  "npm run check:p1016-founder-live-use-docs-roadmap",
  "npm run check:p1015-founder-live-use-validation",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const unsafeClaimPattern = /run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i;
const privateIdPattern = /(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1016-founder-live-use-docs-roadmap"]));
addCheck("contract marks P101.1-P101.6 complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P101.7 planned", p1017.status === "planned");
addCheck("contract declares P101.6 validation", validationCommands.every((command) => p1016.validationCommands?.includes(command)));
addCheck("P101.6 avoids forbidden file scope", !(p1016.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

addCheck("README records P101.6 current status", readme.includes("Current Status Through P101.6") && readme.includes("P101 founder live-use hardening"));
addCheck("README states execution remains blocked", readme.includes("Executable and dispatchable lane counts") && readme.includes("provider/model calls"));
addCheck("Command Center guide includes founder live-use readiness", guide.includes("## Founder Live-Use Readiness") && guide.includes("/command-center/live-readiness"));
addCheck("Command Center guide lists founder routes", ["/command-center/lite", "/command-center/business-build", "/command-center/agent-flow", "/command-center/live-readiness"].every((route) => guide.includes(route)));
addCheck("Command Center guide records evidence", guide.includes("reports/p1013-founder-live-use-review-packet-report.md") && guide.includes("reports/p1015-founder-live-use-validation-report.md"));
addCheck("Command Center guide preserves theme requirement", guide.includes("System, Dark, and Light theme behavior"));
addCheck("P101 plan records P101.6 complete", /P101\.6 Docs \/ Roadmap[\s\S]*Status:\s+complete/.test(plan));
addCheck("P101 plan records validation commands", validationCommands.every((command) => plan.includes(command)));
addCheck("platform roadmap records P101.6", /P101\.6 is\s+complete/.test(platformRoadmap) && /P101\.7 is\s+next/.test(platformRoadmap));

addCheck("prior P101 validation report exists", exists("reports/p1015-founder-live-use-validation-report.md"));
addCheck("P101 Command Center UX report exists", exists("reports/p1014-command-center-founder-live-use-ux-report.md"));
addCheck(
  "phase status advanced",
  status.currentPhase === "P101.6"
    && status.previousPhase === "P101.5"
    && status.nextPhase === "P101.7"
    && statusById.get("P101")?.status === "in_progress"
    && statusById.get("P101.6")?.status === "complete"
    && roadmapById.get("P101.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P101.7 handoff remains planned", statusById.get("P101.7")?.status === "planned" && roadmapById.get("P101.7")?.status === "planned");
addCheck("phase status records P101.6 checks", validationCommands.every((command) => statusById.get("P101.6")?.checksRun?.includes(command)));
addCheck("docs do not claim unsafe execution", !unsafeClaimPattern.test([readme, guide, plan, platformRoadmap].join("\n")));
addCheck("docs do not expose raw private ids", !privateIdPattern.test([readme, guide, plan, platformRoadmap].join("\n")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P101.6 docs, roadmap, and operator-guide closure.",
        "- Confirms README, Command Center guide, P101 plan, platform roadmap, reports, and OS status are aligned.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P101.6 is documentation and roadmap closure only. Final P101 closure remains P101.7, and unsafe execution remains blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P101.6 Founder Live Use Docs Roadmap Report", phase: "P101.6" },
);

printCheckReport("P101.6 Founder Live Use Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
