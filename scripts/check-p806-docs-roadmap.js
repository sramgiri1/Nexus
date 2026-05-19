import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p806-docs-roadmap-report.md";

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

export function checkP80DocsRoadmap() {
  const packageJson = readJson("package.json");
  const phases = readJson("os-roadmap/nexus-phases.json").phases || [];
  const status = readJson("os-roadmap/phase-status.json");
  const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
  const phaseById = new Map(phases.map((entry) => [entry.phaseId, entry]));
  const plan = readText("docs/architecture/P80_FOUNDER_INTAKE_RUNTIME_PLAN.md");
  const roadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
  const contract = readText("contracts/os-roadmap/p80-execution-contracts.json");

  const requiredReports = [
    "reports/p805-tests-checkers-docs-report.md",
    "reports/p804-command-center-founder-intake-ux-report.md",
    "reports/p803-founder-intake-qna-report.md",
    "reports/p802-founder-intake-session-report.md",
    "reports/p801-founder-intake-schema-report.md",
    "reports/p80-execution-plan-report.md",
  ];

  addCheck("package script registered", Boolean(packageJson.scripts?.["check:p806-docs-roadmap"]));
  addCheck("contract lists checker", contract.includes("scripts/check-p806-docs-roadmap.js") && contract.includes("check:p806-docs-roadmap"));
  addCheck("required reports exist", requiredReports.every(fileExists), `${requiredReports.length} reports`);
  addCheck("P80.6 status complete", statusById.get("P80.6")?.status === "complete" && phaseById.get("P80.6")?.status === "complete");
  addCheck("root phase advanced", status.currentPhase === "P80.6" && status.previousPhase === "P80.5" && status.nextPhase === "P80.7");
  addCheck("P80 next phase is final validation", statusById.get("P80")?.status === "in_progress" && statusById.get("P80")?.nextPhase === "P80.7" && phaseById.get("P80")?.nextPhase === "P80.7");
  addCheck("plan documents P80.6 completion", plan.includes("P80.6 Docs / Roadmap") && plan.includes("Status: complete") && plan.includes("live-local founder intake posture"));
  addCheck("plan keeps runtime blocked", /provider calls[\s\S]+blocked/i.test(plan) && /project mutation[\s\S]+blocked/i.test(plan) && /provider spend[\s\S]+blocked/i.test(plan));
  addCheck("roadmap includes P79 and P80", roadmap.includes("`P79` Live Execution Mode") && roadmap.includes("`P80` Founder Intake Runtime"));
  addCheck("roadmap shows P80.6 complete and P80.7 next", roadmap.includes("`P80.6` Docs / Roadmap — complete") && roadmap.includes("`P80.7` Final Validation — next"));
  addCheck(
    "roadmap states live-local boundary",
    roadmap.includes("live-local founder intake") &&
      /provider\s+calls,\s+project\s+mutation,\s+DB\s+writes,\s+deploy,\s+and\s+provider\s+spend\s+remain\s+blocked/i.test(roadmap),
  );
  addCheck("P80.7 remains planned", statusById.get("P80.7")?.status === "planned" && phaseById.get("P80.7")?.status === "planned");
  addCheck("report path is distinct", REPORT_PATH.endsWith("p806-docs-roadmap-report.md"));

  const failed = checks.filter((check) => check.status === "FAIL");
  writeMarkdownReport(
    join(ROOT, REPORT_PATH),
    [
      {
        title: "Scope",
        body: [
          "- Updates P80 founder intake docs, platform roadmap, OS roadmap, phase status, and generated report evidence.",
          "- Does not change Command Center UI behavior or enable provider calls, tools, workers, project mutation, DB writes, deploy, network calls, or provider spend.",
        ].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(checks) },
      {
        title: "Validation Commands",
        body: [
          "- npm run check:p806-docs-roadmap",
          "- npm run check:p805-tests-checkers-docs",
          "- npm run check:p80-execution-plan",
          "- npm run check:phase-validation-coverage",
          "- npm run check:os-phase-status",
          "- npm run check:format-readability",
          "- git diff --check",
        ].join("\n"),
      },
      {
        title: "Known Limitations",
        body: "- P80.6 updates docs and roadmap only. P80 final validation starts in P80.7.",
      },
      { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
    ],
    { title: "P80.6 Docs Roadmap Report", phase: "P80.6" },
  );
  return { checks, failed, result: failed.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP80DocsRoadmap();
printCheckReport("P80.6 Docs Roadmap Check", result.checks, result.result);
if (result.failed.length > 0) process.exit(1);
