import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  P72_3_REQUIRED_FIELDS,
  P72_3_SAMPLE_PREVIEWS,
  buildDbMigrationPreviewEnvelope,
  createDbMigrationPreview,
  validateDbMigrationPreview,
} from "../db-runtime/p72-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p723-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedPreview = createDbMigrationPreview({
  evidenceRefs: ["reports/p723-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P72.3"],
});
const previews = [...P72_3_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validateDbMigrationPreview(preview));
const envelope = buildDbMigrationPreviewEnvelope({
  evidenceRefs: ["reports/p723-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P72.3"],
});
const serialized = JSON.stringify(previews);

addCheck("required fields listed", P72_3_REQUIRED_FIELDS.length >= 27, `${P72_3_REQUIRED_FIELDS.length} fields`);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("no migration file on disk", !existsSync(join(ROOT, "migrations/p72-preview.sql")));
addCheck("no schema file created", !existsSync(join(ROOT, "prisma/schema.p72-preview.prisma")));
addCheck("migration and schema flags disabled", previews.every((preview) => preview.migrationFileCreated === false && preview.schemaFileChanged === false));
addCheck("DB writes migrations schema disabled", previews.every((preview) => preview.dbWritesAllowed === false && preview.migrationsAllowed === false && preview.schemaMutationAllowed === false));
addCheck("project mutation disabled", previews.every((preview) => preview.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", previews.every((preview) => preview.providerDispatchAllowed === false && preview.toolExecutionAllowed === false && preview.workerExecutionAllowed === false));
addCheck("network/spend disabled", previews.every((preview) => preview.networkCallsAllowed === false && preview.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", previews.every((preview) => preview.deployExecutionAllowed === false && preview.releaseExecutionAllowed === false && preview.exportExecutionAllowed === false && preview.packageCreationAllowed === false));
addCheck("affected stores visible", previews.every((preview) => preview.affectedStores.length >= 4));
addCheck("blocked operations visible", previews.every((preview) => preview.blockedOperations.length >= 4));
addCheck("private IDs and DB URLs hidden", !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/postgres(?:ql)?:\/\//i.test(serialized));
addCheck("evidence and activity visible", previews.every((preview) => preview.evidenceRefs.length > 0 && preview.activityRefs.length > 0));
addCheck("cost impact visible", previews.every((preview) => preview.costImpact.includes("No DB service calls")));
addCheck("no fake runnable DB action", previews.every((preview) => !/migrate now|write now|schema now|run db|execute now/i.test(preview.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P72.3" && envelope.data.preview.migrationsAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P72.3 preview-only DB migration records.\n- Does not write DB state, create migrations, mutate schema, mutate projects, dispatch providers/tools/workers, call network services, deploy, release, export, package, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P72_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P72.3 Migration Preview Report", phase: "P72.3" },
);

printCheckReport("P72.3 Migration Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
