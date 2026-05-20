import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p906-founder-prd-docs-roadmap-report.md";

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
const contract = readText("contracts/os-roadmap/p90-execution-contracts.json");
const docs = readText("docs/architecture/P90_GOVERNED_FOUNDER_PRD_LIVE_AUTHORING_LANE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const p905Report = readText("reports/p905-founder-prd-lane-validation-report.md");
const commandCenterPage = readText("dashboard/src/pages/CommandCenterV2.jsx");
const commandCenterTabs = readText("dashboard/src/data/commandCenterTabs.js");

const requiredDocs = [
  "P90.1 is complete",
  "P90.2 is complete",
  "P90.3 is complete",
  "P90.4 is complete",
  "P90.5 is complete",
  "P90.6 is complete",
  "P90.7 Final Validation",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p906-founder-prd-docs-roadmap"]));
addCheck("contract tracks P90.6", contract.includes("P90.6") && contract.includes("check:p906-founder-prd-docs-roadmap"));
addCheck("contract keeps P90.7 final handoff", contract.includes("P90.7") && contract.includes("Finalize P90 validation"));
addCheck("P90 plan doc is closed through P90.6", requiredDocs.every((text) => docs.includes(text)));
addCheck("P90 plan records validation commands", docs.includes("npm run check:p906-founder-prd-docs-roadmap") && docs.includes("npm run check:p905-founder-prd-lane-validation"));
addCheck("platform roadmap records P90.6", platformRoadmap.includes("P90.6 is complete") && platformRoadmap.includes("P90.7 is next"));
addCheck("P90.5 validation remains recorded", p905Report.includes("P90.5 Founder PRD Lane Validation Report") && p905Report.includes("PASS"));
addCheck(
  "phase status advanced",
  statusById.get("P90")?.status === "in_progress"
    && statusById.get("P90.6")?.status === "complete"
    && status.currentPhase === "P90.6"
    && status.previousPhase === "P90.5"
    && status.nextPhase === "P90.7",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P90.6", roadmapById.get("P90.6")?.track === "NEXUS_OS" && roadmapById.get("P90.6")?.status === "complete");
addCheck("P90.7 planned handoff exists", statusById.get("P90.7")?.status === "planned" && roadmapById.get("P90.7")?.status === "planned");
addCheck("status checker accepts P90.7", statusChecker.includes("\"P90.7\""));
addCheck("Command Center Local PRD remains present", commandCenterTabs.includes('id: "localPrd"') && commandCenterPage.includes("Local PRD Artifact"));
addCheck("Command Center does not expose DemoApp", !/DemoApp/.test(commandCenterPage + commandCenterTabs));
addCheck("Command Center does not expose fake unsafe actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i.test(commandCenterPage + commandCenterTabs));
addCheck("docs preserve blocked runtime boundary", docs.includes("does not write") && docs.includes("dispatch agents") && docs.includes("call providers/models") && docs.includes("deploy, release, export, package, or spend"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P90.6 docs, roadmap, contract, and phase-status closure.",
        "- Confirms P90.7 remains the final validation handoff.",
        "- Confirms Command Center Local PRD UX remains present while unsafe runtime operations stay blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p906-founder-prd-docs-roadmap",
        "- npm run check:p905-founder-prd-lane-validation",
        "- npm run check:p904-command-center-prd-lane-ux",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P90.6 is docs and roadmap closure only. It does not write project files, dispatch agents, execute tools/workers, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P90.6 Founder PRD Docs Roadmap Report", phase: "P90.6" },
);

printCheckReport("P90.6 Founder PRD Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
