import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildFounderRuntimeEnvelope,
  validateFounderRuntimeEnvelope,
} from "../live-ready/founderRuntimeEnvelope.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p842-command-center-lite-report.md";

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

const envelope = buildFounderRuntimeEnvelope();
const validation = validateFounderRuntimeEnvelope(envelope);
const envelopeText = JSON.stringify(envelope);
const routes = readText("dashboard/src/data/commandCenterRoutes.js");
const page = readText("dashboard/src/pages/CommandCenterV2.jsx");
const styles = readText("dashboard/src/styles-command-center-v2.css");
const tests = readText("dashboard/tests/routes.spec.js");
const contract = readText("contracts/os-roadmap/p84-execution-contracts.json");
const docs = readText("docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md");
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));

const unsafeFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
];

addCheck("envelope validates", validation.valid, validation.errors.join("; "));
addCheck("chat and agent flow present", envelope.data.chat.title === "Chat with NEXUS" && envelope.data.agentFlow.length >= 4);
addCheck("unsafe execution remains false", unsafeFlags.every((flag) => envelope.data[flag] === false && envelope.data.safety[flag] === false));
addCheck("local planning gates visible", envelope.data.safety.localQnaAllowed === true && envelope.data.safety.localPrdDraftAllowed === true && envelope.data.safety.localWorkstreamPlanningAllowed === true);
addCheck("no fake runnable actions", !/dispatch now|run agent|call provider now|write project now|deploy now|spend now/i.test(envelopeText));
addCheck("P80/P81/P84 helpers reused", readText("live-ready/founderRuntimeEnvelope.js").includes("createFounderIntakeSessionEnvelope") && readText("live-ready/founderRuntimeEnvelope.js").includes("createBusinessBuildPrdDraft") && readText("live-ready/founderRuntimeEnvelope.js").includes("buildFounderRuntimeAdmission"));
addCheck("Lite route is default", routes.includes('key: "lite"') && routes.includes('aliases: ["/", "/command-center"]') && routes.includes("getCommandCenterLiteSidebarGroups"));
addCheck("primary sidebar hides clutter by construction", routes.includes('"lite"') && routes.includes('"agentFlow"') && !/liteRouteKeys[\s\S]*"workers"/.test(routes) && !/liteRouteKeys[\s\S]*"enterprisePreview"/.test(routes));
addCheck("Command Center renders Lite and Agent Flow", page.includes("CommandCenterLitePage") && page.includes("AgentFlowPanel") && page.includes('currentPage === "lite"') && page.includes('currentPage === "agentFlow"'));
addCheck("Lite styles are present", styles.includes(".ccv2-lite-page") && styles.includes(".ccv2-agent-flow__rail"));
addCheck("Playwright coverage added", tests.includes("Command Center Lite keeps primary navigation focused") && tests.includes("Chat with NEXUS and watch the agent plan form"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p842-command-center-lite"]));
addCheck("contract references P84.2 Lite files", contract.includes("live-ready/founderRuntimeEnvelope.js") && contract.includes("check:p842-command-center-lite"));
addCheck("docs mention P84.2 validation", docs.includes("P84.2 Live-Local Q&A to PRD Envelope") && docs.includes("npm run check:p842-command-center-lite"));
addCheck("phase status advanced", statusById.get("P84.2")?.status === "complete" && status.currentPhase === "P84.2" && status.nextPhase === "P84.3");
addCheck("report prerequisites exist", fileExists("reports/p841-founder-runtime-admission-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P84.2 Command Center Lite and live-local Q&A to PRD envelope.",
        "- Primary UX now focuses on chat with NEXUS, local PRD readiness, and graphical agent workstream planning.",
        "- Advanced Command Center routes remain registered but are removed from the primary founder sidebar.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Command Center UX",
      body: [
        `- Current state: ${envelope.data.currentState}`,
        `- Next action: ${envelope.data.nextAction}`,
        `- Owner capability: ${envelope.data.ownerCapability}`,
        `- Agent lanes shown: ${envelope.data.agentFlow.length}`,
        `- Cost impact: ${envelope.data.costImpact}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p842-command-center-lite",
        "- npm run check:p84-execution-plan",
        "- npm run check:os-phase-status",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Command Center Lite|home route\"",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P84.2 is local planning UX only. It does not call providers, dispatch agents, mutate projects, write DB state, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P84.2 Command Center Lite Report", phase: "P84.2" },
);

printCheckReport("P84.2 Command Center Lite Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
