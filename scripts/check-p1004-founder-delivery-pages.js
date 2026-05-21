import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1004-founder-delivery-pages-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p1004 = subphaseById.get("P100.4");
const deliveryPages = [
  "Projects",
  "Workspace",
  "Implementation",
  "Agent Workbench",
  "Release Control",
  "Agent Registry",
  "Skill Registry",
  "Hook Registry",
  "Tool Gateway",
  "Trigger Integration",
  "API Batch Adapter",
  "Agent Rooms",
  "Test Center",
  "Quality Intelligence",
];
const deliveryKeys = [
  "agentRegistry",
  "release",
  "projects",
  "skills",
  "hooks",
  "workspace",
  "implementation",
  "workbench",
  "tools",
  "triggers",
  "apiBatch",
  "agentRooms",
  "tests",
  "quality",
];
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1004-founder-delivery-pages"]));
addCheck("P100.4 contract complete with P100.5 handoff", p1004?.status === "complete" && subphaseById.get("P100.5")?.status === "planned");
addCheck("P100.4 allowed files scoped", p1004?.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p1004.allowedFiles.includes("dashboard/tests/routes.spec.js"));
addCheck("P100.4 allowed files avoid forbidden roots", !p1004?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("delivery board map exists", pageSource.includes("const FOUNDER_DELIVERY_BOARDS") && deliveryKeys.every((key) => pageSource.includes(`${key}:`)));
addCheck("delivery pages render board", deliveryKeys.every((key) => pageSource.includes(`FOUNDER_DELIVERY_BOARDS.${key}`)));
addCheck("delivery board titles are registered", deliveryPages.every((title) => pageSource.includes(`title: "${title}"`)));
addCheck("Test Center primary copy avoids raw phase labels", !pageSource.includes("Phase: {tsm.policyPhase") && !pageSource.includes("P55"));
addCheck("Playwright delivery coverage added", routeTests.includes("Founder delivery pages show useful action boards") && deliveryPages.every((title) => routeTests.includes(`title: "${title}"`)));
addCheck("platform roadmap records P100.4", /P100\.4 is\s+complete/.test(platformRoadmap) && (/P100\.5 is\s+next/.test(platformRoadmap) || /P100\.5 is\s+planned/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  statusById.get("P100")?.status === "in_progress"
    && statusById.get("P100.4")?.status === "complete"
    && status.currentPhase === "P100.4"
    && status.previousPhase === "P100.3"
    && status.nextPhase === "P100.5",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P100.4", roadmapById.get("P100.4")?.track === "NEXUS_OS" && roadmapById.get("P100.4")?.status === "complete");
addCheck("P100.5 handoff exists", statusById.get("P100.5")?.status === "planned" && roadmapById.get("P100.5")?.status === "planned");

const deliverySlice = [
  pageSource.slice(pageSource.indexOf("const FOUNDER_DELIVERY_BOARDS"), pageSource.indexOf("function countEvidenceForTask")),
  pageSource.slice(pageSource.indexOf("/* ─── Agent Registry Page ─── */"), pageSource.indexOf("/* ─── Approvals Page ─── */")),
  pageSource.slice(pageSource.indexOf("/* ─── Release Control Page ─── */"), pageSource.indexOf("/* ─── Worker Runtime Page ─── */")),
  pageSource.slice(pageSource.indexOf("function SkillRegistryPage"), pageSource.indexOf("function LiveApiPage")),
  pageSource.slice(pageSource.indexOf("function TestCenterPage"), pageSource.indexOf("function PlannedRoutePage")),
].join("\n");

addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(deliverySlice));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now|approve now/i.test(deliverySlice));
addCheck("no unsafe imports or provider wiring", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P100.4 founder delivery page utility.",
        "- Confirms delivery pages expose founder action boards for projects, workspace, implementation, workbench, release, agents, skills, hooks, tools, triggers, batch, rooms, tests, and quality.",
        "- Confirms this is display-only UX; registry mutation, tool execution, worker execution, project writes, deploy, package, provider calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1004-founder-delivery-pages",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder delivery pages\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P100.4 improves founder delivery pages only. Runtime and OS page audits remain planned for P100.5. It does not dispatch agents, execute workers/tools, mutate project source, edit registries, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P100.4 Founder Delivery Pages Report", phase: "P100.4" },
);

printCheckReport("P100.4 Founder Delivery Pages Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
