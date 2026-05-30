import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1337-founder-idea-to-prd-final-validation-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|local|preview|read-only|in memory|docs?|roadmap|status|reports?|checkers?|coverage|future|until|before|must not|cannot|preserve|safety boundary|final validation)\b/i.test(context);
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
const p1337 = subphaseById.get("P133.7") || {};
const p134 = statusById.get("P134") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText(ENTERPRISE_PATH);
const checkerSource = readText("scripts/check-p1337-founder-idea-to-prd-final-validation.js");
const p1336Checker = readText("scripts/check-p1336-founder-idea-to-prd-docs-roadmap.js");
const p1335Checker = readText("scripts/check-p1335-founder-idea-to-prd-tests-checkers.js");
const p1334Checker = readText("scripts/check-p1334-command-center-idea-to-prd-ux.js");
const p1333Checker = readText("scripts/check-p1333-founder-idea-to-prd-preview.js");
const p1332Checker = readText("scripts/check-p1332-founder-idea-to-prd-model.js");
const p1331Checker = readText("scripts/check-p1331-founder-idea-to-prd-productization.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1327Checker = readText("scripts/check-p1327-founder-runtime-store-live-admission-execution.js");
const changed = changedFiles();
const completedP133Subphases = ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6", "P133.7"];
const validationCommands = [
  "npm run check:p1337-founder-idea-to-prd-final-validation",
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
  "scripts/check-p1337-founder-idea-to-prd-final-validation.js",
  "scripts/check-p1336-founder-idea-to-prd-docs-roadmap.js",
  "scripts/check-p1335-founder-idea-to-prd-tests-checkers.js",
  "scripts/check-p1334-command-center-idea-to-prd-ux.js",
  "scripts/check-p1333-founder-idea-to-prd-preview.js",
  "scripts/check-p1332-founder-idea-to-prd-model.js",
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1336-founder-idea-to-prd-docs-roadmap-report.md",
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
const p1337FinalState =
  status.currentPhase === "P133.7"
  && status.previousPhase === "P133.6"
  && status.nextPhase === "P134"
  && roadmap.currentPhase === "P133.7"
  && roadmap.previousPhase === "P133.6"
  && roadmap.nextPhase === "P134"
  && status.current?.phaseId === "P133.7"
  && status.previous?.phaseId === "P133.6"
  && status.next?.phaseId === "P134"
  && roadmap.current?.phaseId === "P133.7"
  && roadmap.previous?.phaseId === "P133.6"
  && roadmap.next?.phaseId === "P134"
  && statusById.get("P133")?.status === "complete"
  && roadmapById.get("P133")?.status === "complete"
  && completedP133Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P134")?.status === "planned"
  && roadmapById.get("P134")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1337-founder-idea-to-prd-final-validation"]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract closes P133", contract.status === "complete" && contract.currentSubphase === "P133.7" && contract.previousSubphase === "P133.6" && contract.nextSubphase === "P134" && p1337.status === "complete");
addCheck("contract records P133.7 final validation scope", p1337.expectedBaseCommit === "67530192" && p1337.allowedFiles?.includes("scripts/check-p1337-founder-idea-to-prd-final-validation.js") && p1337.allowedFiles?.includes(REPORT_PATH));
addCheck("P133.7 records validation commands", validationCommands.every((command) => p1337.validationCommands?.includes(command)));
addCheck("P133.1-P133.7 contract entries complete", completedP133Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("prior P133 reports pass", [
  "reports/p1336-founder-idea-to-prd-docs-roadmap-report.md",
  "reports/p1335-founder-idea-to-prd-tests-checkers-report.md",
  "reports/p1334-command-center-idea-to-prd-ux-report.md",
  "reports/p1333-founder-idea-to-prd-preview-report.md",
  "reports/p1332-founder-idea-to-prd-model-report.md",
  "reports/p1331-founder-idea-to-prd-productization-report.md",
].every(reportPassed));
addCheck("prior P133 checkers accept P133.7", [p1336Checker, p1335Checker, p1334Checker, p1333Checker, p1332Checker, p1331Checker].every((source) => source.includes("p1337FinalState") && source.includes('status.currentPhase === "P133.7"')));
addCheck("enterprise and P132.7 checkers accept P133.7", enterpriseChecker.includes("p1337FinalState") && enterpriseChecker.includes("check:p1337-founder-idea-to-prd-final-validation") && p1327Checker.includes("p1337FinalState") && p1327Checker.includes('status.currentPhase === "P133.7"'));
addCheck("P133 plan records P133.7", /## P133\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P133.7", /P133\.7 final validation/i.test(readme) && /P134 durable DB and CRUD runtime is\s+planned-only next/i.test(readme));
addCheck("platform roadmap records P133.7", /P133\.7 is complete/i.test(platformRoadmap) && /P134 Durable DB and CRUD\s+Runtime is planned-only next/i.test(platformRoadmap));
addCheck("enterprise roadmap records P133 closure", /P133\.1-P133\.7 are now complete/i.test(enterpriseRoadmap) && /P134 is the next executable phase/i.test(enterpriseRoadmap));
addCheck("phase status closes P133", p1337FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P133 entries have required fields", [statusById.get("P133"), statusById.get("P133.7"), roadmapById.get("P133"), roadmapById.get("P133.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P134 remains planned-only", p134.status === "planned" && p134.commit === "" && Array.isArray(p134.checksRun) && p134.checksRun.length === 0 && (p134.knownLimitations || []).join(" ").includes("planned-only"));
addCheck("changed files stay in P133.7 allowed scope", changed.every((file) => allowedFiles.has(file)), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now|generate prd now|save now|persist now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /autonomous Q&A is enabled|PRD generation is enabled|provider PRD generation is enabled|agent dispatch is enabled|project mutation is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|provider spend is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P133 closure, P133.1-P133.6 reports, checker handoffs, OS status, roadmap, and documentation.",
        "- Confirms P134 is planned-only and no durable DB/CRUD runtime is enabled by P133.7.",
        "- Confirms this subphase does not call providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P133.7 is final validation only. It does not enable live Q&A execution, provider/model PRD generation, agent dispatch, project mutation, DB/runtime writes, deploy, export, package creation, network calls, or provider spend. P134 remains planned-only until its own implementation-grade contract starts.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P133.7 Founder Idea-to-PRD Final Validation Report", phase: "P133.7" },
);

printCheckReport("P133.7 Founder Idea-to-PRD Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
