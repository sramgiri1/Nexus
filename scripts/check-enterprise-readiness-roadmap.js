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
  "docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  DOC_PATH,
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "README.md",
  "package.json",
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  "reports/p1331-founder-idea-to-prd-productization-report.md",
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
  "dashboard/tests/routes.spec.js",
]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:enterprise-readiness-roadmap"]));
addCheck("P133.1 checker registered when active", !p1331StartedState || Boolean(packageJson.scripts?.["check:p1331-founder-idea-to-prd-productization"]));
addCheck("current enterprise handoff", p1331StartedState || (phaseStatus.currentPhase === "P132.7" && phaseStatus.previousPhase === "P132.6" && phaseStatus.nextPhase === "P133" && phaseIndex.currentPhase === "P132.7" && phaseIndex.previousPhase === "P132.6" && phaseIndex.nextPhase === "P133"), `${phaseStatus.currentPhase}/${phaseStatus.previousPhase}/${phaseStatus.nextPhase}`);
addCheck("P132.7 hands off to P133", statusById.get("P132.7")?.nextPhase === "P133" && indexById.get("P132.7")?.nextPhase === "P133");
addCheck("enterprise parent phases exist", enterprisePhases.every(([phaseId, title]) => statusById.get(phaseId)?.title === title && indexById.get(phaseId)?.title === title));
addCheck("enterprise parent phases are planned-only", enterprisePhases.every(([phaseId]) => {
  const status = statusById.get(phaseId);
  const index = indexById.get(phaseId);
  if (phaseId === "P133" && p1331StartedState) {
    return status?.status === "in_progress"
      && index?.status === "in_progress"
      && Boolean(status.commit)
      && Boolean(index.commit)
      && Array.isArray(status.checksRun)
      && status.checksRun.includes("npm run check:p1331-founder-idea-to-prd-productization")
      && Array.isArray(index.checksRun)
      && index.checksRun.includes("npm run check:p1331-founder-idea-to-prd-productization");
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
addCheck("P133.1 active subphase records are present", !p1331StartedState || (statusById.get("P133.1")?.status === "complete" && indexById.get("P133.1")?.status === "complete" && statusById.get("P133.2")?.status === "planned" && indexById.get("P133.2")?.status === "planned"));
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
        "- Allows P133.1 to start the enterprise roadmap while P133.2-P133.7 and P134-P145 remain planned-only.",
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
      body: "- P133.1 is contract/checker/docs/status only. P133.2-P133.7 and P134-P145 remain planned-only. They do not create runtime capability, DB schemas, provider calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "Enterprise Readiness Roadmap Report", phase: "P133-P145" },
);

printCheckReport("Enterprise Readiness Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
