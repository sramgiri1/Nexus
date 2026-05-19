import {
  P69_3_REQUIRED_FIELDS,
  P69_3_SAMPLE_CANDIDATES,
  buildReleaseCandidateEnvelope,
  createReleaseCandidatePreview,
  validateReleaseCandidatePreview,
} from "../release-governance/p69-3-placeholder.js";
import { createReleaseIntentContract } from "../release-governance/p69-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p693-report.md";
const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedCandidate = createReleaseCandidatePreview({
  intent: createReleaseIntentContract({
    allowedFiles: ["release-governance/p69-3-placeholder.js"],
    evidenceRefs: ["reports/p693-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P69.3"],
  }),
});
const candidates = [...P69_3_SAMPLE_CANDIDATES, generatedCandidate];
const validations = candidates.map((candidate) => validateReleaseCandidatePreview(candidate));
const envelope = buildReleaseCandidateEnvelope({
  allowedFiles: ["release-governance/p69-3-placeholder.js"],
  evidenceRefs: ["reports/p693-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P69.3"],
});

addCheck("required fields listed", P69_3_REQUIRED_FIELDS.length >= 27, `${P69_3_REQUIRED_FIELDS.length} fields`);
addCheck("candidates validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("projects forbidden", candidates.every((candidate) => candidate.forbiddenFiles.includes("projects/**")));
addCheck("allowed files stay out of projects", candidates.every((candidate) => !candidate.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("validation commands visible", candidates.every((candidate) => candidate.validationCommands.includes("git diff --check")));
addCheck("package creation disabled", candidates.every((candidate) => candidate.packageCreated === false));
addCheck("release execution disabled", candidates.every((candidate) => candidate.releaseExecutionAllowed === false));
addCheck("deploy execution disabled", candidates.every((candidate) => candidate.deployExecutionAllowed === false));
addCheck("project mutation disabled", candidates.every((candidate) => candidate.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", candidates.every((candidate) => candidate.providerDispatchAllowed === false && candidate.toolExecutionAllowed === false && candidate.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", candidates.every((candidate) => candidate.dbWritesAllowed === false && candidate.networkCallsAllowed === false && candidate.providerSpendAllowed === false));
addCheck("rollback documented", candidates.every((candidate) => candidate.rollbackPlan?.state === "documented"));
addCheck("blockers visible", candidates.every((candidate) => candidate.blockers.length >= 3));
addCheck("evidence and activity visible", candidates.every((candidate) => candidate.evidenceRefs.length > 0 && candidate.activityRefs.length > 0));
addCheck("cost impact visible", candidates.every((candidate) => candidate.costImpact.includes("No provider calls")));
addCheck("no fake runnable action", candidates.every((candidate) => !/release now|deploy now|package now|execute now/i.test(candidate.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P69.3" && envelope.data.candidate.deployExecutionAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P69.3 release candidate previews.\n- Does not package, release, deploy, mutate project source, dispatch providers/tools/workers, write DB state, call network services, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Candidate Shape", body: P69_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P69.3 Release Candidate Preview Report", phase: "P69.3" },
);

printCheckReport("P69.3 Release Candidate Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
