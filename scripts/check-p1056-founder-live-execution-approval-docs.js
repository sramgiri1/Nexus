import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1056-founder-live-execution-approval-docs-report.md";

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
const contract = readJson("contracts/os-roadmap/p105-founder-live-execution-approval-planning-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PLANNING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1056 = subphaseById.get("P105.6") || {};
const p105Scripts = [
  "check:p1051-founder-live-execution-approval-planning-contract",
  "check:p1052-founder-live-execution-approval-plan-model",
  "check:p1053-founder-live-execution-approval-review-packet",
  "check:p1054-command-center-approval-review-ux",
  "check:p1055-founder-live-execution-approval-aggregate",
];
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const docsText = `${readme}\n${platformRoadmap}\n${plan}`;
const readmeP105 = readme.slice(readme.indexOf("- P105.1 approval planning"), readme.indexOf("## CareLoop Project Progress"));
const roadmapP105 = platformRoadmap.slice(platformRoadmap.indexOf("P105.1 is complete"), platformRoadmap.indexOf("Implementation follows\n[`p105-founder-live-execution-approval-planning-contracts.json`"));
const scopedP105Docs = `${readmeP105}\n${roadmapP105}\n${plan}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1056-founder-live-execution-approval-docs"]));
addCheck("all prior P105 scripts registered", p105Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract marks P105.6 complete", p1056.status === "complete");
addCheck("P105.7 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P105.7")?.status));
addCheck("contract records validation commands", (p1056.validationCommands || []).includes("npm run check:p1056-founder-live-execution-approval-docs") && (p1056.validationCommands || []).includes("npm run check:phase-validation-coverage"));
addCheck("contract avoids forbidden file scope", !(p1056.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P105.6 complete", /P105\.6 Docs \/ Roadmap[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P105.6", /P105\.6 is\s+complete/.test(platformRoadmap) && /P105\.7 is\s+next/.test(platformRoadmap));
addCheck("README records P105.6", /P105\.6 docs closure/.test(readme) && /P105\.7 is next/.test(readme));
addCheck("docs record approval planning scope", /approval-planning contract/i.test(docsText) && /approval-plan model/i.test(docsText) && /dry-run review packet/i.test(docsText) && /approval review UX/i.test(docsText));
addCheck("docs record Command Center placement", /Business Build, Agent Flow, and Live Readiness/i.test(docsText) && /Chat with NEXUS and Lite remain chat-only/i.test(docsText));
addCheck(
  "docs preserve blocked execution wording",
  [readmeP105, roadmapP105, plan].every((text) => (
    /approval submission/i.test(text)
    && /execution unlock/i.test(text)
    && /runtime admission/i.test(text)
    && /provider\/model calls/i.test(text)
    && /agent dispatch/i.test(text)
    && /worker\/tool execution/i.test(text)
    && /project mutation/i.test(text)
    && /hosted DB mutation/i.test(text)
    && /provider spend|spend/i.test(text)
  )),
);
addCheck(
  "phase status advanced",
  ["P105.6", "P105.7"].includes(status.currentPhase)
    && ["P105.5", "P105.6"].includes(status.previousPhase)
    && ["P105.7", "P106"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P105")?.status)
    && statusById.get("P105.6")?.status === "complete"
    && roadmapById.get("P105.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("OS status command center visible", statusById.get("P105.6")?.commandCenterVisible === true && roadmapById.get("P105.6")?.commandCenterVisible === true);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(scopedP105Docs));
addCheck("docs avoid unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(scopedP105Docs));
addCheck("docs avoid raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(scopedP105Docs));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P105.6 founder live execution approval-planning docs and roadmap closure.",
        "- Confirms README, platform roadmap, P105 plan, P105 contract, OS status, and validation scripts align before final P105 validation.",
        "- Does not enable approval submission, approval capture, approval persistence, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1056-founder-live-execution-approval-docs",
        "- npm run check:p1055-founder-live-execution-approval-aggregate",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P105.6 is docs and roadmap closure only. It does not submit approvals, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P105.6 Founder Live Execution Approval Docs Report", phase: "P105.6" },
);

printCheckReport("P105.6 Founder Live Execution Approval Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
