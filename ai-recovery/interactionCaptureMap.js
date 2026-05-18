export const CAPTURE_SOURCE_TYPES = Object.freeze([
  "command_timeline",
  "mission_composer",
  "worker_queue",
  "tool_preview",
  "approval",
  "activity",
]);

const CAPTURE_SOURCES = Object.freeze([
  {
    sourceId: "command_timeline",
    sourceLabel: "Command Timeline",
    sourceType: "command_timeline",
    ownerAgent: "NEXUS",
    ownerCapability: "Conversational Command Interface",
    redactionRequired: true,
    previewOnly: true,
    persistenceEnabled: false,
    excludedFields: ["commandText", "rawPrompt", "rawResponse", "rawPayload"],
    fixtureRef: "commandTimelinePreview",
    snapshotMapping: {
      displayTitle: "Command preview snapshot",
      commandIntent: "intentType",
      promptSummary: "commandSummary",
      responseSummary: "nextAction",
      correlationId: "correlationId",
    },
  },
  {
    sourceId: "mission_composer",
    sourceLabel: "Mission Composer",
    sourceType: "mission_composer",
    ownerAgent: "SHEPHERD",
    ownerCapability: "Governed Mission Kickoff",
    redactionRequired: true,
    previewOnly: true,
    persistenceEnabled: false,
    excludedFields: ["missionText", "rawPrompt", "rawResponse", "projectId"],
    fixtureRef: "missionComposerPreview",
    snapshotMapping: {
      displayTitle: "Mission planning snapshot",
      commandIntent: "missionType",
      promptSummary: "missionSummary",
      responseSummary: "nextAction",
      correlationId: "correlationId",
    },
  },
  {
    sourceId: "worker_queue",
    sourceLabel: "Worker Queue",
    sourceType: "worker_queue",
    ownerAgent: "CORE",
    ownerCapability: "Worker Runtime Preview",
    redactionRequired: true,
    previewOnly: true,
    persistenceEnabled: false,
    excludedFields: ["rawTaskPayload", "projectId", "privatePath"],
    fixtureRef: "workerQueuePreview",
    snapshotMapping: {
      displayTitle: "Worker queue preview snapshot",
      commandIntent: "taskType",
      promptSummary: "objectiveSummary",
      responseSummary: "queueState",
      correlationId: "correlationId",
    },
  },
  {
    sourceId: "tool_preview",
    sourceLabel: "Tool Preview",
    sourceType: "tool_preview",
    ownerAgent: "WARDEN",
    ownerCapability: "Tool Governance Preview",
    redactionRequired: true,
    previewOnly: true,
    persistenceEnabled: false,
    excludedFields: ["toolArguments", "rawPayload", "secretRefs", "projectId"],
    fixtureRef: "toolPreview",
    snapshotMapping: {
      displayTitle: "Tool decision preview snapshot",
      commandIntent: "method",
      promptSummary: "toolRequestSummary",
      responseSummary: "reason",
      correlationId: "correlationId",
    },
  },
  {
    sourceId: "approval",
    sourceLabel: "Approval Preview",
    sourceType: "approval",
    ownerAgent: "AUDITOR",
    ownerCapability: "Approval Workflow",
    redactionRequired: true,
    previewOnly: true,
    persistenceEnabled: false,
    excludedFields: ["projectId", "taskId", "rawEvidence", "privateReason"],
    fixtureRef: "approvalPreview",
    snapshotMapping: {
      displayTitle: "Approval posture snapshot",
      commandIntent: "approvalType",
      promptSummary: "reasonSummary",
      responseSummary: "decision",
      correlationId: "correlationId",
    },
  },
  {
    sourceId: "activity",
    sourceLabel: "Activity Event",
    sourceType: "activity",
    ownerAgent: "BEACON",
    ownerCapability: "Activity Ledger Preview",
    redactionRequired: true,
    previewOnly: true,
    persistenceEnabled: false,
    excludedFields: ["metadata.raw", "projectId", "missionId", "taskId"],
    fixtureRef: "activityPreview",
    snapshotMapping: {
      displayTitle: "Activity trace snapshot",
      commandIntent: "eventType",
      promptSummary: "summary",
      responseSummary: "status",
      correlationId: "correlationId",
    },
  },
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildInteractionCaptureMap() {
  return CAPTURE_SOURCES.map((source) => ({ ...source }));
}

export function getCaptureSource(sourceId = "") {
  return buildInteractionCaptureMap().find((source) => source.sourceId === sourceId) || null;
}

export function validateCaptureSource(source = {}) {
  const errors = [];

  for (const field of [
    "sourceId",
    "sourceLabel",
    "sourceType",
    "ownerAgent",
    "ownerCapability",
    "fixtureRef",
  ]) {
    if (!normalizeString(source[field])) errors.push(`missing_${field}`);
  }

  if (!CAPTURE_SOURCE_TYPES.includes(source.sourceType)) {
    errors.push("invalid_source_type");
  }

  if (source.redactionRequired !== true) errors.push("redaction_required");
  if (source.previewOnly !== true) errors.push("preview_only_required");
  if (source.persistenceEnabled !== false) errors.push("persistence_must_remain_disabled");
  if (!Array.isArray(source.excludedFields) || source.excludedFields.length === 0) {
    errors.push("excluded_fields_required");
  }
  if (!source.snapshotMapping || typeof source.snapshotMapping !== "object") {
    errors.push("snapshot_mapping_required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateInteractionCaptureMap(sources = buildInteractionCaptureMap()) {
  const errors = [];
  const sourceIds = new Set();

  for (const source of sources) {
    const validation = validateCaptureSource(source);
    if (!validation.valid) {
      errors.push(`${source.sourceId || "unknown"}:${validation.errors.join(",")}`);
    }

    if (sourceIds.has(source.sourceId)) {
      errors.push(`duplicate_source:${source.sourceId}`);
    }
    sourceIds.add(source.sourceId);
  }

  for (const type of CAPTURE_SOURCE_TYPES) {
    if (!sources.some((source) => source.sourceType === type)) {
      errors.push(`missing_source_type:${type}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
