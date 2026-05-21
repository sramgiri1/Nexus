import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1005-founder-runtime-os-pages-report.md";

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
const p1005 = subphaseById.get("P100.5");
const runtimeOsPages = [
  "Worker Runtime",
  "Batch Queue",
  "Live API Status",
  "Durable State",
  "Service Health",
  "Memory Center",
  "Data & Context Center",
  "OS Roadmap",
  "Activity Log",
  "Recovery",
  "Self-Update",
  "Deploy Monitoring",
  "Project Shipping",
  "Auth Governance",
  "Observability",
  "Backup / DR",
  "Isolation",
  "Compliance",
  "Enterprise Preview",
  "Live Readiness",
  "Docs & Guides",
  "Settings",
];
const runtimeOsKeys = [
  "workers",
  "batch",
  "liveapi",
  "database",
  "services",
  "memory",
  "context",
  "roadmap",
  "activity",
  "recovery",
  "selfUpdate",
  "deployMonitoring",
  "projectShipping",
  "authGovernance",
  "observability",
  "backupDr",
  "isolation",
  "compliance",
  "enterprisePreview",
  "liveReadiness",
  "docs",
  "settings",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1005-founder-runtime-os-pages"]));
addCheck("P100.5 contract complete with P100.6 handoff", p1005?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P100.6")?.status));
addCheck("P100.5 allowed files scoped", p1005?.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p1005.allowedFiles.includes("dashboard/tests/routes.spec.js"));
addCheck("P100.5 allowed files avoid forbidden roots", !p1005?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("runtime OS board map exists", pageSource.includes("const FOUNDER_RUNTIME_OS_BOARDS") && runtimeOsKeys.every((key) => pageSource.includes(`${key}:`)));
addCheck("runtime OS pages render board", runtimeOsKeys.every((key) => pageSource.includes(`FOUNDER_RUNTIME_OS_BOARDS.${key}`)));
addCheck("runtime OS board titles are registered", runtimeOsPages.every((title) => pageSource.includes(`title: "${title}"`)));
addCheck("Playwright runtime OS coverage added", routeTests.includes("Founder runtime and OS pages show useful action boards") && runtimeOsPages.every((title) => routeTests.includes(`title: "${title}"`)));
addCheck("platform roadmap records P100.5", /P100\.5 is\s+complete/.test(platformRoadmap) && (/P100\.6 is\s+next/.test(platformRoadmap) || /P100\.6 is\s+planned/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  statusById.get("P100")?.status === "in_progress"
    && statusById.get("P100.5")?.status === "complete"
    && status.phases.some((phase) => phase.phaseId === status.currentPhase)
    && status.phases.some((phase) => phase.phaseId === status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P100.5", roadmapById.get("P100.5")?.track === "NEXUS_OS" && roadmapById.get("P100.5")?.status === "complete");
addCheck("P100.6 handoff exists", ["planned", "complete"].includes(statusById.get("P100.6")?.status) && ["planned", "complete"].includes(roadmapById.get("P100.6")?.status));

const runtimeSlice = [
  pageSource.slice(pageSource.indexOf("const FOUNDER_RUNTIME_OS_BOARDS"), pageSource.indexOf("function countEvidenceForTask")),
  pageSource.slice(pageSource.indexOf("/* ─── Worker Runtime Page ─── */"), pageSource.indexOf("/* ─── Cost Center Page ─── */")),
  pageSource.slice(pageSource.indexOf("function OSRoadmapPage"), pageSource.indexOf("const DOCS_GUIDES")),
  pageSource.slice(pageSource.indexOf("function DocsGuidesPage"), pageSource.indexOf("function activityMatchesSearch")),
  pageSource.slice(pageSource.indexOf("function ActivityLogPage"), pageSource.indexOf("function MemoryCenterPage")),
  pageSource.slice(pageSource.indexOf("function MemoryCenterPage"), pageSource.indexOf("function PlannedRoutePage")),
  pageSource.slice(pageSource.indexOf("function PlannedRoutePage"), pageSource.indexOf("/* ═══════════════════════════════════════════════════════")),
].join("\n");

addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(runtimeSlice));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now|approve now/i.test(runtimeSlice));
addCheck("no unsafe imports or provider wiring", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P100.5 founder runtime and OS page utility.",
        "- Confirms runtime, platform, OS, docs, activity, recovery, live readiness, and settings pages expose founder action boards with current state, next action, blockers, owner, evidence, activity, cost, and lane posture.",
        "- Confirms this is display-only UX; provider/model calls, agent dispatch, worker/tool execution, project writes, hosted DB writes, deploy, package, release, export, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1005-founder-runtime-os-pages",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder runtime and OS pages\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P100.5 improves runtime and OS page usefulness only. It does not dispatch agents, execute workers/tools, mutate project source, write hosted DB records, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P100.5 Founder Runtime And OS Pages Report", phase: "P100.5" },
);

printCheckReport("P100.5 Founder Runtime And OS Pages Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
