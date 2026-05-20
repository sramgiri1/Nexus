import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLocalEnterpriseRuntimeHandoffProfile,
  validateLocalEnterpriseRuntimeHandoffProfile,
  P89_LOCAL_ENTERPRISE_RUNTIME_HANDOFF_PROFILE_PHASE,
} from "../live-ready/localEnterpriseRuntimeHandoffProfile.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p891-local-enterprise-runtime-handoff-profile-report.md";

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const envelope = buildLocalEnterpriseRuntimeHandoffProfile();
const validation = validateLocalEnterpriseRuntimeHandoffProfile(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(data);

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

addCheck("result envelope valid", envelope.ok === true && envelope.status === "PASS" && envelope.phase === P89_LOCAL_ENTERPRISE_RUNTIME_HANDOFF_PROFILE_PHASE);
addCheck("schema validation passes", validation.valid, validation.errors.join("; "));
addCheck("source phase reused", data.sourcePhase === "P88.3");
addCheck("handoff lanes defined", Array.isArray(data.handoffLanes) && data.handoffLanes.length === 3);
addCheck("handoff lanes blocked", (data.handoffLanes || []).every((lane) => lane.handoffCanExecute === false && lane.handoffState === "handoff_profile_defined_not_executable"));
addCheck("required gates present", Array.isArray(data.requiredGates) && data.requiredGates.includes("founderWorkstreamContract") && data.requiredGates.includes("postRunReviewPlan"));
addCheck("runtime flags blocked", Object.values(data.runtimeFlags || {}).every((value) => value === false));
addCheck("top-level execution flags blocked", ["providerCallsAllowed", "modelCallsAllowed", "agentDispatchAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "localExecutorRunAllowed", "projectMutationAllowed", "dbWritesAllowed", "networkCallsAllowed", "deployExecutionAllowed", "packageCreationAllowed", "providerSpendAllowed", "executionAllowed"].every((flag) => data[flag] === false));
addCheck("display evidence present", data.commandCenterVisible === true && data.evidenceRefs?.includes("reports/p891-local-enterprise-runtime-handoff-profile-report.md"));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));
addCheck("P88 final evidence exists", fileExists("reports/p887-final-validation-report.md") && fileExists("reports/p883-local-executor-admission-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Defines P89.1 local enterprise runtime handoff profile.",
        "- Reuses P88 local executor admission evidence.",
        "- Keeps all runtime, mutation, network, deploy, package, and spend flags blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p891-local-enterprise-runtime-handoff-profile",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P89.1 is schema, policy, and contract only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P89.1 Local Enterprise Runtime Handoff Profile Report", phase: "P89.1" },
);

printCheckReport("P89.1 Local Enterprise Runtime Handoff Profile Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
