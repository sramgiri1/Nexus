import { createPassResult } from "../shared/resultEnvelope.js";

export const P73_2_REQUIRED_FIELDS = Object.freeze([
  "identityContractId",
  "identityMode",
  "sessionState",
  "tokenHandlingState",
  "authProviderState",
  "loginAllowed",
  "identityProviderCallsAllowed",
  "tokenExchangeAllowed",
  "sessionMutationAllowed",
  "userMutationAllowed",
  "roleMutationAllowed",
  "tenantMutationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "displayFields",
  "blockedOperations",
  "disabledReason",
  "blockers",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "auth/**",
  "users/**",
  "rbac/**",
  "db/**",
  "prisma/**",
  "migrations/**",
  "providers/**",
  "worker-runtime/**",
  "deploy/**",
  "release/**",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createIdentitySessionContract(input = {}) {
  return {
    identityContractId: input.identityContractId || "identity-session-contract-preview",
    identityMode: input.identityMode || "single_operator_local_preview",
    sessionState: input.sessionState || "session_contract_defined_not_mutating",
    tokenHandlingState: input.tokenHandlingState || "tokens_not_collected_or_stored",
    authProviderState: input.authProviderState || "identity_provider_not_connected",
    loginAllowed: false,
    identityProviderCallsAllowed: false,
    tokenExchangeAllowed: false,
    sessionMutationAllowed: false,
    userMutationAllowed: false,
    roleMutationAllowed: false,
    tenantMutationAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    providerSpendAllowed: false,
    displayFields: [
      "identity mode",
      "session state",
      "token handling state",
      "auth provider state",
      "next action",
      "disabled reason",
    ],
    blockedOperations: [
      "Login",
      "Identity provider calls",
      "Token exchange",
      "Session mutation",
      "User mutation",
      "Role mutation",
    ],
    disabledReason: "P73.2 records identity and session contracts only; login, token exchange, identity provider calls, and session mutation remain disabled.",
    blockers: [
      "Login is disabled.",
      "Identity provider integration is disabled.",
      "Token exchange and token storage are disabled.",
      "Session, user, role, and tenant mutation are disabled.",
      "DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p732-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P73.2"])],
    costImpact: "No identity provider calls, token exchange, DB service calls, network calls, provider calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.identitySessionGovernancePreview",
    nextAction: input.nextAction || "Route this identity/session contract through P73.3 RBAC permission matrix.",
    commandCenterVisible: true,
  };
}

export function validateIdentitySessionContract(contract = {}) {
  const errors = [];
  for (const field of P73_2_REQUIRED_FIELDS) {
    if (!(field in contract)) errors.push(`missing ${field}`);
  }
  if (contract.loginAllowed !== false || contract.identityProviderCallsAllowed !== false || contract.tokenExchangeAllowed !== false || contract.sessionMutationAllowed !== false) errors.push("login, provider calls, token exchange, and session mutation must be false");
  if (contract.userMutationAllowed !== false || contract.roleMutationAllowed !== false || contract.tenantMutationAllowed !== false) errors.push("user, role, and tenant mutation must be false");
  if (contract.projectMutationAllowed !== false || contract.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (contract.providerDispatchAllowed !== false || contract.toolExecutionAllowed !== false || contract.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (contract.networkCallsAllowed !== false || contract.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (contract.deployExecutionAllowed !== false || contract.releaseExecutionAllowed !== false || contract.exportExecutionAllowed !== false || contract.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (!Array.isArray(contract.blockedOperations) || contract.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!Array.isArray(contract.blockers) || contract.blockers.length < 5) errors.push("blockers must be visible");
  if (!Array.isArray(contract.forbiddenFiles) || !contract.forbiddenFiles.includes("auth/**") || !contract.forbiddenFiles.includes("users/**") || !contract.forbiddenFiles.includes("rbac/**")) errors.push("auth/user/RBAC files must remain forbidden");
  if (!contract.disabledReason || /log in now|sign in now|create session|issue token|connect provider|execute now/i.test(contract.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(contract.evidenceRefs) || contract.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(contract.activityRefs) || contract.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildIdentitySessionContractEnvelope(input = {}) {
  const contract = createIdentitySessionContract(input);
  return createPassResult({
    phase: "P73.2",
    mode: "preview-only",
    source: "auth-governance/p73-2-placeholder.js",
    summary: "Identity/session contract recorded without enabling login, token exchange, provider calls, or session mutation.",
    data: { contract },
    evidence: contract.evidenceRefs,
  });
}

export const P73_2_SAMPLE_CONTRACTS = Object.freeze([
  createIdentitySessionContract({
    evidenceRefs: ["reports/p732-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P73.2"],
  }),
]);
