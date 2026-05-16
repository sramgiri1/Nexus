import { listProjectCredentialReferences, validateProjectCredentialReference } from "./projectCredentialRegistry.js";

export function getProjectCredentialBoundary(projectId = "private-project") {
  return {
    phase: "P59.5",
    projectId,
    previewOnly: true,
    dbWritesAllowed: false,
    deployAllowed: false,
    mobileSigningAllowed: false,
    exportIncludesSecretReferences: false,
    references: listProjectCredentialReferences(projectId),
  };
}

export function evaluateProjectCredentialBoundary(projectId = "private-project", action = "metadata") {
  if (["db_write", "deploy", "mobile_signing", "resolve_value"].includes(action)) return "blocked";
  if (action === "export_package") return "redacted_metadata_only";
  return "metadata_only";
}

export function summarizeProjectCredentialBoundary(projectId = "private-project") {
  const boundary = getProjectCredentialBoundary(projectId);
  return {
    projectId,
    referenceCount: boundary.references.length,
    blockedReferences: boundary.references.filter((ref) => ref.status === "blocked").length,
    dbWritesAllowed: boundary.dbWritesAllowed,
    deployAllowed: boundary.deployAllowed,
    mobileSigningAllowed: boundary.mobileSigningAllowed,
    exportIncludesSecretReferences: boundary.exportIncludesSecretReferences,
  };
}

export { listProjectCredentialReferences, validateProjectCredentialReference };
