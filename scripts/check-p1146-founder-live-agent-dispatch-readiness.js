import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1146-founder-live-agent-dispatch-readiness-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1146 = subphaseById.get("P114.6") || {};
const p1147 = subphaseById.get("P114.7") || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P114.6";
const allowedFiles = new Set(p1146.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "dashboard/src/",
  "dashboard/tests/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];

const requiredScripts = [
  "check:p1141-founder-live-agent-dispatch-contract",
  "check:p1142-founder-live-agent-dispatch-readiness",
  "check:p1143-founder-live-agent-dispatch-readiness",
  "check:p1144-founder-live-agent-dispatch-readiness",
  "check:p1145-founder-live-agent-dispatch-readiness",
  "check:p1146-founder-live-agent-dispatch-readiness",
];

const requiredReports = [
  "reports/p1141-founder-live-agent-dispatch-contract-report.md",
  "reports/p1142-founder-live-agent-dispatch-readiness-report.md",
  "reports/p1143-founder-live-agent-dispatch-readiness-report.md",
  "reports/p1144-founder-live-agent-dispatch-readiness-report.md",
  "reports/p1145-founder-live-agent-dispatch-readiness-report.md",
];

const docsText = [plan, platformRoadmap, readme].join("\n");
const uxSourceText = [businessBuildSource, pageSource].join("\n");

function hasPositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains)\b/i.test(context);
  });
}

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck(
  "P114.1-P114.5 scripts and reports exist",
  requiredReports.every((report) => existsSync(join(ROOT, report)))
    && requiredReports.every((report) => /Result[\s\S]*PASS|PASS \(/.test(readText(report))),
);
addCheck("contract marks P114.1-P114.6 complete", ["P114.1", "P114.2", "P114.3", "P114.4", "P114.5", "P114.6"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete") && ["planned", "complete"].includes(p1147.status));
addCheck("contract handoff points to P114.7", contract.currentSubphase === "P114.6" && contract.previousSubphase === "P114.5" && contract.nextSubphase === "P114.7");
addCheck("P114.5 Command Center UX preserved", pageSource.includes("FounderLiveAgentDispatchReadinessCard") && pageSource.includes("Business Build Agent Dispatch Readiness") && pageSource.includes("Agent Flow Agent Dispatch Readiness") && !pageSource.includes("Lite Agent Dispatch Readiness") && !pageSource.includes("Live Readiness Agent Dispatch Readiness"));
addCheck("P114.5 display model preserved", businessBuildSource.includes("buildFounderLiveAgentDispatchReadinessDisplayModel") && businessBuildSource.includes("Dispatch writes") && businessBuildSource.includes("reports/p1144-founder-live-agent-dispatch-readiness-report.md"));
addCheck("P114.5 Playwright coverage preserved", routeTests.includes("Agent dispatch readiness appears only on Business Build and Agent Flow") && routeTests.includes("Founder agent dispatch readiness") && routeTests.includes("Founder Strategy Dispatch"));
addCheck(
  "docs record P114.1-P114.6",
  ["P114.1", "P114.2", "P114.3", "P114.4", "P114.5", "P114.6"].every((phaseId) => {
    const escapedPhaseId = phaseId.replace(".", "\\.");
    return new RegExp(`${escapedPhaseId}[\\s\\S]*Status:\\s+complete`).test(plan);
  }),
);
addCheck("README records P114.6", /P114\.6 dispatch validation and docs/.test(readme) && (/P114\.7 is next/.test(readme) || /P114\.7 final validation/.test(readme)));
addCheck("platform roadmap records P114.6", /P114\.6 is complete/.test(platformRoadmap) && (/P114\.7 is next/.test(platformRoadmap) || /P114\.7 is complete/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  ["P114.6", "P114.7"].includes(status.currentPhase)
    && ["P114.5", "P114.6"].includes(status.previousPhase)
    && ["P114.7", "P115"].includes(status.nextPhase)
    && ["P114.6", "P114.7"].includes(roadmap.currentPhase)
    && ["P114.5", "P114.6"].includes(roadmap.previousPhase)
    && ["P114.7", "P115"].includes(roadmap.nextPhase)
    && statusById.get("P114")?.status === "in_progress"
    && statusById.get("P114.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P114.7")?.status)
    && roadmapById.get("P114.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P114.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P114.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P114.6 contract avoids forbidden file scope", !(p1146.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "docs and UX avoid unsafe positive claims",
  !hasPositiveClaim(
    `${docsText}\n${uxSourceText}`,
    /agent dispatch is enabled|dispatch execution is enabled|provider spend is enabled|project mutation is enabled|raw SQL is allowed|hosted DB mutation is enabled|runtime admission is enabled|execution unlock is enabled/i,
  ),
);
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[a-z0-9][a-z0-9_-]*\d[a-z0-9_-]*/.test(uxSourceText));
addCheck("primary UX avoids raw dispatch table names", !/founder_agent_dispatch_readiness_/i.test(uxSourceText));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write dispatch now/i.test(uxSourceText));
addCheck(
  "docs avoid raw dump exposure claims",
  !hasPositiveClaim(docsText, /raw JSON|raw logs|raw policy dump/i),
);
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(uxSourceText) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(uxSourceText));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P114.1-P114.5 together before final validation.",
        "- Confirms dispatch readiness contracts, local schema metadata, governed local CRUD, safe dry-run preview, and Command Center UX evidence remain aligned.",
        "- Confirms provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, runtime admission, deploy, release, export, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1146-founder-live-agent-dispatch-readiness",
        "- npm run check:p1145-founder-live-agent-dispatch-readiness",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Agent dispatch readiness appears only on Business Build and Agent Flow\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P114.6 is aggregate validation and docs closure only. It does not write dispatch records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P114.6 Founder Live Agent Dispatch Readiness Validation Report", phase: "P114.6" },
);

printCheckReport("P114.6 Founder Live Agent Dispatch Readiness Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
