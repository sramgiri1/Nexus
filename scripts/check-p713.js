import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  P71_3_REQUIRED_FIELDS,
  P71_3_SAMPLE_PREVIEWS,
  buildExportPackagePreviewEnvelope,
  createExportPackagePreview,
  validateExportPackagePreview,
} from "../project-shipping/p71-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p713-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedPreview = createExportPackagePreview({
  allowedFiles: ["project-shipping/p71-3-placeholder.js"],
  evidenceRefs: ["reports/p713-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P71.3"],
});
const previews = [...P71_3_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validateExportPackagePreview(preview));
const envelope = buildExportPackagePreviewEnvelope({
  allowedFiles: ["project-shipping/p71-3-placeholder.js"],
  evidenceRefs: ["reports/p713-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P71.3"],
});
const serialized = JSON.stringify(previews);

addCheck("required fields listed", P71_3_REQUIRED_FIELDS.length >= 25, `${P71_3_REQUIRED_FIELDS.length} fields`);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("artifact not created", previews.every((preview) => preview.artifactCreated === false));
addCheck("no package artifact on disk", !existsSync(join(ROOT, "artifacts/project-release/project-shipping-preview.zip")));
addCheck("projects and artifacts forbidden", previews.every((preview) => preview.forbiddenFiles.includes("projects/**") && preview.forbiddenFiles.includes("artifacts/project-release/**")));
addCheck("export and package disabled", previews.every((preview) => preview.exportAllowed === false && preview.packageCreationAllowed === false));
addCheck("project mutation disabled", previews.every((preview) => preview.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", previews.every((preview) => preview.providerDispatchAllowed === false && preview.toolExecutionAllowed === false && preview.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", previews.every((preview) => preview.dbWritesAllowed === false && preview.networkCallsAllowed === false && preview.providerSpendAllowed === false));
addCheck("deploy/release disabled", previews.every((preview) => preview.deployExecutionAllowed === false && preview.releaseExecutionAllowed === false));
addCheck("preview items visible", previews.every((preview) => preview.previewItems.length >= 3));
addCheck("preview items stay preview-only", previews.every((preview) => preview.previewItems.every((item) => item.packageAction === "preview_only" && item.rawPathVisible === false)));
addCheck("blocked items visible", previews.every((preview) => preview.blockedItems.length >= 3));
addCheck("private IDs hidden", !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("evidence and activity visible", previews.every((preview) => preview.evidenceRefs.length > 0 && preview.activityRefs.length > 0));
addCheck("cost impact visible", previews.every((preview) => preview.costImpact.includes("No provider calls")));
addCheck("no fake runnable action", previews.every((preview) => !/package now|export now|ship now|deploy now|release now|execute now/i.test(preview.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P71.3" && envelope.data.preview.artifactCreated === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P71.3 preview-only export package records.\n- Does not create package artifacts, export project files, mutate project source, dispatch providers/tools/workers, write DB state, call network services, deploy, release, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P71_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P71.3 Export Package Preview Report", phase: "P71.3" },
);

printCheckReport("P71.3 Export Package Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
