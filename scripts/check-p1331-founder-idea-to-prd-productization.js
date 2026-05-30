import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1331-founder-idea-to-prd-productization-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json";
const PLAN_PATH = "docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md";
const ENTERPRISE_DOC_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";

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

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|contract-only|contract\/checker|future|until|before|must not|cannot|preserve|safety boundary)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1331 = subphaseById.get("P133.1") || {};
const p1332 = subphaseById.get("P133.2") || {};
const plan = readText(PLAN_PATH);
const enterpriseRoadmap = readText(ENTERPRISE_DOC_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1327Checker = readText("scripts/check-p1327-founder-runtime-store-live-admission-execution.js");
const checkerSource = readText("scripts/check-p1331-founder-idea-to-prd-productization.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readmeP133Slice = readme.match(/- P133-P145 enterprise readiness roadmap:[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP133Slice = platformRoadmap.match(/## P133-P145 Enterprise Readiness Roadmap[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${enterpriseRoadmap}\n${readmeP133Slice}\n${roadmapP133Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P133.1";
const allowedFiles = new Set(p1331.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
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
const allowedDashboardFiles = new Set([
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
]);
const expectedSubphases = ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6", "P133.7"];
const validationCommands = [
  "npm run check:p1331-founder-idea-to-prd-productization",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:p1327-founder-runtime-store-live-admission-execution",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const p1331StartedState =
  status.currentPhase === "P133.1"
  && status.previousPhase === "P132.7"
  && status.nextPhase === "P133.2"
  && roadmap.currentPhase === "P133.1"
  && roadmap.previousPhase === "P132.7"
  && roadmap.nextPhase === "P133.2"
  && status.current?.phaseId === "P133.1"
  && status.previous?.phaseId === "P132.7"
  && status.next?.phaseId === "P133.2"
  && roadmap.current?.phaseId === "P133.1"
  && roadmap.previous?.phaseId === "P132.7"
  && roadmap.next?.phaseId === "P133.2"
  && statusById.get("P132")?.status === "complete"
  && roadmapById.get("P132")?.status === "complete"
  && statusById.get("P132.7")?.status === "complete"
  && roadmapById.get("P132.7")?.status === "complete"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.1")?.status === "complete"
  && roadmapById.get("P133.1")?.status === "complete"
  && statusById.get("P133.2")?.status === "planned"
  && roadmapById.get("P133.2")?.status === "planned";
const p1332CompleteState =
  status.currentPhase === "P133.2"
  && status.previousPhase === "P133.1"
  && status.nextPhase === "P133.3"
  && roadmap.currentPhase === "P133.2"
  && roadmap.previousPhase === "P133.1"
  && roadmap.nextPhase === "P133.3"
  && status.current?.phaseId === "P133.2"
  && status.previous?.phaseId === "P133.1"
  && status.next?.phaseId === "P133.3"
  && roadmap.current?.phaseId === "P133.2"
  && roadmap.previous?.phaseId === "P133.1"
  && roadmap.next?.phaseId === "P133.3"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.1")?.status === "complete"
  && roadmapById.get("P133.1")?.status === "complete"
  && statusById.get("P133.2")?.status === "complete"
  && roadmapById.get("P133.2")?.status === "complete"
  && statusById.get("P133.3")?.status === "planned"
  && roadmapById.get("P133.3")?.status === "planned";
const p1333CompleteState =
  status.currentPhase === "P133.3"
  && status.previousPhase === "P133.2"
  && status.nextPhase === "P133.4"
  && roadmap.currentPhase === "P133.3"
  && roadmap.previousPhase === "P133.2"
  && roadmap.nextPhase === "P133.4"
  && status.current?.phaseId === "P133.3"
  && status.previous?.phaseId === "P133.2"
  && status.next?.phaseId === "P133.4"
  && roadmap.current?.phaseId === "P133.3"
  && roadmap.previous?.phaseId === "P133.2"
  && roadmap.next?.phaseId === "P133.4"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.1")?.status === "complete"
  && roadmapById.get("P133.1")?.status === "complete"
  && statusById.get("P133.2")?.status === "complete"
  && roadmapById.get("P133.2")?.status === "complete"
  && statusById.get("P133.3")?.status === "complete"
  && roadmapById.get("P133.3")?.status === "complete"
  && statusById.get("P133.4")?.status === "planned"
  && roadmapById.get("P133.4")?.status === "planned";
const p1334CompleteState =
  status.currentPhase === "P133.4"
  && status.previousPhase === "P133.3"
  && status.nextPhase === "P133.5"
  && roadmap.currentPhase === "P133.4"
  && roadmap.previousPhase === "P133.3"
  && roadmap.nextPhase === "P133.5"
  && status.current?.phaseId === "P133.4"
  && status.previous?.phaseId === "P133.3"
  && status.next?.phaseId === "P133.5"
  && roadmap.current?.phaseId === "P133.4"
  && roadmap.previous?.phaseId === "P133.3"
  && roadmap.next?.phaseId === "P133.5"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.1")?.status === "complete"
  && roadmapById.get("P133.1")?.status === "complete"
  && statusById.get("P133.2")?.status === "complete"
  && roadmapById.get("P133.2")?.status === "complete"
  && statusById.get("P133.3")?.status === "complete"
  && roadmapById.get("P133.3")?.status === "complete"
  && statusById.get("P133.4")?.status === "complete"
  && roadmapById.get("P133.4")?.status === "complete"
  && statusById.get("P133.5")?.status === "planned"
  && roadmapById.get("P133.5")?.status === "planned";
const p1335CompleteState =
  status.currentPhase === "P133.5"
  && status.previousPhase === "P133.4"
  && status.nextPhase === "P133.6"
  && roadmap.currentPhase === "P133.5"
  && roadmap.previousPhase === "P133.4"
  && roadmap.nextPhase === "P133.6"
  && status.current?.phaseId === "P133.5"
  && status.previous?.phaseId === "P133.4"
  && status.next?.phaseId === "P133.6"
  && roadmap.current?.phaseId === "P133.5"
  && roadmap.previous?.phaseId === "P133.4"
  && roadmap.next?.phaseId === "P133.6"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P133.6")?.status === "planned"
  && roadmapById.get("P133.6")?.status === "planned";
const p1336CompleteState =
  status.currentPhase === "P133.6"
  && status.previousPhase === "P133.5"
  && status.nextPhase === "P133.7"
  && roadmap.currentPhase === "P133.6"
  && roadmap.previousPhase === "P133.5"
  && roadmap.nextPhase === "P133.7"
  && status.current?.phaseId === "P133.6"
  && status.previous?.phaseId === "P133.5"
  && status.next?.phaseId === "P133.7"
  && roadmap.current?.phaseId === "P133.6"
  && roadmap.previous?.phaseId === "P133.5"
  && roadmap.next?.phaseId === "P133.7"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P133.7")?.status === "planned"
  && roadmapById.get("P133.7")?.status === "planned";
const p1331CompatibleState = p1331StartedState || p1332CompleteState || p1333CompleteState || p1334CompleteState || p1335CompleteState || p1336CompleteState;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1331-founder-idea-to-prd-productization"]));
addCheck("contract marks P133.1 complete", contract.status === "in_progress" && p1331.status === "complete" && ((contract.currentSubphase === "P133.1" && contract.previousSubphase === "P132.7" && contract.nextSubphase === "P133.2") || (contract.currentSubphase === "P133.2" && contract.previousSubphase === "P133.1" && contract.nextSubphase === "P133.3") || (contract.currentSubphase === "P133.3" && contract.previousSubphase === "P133.2" && contract.nextSubphase === "P133.4") || (contract.currentSubphase === "P133.4" && contract.previousSubphase === "P133.3" && contract.nextSubphase === "P133.5") || (contract.currentSubphase === "P133.5" && contract.previousSubphase === "P133.4" && contract.nextSubphase === "P133.6") || (contract.currentSubphase === "P133.6" && contract.previousSubphase === "P133.5" && contract.nextSubphase === "P133.7")));
addCheck("contract records expected base commit", contract.expectedBaseCommit === "c1f61bfe" && p1331.expectedBaseCommit === "c1f61bfe");
addCheck("contract has seven implementation-grade subphases", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && expectedSubphases.every((phaseId) => subphaseById.get(phaseId)?.scopeClassification === "NEXUS_OS_CHANGE"));
addCheck("P133.1 complete and P133.2 safely advanced", p1331.status === "complete" && ["planned", "complete"].includes(p1332.status));
addCheck("P133.1 allowed files include contract, checkers, docs, reports", [
  CONTRACT_PATH,
  PLAN_PATH,
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  REPORT_PATH,
  "reports/enterprise-readiness-roadmap-report.md",
  "reports/p1327-founder-runtime-store-live-admission-execution-report.md",
].every((file) => p1331.allowedFiles?.includes(file)));
addCheck("P133.1 forbids project/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1331.forbiddenFiles?.includes(path)));
addCheck("P133.1 dashboard scope is exact", ["dashboard/src/pages/CommandCenterV2.jsx", "dashboard/tests/routes.spec.js"].every((file) => p1331.allowedFiles?.includes(file)) && !(p1331.allowedFiles || []).some((file) => file.startsWith("dashboard/") && !allowedDashboardFiles.has(file)));
addCheck("P133.1 records validation commands", validationCommands.every((command) => p1331.validationCommands?.includes(command)));
addCheck("P132.7 report passes", reportPassed("reports/p1327-founder-runtime-store-live-admission-execution-report.md"));
addCheck("P132.7 checker accepts P133.1 handoff", p1327Checker.includes("p1331StartedState") && p1327Checker.includes('status.currentPhase === "P133.1"') && p1327Checker.includes('status.nextPhase === "P133.2"'));
addCheck("enterprise roadmap checker accepts P133.1", enterpriseChecker.includes("p1331StartedState") && enterpriseChecker.includes('phaseStatus.currentPhase === "P133.1"') && enterpriseChecker.includes("check:p1331-founder-idea-to-prd-productization"));
addCheck("OS checker recognizes P133 subphases", expectedSubphases.every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("Command Center founder pages remain present", pageSource.includes("Chat with NEXUS") && pageSource.includes("Founder Intake") && pageSource.includes("Business Build") && pageSource.includes("Agent Flow"));
addCheck("Command Center route-wide tests remain present", routeTests.includes("Command Center route-wide UX") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/founder-intake") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow"));
addCheck("P133 plan records P133.1 implementation", /## P133\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P133.1", /P133\.1 founder idea-to-PRD contract/i.test(readme));
addCheck("platform roadmap records P133.1", /P133\.1 is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P133 progress", /P133\.1/i.test(enterpriseRoadmap) && (/P133\.2 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.3 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.4 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.6 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.7 is the next executable subphase/i.test(enterpriseRoadmap)));
addCheck("phase status advanced", p1331CompatibleState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P133.1 entries have required fields", [statusById.get("P133"), statusById.get("P133.1"), roadmapById.get("P133.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P133.2 handoff remains safe", (statusById.get("P133.2")?.status === "planned" && roadmapById.get("P133.2")?.status === "planned" && !(statusById.get("P133.2")?.checksRun || []).length && !(roadmapById.get("P133.2")?.checksRun || []).length) || p1332CompleteState || p1333CompleteState || p1334CompleteState || p1335CompleteState || p1336CompleteState);
addCheck(
  "changed files stay in P133.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => allowedDashboardFiles.has(file) || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P133.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P133.1 contract avoids forbidden file scope", !(p1331.allowedFiles || []).some((file) => !allowedDashboardFiles.has(file) && forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("primary UX avoids DemoApp leakage", !pageSource.includes("DemoApp"));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/ask now|generate prd now|persist now|save now|write now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /founder Q&A is live|autonomous Q&A is enabled|PRD generation is enabled|provider PRD generation is enabled|agent dispatch is enabled|project mutation is enabled|DB writes are enabled|runtime writes are enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|provider spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(checkerSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Starts P133 with an implementation-grade founder idea-to-PRD productization contract.",
        "- Confirms P133.1 remains complete as P133 safely advances into later P133 subphases.",
        "- Does not enable founder Q&A execution, provider/model PRD generation, agent dispatch, project mutation, DB/runtime writes, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Subphases", body: expectedSubphases.map((phaseId) => `- ${phaseId}: ${subphaseById.get(phaseId)?.title || "missing"}`).join("\n") },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P133.1 is contract/checker/docs/status only. Later P133 subphases must keep founder Q&A execution, provider/model PRD generation, agent dispatch, project mutation, DB/runtime writes, deploy, release, export, package, network calls, and spend blocked unless their own contract explicitly allows them.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P133.1 Founder Idea-to-PRD Productization Contract Report", phase: "P133.1" },
);

printCheckReport("P133.1 Founder Idea-to-PRD Productization Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
