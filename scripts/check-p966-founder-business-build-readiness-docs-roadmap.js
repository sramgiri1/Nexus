import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p966-founder-business-build-readiness-docs-roadmap-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readJson("contracts/os-roadmap/p96-execution-contracts.json");
const readme = readText("README.md");
const prd = readText("docs/prd/NEXUS_AGENTIC_OS_PRD.md");
const guide = readText("docs/usage/COMMAND_CENTER_GUIDE.md");
const docs = readText("docs/architecture/P96_FOUNDER_BUSINESS_BUILD_LOCAL_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p966 = contract.subphases?.find((entry) => entry.phaseId === "P96.6");
const p967 = contract.subphases?.find((entry) => entry.phaseId === "P96.7");

const docsBundle = [readme, prd, guide, docs, platformRoadmap].join("\n");
const blockedTerms = [
  "provider/model calls",
  "agent dispatch",
  "worker/tool execution",
  "project mutation",
  "hosted DB mutation",
  "network calls",
  "deploy",
  "package",
  "provider spend",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p966-founder-business-build-readiness-docs-roadmap"]));
addCheck("contract marks P96.6 complete", p966?.status === "complete" && ["planned", "complete"].includes(p967?.status));
addCheck("README records P96 readiness", readme.includes("Current Status Through P96") && readme.includes("P96 Business Build local execution readiness"));
addCheck("PRD records P96 status", prd.includes("updated through P96") && prd.includes("Business Build local execution readiness"));
addCheck("Command Center guide documents readiness", guide.includes("Business Build Local Execution Readiness") && guide.includes("Admitted execution") && guide.includes("Dry-run admission report"));
addCheck("P96 plan records P96.6", docs.includes("P96.6 is complete") && docs.includes("npm run check:p966-founder-business-build-readiness-docs-roadmap"));
addCheck("platform roadmap records P96.6", platformRoadmap.includes("P96.6 is complete") && (platformRoadmap.includes("P96.7 is next") || platformRoadmap.includes("P96.7 is planned") || platformRoadmap.includes("P96.7 is complete")));
addCheck("docs state blocked operations", blockedTerms.every((term) => docsBundle.toLowerCase().includes(term.toLowerCase())));
addCheck("docs avoid execution implication", !/execution is enabled|dispatch is enabled|provider calls are enabled|deploy is enabled|spend is enabled/i.test(docsBundle));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P96")?.status)
    && statusById.get("P96.6")?.status === "complete"
    && ["P96.6", "P96.7"].includes(status.currentPhase)
    && ["P96.5", "P96.6"].includes(status.previousPhase)
    && ["P96.7", "P97"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P96.6", roadmapById.get("P96.6")?.track === "NEXUS_OS" && roadmapById.get("P96.6")?.status === "complete");
addCheck("P96.7 handoff exists", ["planned", "complete"].includes(statusById.get("P96.7")?.status) && ["planned", "complete"].includes(roadmapById.get("P96.7")?.status));
addCheck("P96.6 avoids forbidden file scope", !p966.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("dashboard/src/") || file.startsWith("dashboard/tests/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P96.6 README, PRD, Command Center guide, P96 plan, and platform roadmap updates.",
        "- Confirms docs describe Business Build local execution readiness without implying execution permission.",
        "- Confirms P96.7 final validation handoff is current.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p966-founder-business-build-readiness-docs-roadmap",
        "- npm run check:p965-founder-business-build-readiness-validation",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P96.6 is docs and roadmap only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P96.6 Founder Business Build Readiness Docs Roadmap Report", phase: "P96.6" },
);

printCheckReport("P96.6 Founder Business Build Readiness Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
