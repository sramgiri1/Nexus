import {
  P78_2_REQUIRED_FIELDS,
  P78_2_SAMPLE_PREVIEWS,
  buildFounderIntakePreviewEnvelope,
  createFounderIntakePreview,
  validateFounderIntakePreview,
} from "../enterprise-preview/p78-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p782-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedPreview = createFounderIntakePreview({
  evidenceRefs: ["reports/p782-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P78.2"],
});
const previews = [...P78_2_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validateFounderIntakePreview(preview));
const envelope = buildFounderIntakePreviewEnvelope({
  evidenceRefs: ["reports/p782-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P78.2"],
});
const serialized = JSON.stringify(previews);

addCheck("required fields listed", P78_2_REQUIRED_FIELDS.length >= 36, `${P78_2_REQUIRED_FIELDS.length} fields`);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("founder automation disabled", previews.every((preview) => preview.autonomousQnaAllowed === false && preview.prdGenerationAllowed === false));
addCheck("agent and healing disabled", previews.every((preview) => preview.agentDispatchAllowed === false && preview.selfHealingApplyAllowed === false));
addCheck("project DB provider tool worker disabled", previews.every((preview) => preview.projectMutationAllowed === false && preview.dbWritesAllowed === false && preview.providerDispatchAllowed === false && preview.toolExecutionAllowed === false && preview.workerExecutionAllowed === false));
addCheck("network deploy release export package spend disabled", previews.every((preview) => preview.networkCallsAllowed === false && preview.deployExecutionAllowed === false && preview.releaseExecutionAllowed === false && preview.exportExecutionAllowed === false && preview.packageCreationAllowed === false && preview.providerSpendAllowed === false));
addCheck("auth session user workspace disabled", previews.every((preview) => preview.authMutationAllowed === false && preview.sessionMutationAllowed === false && preview.userMutationAllowed === false && preview.workspaceMutationAllowed === false));
addCheck("question rows and missing answers visible", previews.every((preview) => preview.questionRows.length >= 4 && preview.missingAnswers.length >= 4));
addCheck("blockers visible", previews.every((preview) => preview.blockers.length >= 6 && preview.blockedOperations.length >= 7));
addCheck("forbidden paths visible", previews.every((preview) => ["projects/**", "project-roadmap/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => preview.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serialized));
addCheck("no fake runnable founder action", previews.every((preview) => !/ask founder now|generate prd|dispatch agent|self-heal now|create project|execute now/i.test(preview.disabledReason)));
addCheck("evidence activity and cost visible", previews.every((preview) => preview.evidenceRefs.length > 0 && preview.activityRefs.length > 0 && preview.costImpact.includes("No model calls")));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P78.2" && envelope.data.preview.autonomousQnaAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P78.2 preview-only founder intake and Q&A records.\n- Does not enable autonomous Q&A, provider calls, PRD generation, agent dispatch, self-healing apply, project mutation, DB writes, tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P78_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P78.2 Founder Intake Preview Report", phase: "P78.2" },
);

printCheckReport("P78.2 Founder Intake Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
