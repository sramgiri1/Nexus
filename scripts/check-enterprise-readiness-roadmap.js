import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/enterprise-readiness-roadmap-report.md";
const DOC_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";

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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|approval gate|dry run|preview|readiness gate|contract)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const phaseStatus = readJson("os-roadmap/phase-status.json");
const phaseIndex = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
const doc = readText(DOC_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readmeEnterpriseSlice = readme.match(/- P133-P145 enterprise readiness roadmap:[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const platformEnterpriseSlice = platformRoadmap.match(/## P133-P145 Enterprise Readiness Roadmap[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const checkerSource = readText("scripts/check-enterprise-readiness-roadmap.js");
const changed = changedFiles();
const p1331StartedState =
  phaseStatus.currentPhase === "P133.1"
  && phaseStatus.previousPhase === "P132.7"
  && phaseStatus.nextPhase === "P133.2"
  && phaseIndex.currentPhase === "P133.1"
  && phaseIndex.previousPhase === "P132.7"
  && phaseIndex.nextPhase === "P133.2"
  && phaseStatus.current?.phaseId === "P133.1"
  && phaseStatus.previous?.phaseId === "P132.7"
  && phaseStatus.next?.phaseId === "P133.2"
  && phaseIndex.current?.phaseId === "P133.1"
  && phaseIndex.previous?.phaseId === "P132.7"
  && phaseIndex.next?.phaseId === "P133.2";
const p1332CompleteState =
  phaseStatus.currentPhase === "P133.2"
  && phaseStatus.previousPhase === "P133.1"
  && phaseStatus.nextPhase === "P133.3"
  && phaseIndex.currentPhase === "P133.2"
  && phaseIndex.previousPhase === "P133.1"
  && phaseIndex.nextPhase === "P133.3"
  && phaseStatus.current?.phaseId === "P133.2"
  && phaseStatus.previous?.phaseId === "P133.1"
  && phaseStatus.next?.phaseId === "P133.3"
  && phaseIndex.current?.phaseId === "P133.2"
  && phaseIndex.previous?.phaseId === "P133.1"
  && phaseIndex.next?.phaseId === "P133.3";
const p1333CompleteState =
  phaseStatus.currentPhase === "P133.3"
  && phaseStatus.previousPhase === "P133.2"
  && phaseStatus.nextPhase === "P133.4"
  && phaseIndex.currentPhase === "P133.3"
  && phaseIndex.previousPhase === "P133.2"
  && phaseIndex.nextPhase === "P133.4"
  && phaseStatus.current?.phaseId === "P133.3"
  && phaseStatus.previous?.phaseId === "P133.2"
  && phaseStatus.next?.phaseId === "P133.4"
  && phaseIndex.current?.phaseId === "P133.3"
  && phaseIndex.previous?.phaseId === "P133.2"
  && phaseIndex.next?.phaseId === "P133.4";
const p1334CompleteState =
  phaseStatus.currentPhase === "P133.4"
  && phaseStatus.previousPhase === "P133.3"
  && phaseStatus.nextPhase === "P133.5"
  && phaseIndex.currentPhase === "P133.4"
  && phaseIndex.previousPhase === "P133.3"
  && phaseIndex.nextPhase === "P133.5"
  && phaseStatus.current?.phaseId === "P133.4"
  && phaseStatus.previous?.phaseId === "P133.3"
  && phaseStatus.next?.phaseId === "P133.5"
  && phaseIndex.current?.phaseId === "P133.4"
  && phaseIndex.previous?.phaseId === "P133.3"
  && phaseIndex.next?.phaseId === "P133.5";
const p1335CompleteState =
  phaseStatus.currentPhase === "P133.5"
  && phaseStatus.previousPhase === "P133.4"
  && phaseStatus.nextPhase === "P133.6"
  && phaseIndex.currentPhase === "P133.5"
  && phaseIndex.previousPhase === "P133.4"
  && phaseIndex.nextPhase === "P133.6"
  && phaseStatus.current?.phaseId === "P133.5"
  && phaseStatus.previous?.phaseId === "P133.4"
  && phaseStatus.next?.phaseId === "P133.6"
  && phaseIndex.current?.phaseId === "P133.5"
  && phaseIndex.previous?.phaseId === "P133.4"
  && phaseIndex.next?.phaseId === "P133.6";
const p1336CompleteState =
  phaseStatus.currentPhase === "P133.6"
  && phaseStatus.previousPhase === "P133.5"
  && phaseStatus.nextPhase === "P133.7"
  && phaseIndex.currentPhase === "P133.6"
  && phaseIndex.previousPhase === "P133.5"
  && phaseIndex.nextPhase === "P133.7"
  && phaseStatus.current?.phaseId === "P133.6"
  && phaseStatus.previous?.phaseId === "P133.5"
  && phaseStatus.next?.phaseId === "P133.7"
  && phaseIndex.current?.phaseId === "P133.6"
  && phaseIndex.previous?.phaseId === "P133.5"
  && phaseIndex.next?.phaseId === "P133.7";
const p1337FinalState =
  phaseStatus.currentPhase === "P133.7"
  && phaseStatus.previousPhase === "P133.6"
  && phaseStatus.nextPhase === "P134"
  && phaseIndex.currentPhase === "P133.7"
  && phaseIndex.previousPhase === "P133.6"
  && phaseIndex.nextPhase === "P134"
  && phaseStatus.current?.phaseId === "P133.7"
  && phaseStatus.previous?.phaseId === "P133.6"
  && phaseStatus.next?.phaseId === "P134"
  && phaseIndex.current?.phaseId === "P133.7"
  && phaseIndex.previous?.phaseId === "P133.6"
  && phaseIndex.next?.phaseId === "P134"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6", "P133.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && statusById.get("P134")?.status === "planned"
  && indexById.get("P134")?.status === "planned";
const p133ActiveState = p1331StartedState || p1332CompleteState || p1333CompleteState || p1334CompleteState || p1335CompleteState || p1336CompleteState || p1337FinalState;
const p1341StartedState =
  phaseStatus.currentPhase === "P134.1"
  && phaseStatus.previousPhase === "P133.7"
  && phaseStatus.nextPhase === "P134.2"
  && phaseIndex.currentPhase === "P134.1"
  && phaseIndex.previousPhase === "P133.7"
  && phaseIndex.nextPhase === "P134.2"
  && phaseStatus.current?.phaseId === "P134.1"
  && phaseStatus.previous?.phaseId === "P133.7"
  && phaseStatus.next?.phaseId === "P134.2"
  && phaseIndex.current?.phaseId === "P134.1"
  && phaseIndex.previous?.phaseId === "P133.7"
  && phaseIndex.next?.phaseId === "P134.2"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && indexById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && indexById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "planned"
  && indexById.get("P134.2")?.status === "planned";
const p1342CurrentState =
  phaseStatus.currentPhase === "P134.2"
  && phaseStatus.previousPhase === "P134.1"
  && phaseStatus.nextPhase === "P134.3"
  && phaseIndex.currentPhase === "P134.2"
  && phaseIndex.previousPhase === "P134.1"
  && phaseIndex.nextPhase === "P134.3"
  && phaseStatus.current?.phaseId === "P134.2"
  && phaseStatus.previous?.phaseId === "P134.1"
  && phaseStatus.next?.phaseId === "P134.3"
  && phaseIndex.current?.phaseId === "P134.2"
  && phaseIndex.previous?.phaseId === "P134.1"
  && phaseIndex.next?.phaseId === "P134.3"
  && statusById.get("P133")?.status === "complete"
  && indexById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && indexById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && indexById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "complete"
  && indexById.get("P134.2")?.status === "complete"
  && statusById.get("P134.3")?.status === "planned"
  && indexById.get("P134.3")?.status === "planned";
const p134ActiveState = p1341StartedState || p1342CurrentState;
const enterpriseActiveState = p133ActiveState || p134ActiveState;
const currentP133CheckCommand = p1337FinalState
  ? "npm run check:p1337-founder-idea-to-prd-final-validation"
  : p1336CompleteState
  ? "npm run check:p1336-founder-idea-to-prd-docs-roadmap"
  : p1335CompleteState
  ? "npm run check:p1335-founder-idea-to-prd-tests-checkers"
  : p1334CompleteState
    ? "npm run check:p1334-command-center-idea-to-prd-ux"
    : p1333CompleteState
      ? "npm run check:p1333-founder-idea-to-prd-preview"
      : p1332CompleteState
        ? "npm run check:p1332-founder-idea-to-prd-model"
        : "npm run check:p1331-founder-idea-to-prd-productization";

const currentP134CheckCommand = p1342CurrentState
  ? "npm run check:p1342-durable-db-crud-runtime-schema-model"
  : p1341StartedState
  ? "npm run check:p1341-durable-db-crud-runtime"
  : "";

const enterprisePhases = [
  ["P133", "Founder Idea-to-PRD Productization"],
  ["P134", "Durable DB and CRUD Runtime"],
  ["P135", "Identity, Tenant, Roles, and Permissions"],
  ["P136", "Secrets, Providers, and Tool Governance"],
  ["P137", "Agent Work Order Runtime"],
  ["P138", "Project Workspace Mutation and Build Pipeline"],
  ["P139", "Evidence, Audit, Observability, and Cost Ledger"],
  ["P140", "Backup, Recovery, DR, and Retention"],
  ["P141", "Security, Privacy, and Compliance Controls"],
  ["P142", "Admin Operations and Runtime Settings"],
  ["P143", "Release, Deploy, Export, and Package Pipeline"],
  ["P144", "Billing, Metering, and Customer Operations"],
  ["P145", "Enterprise Certification and GA Readiness"],
];
const allowedFiles = new Set([
  "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json",
  "contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json",
  "docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md",
  "docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  DOC_PATH,
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "README.md",
  "package.json",
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-p1332-founder-idea-to-prd-model.js",
  "scripts/check-p1333-founder-idea-to-prd-preview.js",
  "scripts/check-p1334-command-center-idea-to-prd-ux.js",
  "scripts/check-p1335-founder-idea-to-prd-tests-checkers.js",
  "scripts/check-p1336-founder-idea-to-prd-docs-roadmap.js",
  "scripts/check-p1337-founder-idea-to-prd-final-validation.js",
  "scripts/check-p1341-durable-db-crud-runtime.js",
  "scripts/check-p1342-durable-db-crud-runtime-schema-model.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  "scripts/check-p904-command-center-prd-lane-ux.js",
  "scripts/check-p905-founder-prd-lane-validation.js",
  "scripts/check-p907-founder-prd-final.js",
  "live-ready/founderIdeaToPrdModel.js",
  "live-ready/founderIdeaToPrdPreview.js",
  "shared/durableDbCrudRuntimeSchemaModel.js",
  "dashboard/src/data/businessBuild.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  "reports/p1331-founder-idea-to-prd-productization-report.md",
  "reports/p1332-founder-idea-to-prd-model-report.md",
  "reports/p1333-founder-idea-to-prd-preview-report.md",
  "reports/p1334-command-center-idea-to-prd-ux-report.md",
  "reports/p1335-founder-idea-to-prd-tests-checkers-report.md",
  "reports/p1336-founder-idea-to-prd-docs-roadmap-report.md",
  "reports/p1337-founder-idea-to-prd-final-validation-report.md",
  "reports/p1341-durable-db-crud-runtime-report.md",
  "reports/p1342-durable-db-crud-runtime-schema-model-report.md",
  "reports/p1327-founder-runtime-store-live-admission-execution-report.md",
  REPORT_PATH,
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
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
  "dashboard/src/data/businessBuild.js",
  "dashboard/tests/routes.spec.js",
]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:enterprise-readiness-roadmap"]));
addCheck("P133/P134 checkers registered when active", (!p133ActiveState || (Boolean(packageJson.scripts?.["check:p1331-founder-idea-to-prd-productization"]) && (!p1332CompleteState || Boolean(packageJson.scripts?.["check:p1332-founder-idea-to-prd-model"])) && (!p1333CompleteState || Boolean(packageJson.scripts?.["check:p1333-founder-idea-to-prd-preview"])) && (!p1334CompleteState || Boolean(packageJson.scripts?.["check:p1334-command-center-idea-to-prd-ux"])) && (!p1335CompleteState || Boolean(packageJson.scripts?.["check:p1335-founder-idea-to-prd-tests-checkers"])) && (!p1336CompleteState || Boolean(packageJson.scripts?.["check:p1336-founder-idea-to-prd-docs-roadmap"])) && (!p1337FinalState || Boolean(packageJson.scripts?.["check:p1337-founder-idea-to-prd-final-validation"])))) && (!p134ActiveState || (Boolean(packageJson.scripts?.["check:p1341-durable-db-crud-runtime"]) && (!p1342CurrentState || Boolean(packageJson.scripts?.["check:p1342-durable-db-crud-runtime-schema-model"])))));
addCheck("current enterprise handoff", enterpriseActiveState || (phaseStatus.currentPhase === "P132.7" && phaseStatus.previousPhase === "P132.6" && phaseStatus.nextPhase === "P133" && phaseIndex.currentPhase === "P132.7" && phaseIndex.previousPhase === "P132.6" && phaseIndex.nextPhase === "P133"), `${phaseStatus.currentPhase}/${phaseStatus.previousPhase}/${phaseStatus.nextPhase}`);
addCheck("P132.7 hands off to P133", statusById.get("P132.7")?.nextPhase === "P133" && indexById.get("P132.7")?.nextPhase === "P133");
addCheck("enterprise parent phases exist", enterprisePhases.every(([phaseId, title]) => statusById.get(phaseId)?.title === title && indexById.get(phaseId)?.title === title));
addCheck("enterprise parent phases are planned-only", enterprisePhases.every(([phaseId]) => {
  const status = statusById.get(phaseId);
  const index = indexById.get(phaseId);
  if (phaseId === "P133" && p134ActiveState) {
    return status?.status === "complete"
      && index?.status === "complete"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1337-founder-idea-to-prd-final-validation")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1337-founder-idea-to-prd-final-validation");
  }
  if (phaseId === "P133" && p133ActiveState) {
    return ["in_progress", "complete"].includes(status?.status)
      && ["in_progress", "complete"].includes(index?.status)
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP133CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP133CheckCommand);
  }
  if (phaseId === "P134" && p134ActiveState) {
    return status?.status === "in_progress"
      && index?.status === "in_progress"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes(currentP134CheckCommand)
      && Array.isArray(index.checksRun)
      && index.checksRun.includes(currentP134CheckCommand);
  }
  return status?.status === "planned"
    && index?.status === "planned"
    && status.commit === ""
    && index.commit === ""
    && Array.isArray(status.checksRun)
    && status.checksRun.length === 0
    && Array.isArray(index.checksRun)
    && index.checksRun.length === 0;
}));
addCheck("enterprise phases are sequential", enterprisePhases.every(([phaseId], index) => {
  const expectedPrevious = index === 0 ? "P132.7" : enterprisePhases[index - 1][0];
  const expectedNext = index === enterprisePhases.length - 1 ? "" : enterprisePhases[index + 1][0];
  return statusById.get(phaseId)?.previousPhase === expectedPrevious
    && indexById.get(phaseId)?.previousPhase === expectedPrevious
    && statusById.get(phaseId)?.nextPhase === expectedNext
    && indexById.get(phaseId)?.nextPhase === expectedNext;
}));
addCheck("enterprise phases are Command Center visible", enterprisePhases.every(([phaseId]) => statusById.get(phaseId)?.commandCenterVisible === true && indexById.get(phaseId)?.commandCenterVisible === true));
addCheck("roadmap entries include details and limitations", enterprisePhases.every(([phaseId]) => {
  const status = statusById.get(phaseId);
  const index = indexById.get(phaseId);
  return Boolean(status?.detail)
    && Boolean(status?.summary)
    && Array.isArray(status?.knownLimitations)
    && status.knownLimitations.join(" ").includes("planned-only")
    && Array.isArray(index?.knownLimitations)
    && index.knownLimitations.join(" ").includes("planned-only");
}));
addCheck("roadmap entries include subphase details", enterprisePhases.every(([phaseId]) => {
  const statusSubphases = statusById.get(phaseId)?.subphases || [];
  const indexSubphases = indexById.get(phaseId)?.subphases || [];
  return statusSubphases.length === 7 && indexSubphases.length === 7 && statusSubphases.every((entry) => entry.phaseId?.startsWith(`${phaseId}.`));
}));
const expectedCompleteP133Subphases = p1337FinalState
  ? ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6", "P133.7"]
  : p1336CompleteState
  ? ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5", "P133.6"]
  : p1335CompleteState
    ? ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5"]
    : p1334CompleteState
      ? ["P133.1", "P133.2", "P133.3", "P133.4"]
      : p1333CompleteState
        ? ["P133.1", "P133.2", "P133.3"]
        : p1332CompleteState
          ? ["P133.1", "P133.2"]
          : p1331StartedState
            ? ["P133.1"]
            : [];
const expectedNextP133Subphase = p1337FinalState
  ? "P134"
  : p1336CompleteState
  ? "P133.7"
  : p1335CompleteState
    ? "P133.6"
    : p1334CompleteState
      ? "P133.5"
      : p1333CompleteState
        ? "P133.4"
        : p1332CompleteState
          ? "P133.3"
          : p1331StartedState
            ? "P133.2"
            : "";
const p133ActiveSubphaseRecordsPresent = !p133ActiveState || (
  expectedCompleteP133Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && indexById.get(phaseId)?.status === "complete")
  && (!expectedNextP133Subphase || (statusById.get(expectedNextP133Subphase)?.status === "planned" && indexById.get(expectedNextP133Subphase)?.status === "planned"))
);
const p134ActiveSubphaseRecordsPresent = !p134ActiveState || (
  statusById.get("P134.1")?.status === "complete"
  && indexById.get("P134.1")?.status === "complete"
  && (
    (p1341StartedState && statusById.get("P134.2")?.status === "planned" && indexById.get("P134.2")?.status === "planned")
    || (p1342CurrentState && statusById.get("P134.2")?.status === "complete" && indexById.get("P134.2")?.status === "complete" && statusById.get("P134.3")?.status === "planned" && indexById.get("P134.3")?.status === "planned")
  )
);
addCheck("P133/P134 active subphase records are present", p133ActiveSubphaseRecordsPresent && p134ActiveSubphaseRecordsPresent);
addCheck("enterprise roadmap doc covers all phases", enterprisePhases.every(([phaseId, title]) => doc.includes(`| ${phaseId} | ${title} |`)));
addCheck("enterprise roadmap doc records required subphase contract", [
  "Narrow scope",
  "Allowed files",
  "forbidden files",
  "Command Center UX requirements",
  "Playwright coverage",
  "Checker updates",
  "Validation commands",
  "Final safety checks",
  "Git add, commit, and push commands",
  "Final response checklist",
].every((text) => doc.toLowerCase().includes(text.toLowerCase())));
addCheck("README records enterprise roadmap", readmeEnterpriseSlice.includes("P133-P145 enterprise readiness roadmap"));
addCheck("platform roadmap records enterprise roadmap", platformEnterpriseSlice.includes("P133-P145 Enterprise Readiness Roadmap"));
addCheck("changed files stay in enterprise roadmap scope", changed.every((file) => allowedFiles.has(file)), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => allowedDashboardFiles.has(file) || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("checker reuses report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
const enterpriseDocsBundle = `${doc}\n${readmeEnterpriseSlice}\n${platformEnterpriseSlice}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(enterpriseDocsBundle));
addCheck("docs avoid fake runnable actions", !/persist now|save now|write now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(enterpriseDocsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(enterpriseDocsBundle, /DB writes are enabled|CRUD is live|agent dispatch is enabled|project mutation is enabled|provider spend is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(enterpriseDocsBundle, /raw JSON|raw logs|raw policy dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Tracks P133-P145 enterprise-readiness roadmap phases after P132.",
        "- Allows P133 to close and P134 to advance through completed implementation-grade durable DB/CRUD subphases while later enterprise phases remain planned-only.",
        "- Does not enable DB/runtime writes, live CRUD, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Enterprise Phases", body: enterprisePhases.map(([phaseId, title]) => `- ${phaseId}: ${title}`).join("\n") },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:enterprise-readiness-roadmap",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P133.1-P133.7 may be complete and P134 may be in progress through implementation-grade durable DB/CRUD subphases. P135-P145 remain planned-only. Current P134 work does not create runtime capability, run migrations, write DB/runtime records, execute CRUD, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "Enterprise Readiness Roadmap Report", phase: "P133-P145" },
);

printCheckReport("Enterprise Readiness Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
