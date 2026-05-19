import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/phase-validation-coverage-report.md";

function readText(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function phaseNumber(phaseId = "") {
  const match = phaseId.match(/^P(\d+)/);
  return match ? Number(match[1]) : 0;
}

function isFuturePhase(phaseId = "") {
  return phaseNumber(phaseId) >= 64;
}

function collectCheckerNames() {
  return readdirSync(join(ROOT, "scripts"))
    .filter((name) => name.startsWith("check-") && name.endsWith(".js"))
    .sort();
}

function checkerFromCommand(command = "") {
  if (!command.startsWith("npm run ")) return "";
  const scriptName = command.replace("npm run ", "").trim().split(/\s+/)[0];
  const packageCommand = packageScripts[scriptName];
  const match = packageCommand?.match(/node\s+(scripts\/check-[^\s]+\.js)/);
  return match ? match[1].replace("scripts/", "") : "";
}

const phaseIndex = readJson("os-roadmap/nexus-phases.json");
const phaseStatus = readJson("os-roadmap/phase-status.json");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const checkerNames = collectCheckerNames();
const packageJson = readJson("package.json");
const packageScripts = packageJson.scripts || {};
const reportFiles = new Set(
  readdirSync(join(ROOT, "reports"))
    .filter((name) => name.endsWith(".md") || name.endsWith(".json"))
    .map((name) => `reports/${name}`),
);

const targetPhases = (phaseIndex.phases || [])
  .filter((phase) => phase.track === "NEXUS_OS")
  .filter((phase) => phaseNumber(phase.phaseId) >= 63)
  .sort((a, b) => a.order - b.order);

const rows = targetPhases.map((phase) => {
  const status = statusById.get(phase.phaseId) || {};
  const slug = normalize(`${phase.phaseId}-${phase.title}`);
  const titleSlug = normalize(phase.title);
  const idSlug = normalize(phase.phaseId);
  const checksRun = Array.isArray(status.checksRun) ? status.checksRun : [];
  const checkersFromEvidence = checksRun.map(checkerFromCommand).filter(Boolean);
  const matchingCheckers = checkerNames.filter((checker) => {
    const normalized = normalize(checker);
    return normalized.includes(idSlug) || normalized.includes(titleSlug.split("-").slice(0, 3).join("-"));
  }).concat(checkersFromEvidence.filter((checker) => checkerNames.includes(checker)));
  const matchingReports = [...reportFiles].filter((report) => {
    const normalized = normalize(report);
    if (normalized.includes(idSlug) || normalized.includes(titleSlug.split("-").slice(0, 3).join("-")) || normalized.includes(slug)) {
      return true;
    }
    const source = readText(report);
    return source.includes(`Phase: ${phase.phaseId}`) || source.includes(`- Phase: ${phase.phaseId}`);
  });
  const packageCheckScripts = Object.entries(packageScripts)
    .filter(([name, command]) => name.startsWith("check:") && matchingCheckers.some((checker) => command.includes(checker)))
    .map(([name]) => name);

  const missing = [];
  if (!status.status) missing.push("phase_status_entry");
  if (status.status === "complete" && checksRun.length === 0) missing.push("checks_run_evidence");
  if (status.status === "planned" && !isFuturePhase(phase.phaseId)) missing.push("unexpected_planned_current_or_past_phase");
  if (matchingCheckers.length === 0) missing.push("dedicated_checker");
  if (matchingReports.length === 0) missing.push("validation_report");
  if (matchingCheckers.length > 0 && packageCheckScripts.length === 0) missing.push("package_check_script");

  return {
    phaseId: phase.phaseId,
    title: phase.title,
    status: status.status || "missing",
    nextPhase: status.nextPhase || "",
    checkerCount: matchingCheckers.length,
    reportCount: matchingReports.length,
    packageCheckScripts,
    checksRun,
    missing,
  };
});

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

for (const row of rows) {
  const acceptableFutureGap = row.status === "planned" && isFuturePhase(row.phaseId);
  addCheck(
    `${row.phaseId} validation coverage`,
    row.missing.length === 0 || acceptableFutureGap,
    row.missing.length ? row.missing.join(", ") : `${row.checkerCount} checkers, ${row.reportCount} reports`,
  );
}

addCheck("P63 complete", statusById.get("P63")?.status === "complete", statusById.get("P63")?.status || "missing");
addCheck("P64 complete", statusById.get("P64")?.status === "complete", statusById.get("P64")?.status || "missing");
addCheck(
  "P64.8 next planned or current",
  (phaseStatus.nextPhase === "P64.8" && statusById.get("P64.8")?.status === "planned") ||
    (phaseStatus.currentPhase === "P64.8" && ["in_progress", "complete"].includes(statusById.get("P64.8")?.status)),
  `current=${phaseStatus.currentPhase}; next=${phaseStatus.nextPhase}; status=${statusById.get("P64.8")?.status || "missing"}`,
);
addCheck("public safety report known", fileExists("reports/public-safety-report.md"));

const gaps = rows.filter((row) => row.missing.length > 0);
const blockingGaps = gaps.filter((row) => !(row.status === "planned" && isFuturePhase(row.phaseId)));
const futureGaps = gaps.filter((row) => row.status === "planned" && isFuturePhase(row.phaseId));
const failed = checks.filter((check) => check.status === "FAIL");

function renderRows(items) {
  if (items.length === 0) return "- None";
  return items.map((row) => [
    `- ${row.phaseId} ${row.title}`,
    `  - status: ${row.status}`,
    `  - checkers: ${row.checkerCount}`,
    `  - reports: ${row.reportCount}`,
    `  - gaps: ${row.missing.join(", ") || "none"}`,
  ].join("\n")).join("\n");
}

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Audits NEXUS OS phase validation coverage from P63 forward.",
        "- Does not execute providers, tools, project mutation, DB writes, deploy, or runtime actions.",
        "- Planned P64+ phases may have expected gaps; the report records those as implementation backlog.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Blocking Gaps",
      body: renderRows(blockingGaps),
    },
    {
      title: "Planned Future Gaps",
      body: renderRows(futureGaps),
    },
    {
      title: "Result",
      body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)`,
    },
  ],
  {
    title: "Phase Validation Coverage Report",
    phase: "Cross-phase validation",
  },
);

printCheckReport("Phase Validation Coverage Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) process.exit(1);
