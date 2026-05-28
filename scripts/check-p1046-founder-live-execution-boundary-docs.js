import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1046-founder-live-execution-boundary-docs-report.md";

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
const contract = readJson("contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1046 = subphaseById.get("P104.6") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1046-founder-live-execution-boundary-docs"]));
addCheck("all P104 scripts registered", ["check:p1041-chat-surface-consolidation", "check:p1042-founder-live-execution-boundary-schema", "check:p1043-founder-live-execution-boundary-model", "check:p1044-founder-live-execution-boundary-ux", "check:p1045-founder-live-execution-boundary-aggregate"].every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract marks P104.6 complete", p1046.status === "complete");
addCheck("P104.7 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P104.7")?.status));
addCheck("contract records validation commands", (p1046.validationCommands || []).includes("npm run check:p1046-founder-live-execution-boundary-docs") && (p1046.validationCommands || []).includes("npm run check:phase-validation-coverage"));
addCheck("contract avoids forbidden file scope", !(p1046.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P104.6 complete", /P104\.6 Execution Boundary Docs \/ Roadmap[\s\S]*Status:\s+complete/.test(plan));
addCheck("plan lists safety boundary", /no provider\/model calls/i.test(plan) && /no project files changed/i.test(plan) && /no fake runnable actions/i.test(plan));
addCheck("platform roadmap records P104.6", /P104\.6 is\s+complete/.test(platformRoadmap) && /P104\.7\s+is\s+next/.test(platformRoadmap));
addCheck("README records P104.6", /P104\.6 execution-boundary docs/.test(readme) && /P104\.7\s+is next/.test(readme));
addCheck(
  "docs preserve blocked execution wording",
  [readme, platformRoadmap, plan].every((text) => (
    /provider\/model calls/i.test(text)
    && /agent dispatch/i.test(text)
    && /worker\/tool execution/i.test(text)
    && /project mutation/i.test(text)
    && /hosted DB mutation/i.test(text)
    && /provider spend/i.test(text)
  )),
);
addCheck(
  "phase status advanced",
  ["P104.6", "P104.7"].includes(status.currentPhase)
    && ["P104.5", "P104.6"].includes(status.previousPhase)
    && ["P104.7", "P105"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P104")?.status)
    && statusById.get("P104.6")?.status === "complete"
    && roadmapById.get("P104.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("OS status command center visible", statusById.get("P104.6")?.commandCenterVisible === true && roadmapById.get("P104.6")?.commandCenterVisible === true);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(`${readme}\n${platformRoadmap}\n${plan}`));
addCheck("docs avoid unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(`${readme}\n${platformRoadmap}\n${plan}`));
addCheck("docs prohibit raw dumps", /no raw IDs; no raw dumps; no fake runnable actions/i.test(plan));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P104.6 founder live execution-boundary docs and roadmap closure.",
        "- Confirms README, platform roadmap, P104 plan, P104 contract, OS status, and validation scripts align before final P104 validation.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1046-founder-live-execution-boundary-docs",
        "- npm run check:p1045-founder-live-execution-boundary-aggregate",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P104.6 is docs and roadmap closure only. It does not approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P104.6 Founder Live Execution Boundary Docs Report", phase: "P104.6" },
);

printCheckReport("P104.6 Founder Live Execution Boundary Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
