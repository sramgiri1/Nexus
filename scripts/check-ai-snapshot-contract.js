import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  SNAPSHOT_REDACTION_POLICY,
  buildSnapshotEvidenceRecord,
  buildSnapshotPreview,
  validateSnapshotEvidenceRecord,
  validateSnapshotRecord,
} from "../ai-recovery/snapshotContract.js";
import {
  summarizeSnapshotRedaction,
  validateSnapshotRedaction,
} from "../ai-recovery/redactionPolicy.js";
import { buildIdentityContext } from "../runtime/identityContext.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "ai-recovery/fixtures/snapshot-fixtures.json";
const REPORT_PATH = "reports/ai-snapshot-contract-report.md";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({
    name,
    status: passed ? "PASS" : "FAIL",
    details,
  });
}

const fixtures = readJson(FIXTURE_PATH);
const validSnapshots = fixtures.validSnapshots || [];
const invalidSnapshots = fixtures.invalidSnapshots || [];

for (const fixture of validSnapshots) {
  const preview = buildSnapshotPreview(fixture);
  addCheck(
    `valid fixture ${fixture.snapshotId}`,
    preview.ok,
    preview.validation.errors.join(", "),
  );

  const evidence = buildSnapshotEvidenceRecord(
    preview.snapshot,
    buildIdentityContext({
      originatingUser: {
        userId: "operator",
        role: "founder",
        scopes: ["nexus-os"],
      },
      session: {
        sessionId: "p63-snapshot-contract-check",
        source: "test",
      },
      agent: {
        agentId: "nexus",
        agentVersion: "p63.1",
        agentGroup: "control",
        agentPlane: "control",
      },
      request: {
        taskId: preview.snapshot.snapshotId,
        projectId: "nexus-os",
        correlationId: preview.snapshot.correlationId,
      },
    }),
  );
  const evidenceValidation = validateSnapshotEvidenceRecord(evidence);
  addCheck(
    `evidence record ${fixture.snapshotId}`,
    evidenceValidation.valid,
    evidenceValidation.errors.join(", "),
  );
}

for (const fixture of invalidSnapshots) {
  const preview = buildSnapshotPreview(fixture);
  addCheck(
    `invalid fixture rejected ${fixture.snapshotId}`,
    preview.ok === false,
    preview.ok ? "invalid fixture passed unexpectedly" : preview.validation.errors.join(", "),
  );
}

const policyDisabled = Object.entries(SNAPSHOT_REDACTION_POLICY)
  .filter(([key]) => key.endsWith("Allowed"))
  .every(([, value]) => value === false);
addCheck("runtime action policy disabled", policyDisabled, "provider/tool/project/DB/deploy actions remain disabled");

const redactionSummary = summarizeSnapshotRedaction({
  accessToken: "sk-test-secret-value-123456789",
  displayTitle: "Safe title",
});
addCheck("redaction summary redacts secret-like payload", redactionSummary.changed && redactionSummary.redactionCount >= 1);

const rawPayloadValidation = validateSnapshotRedaction({
  promptSummary: "summary only",
  safeLabel: "NEXUS OS",
});
addCheck("summary-only payload has no secret errors", rawPayloadValidation.valid);

const validCount = checks.filter((check) => check.status === "PASS").length;
const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Phase: P63.1",
        "- Preview-only snapshot contract and redaction policy.",
        "- No provider, tool, project mutation, DB write, or deploy action is enabled.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Failures",
      body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n"),
    },
    {
      title: "Reuse",
      body: [
        "- Reused `shared/redaction.js` for redaction behavior.",
        "- Reused `runtime/evidenceRecord.js` for evidence record shape.",
        "- Reused `shared/reportWriter.js` and `shared/checkResultFormatter.js` for report output.",
      ].join("\n"),
    },
    {
      title: "Result",
      body: failed.length === 0 ? `PASS (${validCount}/${checks.length})` : `FAIL (${failed.length} failed)`,
    },
  ],
  {
    title: "AI Snapshot Contract Report",
    phase: "P63.1",
  },
);

printCheckReport("AI Snapshot Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) {
  process.exit(1);
}
