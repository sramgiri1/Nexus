import {
  P68_3_REQUIRED_FIELDS,
  P68_3_SAMPLE_PROPOSALS,
  buildSelfUpdateProposalEnvelope,
  createSelfUpdateProposalPreview,
  validateSelfUpdateProposalPreview,
} from "../self-update/p68-3-placeholder.js";
import { createSelfUpdateIntentContract } from "../self-update/p68-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p683-report.md";
const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sampleProposal = P68_3_SAMPLE_PROPOSALS[0];
const generatedProposal = createSelfUpdateProposalPreview({
  intent: createSelfUpdateIntentContract({
    allowedFiles: ["self-update/p68-3-placeholder.js"],
    evidenceRefs: ["reports/p683-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P68.3"],
  }),
});
const proposals = [sampleProposal, generatedProposal];
const validations = proposals.map((proposal) => validateSelfUpdateProposalPreview(proposal));
const envelope = buildSelfUpdateProposalEnvelope({
  allowedFiles: ["self-update/p68-3-placeholder.js"],
  evidenceRefs: ["reports/p683-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P68.3"],
});

addCheck("required fields listed", P68_3_REQUIRED_FIELDS.length >= 23, `${P68_3_REQUIRED_FIELDS.length} fields`);
addCheck("proposals validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("target stays NEXUS OS", proposals.every((proposal) => proposal.targetKind === "nexus_os"));
addCheck("projects forbidden", proposals.every((proposal) => proposal.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", proposals.every((proposal) => !proposal.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("proposed updates stay out of projects", proposals.every((proposal) => !proposal.proposedUpdates.some((update) => update.filePath.startsWith("projects/"))));
addCheck("validation commands visible", proposals.every((proposal) => proposal.validationCommands.includes("npm run check:p683") && proposal.validationCommands.includes("git diff --check")));
addCheck("rollback documented", proposals.every((proposal) => proposal.rollbackPlan.state === "documented" && proposal.rollbackPlan.command.includes("git revert")));
addCheck("self-update apply disabled", proposals.every((proposal) => proposal.selfUpdateAllowed === false && proposal.applyAllowed === false));
addCheck("mutation disabled", proposals.every((proposal) => proposal.projectMutationAllowed === false));
addCheck("execution disabled", proposals.every((proposal) => proposal.executionAllowed === false));
addCheck("provider/tool/worker disabled", proposals.every((proposal) => proposal.providerDispatchAllowed === false && proposal.toolExecutionAllowed === false && proposal.workerExecutionAllowed === false));
addCheck("db/deploy/spend disabled", proposals.every((proposal) => proposal.dbWritesAllowed === false && proposal.deployAllowed === false && proposal.providerSpendAllowed === false));
addCheck("evidence and activity visible", proposals.every((proposal) => proposal.evidenceRefs.length > 0 && proposal.activityRefs.length > 0));
addCheck("no fake runnable apply", proposals.every((proposal) => !/apply now|run now|execute now/i.test(proposal.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P68.3" && envelope.data.proposal.applyAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P68.3 preview-only self-update proposal records.\n- Does not generate patches, apply patches, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Proposal Shape", body: P68_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P68.3 Self-Update Proposal Preview Report", phase: "P68.3" },
);

printCheckReport("P68.3 Self-Update Proposal Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
