import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p976-business-build-docs-roadmap-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p97-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const readme = readText("README.md");
const prd = readText("docs/prd/NEXUS_AGENTIC_OS_PRD.md");
const guide = readText("docs/usage/COMMAND_CENTER_GUIDE.md");
const p97Plan = readText("docs/architecture/P97_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p975Report = readText("reports/p975-business-build-crud-validation-report.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p976 = subphaseById.get("P97.6");
const expectedDocs = [
  "README.md",
  "docs/prd/NEXUS_AGENTIC_OS_PRD.md",
  "docs/usage/COMMAND_CENTER_GUIDE.md",
  "docs/architecture/P97_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_PLAN.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
];
const forbiddenPatterns = [
  /^projects\//,
  /^careloop\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
  /^\.env/,
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p976-business-build-docs-roadmap"]));
addCheck("contract marks P97.6 complete", p976?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P97.7")?.status));
addCheck("P97.6 allowed files include docs", expectedDocs.every((file) => p976?.allowedFiles?.includes(file)));
addCheck("P97.6 allowed files include checker and report", p976?.allowedFiles?.includes("scripts/check-p976-business-build-docs-roadmap.js") && p976?.allowedFiles?.includes("reports/p976-business-build-docs-roadmap-report.md"));
addCheck("P97.6 allowed files avoid forbidden roots", !p976?.allowedFiles?.some((file) => forbiddenPatterns.some((pattern) => pattern.test(file))));
addCheck("P97.6 validation commands include P97.5 handoff", p976?.validationCommands?.includes("npm run check:p975-business-build-crud-validation"));
addCheck("README records P97.6 current state", readme.includes("Current Status Through P97.6") && readme.includes("P97 governed Business Build DB CRUD") && readme.includes("P97.7 is next"));
addCheck("PRD records P97.6 current state", prd.includes("updated through P97.6") && prd.includes("Current Implementation Status Through P97.6") && prd.includes("Safety boundary as of P97.6"));
addCheck("Command Center guide documents Business Build DB CRUD", guide.includes("Business Build DB CRUD") && guide.includes("/command-center/agent-flow") && guide.includes("Business Build sessions") && guide.includes("PRD snapshots"));
addCheck("P97 plan marks P97.6 complete", p97Plan.includes("P97.6 is complete") && p97Plan.includes("P97.7 is next"));
addCheck("platform roadmap marks P97.6 complete", platformRoadmap.includes("P97.6 is complete") && (platformRoadmap.includes("P97.7 is next") || platformRoadmap.includes("P97.7 is complete")));
addCheck("P97.5 aggregate evidence retained", p975Report.includes("P97.5 Business Build CRUD Validation Report") && p975Report.includes("PASS"));
addCheck(
  "phase status advanced to P97.6",
  (statusById.get("P97.6")?.status === "complete"
      && status.currentPhase === "P97.6"
      && status.previousPhase === "P97.5"
      && status.nextPhase === "P97.7")
    || (statusById.get("P97.6")?.status === "complete"
      && status.currentPhase === "P97.7"
      && status.previousPhase === "P97.6"
      && status.nextPhase === "P98"),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P97.6", roadmapById.get("P97.6")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P97.7")?.status));

const serializedDocs = JSON.stringify([readme, prd, guide, p97Plan, platformRoadmap, statusById.get("P97.6")]);
addCheck("docs keep unsafe execution blocked", /provider\/model calls.*blocked|Provider\/model calls remain blocked/s.test(serializedDocs) && /agent dispatch.*blocked/i.test(serializedDocs));
addCheck("no raw private IDs or credentials", !/(private-project-\d|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(serializedDocs));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serializedDocs));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P97.6 docs and roadmap closure for Business Build DB CRUD.",
        "- Confirms README, PRD, Command Center guide, P97 plan, platform roadmap, OS status, and aggregate evidence agree.",
        "- Confirms docs preserve the blocked execution boundary.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p976-business-build-docs-roadmap",
        "- npm run check:p975-business-build-crud-validation",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P97.6 is docs and roadmap closure only. It does not execute agents, run workers/tools, write project files, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P97.6 Business Build Docs Roadmap Report", phase: "P97.6" },
);

printCheckReport("P97.6 Business Build Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
