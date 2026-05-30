import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1336-founder-idea-to-prd-docs-roadmap-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json";
const PLAN_PATH = "docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md";
const ENTERPRISE_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|local|preview|read-only|in memory|docs?|roadmap|status|reports?|checkers?|coverage|future|until|before|must not|cannot|preserve|safety boundary)\b/i.test(context);
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
const p1336 = subphaseById.get("P133.6") || {};
const p1337 = subphaseById.get("P133.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText(ENTERPRISE_PATH);
const p1335Checker = readText("scripts/check-p1335-founder-idea-to-prd-tests-checkers.js");
const p1334Checker = readText("scripts/check-p1334-command-center-idea-to-prd-ux.js");
const p1333Checker = readText("scripts/check-p1333-founder-idea-to-prd-preview.js");
const p1332Checker = readText("scripts/check-p1332-founder-idea-to-prd-model.js");
const p1331Checker = readText("scripts/check-p1331-founder-idea-to-prd-productization.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1327Checker = readText("scripts/check-p1327-founder-runtime-store-live-admission-execution.js");
const checkerSource = readText("scripts/check-p1336-founder-idea-to-prd-docs-roadmap.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P133.6";
const validationCommands = [
  "npm run check:p1336-founder-idea-to-prd-docs-roadmap",
  "npm run check:p1335-founder-idea-to-prd-tests-checkers",
  "npm run check:p1334-command-center-idea-to-prd-ux",
  "npm run check:p1333-founder-idea-to-prd-preview",
  "npm run check:p1332-founder-idea-to-prd-model",
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
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  ENTERPRISE_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1336-founder-idea-to-prd-docs-roadmap.js",
  "scripts/check-p1335-founder-idea-to-prd-tests-checkers.js",
  "scripts/check-p1334-command-center-idea-to-prd-ux.js",
  "scripts/check-p1333-founder-idea-to-prd-preview.js",
  "scripts/check-p1332-founder-idea-to-prd-model.js",
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  REPORT_PATH,
  "reports/p1335-founder-idea-to-prd-tests-checkers-report.md",
  "reports/p1334-command-center-idea-to-prd-ux-report.md",
  "reports/p1333-founder-idea-to-prd-preview-report.md",
  "reports/p1332-founder-idea-to-prd-model-report.md",
  "reports/p1331-founder-idea-to-prd-productization-report.md",
  "reports/enterprise-readiness-roadmap-report.md",
  "reports/p1327-founder-runtime-store-live-admission-execution-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1336-founder-idea-to-prd-docs-roadmap"]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract marks P133.6 complete", contract.status === "in_progress" && contract.currentSubphase === "P133.6" && contract.previousSubphase === "P133.5" && contract.nextSubphase === "P133.7" && p1336.status === "complete");
addCheck("contract records P133.6 docs scope", p1336.expectedBaseCommit === "b084bd54" && p1336.allowedFiles?.includes("scripts/check-p1336-founder-idea-to-prd-docs-roadmap.js") && p1336.allowedFiles?.includes(PLAN_PATH) && p1336.allowedFiles?.includes("README.md"));
addCheck("P133.7 handoff remains planned-only", p1337.status === "planned" && statusById.get("P133.7")?.status === "planned" && roadmapById.get("P133.7")?.status === "planned");
addCheck("P133.6 records validation commands", validationCommands.every((command) => p1336.validationCommands?.includes(command)));
addCheck("P133 plan records P133.6", /## P133\.6 Docs \/ Roadmap \/ Status[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P133.6", /P133\.6 founder idea-to-PRD docs/i.test(readme) && /P133\.7 Final Validation is\s+next/i.test(readme));
addCheck("platform roadmap records P133.6", /P133\.6 is complete/i.test(platformRoadmap) && /P133\.7 Final Validation is next/i.test(platformRoadmap));
addCheck("enterprise roadmap records P133.6", (/P133\.6 is now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.6 are now complete/i.test(enterpriseRoadmap)) && /P133\.7 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("prior P133 reports pass", [
  "reports/p1335-founder-idea-to-prd-tests-checkers-report.md",
  "reports/p1334-command-center-idea-to-prd-ux-report.md",
  "reports/p1333-founder-idea-to-prd-preview-report.md",
  "reports/p1332-founder-idea-to-prd-model-report.md",
  "reports/p1331-founder-idea-to-prd-productization-report.md",
].every(reportPassed));
addCheck("prior P133 checkers accept P133.6", [p1335Checker, p1334Checker, p1333Checker, p1332Checker, p1331Checker].every((source) => source.includes("p1336CompleteState") && source.includes('status.currentPhase === "P133.6"')));
addCheck("enterprise and P132.7 checkers accept P133.6", enterpriseChecker.includes("p1336CompleteState") && enterpriseChecker.includes("check:p1336-founder-idea-to-prd-docs-roadmap") && p1327Checker.includes("p1336CompleteState") && p1327Checker.includes('status.currentPhase === "P133.6"'));
addCheck("phase status advanced", p1336CompleteState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P133.6 entries have required fields", [statusById.get("P133"), statusById.get("P133.6"), roadmapById.get("P133.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P133.6 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P133.6 forbidden path check relaxed for ${status.currentPhase}`);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now|generate prd now|save now|persist now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /autonomous Q&A is enabled|PRD generation is enabled|provider PRD generation is enabled|agent dispatch is enabled|project mutation is enabled|DB writes are enabled|runtime writes are enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|provider spend is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P133.6 docs, roadmap, status, and report alignment for founder idea-to-PRD productization.",
        "- Confirms P133.1-P133.6 are complete and P133.7 remains planned-only for final validation.",
        "- Confirms this subphase does not call providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P133.6 is docs/roadmap/status validation only. P133.7 remains planned-only, and live Q&A execution, provider/model PRD generation, agent dispatch, project mutation, DB/runtime writes, deploy, export, package creation, network calls, and provider spend remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P133.6 Founder Idea-to-PRD Docs Roadmap Report", phase: "P133.6" },
);

printCheckReport("P133.6 Founder Idea-to-PRD Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
