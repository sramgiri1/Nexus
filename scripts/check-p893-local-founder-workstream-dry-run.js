import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLocalFounderWorkstreamDryRun,
  validateLocalFounderWorkstreamDryRun,
  P89_LOCAL_FOUNDER_WORKSTREAM_DRY_RUN_PHASE,
} from "../live-ready/localFounderWorkstreamDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p893-local-founder-workstream-dry-run-report.md";

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const envelope = buildLocalFounderWorkstreamDryRun();
const validation = validateLocalFounderWorkstreamDryRun(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(data);

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

addCheck("result envelope valid", envelope.ok === true && envelope.status === "PASS" && envelope.phase === P89_LOCAL_FOUNDER_WORKSTREAM_DRY_RUN_PHASE);
addCheck("schema validation passes", validation.valid, validation.errors.join("; "));
addCheck("source phase reused", data.sourcePhase === "P89.2");
addCheck("dry runs defined", Array.isArray(data.dryRuns) && data.dryRuns.length === 3);
addCheck("dry runs blocked", (data.dryRuns || []).every((run) => run.dryRunCanMutate === false && run.dryRunCanExecute === false));
addCheck("transition steps defined", Array.isArray(data.transitionSteps) && data.transitionSteps.includes("askClarifyingQuestions") && data.transitionSteps.includes("draftPrdReadinessPacket"));
addCheck("founder inputs and preview outputs present", (data.dryRuns || []).every((run) => run.founderInputsNeeded?.includes("problem") && run.previewOutputs?.includes("agent lane plan")));
addCheck("runtime flags blocked", Object.values(data.runtimeFlags || {}).every((value) => value === false));
addCheck("top-level execution flags blocked", ["providerCallsAllowed", "modelCallsAllowed", "agentDispatchAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "localExecutorRunAllowed", "projectMutationAllowed", "dbWritesAllowed", "networkCallsAllowed", "deployExecutionAllowed", "packageCreationAllowed", "providerSpendAllowed", "executionAllowed"].every((flag) => data[flag] === false));
addCheck("display evidence present", data.commandCenterVisible === true && data.evidenceRefs?.includes("reports/p893-local-founder-workstream-dry-run-report.md"));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));
addCheck("P89.2 evidence exists", fileExists("reports/p892-local-founder-workstream-runtime-envelope-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Defines P89.3 local founder workstream dry run.",
        "- Previews founder Q&A, PRD readiness, and agent lane planning transitions.",
        "- Keeps all runtime, mutation, network, deploy, package, and spend flags blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p893-local-founder-workstream-dry-run",
        "- npm run check:p892-local-founder-workstream-runtime-envelope",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P89.3 is a local dry-run preview only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P89.3 Local Founder Workstream Dry Run Report", phase: "P89.3" },
);

printCheckReport("P89.3 Local Founder Workstream Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
