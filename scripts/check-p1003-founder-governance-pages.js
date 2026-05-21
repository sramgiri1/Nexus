import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1003-founder-governance-pages-report.md";

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
const p1003 = subphaseById.get("P100.3");
const governancePages = [
  "Approvals",
  "Verification Gates",
  "Contracts",
  "Evidence",
  "Safety Center",
  "Cost Center",
  "Policy Center",
  "Secrets Boundary",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1003-founder-governance-pages"]));
addCheck("P100.3 contract complete with P100.4 handoff", p1003?.status === "complete" && subphaseById.get("P100.4")?.status === "planned");
addCheck("P100.3 allowed files scoped", p1003?.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p1003.allowedFiles.includes("dashboard/tests/routes.spec.js"));
addCheck("P100.3 allowed files avoid forbidden roots", !p1003?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("governance pages render board", governancePages.every((title) => pageSource.includes(`title="${title}"`)));
addCheck("governance boards expose required founder fields", [
  "Founder use",
  "Current state",
  "Next action",
  "Blocker",
  "Owner",
  "Evidence",
  "Activity",
  "Cost impact",
].every((label) => pageSource.includes(label)));
addCheck("policy and cost primary copy avoids stale phase labels", !pageSource.includes("execution still remains disabled in P57") && !pageSource.includes("before P59") && !pageSource.includes("in P58."));
addCheck("Playwright governance coverage added", routeTests.includes("Founder governance pages show useful action boards") && governancePages.every((title) => routeTests.includes(`title: "${title}"`)));
addCheck("platform roadmap records P100.3", /P100\.3 is\s+complete/.test(platformRoadmap) && (/P100\.4 is\s+next/.test(platformRoadmap) || /P100\.4 is\s+planned/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  statusById.get("P100")?.status === "in_progress"
    && statusById.get("P100.3")?.status === "complete"
    && status.currentPhase === "P100.3"
    && status.previousPhase === "P100.2"
    && status.nextPhase === "P100.4",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P100.3", roadmapById.get("P100.3")?.track === "NEXUS_OS" && roadmapById.get("P100.3")?.status === "complete");
addCheck("P100.4 handoff exists", statusById.get("P100.4")?.status === "planned" && roadmapById.get("P100.4")?.status === "planned");

const governanceSlice = [
  pageSource.slice(pageSource.indexOf("/* ─── Approvals Page ─── */"), pageSource.indexOf("/* ─── Release Control Page ─── */")),
  pageSource.slice(pageSource.indexOf("/* ─── Cost Center Page ─── */"), pageSource.indexOf("function MemoryCenterPage")),
].join("\n");

addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(governanceSlice));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now|approve now/i.test(governanceSlice));
addCheck("no unsafe imports or provider wiring", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P100.3 founder governance page utility.",
        "- Confirms Approvals, Verification Gates, Contracts, Evidence, Safety Center, Cost Center, Policy Center, and Secrets Boundary expose a consistent founder action board.",
        "- Confirms this is display-only UX; policy, secrets, spend, and execution mutation remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1003-founder-governance-pages",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder governance pages\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P100.3 improves founder governance pages only. Delivery, runtime, and OS page audits remain planned for P100.4 through P100.5. It does not approve execution, dispatch agents, execute workers/tools, mutate project source, edit policies, reveal secrets, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P100.3 Founder Governance Pages Report", phase: "P100.3" },
);

printCheckReport("P100.3 Founder Governance Pages Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
