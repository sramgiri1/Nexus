export function createAgentDefinitionVersionRecord(input = {}) {
  return {
    versionRecordVersion: "1.0",
    phase: "P49.5",
    proposalId: input.proposalId,
    agentId: input.agentId,
    previousVersion: input.previousVersion || "1.0.0",
    proposedVersion: input.proposedVersion || "1.0.1-dry-run",
    status: input.status || "dry_run_only",
    approvedProposalRequired: true,
    agentFileMutationAllowed: false,
    createdAt: input.createdAt || new Date().toISOString(),
    evidenceRequired: input.evidenceRequired || ["approved-proposal", "boundary-diff", "rollback-plan", "final-validation"],
  };
}

export function validateAgentDefinitionVersionRecord(record = {}) {
  const errors = [];
  for (const field of ["proposalId", "agentId", "previousVersion", "proposedVersion", "status"]) {
    if (!record[field]) errors.push(`Version record missing ${field}.`);
  }
  if (record.agentFileMutationAllowed === true) errors.push("Version record cannot allow direct agent file mutation.");
  if (record.approvedProposalRequired !== true) errors.push("Approved proposal must be required.");
  return { ok: errors.length === 0, errors };
}

export function summarizeVersionRecord(record = {}) {
  return {
    proposalId: record.proposalId,
    agentId: record.agentId,
    previousVersion: record.previousVersion,
    proposedVersion: record.proposedVersion,
    status: record.status,
    mutationAllowed: record.agentFileMutationAllowed === true,
  };
}
