import {
  P78_4_REQUIRED_FIELDS,
  P78_4_SAMPLE_PREVIEWS,
  buildAgentWorkplanPreviewEnvelope,
  createAgentWorkplanPreview,
  validateAgentWorkplanPreview,
} from "../enterprise-preview/p78-4-placeholder.js";
import { P78_3_SAMPLE_PREVIEWS, validatePrdAssemblyPreview } from "../enterprise-preview/p78-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p784-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourcePrd = P78_3_SAMPLE_PREVIEWS[0];
const generatedPreview = createAgentWorkplanPreview({
  sourcePrd,
  evidenceRefs: ["reports/p784-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P78.4"],
});
const previews = [...P78_4_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validateAgentWorkplanPreview(preview));
const envelope = buildAgentWorkplanPreviewEnvelope({
  sourcePrd,
  evidenceRefs: ["reports/p784-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P78.4"],
});
const serialized = JSON.stringify(previews);

addCheck("required fields listed", P78_4_REQUIRED_FIELDS.length >= 39, `${P78_4_REQUIRED_FIELDS.length} fields`);
addCheck("source PRD preview validates", validatePrdAssemblyPreview(sourcePrd).valid);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("founder Q&A and PRD disabled", previews.every((preview) => preview.founderIntakeExecutionAllowed === false && preview.autonomousQnaAllowed === false && preview.prdGenerationAllowed === false));
addCheck("agent and healing disabled", previews.every((preview) => preview.agentDispatchAllowed === false && preview.selfHealingApplyAllowed === false));
addCheck("project DB provider tool worker disabled", previews.every((preview) => preview.projectMutationAllowed === false && preview.dbWritesAllowed === false && preview.providerDispatchAllowed === false && preview.toolExecutionAllowed === false && preview.workerExecutionAllowed === false));
addCheck("network deploy release export package spend disabled", previews.every((preview) => preview.networkCallsAllowed === false && preview.deployExecutionAllowed === false && preview.releaseExecutionAllowed === false && preview.exportExecutionAllowed === false && preview.packageCreationAllowed === false && preview.providerSpendAllowed === false));
addCheck("auth session user workspace disabled", previews.every((preview) => preview.authMutationAllowed === false && preview.sessionMutationAllowed === false && preview.userMutationAllowed === false && preview.workspaceMutationAllowed === false));
addCheck("owner capabilities visible", previews.every((preview) => preview.ownerCapabilities.length >= 4 && preview.ownerCapabilities.every((capability) => capability.executionState === "disabled")));
addCheck("task lanes visible", previews.every((preview) => preview.taskLanes.length >= 4 && preview.taskLanes.every((lane) => lane.dispatchState === "not dispatched")));
addCheck("validation gates visible", previews.every((preview) => preview.validationGates.length >= 4));
addCheck("healing loops visible and disabled", previews.every((preview) => preview.healingLoops.length >= 3 && preview.healingLoops.every((loop) => loop.applyState === "disabled")));
addCheck("blocked operations visible", previews.every((preview) => preview.blockedOperations.length >= 7 && preview.blockers.length >= 6));
addCheck("forbidden paths visible", previews.every((preview) => ["projects/**", "project-roadmap/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => preview.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serialized));
addCheck("no fake runnable agent action", previews.every((preview) => !/dispatch agent|run agent|apply healing|self-heal now|execute tool|start worker|create project|execute now/i.test(preview.disabledReason)));
addCheck("evidence activity and cost visible", previews.every((preview) => preview.evidenceRefs.length > 0 && preview.activityRefs.length > 0 && preview.costImpact.includes("No model calls")));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P78.4" && envelope.data.preview.agentDispatchAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body:
        "- Validates P78.4 preview-only agent workplan and self-healing records.\n" +
        "- Does not enable agent dispatch, self-healing apply, PRD generation, project mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, certification, attestation, or provider spend.",
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P78_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P78.4 Agent Workplan Self-Healing Preview Report", phase: "P78.4" },
);

printCheckReport("P78.4 Agent Workplan Self-Healing Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
