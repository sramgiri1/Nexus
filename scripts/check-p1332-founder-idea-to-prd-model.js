import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createBusinessBuildPrdDraft } from "../business-build/businessBuildPrdSchema.js";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildFounderIdeaToPrdModel,
  P133_FOUNDATION_PRD_FIELDS,
  P133_FOUNDER_IDEA_TO_PRD_MODEL_PHASE,
  P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS,
  validateFounderIdeaToPrdModel,
} from "../live-ready/founderIdeaToPrdModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1332-founder-idea-to-prd-model-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|local|deterministic|model only|future|until|before|must not|cannot|preserve|safety boundary)\b/i.test(context);
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
const p1332 = subphaseById.get("P133.2") || {};
const p1333 = subphaseById.get("P133.3") || {};
const p1334 = subphaseById.get("P133.4") || {};
const modelSource = readText("live-ready/founderIdeaToPrdModel.js");
const p1331Checker = readText("scripts/check-p1331-founder-idea-to-prd-productization.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1327Checker = readText("scripts/check-p1327-founder-runtime-store-live-admission-execution.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const defaultModel = buildFounderIdeaToPrdModel();
const defaultEnvelopeValidation = validateResultEnvelope(defaultModel);
const defaultModelValidation = validateFounderIdeaToPrdModel(defaultModel);
const partialModel = buildFounderIdeaToPrdModel({
  founderIdeaSummary: "Validate a narrow founder workflow product.",
  answers: {
    targetCustomer: "early-stage founders",
    problem: "startup idea validation takes too long",
  },
});
const partialValidation = validateFounderIdeaToPrdModel(partialModel);
const prdDraft = createBusinessBuildPrdDraft({ answers: defaultModel.data?.intake?.answeredFields?.reduce((acc, field) => ({ ...acc, [field]: `${field} answer` }), {}) });
const serialized = JSON.stringify([defaultModel.data, partialModel.data]);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P133.2";
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  "live-ready/founderIdeaToPrdModel.js",
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
const p1332CompatibleState = p1332CompleteState || p1333CompleteState || p1334CompleteState || p1335CompleteState || p1336CompleteState || p1337FinalState;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1332-founder-idea-to-prd-model"]));
addCheck("phase export is P133.2", P133_FOUNDER_IDEA_TO_PRD_MODEL_PHASE === "P133.2");
addCheck("result envelope valid", defaultEnvelopeValidation.valid, defaultEnvelopeValidation.errors.join("; "));
addCheck("default model validates", defaultModelValidation.valid, defaultModelValidation.errors.join("; "));
addCheck("partial model validates", partialValidation.valid, partialValidation.errors.join("; "));
addCheck("model reuses founder intake helpers", modelSource.includes("../founder-intake/founderIntakeSession.js") && modelSource.includes("../founder-intake/founderIntakeQuestions.js") && modelSource.includes("../founder-intake/founderIntakeComprehension.js"));
addCheck("model reuses business build PRD helper", modelSource.includes("../business-build/businessBuildPrdSchema.js") && prdDraft.phase === "P81.2");
addCheck("default model is ready for safe preview", defaultModel.data?.prdReadiness?.readyForSafePreview === true && defaultModel.data?.feasibility?.state === "ready_for_operator_review");
addCheck("partial model asks for missing founder input", partialModel.data?.prdReadiness?.readyForSafePreview === false && partialModel.data?.question?.prompt && partialModel.data?.blockers?.length > 0);
addCheck("PRD field rows cover required fields", P133_FOUNDATION_PRD_FIELDS.length === 8 && defaultModel.data?.prdReadiness?.fieldRows?.length === P133_FOUNDATION_PRD_FIELDS.length);
addCheck("feasibility signals are display-safe", defaultModel.data?.feasibility?.signals?.length >= 7 && defaultModel.data.feasibility.signals.every((signal) => signal.providerCallsAllowed === false && signal.projectMutationAllowed === false && signal.dbWritesAllowed === false));
addCheck("unsafe runtime flags remain false", P133_FOUNDER_IDEA_TO_PRD_SAFETY_FLAGS.every((flag) => defaultModel.data?.[flag] === false && defaultModel.data?.safetyFlags?.[flag] === false && partialModel.data?.[flag] === false && partialModel.data?.safetyFlags?.[flag] === false));
addCheck("local state does not write or mutate", ["writesFiles", "writesDb", "mutatesProjects", "dispatchesAgents", "callsProviders", "usesNetwork", "spendsBudget"].every((field) => defaultModel.data?.localState?.[field] === false));
addCheck("no unsafe imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|prisma|deploy|release|projects|packages)\//.test(modelSource));
addCheck("contract marks P133.2 complete", ["in_progress", "complete"].includes(contract.status) && p1332.status === "complete" && ((contract.currentSubphase === "P133.2" && contract.previousSubphase === "P133.1" && contract.nextSubphase === "P133.3") || (contract.currentSubphase === "P133.3" && contract.previousSubphase === "P133.2" && contract.nextSubphase === "P133.4") || (contract.currentSubphase === "P133.4" && contract.previousSubphase === "P133.3" && contract.nextSubphase === "P133.5") || (contract.currentSubphase === "P133.5" && contract.previousSubphase === "P133.4" && contract.nextSubphase === "P133.6") || (contract.currentSubphase === "P133.6" && contract.previousSubphase === "P133.5" && contract.nextSubphase === "P133.7") || (contract.currentSubphase === "P133.7" && contract.previousSubphase === "P133.6" && contract.nextSubphase === "P134")));
addCheck("contract records P133.2 implementation scope", p1332.allowedFiles?.includes("live-ready/founderIdeaToPrdModel.js") && p1332.expectedExports?.includes("buildFounderIdeaToPrdModel") && p1332.expectedExports?.includes("validateFounderIdeaToPrdModel"));
addCheck("P133.3/P133.4 handoff remains safe", (p1333.status === "planned" && statusById.get("P133.3")?.status === "planned" && roadmapById.get("P133.3")?.status === "planned") || p1333CompleteState || (p1333.status === "complete" && p1334.status === "complete" && (p1334CompleteState || p1335CompleteState || p1336CompleteState || p1337FinalState)));
addCheck("P133.2 records validation commands", validationCommands.every((command) => p1332.validationCommands?.includes(command)));
addCheck("P133.1 checker accepts P133.2 handoff", p1331Checker.includes("p1332CompleteState") && p1331Checker.includes('status.currentPhase === "P133.2"'));
addCheck("enterprise checker accepts P133.2", enterpriseChecker.includes("p1332CompleteState") && enterpriseChecker.includes("check:p1332-founder-idea-to-prd-model"));
addCheck("P132.7 checker accepts P133 progress", p1327Checker.includes("p133SafeProgressState") && p1327Checker.includes('status.currentPhase === "P133.2"'));
addCheck("P133.1 report passes", reportPassed("reports/p1331-founder-idea-to-prd-productization-report.md"));
addCheck("P133 plan records P133.2", /## P133\.2 Intake and PRD Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P133.2", /P133\.2 founder idea-to-PRD model/i.test(readme));
addCheck("platform roadmap records P133.2", /P133\.2 is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P133.2", (/P133\.2 is now complete/i.test(enterpriseRoadmap) || /P133\.1 and P133\.2 are now complete/i.test(enterpriseRoadmap) || /P133\.1, P133\.2, and P133\.3 are now complete/i.test(enterpriseRoadmap) || /P133\.1, P133\.2, P133\.3, and P133\.4 are now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.5 are now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.6 are now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.7 are now complete/i.test(enterpriseRoadmap)) && (/P133\.3 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.4 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.6 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.7 is the next executable subphase/i.test(enterpriseRoadmap) || /P134 is the next executable phase/i.test(enterpriseRoadmap)));
addCheck("phase status advanced", p1332CompatibleState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P133.2 entries have required fields", [statusById.get("P133"), statusById.get("P133.2"), roadmapById.get("P133.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P133.2 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P133.2 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("model avoids fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /autonomous Q&A is enabled|PRD generation is enabled|provider PRD generation is enabled|agent dispatch is enabled|project mutation is enabled|DB writes are enabled|runtime writes are enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|provider spend is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P133.2 deterministic founder idea-to-PRD intake and PRD readiness model.",
        "- Confirms the model composes existing founder intake, Q&A, comprehension, and Business Build PRD helpers.",
        "- Confirms this subphase does not render new Command Center UI, execute Q&A, call providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P133.2 is a deterministic local model only. Safe PRD preview starts in P133.3, Command Center rendering starts in P133.4, and live execution remains blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P133.2 Founder Idea-to-PRD Model Report", phase: "P133.2" },
);

printCheckReport("P133.2 Founder Idea-to-PRD Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
