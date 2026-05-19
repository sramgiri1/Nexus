import {
  P78_3_REQUIRED_FIELDS,
  P78_3_SAMPLE_PREVIEWS,
  buildPrdAssemblyPreviewEnvelope,
  createPrdAssemblyPreview,
  validatePrdAssemblyPreview,
} from "../enterprise-preview/p78-3-placeholder.js";
import { P78_2_SAMPLE_PREVIEWS, validateFounderIntakePreview } from "../enterprise-preview/p78-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p783-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourceIntake = P78_2_SAMPLE_PREVIEWS[0];
const generatedPreview = createPrdAssemblyPreview({
  sourceIntake,
  evidenceRefs: ["reports/p783-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P78.3"],
});
const previews = [...P78_3_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validatePrdAssemblyPreview(preview));
const envelope = buildPrdAssemblyPreviewEnvelope({
  sourceIntake,
  evidenceRefs: ["reports/p783-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P78.3"],
});
const serialized = JSON.stringify(previews);

addCheck("required fields listed", P78_3_REQUIRED_FIELDS.length >= 43, `${P78_3_REQUIRED_FIELDS.length} fields`);
addCheck("source founder intake validates", validateFounderIntakePreview(sourceIntake).valid);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("founder Q&A and PRD execution disabled", previews.every((preview) => preview.founderIntakeExecutionAllowed === false && preview.autonomousQnaAllowed === false && preview.prdGenerationAllowed === false));
addCheck("project writes and mutation disabled", previews.every((preview) => preview.projectFileWriteAllowed === false && preview.projectMutationAllowed === false));
addCheck("agent dispatch and self-healing disabled", previews.every((preview) => preview.agentDispatchAllowed === false && preview.selfHealingApplyAllowed === false));
addCheck("DB provider tool worker disabled", previews.every((preview) => preview.dbWritesAllowed === false && preview.providerDispatchAllowed === false && preview.toolExecutionAllowed === false && preview.workerExecutionAllowed === false));
addCheck("network deploy release export package spend disabled", previews.every((preview) => preview.networkCallsAllowed === false && preview.deployExecutionAllowed === false && preview.releaseExecutionAllowed === false && preview.exportExecutionAllowed === false && preview.packageCreationAllowed === false && preview.providerSpendAllowed === false));
addCheck("auth session user workspace disabled", previews.every((preview) => preview.authMutationAllowed === false && preview.sessionMutationAllowed === false && preview.userMutationAllowed === false && preview.workspaceMutationAllowed === false));
addCheck("PRD sections visible", previews.every((preview) => preview.problemStatement && preview.targetAudience && preview.valueProposition && preview.mvpScope.length >= 4 && preview.acceptanceCriteria.length >= 3));
addCheck("risks and missing inputs visible", previews.every((preview) => preview.riskRows.length >= 4 && preview.missingInputs.length >= 4));
addCheck("blocked operations visible", previews.every((preview) => preview.blockedOperations.length >= 7 && preview.blockers.length >= 6));
addCheck("forbidden paths visible", previews.every((preview) => ["projects/**", "project-roadmap/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => preview.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serialized));
addCheck("no fake runnable PRD action", previews.every((preview) => !/generate prd|write project|create project|dispatch agent|self-heal now|execute now/i.test(preview.disabledReason)));
addCheck("evidence activity and cost visible", previews.every((preview) => preview.evidenceRefs.length > 0 && preview.activityRefs.length > 0 && preview.costImpact.includes("No model calls")));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P78.3" && envelope.data.preview.prdGenerationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body:
        "- Validates P78.3 preview-only PRD assembly records.\n" +
        "- Does not enable PRD generation, project file writes, agent dispatch, self-healing apply, project mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, certification, attestation, or provider spend.",
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P78_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P78.3 PRD Assembly Preview Report", phase: "P78.3" },
);

printCheckReport("P78.3 PRD Assembly Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
