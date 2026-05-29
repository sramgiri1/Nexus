import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveRuntimeAdmissionReadinessDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1157-founder-live-runtime-admission-readiness-report.md";

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

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) return "";
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|final-validation)\b/i.test(context);
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
const plan = readText("docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1156Checker = readText("scripts/check-p1156-founder-live-runtime-admission-readiness.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const runtimeCardSource = extractFunction(pageSource, "FounderLiveRuntimeAdmissionReadinessCard");
const displayModel = buildFounderLiveRuntimeAdmissionReadinessDisplayModel("Build a simple iOS Snake game for the App Store");
const serializedDisplayModel = JSON.stringify(displayModel);
const p1157 = subphaseById.get("P115.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1157.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P115.7";

const p115Scripts = [
  "check:p1151-founder-live-runtime-admission-contract",
  "check:p1152-founder-live-runtime-admission-readiness",
  "check:p1153-founder-live-runtime-admission-readiness",
  "check:p1154-founder-live-runtime-admission-readiness",
  "check:p1155-founder-live-runtime-admission-readiness",
  "check:p1156-founder-live-runtime-admission-readiness",
  "check:p1157-founder-live-runtime-admission-readiness",
];
const p115Reports = [
  "reports/p1151-founder-live-runtime-admission-contract-report.md",
  "reports/p1152-founder-live-runtime-admission-readiness-report.md",
  "reports/p1153-founder-live-runtime-admission-readiness-report.md",
  "reports/p1154-founder-live-runtime-admission-readiness-report.md",
  "reports/p1155-founder-live-runtime-admission-readiness-report.md",
  "reports/p1156-founder-live-runtime-admission-readiness-report.md",
];
const validationCommands = [
  "npm run check:p1157-founder-live-runtime-admission-readiness",
  "npm run check:p1156-founder-live-runtime-admission-readiness",
  "npm run check:p1155-founder-live-runtime-admission-readiness",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Runtime admission readiness appears only on Business Build and Agent Flow\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
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
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const uxText = `${runtimeCardSource}\n${serializedDisplayModel}`;

const p115ClosedState =
  status.currentPhase === "P115.7"
    && status.previousPhase === "P115.6"
    && status.nextPhase === "P116"
    && roadmap.currentPhase === "P115.7"
    && roadmap.previousPhase === "P115.6"
    && roadmap.nextPhase === "P116"
    && statusById.get("P115")?.status === "complete"
    && roadmapById.get("P115")?.status === "complete"
    && statusById.get("P115.7")?.status === "complete"
    && roadmapById.get("P115.7")?.status === "complete"
    && statusById.get("P116")?.status === "planned"
    && roadmapById.get("P116")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1157-founder-live-runtime-admission-readiness"]));
addCheck("all P115 scripts registered", p115Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P115 reports exist and pass", p115Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P115 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P116", contract.currentSubphase === "P115.7" && contract.previousSubphase === "P115.6" && contract.nextSubphase === "P116");
addCheck("P115.7 records final validation commands", validationCommands.every((command) => p1157.validationCommands?.includes(command)));
addCheck("P115.7 avoids forbidden file scope", !(p1157.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P115.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P115.6 checker accepts final handoff", p1156Checker.includes("P115.7") && p1156Checker.includes("P116") && p1156Checker.includes("p1157HandoffState"));
addCheck("OS status checker can resolve P116 handoff", osStatusChecker.includes('"P116"') && statusById.has("P116") && roadmapById.has("P116"));
addCheck("phase status closed with P116 planned", p115ClosedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P115")?.commit, statusById.get("P115.7")?.commit, roadmapById.get("P115")?.commit, roadmapById.get("P115.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P115")?.commandCenterVisible === true && statusById.get("P115.7")?.commandCenterVisible === true);
addCheck("P116 remains planned placeholder", statusById.get("P116")?.status === "planned" && roadmapById.get("P116")?.status === "planned" && statusById.get("P116")?.checksRun?.length === 0);
addCheck("P115 plan records final validation", /P115\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P115 is complete/.test(plan) && /P116/.test(plan));
addCheck("platform roadmap records P115 complete", /P115\.7 is complete/.test(platformRoadmap) && /P115 is complete/.test(platformRoadmap) && /P116/.test(platformRoadmap));
addCheck("README records P115 complete", /P115\.7 final validation/.test(readme) && /P115 is complete/.test(readme) && /P116/.test(readme));
addCheck("dashboard uses browser-safe runtime display model", businessBuildSource.includes("buildFounderLiveRuntimeAdmissionReadinessDisplayModel") && businessBuildSource.includes("reports/p1154-founder-live-runtime-admission-readiness-report.md"));
addCheck("Command Center runtime card retained", runtimeCardSource.includes("aria-label=\"Founder runtime admission readiness\"") && runtimeCardSource.includes("Runtime candidates") && runtimeCardSource.includes("Blocked candidates"));
addCheck("Command Center runtime surfaces remain scoped", pageSource.includes("Business Build Runtime Admission Readiness") && pageSource.includes("Agent Flow Runtime Admission Readiness") && !pageSource.includes("Lite Runtime Admission Readiness") && !pageSource.includes("Chat Runtime Admission Readiness") && !pageSource.includes("Live Readiness Runtime Admission Readiness"));
addCheck("route coverage retained", routeTests.includes("Runtime admission readiness appears only on Business Build and Agent Flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.runtimeAdmissionRows?.every((row) => row.proposedAdmissionLane && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", displayModel.writableCandidateCount === 0 && displayModel.persistedCandidateCount === 0 && displayModel.runtimeAdmissibleCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.dispatchableCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(uxText));
addCheck("primary UX avoids raw runtime keys and table names", !/(runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/.test(uxText));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|unlock execution now/i.test(uxText));
addCheck("public docs avoid raw runtime keys and table names", !/(runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|unlock execution now/i.test(docsBundle));
addCheck(
  "docs and UX do not claim unsafe authority live",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxText}`,
    /hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|runtime admission is live|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime writes are enabled/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P115 founder live runtime admission readiness closure.",
        "- Confirms parent P115 and all subphases are complete, reports and scripts exist, Command Center runtime admission readiness route safety is retained, and the P116 handoff placeholder is planned.",
        "- Does not enable runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P115.7 closes P115 validation only. It does not add Command Center source changes, write runtime admission records, admit runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend. P116 is a planned placeholder until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P115.7 Founder Live Runtime Admission Readiness Final Report", phase: "P115.7" },
);

printCheckReport("P115.7 Founder Live Runtime Admission Readiness Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
