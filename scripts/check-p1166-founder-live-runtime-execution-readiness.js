import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveRuntimeExecutionReadinessDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1166-founder-live-runtime-execution-readiness-report.md";

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

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|docs-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p116-founder-live-runtime-execution-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1166 = subphaseById.get("P116.6") || {};
const p1167 = subphaseById.get("P116.7") || {};
const plan = readText("docs/architecture/P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1165Checker = readText("scripts/check-p1165-founder-live-runtime-execution-readiness.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P116.6";
const allowedFiles = new Set(p1166.allowedFiles || []);

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
  "check:p1161-founder-live-runtime-execution-contract",
  "check:p1162-founder-live-runtime-execution-readiness",
  "check:p1163-founder-live-runtime-execution-readiness",
  "check:p1164-founder-live-runtime-execution-readiness",
  "check:p1165-founder-live-runtime-execution-readiness",
  "check:p1166-founder-live-runtime-execution-readiness",
];

const requiredReports = [
  "reports/p1161-founder-live-runtime-execution-contract-report.md",
  "reports/p1162-founder-live-runtime-execution-readiness-report.md",
  "reports/p1163-founder-live-runtime-execution-readiness-report.md",
  "reports/p1164-founder-live-runtime-execution-readiness-report.md",
  "reports/p1165-founder-live-runtime-execution-readiness-report.md",
];

const validationCommands = [
  "npm run check:p1166-founder-live-runtime-execution-readiness",
  "npm run check:p1165-founder-live-runtime-execution-readiness",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Runtime execution readiness appears only on Business Build and Agent Flow\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const uxSourceText = [businessBuildSource, pageSource].join("\n");
const serializedDisplayModel = JSON.stringify(
  buildFounderLiveRuntimeExecutionReadinessDisplayModel("Build a simple iOS Snake game for the App Store"),
  null,
  2,
);

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P116.1-P116.5 are complete", ["P116.1", "P116.2", "P116.3", "P116.4", "P116.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P116.6 contract is complete", p1166.status === "complete" && ["planned", "complete"].includes(p1167.status));
addCheck("P116.6 records validation commands", validationCommands.every((command) => p1166.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS|PASS \(/.test(readText(report))));
addCheck("P116.5 checker accepts P116.6 handoff", p1165Checker.includes('["P116.5", "P116.6", "P116.7"].includes(status.currentPhase)') && p1165Checker.includes('["P116.6", "P116.7", "P117"].includes(status.nextPhase)'));
addCheck("P116.5 Command Center UX preserved", pageSource.includes("FounderLiveRuntimeExecutionReadinessCard") && pageSource.includes("Business Build Runtime Execution Readiness") && pageSource.includes("Agent Flow Runtime Execution Readiness") && !pageSource.includes("Lite Runtime Execution Readiness") && !pageSource.includes("Live Readiness Runtime Execution Readiness"));
addCheck("P116.5 display model preserved", businessBuildSource.includes("buildFounderLiveRuntimeExecutionReadinessDisplayModel") && businessBuildSource.includes("runtimeExecutionRows") && businessBuildSource.includes("reports/p1164-founder-live-runtime-execution-readiness-report.md"));
addCheck("P116.5 Playwright coverage preserved", routeTests.includes("Runtime execution readiness appears only on Business Build and Agent Flow") && routeTests.includes("Founder runtime execution readiness") && routeTests.includes("Build a simple iOS Snake game for the App Store"));
addCheck(
  "P116 plan records all completed subphases",
  [
    /P116\.1 Runtime Execution Contract \/ Policy[\s\S]*Status:\s+complete/,
    /P116\.2 Local Execution Schema Metadata[\s\S]*Status:\s+complete/,
    /P116\.3 Governed Local Execution CRUD Model[\s\S]*Status:\s+complete/,
    /P116\.4 Execution Readiness Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/,
    /P116\.5 Command Center Runtime Execution UX[\s\S]*Status:\s+complete/,
    /P116\.6 Execution Readiness Validation \/ Docs[\s\S]*Status:\s+complete/,
  ].every((pattern) => pattern.test(plan)),
);
addCheck("README records P116.6", /P116\.6 runtime execution validation/.test(readme) && (/P116\.7 is next/.test(readme) || /P116\.7 final validation/.test(readme)));
addCheck("platform roadmap records P116.6", /P116\.6 is complete/.test(platformRoadmap) && (/P116\.7 is next/.test(platformRoadmap) || /P116\.7 is complete/.test(platformRoadmap)));

const p1166HandoffState =
  status.currentPhase === "P116.6"
    && status.previousPhase === "P116.5"
    && status.nextPhase === "P116.7"
    && roadmap.currentPhase === "P116.6"
    && roadmap.previousPhase === "P116.5"
    && roadmap.nextPhase === "P116.7"
    && statusById.get("P116")?.status === "in_progress"
    && statusById.get("P116.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P116.7")?.status)
    && roadmapById.get("P116")?.status === "in_progress"
    && roadmapById.get("P116.6")?.status === "complete";
const p1167HandoffState =
  status.currentPhase === "P116.7"
    && status.previousPhase === "P116.6"
    && status.nextPhase === "P117"
    && roadmap.currentPhase === "P116.7"
    && roadmap.previousPhase === "P116.6"
    && roadmap.nextPhase === "P117"
    && statusById.get("P116")?.status === "complete"
    && statusById.get("P116.6")?.status === "complete"
    && statusById.get("P116.7")?.status === "complete"
    && roadmapById.get("P116")?.status === "complete"
    && roadmapById.get("P116.6")?.status === "complete"
    && roadmapById.get("P116.7")?.status === "complete";

addCheck("phase status advanced", p1166HandoffState || p1167HandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("contract handoff points to final validation", (contract.currentSubphase === "P116.6" && contract.previousSubphase === "P116.5" && contract.nextSubphase === "P116.7") || (contract.currentSubphase === "P116.7" && contract.previousSubphase === "P116.6" && contract.nextSubphase === "P117"));
addCheck(
  "changed files stay in P116.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P116.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P116.6 contract avoids forbidden file scope", !(p1166.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("primary UX avoids raw runtime execution table names", !/(founder_runtime_execution_readiness_items|founder_runtime_execution_events|founder_runtime_execution_evidence_refs)/i.test(uxSourceText));
addCheck("public docs avoid raw runtime execution table names", !/(founder_runtime_execution_readiness_items|founder_runtime_execution_events|founder_runtime_execution_evidence_refs)/i.test(publicDocsBundle));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|run runtime now|unlock execution now/i.test(uxSourceText));
addCheck(
  "docs and UX avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxSourceText}`,
    /runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(uxSourceText) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${uxSourceText}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P116.1-P116.5 together before final validation.",
        "- Confirms runtime execution readiness contracts, local schema metadata, governed local CRUD, safe dry-run preview, and Command Center UX evidence remain aligned.",
        "- Confirms provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, runtime execution, execution unlock, deploy, release, export, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P116.6 is aggregate validation and docs closure only. It does not write runtime execution records, run runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P116.6 Founder Live Runtime Execution Readiness Validation Report", phase: "P116.6" },
);

printCheckReport("P116.6 Founder Live Runtime Execution Readiness Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
