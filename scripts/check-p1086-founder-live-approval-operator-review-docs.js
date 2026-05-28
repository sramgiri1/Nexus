import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1086-founder-live-approval-operator-review-docs-report.md";

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
const contract = readJson("contracts/os-roadmap/p108-founder-live-approval-capture-operator-review-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P108_FOUNDER_LIVE_APPROVAL_CAPTURE_OPERATOR_REVIEW_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1086 = subphaseById.get("P108.6") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const docsBundle = [contract, plan, platformRoadmap, readme].map((entry) => JSON.stringify(entry)).join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1086-founder-live-approval-operator-review-docs"]));
addCheck("contract marks P108.1-P108.6 complete", ["P108.1", "P108.2", "P108.3", "P108.4", "P108.5", "P108.6"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P108.7 planned or complete", ["planned", "complete"].includes(subphaseById.get("P108.7")?.status));
addCheck("contract records docs validation commands", ["npm run check:p1086-founder-live-approval-operator-review-docs", "npm run check:p1085-founder-live-approval-operator-review-validation", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1086.validationCommands?.includes(command)));
addCheck("P108.6 avoids forbidden file scope", !(p1086.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P108.1-P108.6 complete", [
  /P108\.1 Operator Review Contract \/ Schema Baseline[\s\S]*Status:\s+complete/,
  /P108\.2 Operator Review Model[\s\S]*Status:\s+complete/,
  /P108\.3 Operator Review Audit Preview[\s\S]*Status:\s+complete/,
  /P108\.4 Command Center Operator Review UX[\s\S]*Status:\s+complete/,
  /P108\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/,
  /P108\.6 Docs \/ Roadmap[\s\S]*Status:\s+complete/,
].every((pattern) => pattern.test(plan)));
addCheck("README records P108.6", /P108\.6 docs closure/.test(readme) && /P108\.7\s+is\s+next/.test(readme));
addCheck("platform roadmap records P108.6", /P108\.6 is\s+complete/.test(platformRoadmap) && (/P108\.7 is\s+next/.test(platformRoadmap) || /P108\.7 is\s+complete/.test(platformRoadmap)));
addCheck("docs preserve blocked operator review language", /operator decisions[\s\S]*remain blocked/i.test(readme) && /approval persistence[\s\S]*remain blocked/i.test(platformRoadmap));
addCheck("docs preserve Command Center placement", /Business Build, Agent Flow, and Live Readiness/.test(readme) && /Chat with NEXUS and Lite/.test(platformRoadmap));
addCheck("docs point at P108 contract and plan", platformRoadmap.includes("p108-founder-live-approval-capture-operator-review-contracts.json") && platformRoadmap.includes("P108_FOUNDER_LIVE_APPROVAL_CAPTURE_OPERATOR_REVIEW_PLAN.md"));
addCheck(
  "phase status advanced",
  ["P108.6", "P108.7"].includes(status.currentPhase)
    && ["P108.5", "P108.6"].includes(status.previousPhase)
    && ["P108.7", "P109"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P108")?.status)
    && statusById.get("P108.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P108.7")?.status)
    && roadmapById.get("P108.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(docsBundle));
addCheck("docs do not claim execution live", !/execution is live|approval capture is live|operator decision capture is live|runtime admission is enabled|provider spend is enabled/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P108 docs, README, platform roadmap, contract, reports, and OS phase status closure.",
        "- Confirms documentation records completed P108.1-P108.6 scope while keeping operator decisions, approval capture/persistence/writes, runtime admission, and execution authority blocked.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, runtime admission, execution unlock, approval writes, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1086-founder-live-approval-operator-review-docs",
        "- npm run check:p1085-founder-live-approval-operator-review-validation",
        "- npm run check:p1084-command-center-operator-review-ux",
        "- npm run check:p1083-founder-live-approval-operator-review-audit-preview",
        "- npm run check:p1082-founder-live-approval-operator-review-model",
        "- npm run check:p1081-founder-live-approval-operator-review-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P108.6 is docs/checker only. It does not capture operator decisions, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P108.6 Founder Live Approval Operator Review Docs Report", phase: "P108.6" },
);

printCheckReport("P108.6 Founder Live Approval Operator Review Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
