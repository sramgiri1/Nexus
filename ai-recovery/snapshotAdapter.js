import { buildSnapshotPreview } from "./snapshotContract.js";
import { getCaptureSource, validateCaptureSource } from "./interactionCaptureMap.js";
import { redactSnapshotPayload } from "./redactionPolicy.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readPath(record = {}, path = "") {
  if (!path) return "";
  return path.split(".").reduce((value, key) => {
    if (value === undefined || value === null) return "";
    return value[key];
  }, record);
}

function safeSummary(value = "", fallback = "Summary unavailable.") {
  const normalized = normalizeString(value);
  if (!normalized) return fallback;
  return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized;
}

function sourceRecordValue(record = {}, source = {}, field = "") {
  const mapped = source.snapshotMapping?.[field];
  return normalizeString(readPath(record, mapped)) || normalizeString(record[field]);
}

export function adaptPreviewRecordToSnapshot(input = {}) {
  const source = input.source || getCaptureSource(input.sourceId);
  const sourceValidation = validateCaptureSource(source || {});

  if (!source || !sourceValidation.valid) {
    return {
      ok: false,
      errors: sourceValidation.errors.length ? sourceValidation.errors : ["unknown_capture_source"],
      snapshot: null,
      validation: sourceValidation,
    };
  }

  const record = input.record || {};
  const displayTitle =
    normalizeString(input.displayTitle)
    || sourceRecordValue(record, source, "displayTitle")
    || `${source.sourceLabel} snapshot`;
  const commandIntent =
    normalizeString(input.commandIntent)
    || sourceRecordValue(record, source, "commandIntent")
    || source.sourceType;
  const promptSummary =
    normalizeString(input.promptSummary)
    || sourceRecordValue(record, source, "promptSummary")
    || `${source.sourceLabel} generated a preview record.`;
  const responseSummary =
    normalizeString(input.responseSummary)
    || sourceRecordValue(record, source, "responseSummary")
    || "Preview record is available for inspection.";
  const correlationId =
    normalizeString(input.correlationId)
    || sourceRecordValue(record, source, "correlationId")
    || `corr_${source.sourceId}_preview`;

  const preview = buildSnapshotPreview({
    snapshotId: normalizeString(input.snapshotId) || `snapshot_${source.sourceId}_preview`,
    displayTitle,
    scopeLabel: normalizeString(input.scopeLabel) || "NEXUS OS",
    actorLabel: normalizeString(input.actorLabel) || source.ownerAgent,
    correlationId,
    commandIntent,
    promptSummary: safeSummary(promptSummary),
    responseSummary: safeSummary(responseSummary),
    toolPreviewRefs: input.toolPreviewRefs || [],
    evidenceRefs: [
      {
        label: source.sourceLabel,
        path: normalizeString(input.evidencePath) || source.fixtureRef,
        recordId: source.sourceId,
      },
      ...(input.evidenceRefs || []),
    ],
    redactionLevel: input.redactionLevel || "internal_redacted",
    recoveryEligibility: input.recoveryEligibility || "inspect_only",
    recoveryBlockedReasons: input.recoveryBlockedReasons || [
      "P63.2 maps capture points only; recovery execution is not enabled.",
    ],
    redactedPayload: redactSnapshotPayload({
      sourceId: source.sourceId,
      sourceLabel: source.sourceLabel,
      ownerAgent: source.ownerAgent,
      ownerCapability: source.ownerCapability,
      previewOnly: true,
      persistenceEnabled: false,
      record,
    }),
  });

  return {
    ok: preview.ok,
    source,
    snapshot: preview.snapshot,
    validation: preview.validation,
    display: preview.display,
    previewOnly: true,
    persistenceEnabled: false,
    executionEnabled: false,
  };
}

export function adaptPreviewRecordsToSnapshots(inputs = []) {
  return inputs.map((input) => adaptPreviewRecordToSnapshot(input));
}
