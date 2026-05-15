const lineageRecords = [];
const lineageLinks = [];

function stableId(prefix, parts) {
  return `${prefix}-${parts.filter(Boolean).join("-").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

export function createLineageRecord(input = {}) {
  const createdAt = input.createdAt || new Date().toISOString();
  const record = {
    lineageId: input.lineageId || stableId("lineage", [input.sourceId, input.taskId, input.activityId, Date.parse(createdAt)]),
    sourceId: input.sourceId,
    derivedFrom: input.derivedFrom || [],
    generatedBy: input.generatedBy || "trusted-context",
    projectId: input.projectId || null,
    scope: input.scope || "os",
    taskId: input.taskId || null,
    activityId: input.activityId || null,
    evidenceId: input.evidenceId || null,
    createdAt,
    redacted: true,
  };
  lineageRecords.push(record);
  return record;
}

export function linkLineage(parentId, childId, relationship = "derived_from") {
  const link = {
    parentId,
    childId,
    relationship,
    createdAt: new Date().toISOString(),
    redacted: true,
  };
  lineageLinks.push(link);
  return link;
}

export function traceLineage(sourceId) {
  return {
    sourceId,
    records: lineageRecords.filter((record) => record.sourceId === sourceId || record.derivedFrom.includes(sourceId)),
    links: lineageLinks.filter((link) => link.parentId === sourceId || link.childId === sourceId),
    redacted: true,
  };
}

export function validateLineageRecord(record) {
  const errors = [];
  if (!record?.lineageId) errors.push("lineageId is required");
  if (!record?.sourceId) errors.push("sourceId is required");
  if (!Array.isArray(record?.derivedFrom)) errors.push("derivedFrom must be an array");
  if (!record?.generatedBy) errors.push("generatedBy is required");
  if (!record?.scope) errors.push("scope is required");
  if (!record?.createdAt) errors.push("createdAt is required");
  if (record?.redacted !== true) errors.push("Lineage records must be redacted");
  return { ok: errors.length === 0, errors };
}
