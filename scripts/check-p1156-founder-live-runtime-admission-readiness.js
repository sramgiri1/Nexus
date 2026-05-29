import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveRuntimeAdmissionReadinessDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1156-founder-live-runtime-admission-readiness-report.md";

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
const contract = readJson("contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1156 = subphaseById.get("P115.6") || {};
const p1157 = subphaseById.get("P115.7") || {};
const plan = readText("docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1155Checker = readText("scripts/check-p1155-founder-live-runtime-admission-readiness.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P115.6";
const allowedFiles = new Set(p1156.allowedFiles || []);

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
  "check:p1151-founder-live-runtime-admission-contract",
  "check:p1152-founder-live-runtime-admission-readiness",
  "check:p1153-founder-live-runtime-admission-readiness",
  "check:p1154-founder-live-runtime-admission-readiness",
  "check:p1155-founder-live-runtime-admission-readiness",
  "check:p1156-founder-live-runtime-admission-readiness",
];

const requiredReports = [
  "reports/p1151-founder-live-runtime-admission-contract-report.md",
  "reports/p1152-founder-live-runtime-admission-readiness-report.md",
  "reports/p1153-founder-live-runtime-admission-readiness-report.md",
  "reports/p1154-founder-live-runtime-admission-readiness-report.md",
  "reports/p1155-founder-live-runtime-admission-readiness-report.md",
];

const validationCommands = [
  "npm run check:p1156-founder-live-runtime-admission-readiness",
  "npm run check:p1155-founder-live-runtime-admission-readiness",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Runtime admission readiness appears only on Business Build and Agent Flow\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const uxSourceText = [businessBuildSource, pageSource].join("\n");
const serializedDisplayModel = JSON.stringify(
  buildFounderLiveRuntimeAdmissionReadinessDisplayModel("Build a simple iOS Snake game for the App Store"),
  null,
  2,
);

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P115.1-P115.5 are complete", ["P115.1", "P115.2", "P115.3", "P115.4", "P115.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P115.6 contract is complete", p1156.status === "complete" && ["planned", "complete"].includes(p1157.status));
addCheck("P115.6 records validation commands", validationCommands.every((command) => p1156.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("P115.5 checker accepts P115.6 handoff", p1155Checker.includes('["P115.5", "P115.6", "P115.7"].includes(status.currentPhase)') && p1155Checker.includes('["P115.6", "P115.7", "P116"].includes(status.nextPhase)'));
addCheck("P115.5 Command Center UX preserved", pageSource.includes("FounderLiveRuntimeAdmissionReadinessCard") && pageSource.includes("Business Build Runtime Admission Readiness") && pageSource.includes("Agent Flow Runtime Admission Readiness") && !pageSource.includes("Lite Runtime Admission Readiness") && !pageSource.includes("Live Readiness Runtime Admission Readiness"));
addCheck("P115.5 display model preserved", businessBuildSource.includes("buildFounderLiveRuntimeAdmissionReadinessDisplayModel") && businessBuildSource.includes("runtimeAdmissionRows") && businessBuildSource.includes("reports/p1154-founder-live-runtime-admission-readiness-report.md"));
addCheck("P115.5 Playwright coverage preserved", routeTests.includes("Runtime admission readiness appears only on Business Build and Agent Flow") && routeTests.includes("Founder runtime admission readiness") && routeTests.includes("Build a simple iOS Snake game for the App Store"));
addCheck(
  "P115 plan records all completed subphases",
  [
    /P115\.1 Runtime Admission Contract \/ Policy[\s\S]*Status:\s+complete/,
    /P115\.2 Local Admission Schema Metadata[\s\S]*Status:\s+complete/,
    /P115\.3 Governed Local Admission CRUD Model[\s\S]*Status:\s+complete/,
    /P115\.4 Runtime Admission Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/,
    /P115\.5 Command Center Runtime Admission UX[\s\S]*Status:\s+complete/,
    /P115\.6 Runtime Admission Validation \/ Docs[\s\S]*Status:\s+complete/,
  ].every((pattern) => pattern.test(plan)),
);
addCheck("README records P115.6", /P115\.6 runtime admission validation/.test(readme) && (/P115\.7 is next/.test(readme) || /P115\.7 final validation/.test(readme)));
addCheck("platform roadmap records P115.6", /P115\.6 is complete/.test(platformRoadmap) && (/P115\.7 is next/.test(platformRoadmap) || /P115\.7 is complete/.test(platformRoadmap)));

const p1156HandoffState =
  status.currentPhase === "P115.6"
    && status.previousPhase === "P115.5"
    && status.nextPhase === "P115.7"
    && roadmap.currentPhase === "P115.6"
    && roadmap.previousPhase === "P115.5"
    && roadmap.nextPhase === "P115.7"
    && statusById.get("P115")?.status === "in_progress"
    && statusById.get("P115.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P115.7")?.status)
    && roadmapById.get("P115")?.status === "in_progress"
    && roadmapById.get("P115.6")?.status === "complete";
const p1157HandoffState =
  status.currentPhase === "P115.7"
    && status.previousPhase === "P115.6"
    && status.nextPhase === "P116"
    && roadmap.currentPhase === "P115.7"
    && roadmap.previousPhase === "P115.6"
    && roadmap.nextPhase === "P116"
    && statusById.get("P115")?.status === "complete"
    && statusById.get("P115.6")?.status === "complete"
    && statusById.get("P115.7")?.status === "complete"
    && roadmapById.get("P115")?.status === "complete"
    && roadmapById.get("P115.6")?.status === "complete"
    && roadmapById.get("P115.7")?.status === "complete";

addCheck("phase status advanced", p1156HandoffState || p1157HandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("contract handoff points to final validation", (contract.currentSubphase === "P115.6" && contract.previousSubphase === "P115.5" && contract.nextSubphase === "P115.7") || (contract.currentSubphase === "P115.7" && contract.previousSubphase === "P115.6" && contract.nextSubphase === "P116"));
addCheck(
  "changed files stay in P115.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P115.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P115.6 contract avoids forbidden file scope", !(p1156.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("primary UX avoids raw runtime table names", !/(founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/i.test(uxSourceText));
addCheck("public docs avoid raw runtime table names", !/(founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/i.test(publicDocsBundle));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|admit runtime now|unlock execution now/i.test(uxSourceText));
addCheck(
  "docs and UX avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxSourceText}`,
    /runtime admission is enabled|runtime admission is live|execution unlock is enabled|runtime execution is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
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
        "- Validates P115.1-P115.5 together before final validation.",
        "- Confirms runtime admission readiness contracts, local schema metadata, governed local CRUD, safe dry-run preview, and Command Center UX evidence remain aligned.",
        "- Confirms provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, runtime admission, execution unlock, deploy, release, export, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P115.6 is aggregate validation and docs closure only. It does not write runtime admission records, admit runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P115.6 Founder Live Runtime Admission Readiness Validation Report", phase: "P115.6" },
);

printCheckReport("P115.6 Founder Live Runtime Admission Readiness Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
