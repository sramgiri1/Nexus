import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/ai-recovery-final-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const phaseStatus = readJson("os-roadmap/phase-status.json");
const phases = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
const roadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p63Plan = readText("docs/architecture/P63_AI_INTERACTION_SNAPSHOT_RECOVERY_PLAN.md");
const recoveryPreview = readText("dashboard/src/utils/recoveryPreview.js");
const recoveryPage = readText("dashboard/src/pages/Recovery.jsx");

const requiredReports = [
  "reports/ai-snapshot-contract-report.md",
  "reports/ai-interaction-capture-report.md",
  "reports/ai-recovery-point-model-report.md",
  "reports/ai-snapshot-store-report.md",
  "reports/command-center-recovery-ux-report.md",
  "reports/ai-replay-resume-preview-report.md",
];

const requiredScripts = [
  "scripts/check-ai-snapshot-contract.js",
  "scripts/check-ai-interaction-capture.js",
  "scripts/check-ai-recovery-point-model.js",
  "scripts/check-ai-snapshot-store.js",
  "scripts/check-command-center-recovery-ux.js",
  "scripts/check-ai-replay-resume-preview.js",
];

for (const phaseId of ["P63.1", "P63.2", "P63.3", "P63.4", "P63.5", "P63.6"]) {
  const phase = phases.get(phaseId);
  addCheck(`${phaseId} complete`, phase?.status === "complete", phase?.status || "missing");
  addCheck(`${phaseId} has commit`, Boolean(phase?.commit), phase?.commit || "missing");
}

for (const report of requiredReports) {
  addCheck(`report exists ${report}`, exists(report));
}

for (const script of requiredScripts) {
  addCheck(`checker exists ${script}`, exists(script));
}

addCheck("P63 plan documents final validation", p63Plan.includes("P63.7 Recovery Tests + Docs + Final Validation"));
addCheck("Platform roadmap documents P63", roadmap.includes("P63 - AI Interaction Snapshot + Granular Recovery Layer"));
addCheck("P64 remains planned", phases.get("P64")?.status === "planned");
addCheck("Recovery UX is inspection-only", recoveryPage.includes("Inspection-only") && recoveryPreview.includes("execution remains unavailable"));
addCheck("Recovery actions disabled", recoveryPreview.includes("Restore is disabled") && recoveryPreview.includes("Replay is disabled") && recoveryPreview.includes("Resume is disabled"));
addCheck("No provider dispatch enabled", !recoveryPreview.includes("providerDispatchAllowed: true"));
addCheck("No DB writes enabled", !recoveryPreview.includes("dbWriteAllowed: true"));
addCheck("No fake success copy", !/\b(successfully|execution succeeded|was restored|was replayed|was resumed)\b/i.test(recoveryPreview));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Phase: P63.7",
        "- Final validation aggregates P63 snapshot, capture, recovery point, store, Command Center Recovery UX, and replay/resume preview evidence.",
        "- P64 remains planned; no P64 provider/tool dispatch behavior is enabled.",
      ].join("\n"),
    },
    {
      title: "Subphase Results",
      body: ["P63.1", "P63.2", "P63.3", "P63.4", "P63.5", "P63.6"].map((phaseId) => {
        const phase = phases.get(phaseId);
        return `- ${phaseId}: ${phase?.status || "missing"} (${phase?.commit || "no commit"})`;
      }).join("\n"),
    },
    {
      title: "Validation Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Known Limitations",
      body: [
        "- Recovery is inspection-only and preview-only.",
        "- Restore, replay, resume, provider dispatch, tool dispatch, worker execution, project mutation, DB writes, deploy, delete, and export remain disabled.",
        "- Full dashboard page suite has known project-label assertions outside P63 OS scope.",
        "- Public safety checker has known root README project-reference findings outside P63 OS scope.",
      ].join("\n"),
    },
    {
      title: "Failures",
      body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n"),
    },
    {
      title: "Result",
      body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)`,
    },
  ],
  {
    title: "AI Recovery Final Report",
    phase: "P63.7",
  },
);

printCheckReport("AI Recovery Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) process.exit(1);
