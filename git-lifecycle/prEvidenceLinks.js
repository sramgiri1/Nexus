export function buildPrEvidenceLinks(input = {}) {
  const evidenceIds = Array.isArray(input.evidenceIds) ? input.evidenceIds : [];
  const auditIds = Array.isArray(input.auditIds) ? input.auditIds : [];
  const activityCorrelationIds = Array.isArray(input.activityCorrelationIds)
    ? input.activityCorrelationIds
    : [];

  return {
    linkVersion: "1.0",
    phase: "P44.4",
    source: "local-metadata",
    evidenceIds,
    auditIds,
    activityCorrelationIds,
    externalLinksResolved: false,
    externalNetworkCallsAllowed: false,
  };
}

export function validatePrEvidenceLinks(links) {
  const errors = [];
  if (links?.linkVersion !== "1.0") errors.push("linkVersion must be 1.0");
  if (links?.phase !== "P44.4") errors.push("phase must be P44.4");
  for (const field of ["evidenceIds", "auditIds", "activityCorrelationIds"]) {
    if (!Array.isArray(links?.[field])) errors.push(`${field} must be an array`);
  }
  if (links?.externalLinksResolved !== false) errors.push("external links must not be resolved");
  if (links?.externalNetworkCallsAllowed !== false) errors.push("external network calls must be disabled");
  return { valid: errors.length === 0, errors };
}
