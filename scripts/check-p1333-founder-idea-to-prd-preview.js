import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderPrdSafeAuthoring, validateFounderPrdSafeAuthoring } from "../live-ready/founderPrdSafeAuthoring.js";
import {
  buildFounderIdeaToPrdPreview,
  P133_FOUNDER_IDEA_TO_PRD_PREVIEW_PHASE,
  validateFounderIdeaToPrdPreview,
} from "../live-ready/founderIdeaToPrdPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1333-founder-idea-to-prd-preview-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json";
const PLAN_PATH = "docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|local|preview|read-only|in memory|future|until|before|must not|cannot|preserve|safety boundary)\b/i.test(context);
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
const p1333 = subphaseById.get("P133.3") || {};
const p1334 = subphaseById.get("P133.4") || {};
const p1335 = subphaseById.get("P133.5") || {};
const previewSource = readText("live-ready/founderIdeaToPrdPreview.js");
const p1332Checker = readText("scripts/check-p1332-founder-idea-to-prd-model.js");
const p1331Checker = readText("scripts/check-p1331-founder-idea-to-prd-productization.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1327Checker = readText("scripts/check-p1327-founder-runtime-store-live-admission-execution.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const preview = buildFounderIdeaToPrdPreview();
const envelopeValidation = validateResultEnvelope(preview);
const previewValidation = validateFounderIdeaToPrdPreview(preview);
const safeAuthoring = buildFounderPrdSafeAuthoring();
const sourceSafeAuthoringValidation = validateFounderPrdSafeAuthoring(safeAuthoring);
const partialPreview = buildFounderIdeaToPrdPreview({
  founderIdeaSummary: "Validate a founder support workflow.",
  answers: { targetCustomer: "founders", problem: "PRDs take too long" },
});
const partialValidation = validateFounderIdeaToPrdPreview(partialPreview);
const serialized = JSON.stringify([preview.data, partialPreview.data]);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P133.3";
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  "live-ready/founderIdeaToPrdPreview.js",
  "scripts/check-p1333-founder-idea-to-prd-preview.js",
  "scripts/check-p1332-founder-idea-to-prd-model.js",
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  "package.json",
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  REPORT_PATH,
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
const validationCommands = [
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
  && ["P133.3", "P133.4", "P133.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
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
  && ["P133.3", "P133.4", "P133.5", "P133.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P133.7")?.status === "planned"
  && roadmapById.get("P133.7")?.status === "planned";
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
  && ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6", "P133.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P134")?.status === "planned"
  && roadmapById.get("P134")?.status === "planned";
const p1333CompatibleState = p1333CompleteState || p1334CompleteState || p1335CompleteState || p1336CompleteState || p1337FinalState;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1333-founder-idea-to-prd-preview"]));
addCheck("phase export is P133.3", P133_FOUNDER_IDEA_TO_PRD_PREVIEW_PHASE === "P133.3");
addCheck("result envelope valid", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("partial preview validates", partialValidation.valid, partialValidation.errors.join("; "));
addCheck("preview reuses P133.2 model", previewSource.includes("./founderIdeaToPrdModel.js") && preview.data?.sourceModel?.phase === "P133.2");
addCheck("preview reuses safe authoring helper", previewSource.includes("./founderPrdSafeAuthoring.js") && sourceSafeAuthoringValidation.valid);
addCheck("default preview is ready", preview.data?.prdPreview?.reviewState === "ready_for_operator_review" && preview.data?.currentState === "founder_idea_to_prd_safe_preview_ready");
addCheck("partial preview reports missing sections", partialPreview.data?.currentState === "founder_idea_to_prd_safe_preview_needs_founder_inputs" && partialPreview.data?.prdPreview?.missingSections?.length > 0);
addCheck("preview includes useful PRD markdown", preview.data?.prdPreview?.markdown?.includes("# PRD -") && preview.data?.prdPreview?.markdown?.includes("## Operator Review") && preview.data?.prdPreview?.markdown?.includes("iOS Snake"));
addCheck("preview sections and criteria complete", preview.data?.prdPreview?.sections?.length === 8 && preview.data?.prdPreview?.acceptanceCriteria?.length >= 3);
addCheck("review checklist is non-executable", preview.data?.reviewChecklist?.length >= 3 && preview.data.reviewChecklist.every((item) => item.providerCallsAllowed === false && item.agentDispatchAllowed === false && item.projectMutationAllowed === false));
addCheck("preview safety does not write or mutate", ["writesFiles", "writesDb", "mutatesProjects", "dispatchesAgents", "callsProviders", "usesNetwork", "exportsPackages", "spendsBudget"].every((field) => preview.data?.previewSafety?.[field] === false));
addCheck("unsafe runtime flags remain false", Object.entries(preview.data?.safetyFlags || {}).every(([, value]) => value === false) && Object.entries(partialPreview.data?.safetyFlags || {}).every(([, value]) => value === false));
addCheck("no unsafe imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|prisma|deploy|release|projects|packages)\//.test(previewSource));
addCheck("contract marks P133.3 complete", ["in_progress", "complete"].includes(contract.status) && p1333.status === "complete" && ((contract.currentSubphase === "P133.3" && contract.previousSubphase === "P133.2" && contract.nextSubphase === "P133.4") || (contract.currentSubphase === "P133.4" && contract.previousSubphase === "P133.3" && contract.nextSubphase === "P133.5") || (contract.currentSubphase === "P133.5" && contract.previousSubphase === "P133.4" && contract.nextSubphase === "P133.6") || (contract.currentSubphase === "P133.6" && contract.previousSubphase === "P133.5" && contract.nextSubphase === "P133.7") || (contract.currentSubphase === "P133.7" && contract.previousSubphase === "P133.6" && contract.nextSubphase === "P134")));
addCheck("contract records P133.3 implementation scope", p1333.allowedFiles?.includes("live-ready/founderIdeaToPrdPreview.js") && p1333.expectedExports?.includes("buildFounderIdeaToPrdPreview") && p1333.expectedExports?.includes("validateFounderIdeaToPrdPreview"));
addCheck("P133.4 handoff remains safe", (p1334.status === "planned" && statusById.get("P133.4")?.status === "planned" && roadmapById.get("P133.4")?.status === "planned") || (p1334.status === "complete" && ((p1335.status === "planned" && p1334CompleteState) || (p1335.status === "complete" && (p1335CompleteState || p1336CompleteState || p1337FinalState)))));
addCheck("P133.3 records validation commands", validationCommands.every((command) => p1333.validationCommands?.includes(command)));
addCheck("P133.2 checker accepts P133.3 handoff", p1332Checker.includes("p1333CompleteState") && p1332Checker.includes('status.currentPhase === "P133.3"'));
addCheck("P133.1 checker accepts P133.3 handoff", p1331Checker.includes("p1333CompleteState") && p1331Checker.includes('status.currentPhase === "P133.3"'));
addCheck("enterprise checker accepts P133.3", enterpriseChecker.includes("p1333CompleteState") && enterpriseChecker.includes("check:p1333-founder-idea-to-prd-preview"));
addCheck("P132.7 checker accepts P133.3", p1327Checker.includes("p1333CompleteState") && p1327Checker.includes('status.currentPhase === "P133.3"'));
addCheck("P133.2 report passes", reportPassed("reports/p1332-founder-idea-to-prd-model-report.md"));
addCheck("P133 plan records P133.3", /## P133\.3 Safe PRD Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P133.3", /P133\.3 safe PRD preview/i.test(readme));
addCheck("platform roadmap records P133.3", /P133\.3 is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P133.3", (/P133\.3 is now complete/i.test(enterpriseRoadmap) || /P133\.1, P133\.2, and P133\.3 are now complete/i.test(enterpriseRoadmap) || /P133\.1, P133\.2, P133\.3, and P133\.4 are now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.5 are now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.6 are now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.7 are now complete/i.test(enterpriseRoadmap)) && (/P133\.4 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.6 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.7 is the next executable subphase/i.test(enterpriseRoadmap) || /P134 is the next executable phase/i.test(enterpriseRoadmap)));
addCheck("phase status advanced", p1333CompatibleState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P133.3 entries have required fields", [statusById.get("P133"), statusById.get("P133.3"), roadmapById.get("P133.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P133.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P133.3 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("preview avoids fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /autonomous Q&A is enabled|PRD generation is enabled|provider PRD generation is enabled|agent dispatch is enabled|project mutation is enabled|DB writes are enabled|runtime writes are enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|provider spend is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P133.3 safe local founder idea-to-PRD preview.",
        "- Confirms the preview composes the P133.2 model with the existing safe PRD authoring helper.",
        "- Confirms this subphase does not render new Command Center UI, write files, execute Q&A, call providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P133.3 is an in-memory read-only preview only. Command Center rendering is handled by P133.4, and live execution remains blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P133.3 Founder Idea-to-PRD Preview Report", phase: "P133.3" },
);

printCheckReport("P133.3 Founder Idea-to-PRD Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
