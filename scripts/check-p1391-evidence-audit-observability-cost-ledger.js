import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1391-evidence-audit-observability-cost-ledger-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p139-evidence-audit-observability-cost-ledger-contracts.json";
const PLAN_PATH = "docs/architecture/P139_EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PLAN.md";
const REQUIRED_SCRIPT = "check:p1391-evidence-audit-observability-cost-ledger";
const EXPECTED_BASE_COMMIT = "afe98694";
const VALIDATION_COMMANDS = [
  "npm run check:p1391-evidence-audit-observability-cost-ledger",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const LEDGER_FIELDS = [
  "actionRef",
  "actorRef",
  "projectScope",
  "evidenceRefs",
  "auditRefs",
  "activityRefs",
  "observabilityRefs",
  "costAttribution",
  "redactionState",
  "policyDecision",
  "disabledReason",
  "ownerCapability",
  "createdAt",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|audit|observability|cost|redacted|validation-only|closure)\b/i.test(context);
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
const p1391 = subphaseById.get("P139.1") || {};
const p1392 = subphaseById.get("P139.2") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1391-evidence-audit-observability-cost-ledger.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P139.1";
const allowedFiles = new Set(p1391.allowedFiles || []);
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
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1391CurrentState =
  status.currentPhase === "P139.1"
  && status.previousPhase === "P138.7"
  && status.nextPhase === "P139.2"
  && roadmap.currentPhase === "P139.1"
  && roadmap.previousPhase === "P138.7"
  && roadmap.nextPhase === "P139.2"
  && status.current?.phaseId === "P139.1"
  && status.previous?.phaseId === "P138.7"
  && status.next?.phaseId === "P139.2"
  && roadmap.current?.phaseId === "P139.1"
  && roadmap.previous?.phaseId === "P138.7"
  && roadmap.next?.phaseId === "P139.2"
  && statusById.get("P138")?.status === "complete"
  && roadmapById.get("P138")?.status === "complete"
  && statusById.get("P138.7")?.status === "complete"
  && roadmapById.get("P138.7")?.status === "complete"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && statusById.get("P139.1")?.status === "complete"
  && roadmapById.get("P139.1")?.status === "complete"
  && statusById.get("P139.2")?.status === "planned"
  && roadmapById.get("P139.2")?.status === "planned";
const p1392CurrentState =
  status.currentPhase === "P139.2"
  && status.previousPhase === "P139.1"
  && status.nextPhase === "P139.3"
  && roadmap.currentPhase === "P139.2"
  && roadmap.previousPhase === "P139.1"
  && roadmap.nextPhase === "P139.3"
  && status.current?.phaseId === "P139.2"
  && status.previous?.phaseId === "P139.1"
  && status.next?.phaseId === "P139.3"
  && roadmap.current?.phaseId === "P139.2"
  && roadmap.previous?.phaseId === "P139.1"
  && roadmap.next?.phaseId === "P139.3"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && statusById.get("P139.1")?.status === "complete"
  && roadmapById.get("P139.1")?.status === "complete"
  && statusById.get("P139.2")?.status === "complete"
  && roadmapById.get("P139.2")?.status === "complete"
  && statusById.get("P139.3")?.status === "planned"
  && roadmapById.get("P139.3")?.status === "planned";
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
const p1391OrLaterState = p1391CurrentState || p1392CurrentState || p1396CurrentState;

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1391-evidence-audit-observability-cost-ledger.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract starts P139 safely", contract.phaseId === "P139" && contract.status === "in_progress" && ["P139.1", "P139.2", "P139.6"].includes(contract.currentSubphase) && ["P138.7", "P139.1", "P139.5"].includes(contract.previousSubphase) && ["P139.2", "P139.3", "P139.7"].includes(contract.nextSubphase));
addCheck("contract records expected base commit", contract.expectedBaseCommit === EXPECTED_BASE_COMMIT && p1391.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract has seven implementation-grade subphases", (contract.subphases || []).length === 7 && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5", "P139.6", "P139.7"].every((phaseId) => subphaseById.has(phaseId)));
addCheck("P139.1 complete and P139.2 handoff known", p1391.status === "complete" && ["planned", "complete"].includes(p1392.status) && p1391.nextPhase === "P139.2");
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1391.validationCommands?.includes(command)));
addCheck("future ledger shape is display-safe and complete", LEDGER_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(contract.futureLedgerRecordShape || {}, field)) && contract.futureLedgerRecordShape?.costAttribution?.mode === "no-spend until future approval");
addCheck("all authority flags remain blocked", Object.values(contract.authorityFlags || {}).every((value) => value === false));
addCheck("contract reuses existing helpers", ["shared/reportWriter.js", "shared/checkResultFormatter.js", "shared/resultEnvelope.js", "shared/modeGuard.js", "shared/redaction.js", "observability/activityLogger.js", "cost-center/costLedgerSchema.js", "cost-center/costRecorder.js"].every((target) => contract.reuseTargets?.includes(target)));
addCheck("contract scope stays contract-only", p1391.expectedExports?.length === 0 && /Contract-only/.test(p1391.dataShape || "") && p1391.forbiddenFiles?.includes("dashboard/src/**") && p1391.forbiddenFiles?.includes("projects/**"));
addCheck("P138.7 report passes", reportPassed("reports/p1387-project-workspace-mutation-build-pipeline-report.md"));
addCheck("enterprise checker accepts P139.1", enterpriseChecker.includes("p1391StartedState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P139 handoff", osStatusChecker.includes('"P139.1"') && osStatusChecker.includes('"P139.2"'));
addCheck("P139 plan records P139.1", /## P139\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P139.1", /P139\.1 evidence, audit,[\s\S]*observability, and cost ledger contract/i.test(readme));
addCheck("platform roadmap records P139.1", /P139\.1 evidence, audit, observability, and cost ledger contract is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P139.1", /P139\.1 is now complete/i.test(enterpriseRoadmap) && (/P139\.2 is the next executable subphase/i.test(enterpriseRoadmap) || /P139\.2 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status keeps P139.1 complete", p1391OrLaterState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P139.1 entries have required fields", [statusById.get("P139"), statusById.get("P139.1"), roadmapById.get("P139"), roadmapById.get("P139.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P139.2 handoff remains valid", (p1391CurrentState && statusById.get("P139.2")?.status === "planned" && roadmapById.get("P139.2")?.status === "planned" && !(statusById.get("P139.2")?.checksRun || []).length) || p1392CurrentState || p1396CurrentState);
addCheck("changed files stay in P139.1 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P139.1 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|ledger)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/write ledger now|persist ledger now|write audit now|write evidence now|call provider now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(ledger writes are enabled|audit writes are enabled|evidence writes are enabled|observability writes are enabled|cost writes are enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw ledger payloads?|raw registry dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Starts P139 with an enterprise evidence, audit, observability, and cost ledger contract.",
        "- Defines future display-safe ledger record shape, reuse requirements, safety rules, validation commands, and the P139.2 handoff.",
        "- Does not write ledger records, DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Ledger Contract Fields",
      body: LEDGER_FIELDS.map((field) => `- ${field}`).join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        p1396CurrentState ? "- P139.6 has advanced from the P139.1 handoff chain." : p1392CurrentState ? "- P139.2 has advanced from the P139.1 handoff." : "- P139.2 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: p1392CurrentState || p1396CurrentState
        ? "- P139.1 is contract-only. It does not enable live ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. Later P139 subphases have advanced through separate guarded work."
        : "- P139.1 is contract-only. It does not enable live ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P139.2 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P139.1 Evidence Audit Observability Cost Ledger Report", phase: "P139.1" },
);

printCheckReport("P139.1 Evidence Audit Observability Cost Ledger Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
