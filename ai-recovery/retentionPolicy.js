export const SNAPSHOT_RETENTION_CLASSES = Object.freeze([
  "short_lived",
  "phase_evidence",
  "final_validation",
]);

export const SNAPSHOT_RETENTION_POLICY = Object.freeze({
  version: "p63.4",
  previewOnly: true,
  durableDbWritesEnabled: false,
  deleteEnabled: false,
  exportEnabled: false,
  classes: Object.freeze({
    short_lived: Object.freeze({
      label: "Short lived",
      days: 7,
      description: "Temporary operator preview records.",
    }),
    phase_evidence: Object.freeze({
      label: "Phase evidence",
      days: 30,
      description: "Redacted records used as OS phase validation evidence.",
    }),
    final_validation: Object.freeze({
      label: "Final validation",
      days: 90,
      description: "Redacted records retained for final phase validation review.",
    }),
  }),
});

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(isoDate, days) {
  const date = parseDate(isoDate) || new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function resolveSnapshotRetention(input = {}) {
  const retentionClass = SNAPSHOT_RETENTION_CLASSES.includes(input.retentionClass)
    ? input.retentionClass
    : "short_lived";
  const createdAt = normalizeString(input.createdAt) || new Date().toISOString();
  const classPolicy = SNAPSHOT_RETENTION_POLICY.classes[retentionClass];

  return {
    retentionClass,
    retentionLabel: classPolicy.label,
    createdAt,
    expiresAt: addDays(createdAt, classPolicy.days),
    previewOnly: true,
    deleteEnabled: false,
    exportEnabled: false,
  };
}

export function validateSnapshotRetentionPolicy(policy = SNAPSHOT_RETENTION_POLICY) {
  const errors = [];

  if (policy.previewOnly !== true) errors.push("preview_only_required");
  if (policy.durableDbWritesEnabled !== false) errors.push("db_writes_must_remain_disabled");
  if (policy.deleteEnabled !== false) errors.push("delete_must_remain_disabled");
  if (policy.exportEnabled !== false) errors.push("export_must_remain_disabled");

  for (const retentionClass of SNAPSHOT_RETENTION_CLASSES) {
    const classPolicy = policy.classes?.[retentionClass];
    if (!classPolicy) {
      errors.push(`missing_retention_class_${retentionClass}`);
      continue;
    }
    if (!Number.isInteger(classPolicy.days) || classPolicy.days <= 0) {
      errors.push(`invalid_retention_days_${retentionClass}`);
    }
    if (!normalizeString(classPolicy.label)) {
      errors.push(`missing_retention_label_${retentionClass}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function previewSnapshotPrune(records = [], options = {}) {
  const now = parseDate(options.now) || new Date();
  const pruneCandidates = [];
  const retainedRecords = [];

  for (const record of records) {
    const expiresAt = parseDate(record.expiresAt);
    const expired = Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
    const preview = {
      storeRecordId: normalizeString(record.storeRecordId),
      displayTitle: normalizeString(record.displayTitle),
      retentionClass: normalizeString(record.retentionClass),
      expiresAt: normalizeString(record.expiresAt),
      expired,
      deleteEnabled: false,
      blockedReason: expired
        ? "P63.4 pruning is dry-run only; deletion is disabled."
        : "Record is within retention window.",
    };

    if (expired) {
      pruneCandidates.push(preview);
    } else {
      retainedRecords.push(preview);
    }
  }

  return {
    previewOnly: true,
    dryRun: true,
    deleteEnabled: false,
    now: now.toISOString(),
    pruneCandidates,
    retainedRecords,
    blockedReason: "Snapshot pruning is preview-only in P63.4.",
  };
}
