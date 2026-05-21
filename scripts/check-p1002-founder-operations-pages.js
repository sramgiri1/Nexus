import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1002-founder-operations-pages-report.md";

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
const contract = readJson("contracts/os-roadmap/p100-command-center-founder-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const styleSource = readText("dashboard/src/styles-command-center-v2.css");
const routeTests = readText("dashboard/tests/routes.spec.js");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p1002 = subphaseById.get("P100.2");
const forbiddenAllowedPatterns = [
  /^projects\//,
  /^careloop\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
  /^\.env/,
];
const operationsPages = [
  "Mission Control",
  "Task Queue",
  "Agent Flow",
  "Founder Intake",
  "Business Build",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1002-founder-operations-pages"]));
addCheck("P100.2 contract complete with P100.3 handoff", p1002?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P100.3")?.status));
addCheck("P100.2 allowed files scoped", p1002?.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p1002.allowedFiles.includes("dashboard/tests/routes.spec.js"));
addCheck("P100.2 allowed files avoid forbidden roots", !p1002?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("shared founder operations board exists", pageSource.includes("function FounderOperationsBoard") && pageSource.includes("ccv2-founder-ops-board"));
addCheck("operations pages render board", operationsPages.every((title) => pageSource.includes(`title="${title}"`)));
addCheck("board exposes required founder fields", [
  "Founder use",
  "Current state",
  "Next action",
  "Blocker",
  "Owner",
  "Evidence",
  "Activity",
  "Cost impact",
].every((label) => pageSource.includes(label)));
addCheck("agent lane board styling exists", styleSource.includes(".ccv2-founder-ops-board__lanes") && styleSource.includes(".ccv2-founder-ops-board__lane"));
addCheck("Playwright operations coverage added", routeTests.includes("Founder operations pages show useful action boards") && routeTests.includes("founder operations board") && operationsPages.every((title) => routeTests.includes(`title: "${title}"`)));
addCheck("platform roadmap records P100.2", /P100\.2 is\s+complete/.test(platformRoadmap) && (/P100\.3 is\s+next/.test(platformRoadmap) || /P100\.3 is\s+planned/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  statusById.get("P100")?.status === "in_progress"
    && statusById.get("P100.2")?.status === "complete"
    && status.phases.some((phase) => phase.phaseId === status.currentPhase)
    && status.phases.some((phase) => phase.phaseId === status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P100.2", roadmapById.get("P100.2")?.track === "NEXUS_OS" && roadmapById.get("P100.2")?.status === "complete");
addCheck("P100.3 handoff exists", ["planned", "complete"].includes(statusById.get("P100.3")?.status) && ["planned", "complete"].includes(roadmapById.get("P100.3")?.status));

const operationsSlice = [
  pageSource.slice(pageSource.indexOf("function FounderOperationsBoard"), pageSource.indexOf("function countEvidenceForTask")),
  pageSource.slice(pageSource.indexOf("function AgentFlowPage"), pageSource.indexOf("function AskNexusPage")),
  pageSource.slice(pageSource.indexOf("function MissionControlPage"), pageSource.indexOf("/* ─── Task Queue Page ─── */")),
  pageSource.slice(pageSource.indexOf("function TaskQueuePage"), pageSource.indexOf("function AgentRegistryPage")),
  pageSource.slice(pageSource.indexOf("function FounderIntakePage"), pageSource.indexOf("function ExecutionAdmissionCard")),
].join("\n");

addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(operationsSlice));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now|approve now/i.test(operationsSlice));
addCheck("no unsafe imports or provider wiring", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P100.2 founder operations page utility.",
        "- Confirms Mission Control, Task Queue, Agent Flow, Founder Intake, and Business Build expose a consistent founder action board.",
        "- Confirms this is display-only UX; runtime execution remains blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1002-founder-operations-pages",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder operations pages\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P100.2 improves founder operations pages only. Governance, delivery, runtime, and OS pages remain for P100.3 through P100.5. It does not approve execution, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P100.2 Founder Operations Pages Report", phase: "P100.2" },
);

printCheckReport("P100.2 Founder Operations Pages Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
