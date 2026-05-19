import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p846-docs-roadmap-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const docs = readText("docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md");
const roadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));

const requiredValidationCommands = [
  "npm run check:p841-founder-runtime-admission",
  "npm run check:p842-command-center-lite",
  "npm run check:p843-agent-plan-admission-preview",
  "npm run check:p844-command-center-runtime-ux",
  "npm run check:p845-validation-aggregation",
  "npm run check:p846-docs-roadmap",
];

function phaseSection(phaseId) {
  const start = docs.indexOf(`## ${phaseId}`);
  if (start === -1) return "";
  const next = docs.indexOf("\n## ", start + 1);
  return docs.slice(start, next === -1 ? docs.length : next);
}

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p846-docs-roadmap"]));
addCheck(
  "P84.1-P84.6 docs marked complete",
  ["P84.1", "P84.2", "P84.3", "P84.4", "P84.5", "P84.6"].every((phaseId) =>
    phaseSection(phaseId).includes("Status: complete"),
  ),
);
addCheck("validation commands documented", requiredValidationCommands.every((command) => docs.includes(command)));
addCheck("roadmap mentions P84.6", roadmap.includes("P84.6 is complete"));
addCheck("planned list only final validation", roadmap.includes("`P84.7` Final Validation") && !roadmap.includes("`P84.6` Docs / Roadmap"));
addCheck("P84.6 status advanced", statusById.get("P84.6")?.status === "complete" && status.currentPhase === "P84.6" && status.nextPhase === "P84.7");
addCheck("P84.5 report exists", fileExists("reports/p845-validation-aggregation-report.md"));
addCheck("unsafe behavior remains documented as blocked", docs.includes("provider/model calls") && docs.includes("agent dispatch") && docs.includes("project mutation") && docs.includes("provider spend"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P84.6 docs and roadmap closure before final validation.",
        "- Confirms P84.1-P84.6 are documented, validation commands are listed, and the roadmap points only to P84.7.",
        "- Does not change runtime behavior or Command Center UX.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p846-docs-roadmap",
        "- npm run check:p845-validation-aggregation",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P84.6 is docs and roadmap only. Runtime execution, providers, agents, workers, project mutation, DB writes, deploy, release, export, package creation, network calls, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P84.6 Docs Roadmap Report", phase: "P84.6" },
);

printCheckReport("P84.6 Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
