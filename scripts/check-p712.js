import {
  P71_2_REQUIRED_FIELDS,
  P71_2_SAMPLE_MANIFESTS,
  buildProjectShippingManifestEnvelope,
  createProjectShippingManifest,
  validateProjectShippingManifest,
} from "../project-shipping/p71-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p712-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedManifest = createProjectShippingManifest({
  projectDisplayName: "private_project_123456",
  allowedFiles: ["project-shipping/p71-2-placeholder.js"],
  shippingItems: [
    {
      label: "Source handoff",
      contentClass: "project_source",
      rawPathVisible: true,
      requiresRedaction: false,
      state: "candidate_preview",
    },
    {
      label: "sk-localprivateplaceholder123456",
      contentClass: "project_docs",
      rawPathVisible: true,
      requiresRedaction: false,
      state: "candidate_preview",
    },
    {
      label: "Evidence summary",
      contentClass: "redacted_evidence_summary",
      rawPathVisible: true,
      requiresRedaction: true,
      state: "candidate_preview",
    },
  ],
  evidenceRefs: ["reports/p712-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P71.2"],
});
const manifests = [...P71_2_SAMPLE_MANIFESTS, generatedManifest];
const validations = manifests.map((manifest) => validateProjectShippingManifest(manifest));
const envelope = buildProjectShippingManifestEnvelope({
  allowedFiles: ["project-shipping/p71-2-placeholder.js"],
  evidenceRefs: ["reports/p712-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P71.2"],
});
const serialized = JSON.stringify(manifests);

addCheck("required fields listed", P71_2_REQUIRED_FIELDS.length >= 26, `${P71_2_REQUIRED_FIELDS.length} fields`);
addCheck("manifests validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("projects forbidden", manifests.every((manifest) => manifest.forbiddenFiles.includes("projects/**") && manifest.forbiddenFiles.includes("project-roadmap/**")));
addCheck("allowed files stay out of projects", manifests.every((manifest) => !manifest.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("export and package disabled", manifests.every((manifest) => manifest.exportAllowed === false && manifest.packageCreationAllowed === false));
addCheck("project mutation disabled", manifests.every((manifest) => manifest.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", manifests.every((manifest) => manifest.providerDispatchAllowed === false && manifest.toolExecutionAllowed === false && manifest.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", manifests.every((manifest) => manifest.dbWritesAllowed === false && manifest.networkCallsAllowed === false && manifest.providerSpendAllowed === false));
addCheck("deploy/release disabled", manifests.every((manifest) => manifest.deployExecutionAllowed === false && manifest.releaseExecutionAllowed === false));
addCheck("blockers visible", manifests.every((manifest) => manifest.blockers.length >= 4));
addCheck("shipping items visible", manifests.every((manifest) => manifest.shippingItems.length >= 3));
addCheck("raw paths hidden", manifests.every((manifest) => manifest.shippingItems.every((item) => item.rawPathVisible === false)));
addCheck("private IDs hidden", !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("secrets redacted", !serialized.includes("sk-localprivateplaceholder"));
addCheck("evidence and activity visible", manifests.every((manifest) => manifest.evidenceRefs.length > 0 && manifest.activityRefs.length > 0));
addCheck("cost impact visible", manifests.every((manifest) => manifest.costImpact.includes("No provider calls")));
addCheck("no fake runnable action", manifests.every((manifest) => !/package now|export now|ship now|deploy now|release now|execute now/i.test(manifest.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P71.2" && envelope.data.manifest.exportAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P71.2 display-safe project shipping manifest records.\n- Does not create packages, export project files, mutate project source, dispatch providers/tools/workers, write DB state, call network services, deploy, release, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Manifest Shape", body: P71_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P71.2 Project Shipping Manifest Contract Report", phase: "P71.2" },
);

printCheckReport("P71.2 Project Shipping Manifest Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
