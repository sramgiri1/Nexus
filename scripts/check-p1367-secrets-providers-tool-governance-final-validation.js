import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1367-secrets-providers-tool-governance-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json";
const PLAN_PATH = "docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md";
const ENTERPRISE_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";
const PLATFORM_PATH = "docs/architecture/NEXUS_PLATFORM_ROADMAP.md";
const REQUIRED_SCRIPT = "check:p1367-secrets-providers-tool-governance-final-validation";
const COMPLETED_SUBPHASES = ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5", "P136.6", "P136.7"];
const VALIDATION_COMMANDS = [
  "npm run check:p1367-secrets-providers-tool-governance-final-validation",
  "npm run check:p1366-secrets-providers-tool-governance-docs-roadmap",
  "npm run check:p1365-secrets-providers-tool-governance-tests-checkers",
  "npm run check:p1364-provider-governance-command-center-ux",
  "npm run check:p1363-provider-dry-run",
  "npm run check:p1362-secret-provider-model",
  "npm run check:p1361-secrets-providers-tool-governance",
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
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|review-only|model|checker|report|docs?|roadmap|status|boundary|non-runnable|zero-spend|display-safe|tests?|coverage|final validation|handoff|closed)\b/i.test(context);
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
const p1367 = subphaseById.get("P136.7") || {};
const p137Status = statusById.get("P137") || {};
const checkerSource = readText("scripts/check-p1367-secrets-providers-tool-governance-final-validation.js");
const p1366Checker = readText("scripts/check-p1366-secrets-providers-tool-governance-docs-roadmap.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText(PLATFORM_PATH);
const enterpriseRoadmap = readText(ENTERPRISE_PATH);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P136.7";
const allowedFiles = new Set(p1367.allowedFiles || []);
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
const p1367FinalState =
  status.currentPhase === "P136.7"
  && status.previousPhase === "P136.6"
  && status.nextPhase === "P137"
  && roadmap.currentPhase === "P136.7"
  && roadmap.previousPhase === "P136.6"
  && roadmap.nextPhase === "P137"
  && status.current?.phaseId === "P136.7"
  && status.previous?.phaseId === "P136.6"
  && status.next?.phaseId === "P137"
  && roadmap.current?.phaseId === "P136.7"
  && roadmap.previous?.phaseId === "P136.6"
  && roadmap.next?.phaseId === "P137"
  && statusById.get("P133")?.status === "complete"
  && roadmapById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "complete"
  && roadmapById.get("P134")?.status === "complete"
  && statusById.get("P135")?.status === "complete"
  && roadmapById.get("P135")?.status === "complete"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && COMPLETED_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137")?.status === "planned"
  && roadmapById.get("P137")?.status === "planned";
const p1371StartedState =
  status.currentPhase === "P137.1"
  && status.previousPhase === "P136.7"
  && status.nextPhase === "P137.2"
  && roadmap.currentPhase === "P137.1"
  && roadmap.previousPhase === "P136.7"
  && roadmap.nextPhase === "P137.2"
  && status.current?.phaseId === "P137.1"
  && status.previous?.phaseId === "P136.7"
  && status.next?.phaseId === "P137.2"
  && roadmap.current?.phaseId === "P137.1"
  && roadmap.previous?.phaseId === "P136.7"
  && roadmap.next?.phaseId === "P137.2"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && COMPLETED_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && roadmapById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "planned"
  && roadmapById.get("P137.2")?.status === "planned";
const p1372CurrentState =
  status.currentPhase === "P137.2"
  && status.previousPhase === "P137.1"
  && status.nextPhase === "P137.3"
  && roadmap.currentPhase === "P137.2"
  && roadmap.previousPhase === "P137.1"
  && roadmap.nextPhase === "P137.3"
  && status.current?.phaseId === "P137.2"
  && status.previous?.phaseId === "P137.1"
  && status.next?.phaseId === "P137.3"
  && roadmap.current?.phaseId === "P137.2"
  && roadmap.previous?.phaseId === "P137.1"
  && roadmap.next?.phaseId === "P137.3"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && COMPLETED_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && roadmapById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "complete"
  && roadmapById.get("P137.2")?.status === "complete"
  && statusById.get("P137.3")?.status === "planned"
  && roadmapById.get("P137.3")?.status === "planned";
const p1373CurrentState =
  status.currentPhase === "P137.3"
  && status.previousPhase === "P137.2"
  && status.nextPhase === "P137.4"
  && roadmap.currentPhase === "P137.3"
  && roadmap.previousPhase === "P137.2"
  && roadmap.nextPhase === "P137.4"
  && status.current?.phaseId === "P137.3"
  && status.previous?.phaseId === "P137.2"
  && status.next?.phaseId === "P137.4"
  && roadmap.current?.phaseId === "P137.3"
  && roadmap.previous?.phaseId === "P137.2"
  && roadmap.next?.phaseId === "P137.4"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && COMPLETED_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && roadmapById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "complete"
  && roadmapById.get("P137.2")?.status === "complete"
  && statusById.get("P137.3")?.status === "complete"
  && roadmapById.get("P137.3")?.status === "complete"
  && statusById.get("P137.4")?.status === "planned"
  && roadmapById.get("P137.4")?.status === "planned";
const p1374CurrentState =
  status.currentPhase === "P137.4"
  && status.previousPhase === "P137.3"
  && status.nextPhase === "P137.5"
  && roadmap.currentPhase === "P137.4"
  && roadmap.previousPhase === "P137.3"
  && roadmap.nextPhase === "P137.5"
  && status.current?.phaseId === "P137.4"
  && status.previous?.phaseId === "P137.3"
  && status.next?.phaseId === "P137.5"
  && roadmap.current?.phaseId === "P137.4"
  && roadmap.previous?.phaseId === "P137.3"
  && roadmap.next?.phaseId === "P137.5"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && COMPLETED_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && ["P137.1", "P137.2", "P137.3", "P137.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137.5")?.status === "planned"
  && roadmapById.get("P137.5")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract closes P136", contract.status === "complete" && contract.currentSubphase === "P136.7" && contract.previousSubphase === "P136.6" && contract.nextSubphase === "P137" && p1367.status === "complete");
addCheck("P136.7 records expected base commit", p1367.expectedBaseCommit === "18e0960a");
addCheck("P136.7 records validation commands", VALIDATION_COMMANDS.every((command) => p1367.validationCommands?.includes(command)));
addCheck("P136.1-P136.7 contract entries complete", COMPLETED_SUBPHASES.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("prior P136 reports pass", [
  "reports/p1366-secrets-providers-tool-governance-docs-roadmap-report.md",
  "reports/p1365-secrets-providers-tool-governance-tests-checkers-report.md",
  "reports/p1364-provider-governance-command-center-ux-report.md",
  "reports/p1363-provider-dry-run-report.md",
  "reports/p1362-secret-provider-model-report.md",
  "reports/p1361-secrets-providers-tool-governance-report.md",
].every((reportPath) => reportPassed(reportPath)));
addCheck("P136.6 checker accepts P136.7", p1366Checker.includes("p1367FinalState") && p1366Checker.includes('status.currentPhase === "P136.7"') && p1366Checker.includes('status.nextPhase === "P137"'));
addCheck("enterprise checker accepts P136.7", enterpriseChecker.includes("p1367FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P137 handoff", ["P136.7", "P137"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P136 plan records P136.7", /### P136\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck(
  "README records P136.7",
  /P136\.7 secrets\/providers\/tool governance final validation/i.test(readme)
    && (/P137 agent work order runtime is planned-only next/i.test(readme)
      || /P137\.1 agent work order runtime contract/i.test(readme)
	      || /P137\.2 agent work order runtime model/i.test(readme)
	      || /P137\.3 agent work order dispatch dry run/i.test(readme)
	      || /P137\.4 agent work order Agent Flow UX/i.test(readme)),
	);
	addCheck("platform roadmap records P136.7", /P136\.7 secrets\/providers\/tool governance final validation is complete/i.test(platformRoadmap) && (/P137 Agent Work Order Runtime is planned-only next/i.test(platformRoadmap) || /P137\.1 agent work order runtime contract is complete/i.test(platformRoadmap) || /P137\.2 agent work order runtime model is complete/i.test(platformRoadmap) || /P137\.3 agent work order dispatch dry run is complete/i.test(platformRoadmap) || /P137\.4 agent work order Agent Flow UX is complete/i.test(platformRoadmap)));
addCheck(
  "enterprise roadmap records P136 closure",
  /P136\.1 through P136\.7\s+are\s+now complete/i.test(enterpriseRoadmap)
    && (/P137 is the next executable phase/i.test(enterpriseRoadmap)
	      || (/P137\.1 is now complete/i.test(enterpriseRoadmap) && /P137\.2 is the next executable subphase/i.test(enterpriseRoadmap))
	      || (/P137\.2 is now complete/i.test(enterpriseRoadmap) && /P137\.3 is the next executable subphase/i.test(enterpriseRoadmap))
	      || (/P137\.3 is now complete/i.test(enterpriseRoadmap) && /P137\.4 is the next executable subphase/i.test(enterpriseRoadmap))
	      || (/P137\.4 is now complete/i.test(enterpriseRoadmap) && /P137\.5 is the next executable subphase/i.test(enterpriseRoadmap))),
	);
	addCheck("phase status closes P136", p1367FinalState || p1371StartedState || p1372CurrentState || p1373CurrentState || p1374CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
	addCheck("completed P136 entries have required fields", [statusById.get("P136"), statusById.get("P136.7"), roadmapById.get("P136"), roadmapById.get("P136.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
	addCheck("P137 handoff remains safe", (p137Status.status === "planned" && p137Status.commit === "" && Array.isArray(p137Status.checksRun) && p137Status.checksRun.length === 0 && (p137Status.knownLimitations || []).join(" ").toLowerCase().includes("planned-only")) || p1371StartedState || p1372CurrentState || p1373CurrentState || p1374CurrentState);
addCheck(
  "changed files stay in P136.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P136.7 forbidden path check relaxed for ${status.currentPhase}`,
);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable provider/tool actions", !/call provider now|call model now|run tool now|execute tool now|start mcp now|rotate secret now|create secret now|validate secret now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /secret values are stored|provider calls are enabled|model calls are enabled|tool execution is enabled|MCP servers are enabled|network calls are enabled|provider spend is enabled|budget spending is enabled|approval writes are enabled|DB writes are enabled|runtime writes are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P136 closure, P136.1-P136.6 reports, checker handoffs, OS status, roadmap, and documentation.",
        "- Confirms P137 remains safely handed off and no secret values, provider/model calls, tool execution, MCP startup, DB/runtime writes, agent dispatch, project mutation, deploy, release, export, package, network, or spend behavior is enabled by P136.7.",
        "- Confirms this subphase does not change Command Center source, project source, DB/runtime source, provider/tool source, deploy/release/export/package files, or environment files.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P136.7 is final validation only. It does not enable secret value access, provider adapters, model clients, tool executors, MCP startup, approval writes, budget ledgers, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P137 remains governed by its own implementation-grade subphase contract.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P136.7 Secrets Providers Tool Governance Final Validation Report", phase: "P136.7" },
);

printCheckReport("P136.7 Secrets Providers Tool Governance Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
