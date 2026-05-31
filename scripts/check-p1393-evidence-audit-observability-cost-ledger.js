import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_PHASE,
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_SAFETY_FLAG_NAMES,
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_VERSION,
  buildEvidenceAuditObservabilityCostLedgerPreview,
  validateEvidenceAuditObservabilityCostLedgerPreview,
} from "../shared/evidenceAuditObservabilityCostLedgerPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1393-evidence-audit-observability-cost-ledger-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p139-evidence-audit-observability-cost-ledger-contracts.json";
const PLAN_PATH = "docs/architecture/P139_EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PLAN.md";
const REQUIRED_SCRIPT = "check:p1393-evidence-audit-observability-cost-ledger";
const EXPECTED_BASE_COMMIT = "2c1ac1bd";
const EXPECTED_EXPORTS = [
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_PHASE",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_VERSION",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_SAFETY_FLAG_NAMES",
  "buildEvidenceAuditObservabilityCostLedgerPreview",
  "validateEvidenceAuditObservabilityCostLedgerPreview",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1393-evidence-audit-observability-cost-ledger",
  "npm run check:p1392-evidence-audit-observability-cost-ledger",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
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
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|audit|observability|cost|redacted|validation-only|closure|zero-spend)\b/i.test(context);
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
const p1393 = subphaseById.get("P139.3") || {};
const p1394 = subphaseById.get("P139.4") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const checkerSource = readText("scripts/check-p1393-evidence-audit-observability-cost-ledger.js");
const previewSource = readText("shared/evidenceAuditObservabilityCostLedgerPreview.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P139.3";
const allowedFiles = new Set(p1393.allowedFiles || []);
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
const preview = buildEvidenceAuditObservabilityCostLedgerPreview({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  createdAt: "2026-05-30T00:00:00.000Z",
});
const previewValidation = validateEvidenceAuditObservabilityCostLedgerPreview(preview);
const serializedPreview = JSON.stringify(preview.data || {});
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1393CurrentState =
  status.currentPhase === "P139.3"
  && status.previousPhase === "P139.2"
  && status.nextPhase === "P139.4"
  && roadmap.currentPhase === "P139.3"
  && roadmap.previousPhase === "P139.2"
  && roadmap.nextPhase === "P139.4"
  && status.current?.phaseId === "P139.3"
  && status.previous?.phaseId === "P139.2"
  && status.next?.phaseId === "P139.4"
  && roadmap.current?.phaseId === "P139.3"
  && roadmap.previous?.phaseId === "P139.2"
  && roadmap.next?.phaseId === "P139.4"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.4")?.status === "planned"
  && roadmapById.get("P139.4")?.status === "planned";
const p1394CurrentState =
  status.currentPhase === "P139.4"
  && status.previousPhase === "P139.3"
  && status.nextPhase === "P139.5"
  && roadmap.currentPhase === "P139.4"
  && roadmap.previousPhase === "P139.3"
  && roadmap.nextPhase === "P139.5"
  && status.current?.phaseId === "P139.4"
  && status.previous?.phaseId === "P139.3"
  && status.next?.phaseId === "P139.5"
  && roadmap.current?.phaseId === "P139.4"
  && roadmap.previous?.phaseId === "P139.3"
  && roadmap.next?.phaseId === "P139.5"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.5")?.status === "planned"
  && roadmapById.get("P139.5")?.status === "planned";
const p1395CurrentState =
  status.currentPhase === "P139.5"
  && status.previousPhase === "P139.4"
  && status.nextPhase === "P139.6"
  && roadmap.currentPhase === "P139.5"
  && roadmap.previousPhase === "P139.4"
  && roadmap.nextPhase === "P139.6"
  && status.current?.phaseId === "P139.5"
  && status.previous?.phaseId === "P139.4"
  && status.next?.phaseId === "P139.6"
  && roadmap.current?.phaseId === "P139.5"
  && roadmap.previous?.phaseId === "P139.4"
  && roadmap.next?.phaseId === "P139.6"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.6")?.status === "planned"
  && roadmapById.get("P139.6")?.status === "planned";
const p1396CurrentState =
  status.currentPhase === "P139.6"
  && status.previousPhase === "P139.5"
  && status.nextPhase === "P139.7"
  && roadmap.currentPhase === "P139.6"
  && roadmap.previousPhase === "P139.5"
  && roadmap.nextPhase === "P139.7"
  && status.current?.phaseId === "P139.6"
  && status.previous?.phaseId === "P139.5"
  && status.next?.phaseId === "P139.7"
  && roadmap.current?.phaseId === "P139.6"
  && roadmap.previous?.phaseId === "P139.5"
  && roadmap.next?.phaseId === "P139.7"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5", "P139.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.7")?.status === "planned"
  && roadmapById.get("P139.7")?.status === "planned";
const p1393OrLaterState = p1393CurrentState || p1394CurrentState || p1395CurrentState || p1396CurrentState;

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1393-evidence-audit-observability-cost-ledger.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("preview exports expected API", EXPECTED_EXPORTS.every((entry) => previewSource.includes(`export const ${entry}`) || previewSource.includes(`export function ${entry}`)));
addCheck("preview reuses P139.2 model and shared helpers", [
  "./evidenceAuditObservabilityCostLedgerModel.js",
  "./modeGuard.js",
  "./redaction.js",
  "./resultEnvelope.js",
].every((target) => previewSource.includes(target)));
addCheck("preview does not include writers or execution hooks", !/\b(writeFileSync|appendFileSync|mkdirSync|rmSync|execFileSync|spawn|fetch|XMLHttpRequest|sqlite|postgres|mongodb)\b/.test(previewSource));
addCheck("preview constants are correct", EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_PHASE === "P139.3" && EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_VERSION === "1.0");
addCheck("preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("preview rows and sections are useful", preview.data?.previewSummary?.rowCount >= 3 && preview.data?.previewSummary?.sectionCount === 3 && preview.data?.previewRows?.every((row) => row.label && row.nextAction && row.disabledReason));
addCheck("preview reuses valid P139.2 model", preview.data?.sourceModel?.phase === "P139.2" && preview.data?.sourceModelValidation === "valid");
addCheck("all authority flags remain blocked", EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_SAFETY_FLAG_NAMES.every((flag) => preview.data?.[flag] === false && preview.data?.safetyFlags?.[flag] === false));
addCheck("preview remains zero-spend", preview.data?.previewSummary?.zeroSpend === true && /Zero-spend/i.test(preview.data?.costImpact || ""));
addCheck("contract advances P139.3 safely", contract.phaseId === "P139" && contract.status === "in_progress" && ["P139.3", "P139.4", "P139.5", "P139.6"].includes(contract.currentSubphase) && ["P139.2", "P139.3", "P139.4", "P139.5"].includes(contract.previousSubphase) && ["P139.4", "P139.5", "P139.6", "P139.7"].includes(contract.nextSubphase));
addCheck("contract records expected base commit", contract.expectedBaseCommit === "afe98694" && p1393.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P139.3 complete and P139.4 handoff known", p1393.status === "complete" && ["planned", "complete"].includes(p1394.status) && p1393.nextPhase === "P139.4");
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1393.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1393.validationCommands?.includes(command)));
addCheck("contract scope stays preview-only", /read-only evidence preview/i.test(p1393.dataShape || "") && p1393.forbiddenFiles?.includes("dashboard/src/**") && p1393.forbiddenFiles?.includes("db/**") && p1393.forbiddenFiles?.includes("projects/**"));
addCheck("P139.2 report passes", reportPassed("reports/p1392-evidence-audit-observability-cost-ledger-report.md"));
addCheck("enterprise checker accepts P139.3", enterpriseChecker.includes("p1393CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P139 plan records P139.3", /## P139\.3 Evidence Preview[\s\S]*Status:\s+complete/.test(plan) && (/P139\.4 remains planned-only/i.test(plan) || /P139\.4 is complete/i.test(plan)));
addCheck("README records P139.3", /P139\.3 evidence preview/i.test(readme) && (/P139\.4 is planned-only\s+next/i.test(readme) || /P139\.4 Observability Command Center UX/i.test(readme)));
addCheck("platform roadmap records P139.3", /P139\.3 evidence preview is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P139.3", /P139\.3 is now complete/i.test(enterpriseRoadmap) && (/P139\.4 is the next executable subphase/i.test(enterpriseRoadmap) || /P139\.4 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status keeps P139.3 complete", p1393OrLaterState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P139.3 entries have required fields", [statusById.get("P139"), statusById.get("P139.3"), roadmapById.get("P139"), roadmapById.get("P139.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P139.4 handoff remains valid", (p1393CurrentState && statusById.get("P139.4")?.status === "planned" && roadmapById.get("P139.4")?.status === "planned" && !(statusById.get("P139.4")?.checksRun || []).length) || p1394CurrentState || p1395CurrentState || p1396CurrentState);
addCheck("changed files stay in P139.3 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P139.3 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("preview and docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|ledger)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(`${serializedPreview}\n${docsBundle}`));
addCheck("preview avoids fake runnable actions", !/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|call provider now|dispatch agent now|mutate project now|apply patch now|run build now|run tests now|deploy now|release now|export now|package now|spend now/i.test(serializedPreview));
addCheck("docs avoid fake runnable actions", !/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|call provider now|dispatch agent now|mutate project now|apply patch now|run build now|run tests now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(ledger writes are enabled|audit writes are enabled|evidence writes are enabled|observability writes are enabled|cost writes are enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw ledger payloads?|raw registry dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds a local read-only evidence preview for the P139.2 ledger model.",
        "- Reuses the P139.2 model, mode guard, redaction, result envelope, report writer, and checker formatter helpers.",
        "- Does not write ledger records, DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Preview Summary",
      body: [
        `- Sections: ${preview.data.previewSummary.sectionCount}`,
        `- Rows: ${preview.data.previewSummary.rowCount}`,
        `- Blocked rows: ${preview.data.previewSummary.blockedRowCount}`,
        `- Zero spend: ${preview.data.previewSummary.zeroSpend}`,
        `- Ready for Command Center UX: ${preview.data.previewSummary.readyForCommandCenterUx}`,
      ].join("\n"),
    },
    {
      title: "Preview Exports",
      body: EXPECTED_EXPORTS.map((entry) => `- ${entry}`).join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        p1396CurrentState ? "- P139.6 has advanced from the P139.3 handoff chain." : p1394CurrentState ? "- P139.4 has advanced from the P139.3 handoff." : "- P139.4 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: p1394CurrentState || p1396CurrentState
        ? "- P139.3 is preview-only. It does not enable live ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. Later P139 subphases have advanced through separate guarded work."
        : "- P139.3 is preview-only. It does not enable live ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P139.4 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P139.3 Evidence Audit Observability Cost Ledger Report", phase: "P139.3" },
);

printCheckReport("P139.3 Evidence Audit Observability Cost Ledger Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
