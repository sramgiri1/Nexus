import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  P71_4_REQUIRED_FIELDS,
  P71_4_SAMPLE_GATES,
  buildShippingReadinessGateEnvelope,
  createShippingReadinessGate,
  validateShippingReadinessGate,
} from "../project-shipping/p71-4-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p714-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedGate = createShippingReadinessGate({
  evidenceRefs: ["reports/p714-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P71.4"],
});
const gates = [...P71_4_SAMPLE_GATES, generatedGate];
const validations = gates.map((gate) => validateShippingReadinessGate(gate));
const envelope = buildShippingReadinessGateEnvelope({
  evidenceRefs: ["reports/p714-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P71.4"],
});
const serialized = JSON.stringify(gates);

addCheck("required fields listed", P71_4_REQUIRED_FIELDS.length >= 29, `${P71_4_REQUIRED_FIELDS.length} fields`);
addCheck("gates validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("operator approval required", gates.every((gate) => gate.approvalState === "operator_review_required"));
addCheck("artifact not created", gates.every((gate) => gate.artifactCreated === false));
addCheck("no package artifact on disk", !existsSync(join(ROOT, "artifacts/project-release/project-shipping-preview.zip")));
addCheck("export and package disabled", gates.every((gate) => gate.exportAllowed === false && gate.packageCreationAllowed === false));
addCheck("project mutation disabled", gates.every((gate) => gate.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", gates.every((gate) => gate.providerDispatchAllowed === false && gate.toolExecutionAllowed === false && gate.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", gates.every((gate) => gate.dbWritesAllowed === false && gate.networkCallsAllowed === false && gate.providerSpendAllowed === false));
addCheck("deploy/release disabled", gates.every((gate) => gate.deployExecutionAllowed === false && gate.releaseExecutionAllowed === false));
addCheck("readiness visible", gates.every((gate) => gate.manifestReady && gate.previewReady && gate.redactionReady && gate.evidenceReady && gate.costReviewReady));
addCheck("blockers visible", gates.every((gate) => gate.blockers.length >= 4));
addCheck("required evidence visible", gates.every((gate) => gate.requiredEvidence.length >= 5));
addCheck("private IDs hidden", !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("evidence and activity visible", gates.every((gate) => gate.evidenceRefs.length > 0 && gate.activityRefs.length > 0));
addCheck("cost impact visible", gates.every((gate) => gate.costImpact.includes("No provider calls")));
addCheck("no fake runnable action", gates.every((gate) => !/package now|export now|ship now|deploy now|release now|execute now/i.test(gate.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P71.4" && envelope.data.gate.exportAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P71.4 preview-only shipping readiness gates.\n- Does not create package artifacts, export project files, mutate project source, dispatch providers/tools/workers, write DB state, call network services, deploy, release, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Gate Shape", body: P71_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P71.4 Shipping Readiness Gate Report", phase: "P71.4" },
);

printCheckReport("P71.4 Shipping Readiness Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
