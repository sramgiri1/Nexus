import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLocalFounderWorkstreamRuntimeEnvelope,
  validateLocalFounderWorkstreamRuntimeEnvelope,
  P89_LOCAL_FOUNDER_WORKSTREAM_RUNTIME_ENVELOPE_PHASE,
} from "../live-ready/localFounderWorkstreamRuntimeEnvelope.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p892-local-founder-workstream-runtime-envelope-report.md";

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const envelope = buildLocalFounderWorkstreamRuntimeEnvelope();
const validation = validateLocalFounderWorkstreamRuntimeEnvelope(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(data);

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

addCheck("result envelope valid", envelope.ok === true && envelope.status === "PASS" && envelope.phase === P89_LOCAL_FOUNDER_WORKSTREAM_RUNTIME_ENVELOPE_PHASE);
addCheck("schema validation passes", validation.valid, validation.errors.join("; "));
addCheck("source phase reused", data.sourcePhase === "P89.1");
addCheck("workstreams defined", Array.isArray(data.workstreams) && data.workstreams.length === 3);
addCheck("workstreams blocked", (data.workstreams || []).every((workstream) => workstream.workstreamCanRun === false && workstream.founderInteractionState === "local_envelope_defined_needs_founder_answers"));
addCheck("founder evidence required", Array.isArray(data.requiredEvidence) && data.requiredEvidence.includes("founderIdeaSummary") && data.requiredEvidence.includes("prdReadinessChecklist"));
addCheck("agent lanes planned", (data.workstreams || []).every((workstream) => Array.isArray(workstream.agentLanePlan) && workstream.agentLanePlan.length >= 2));
addCheck("runtime flags blocked", Object.values(data.runtimeFlags || {}).every((value) => value === false));
addCheck("top-level execution flags blocked", ["providerCallsAllowed", "modelCallsAllowed", "agentDispatchAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "localExecutorRunAllowed", "projectMutationAllowed", "dbWritesAllowed", "networkCallsAllowed", "deployExecutionAllowed", "packageCreationAllowed", "providerSpendAllowed", "executionAllowed"].every((flag) => data[flag] === false));
addCheck("display evidence present", data.commandCenterVisible === true && data.evidenceRefs?.includes("reports/p892-local-founder-workstream-runtime-envelope-report.md"));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));
addCheck("P89.1 evidence exists", fileExists("reports/p891-local-enterprise-runtime-handoff-profile-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Defines P89.2 local founder workstream runtime envelope.",
        "- Maps P89.1 handoff lanes to local founder workstreams and agent lane plans.",
        "- Keeps all runtime, mutation, network, deploy, package, and spend flags blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p892-local-founder-workstream-runtime-envelope",
        "- npm run check:p891-local-enterprise-runtime-handoff-profile",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P89.2 is a local envelope model only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P89.2 Local Founder Workstream Runtime Envelope Report", phase: "P89.2" },
);

printCheckReport("P89.2 Local Founder Workstream Runtime Envelope Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
