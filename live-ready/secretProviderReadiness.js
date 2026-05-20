import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";
import { buildProviderToolGateProfiles } from "./providerToolGateProfiles.js";
import { buildExplicitLiveActivationContract } from "./explicitLiveActivationContract.js";

export const P87_SECRET_PROVIDER_READINESS_PHASE = "P87.2";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "activationAllowed",
  "executionAllowed",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function buildReadinessProfile(profile = {}) {
  return {
    readinessId: `secret-provider-${profile.id}`,
    label: profile.label,
    ownerCapability: profile.ownerCapability,
    readinessState: "redacted_reference_required",
    secretReferenceRequired: true,
    secretReferencePresent: false,
    secretMaterialVisible: false,
    policyProfileRequired: true,
    budgetLimitRequired: true,
    costLedgerRequired: true,
    requiredBeforeLive: [
      "redactedSecretReference",
      "providerPolicyProfile",
      "budgetLimit",
      "operatorApproval",
      "approvalExpiry",
      "redactionCheck",
      "activityEvidence",
      "costLedger",
      "rollbackPlan",
      "validationCommands",
    ],
    blockers: ["redactedSecretReference", "providerPolicyProfile", "budgetLimit", "operatorApproval", "costLedger"],
    nextAction: "Register a redacted secret reference, provider policy profile, budget limit, cost ledger, rollback plan, and validation evidence before provider use can be reviewed.",
    disabledReason:
      "P87.2 validates readiness metadata only. It does not read secrets, call providers, call models, open network connections, or spend.",
    evidenceRefs: ["reports/p872-secret-provider-readiness-report.md", ...(profile.evidenceRefs || [])],
    activityLocation: profile.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "Zero provider spend. Provider and model calls remain blocked.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarizeProfiles(profiles) {
  return profiles.reduce((acc, profile) => {
    acc[profile.readinessState] = (acc[profile.readinessState] || 0) + 1;
    return acc;
  }, {});
}

export function buildSecretProviderReadiness(input = {}) {
  const providerGate = input.providerGate || buildProviderToolGateProfiles({ mode: "live" });
  const activationContract = input.activationContract || buildExplicitLiveActivationContract(input);
  const providerProfiles = (providerGate.data?.profiles || [])
    .filter((profile) => profile.surface === "provider")
    .map(buildReadinessProfile);
  const redactionProbe = summarizeRedaction({
    providerKey: "placeholder",
    policyProfile: "provider-policy-profile-required",
    budgetLimit: "required-before-live",
  });

  return createPassResult({
    phase: P87_SECRET_PROVIDER_READINESS_PHASE,
    mode: "live-activation-contract",
    source: "live-ready/secretProviderReadiness.js",
    summary: "Secret and provider readiness metadata is available; no secrets are read and provider calls remain blocked.",
    data: {
      schemaVersion: "1.0",
      currentState: "secret_provider_readiness_metadata_ready",
      readinessLabel: "Needs setup",
      providerProfileCount: providerProfiles.length,
      readinessSummary: summarizeProfiles(providerProfiles),
      providerProfiles,
      redactionProbe: {
        changed: redactionProbe.changed,
        redactionCount: redactionProbe.redactionCount,
      },
      activationContractPhase: activationContract.phase,
      nextAction: "Implement P87.3 local agent dispatch admission without dispatching agents.",
      blockers: ["redactedSecretReference", "providerPolicyProfile", "budgetLimit", "operatorApproval", "costLedger"],
      disabledReason:
        "P87.2 is readiness metadata only. It does not read .env files, reveal secrets, call providers or models, open network connections, activate tools, or spend.",
      ownerCapability: "NEXUS Provider Governance",
      evidenceRefs: ["reports/p872-secret-provider-readiness-report.md", "reports/p871-explicit-live-activation-contract-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, model calls, network calls, or provider spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p872-secret-provider-readiness-report.md",
      "contracts/os-roadmap/p87-execution-contracts.json",
    ],
    warnings: ["P87.2 does not read credentials or execute provider/model calls."],
  });
}

export function validateSecretProviderReadiness(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P87_SECRET_PROVIDER_READINESS_PHASE) errors.push("phase must be P87.2");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "providerProfiles", "redactionProbe", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.providerProfiles) || data.providerProfiles.length < 2) errors.push("providerProfiles must cover provider call and spend lanes");
  if (!data.redactionProbe?.changed || data.redactionProbe?.redactionCount < 1) errors.push("redaction probe must prove secret-key redaction");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const profile of data.providerProfiles || []) {
    for (const field of ["readinessId", "label", "ownerCapability", "readinessState", "secretReferenceRequired", "secretReferencePresent", "secretMaterialVisible", "policyProfileRequired", "budgetLimitRequired", "costLedgerRequired", "requiredBeforeLive", "blockers", "nextAction", "disabledReason", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in profile)) errors.push(`${profile.label || "profile"}.${field} missing`);
    }
    if (profile.secretReferencePresent !== false) errors.push(`${profile.label}.secretReferencePresent must be false`);
    if (profile.secretMaterialVisible !== false) errors.push(`${profile.label}.secretMaterialVisible must be false`);
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (profile[flag] !== false) errors.push(`${profile.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("secret provider readiness must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("secret provider readiness must not expose fake unsafe runnable actions");
  if (/sk-[A-Za-z0-9_-]{12,}|xox[baprs]-|BEGIN [A-Z ]*PRIVATE KEY|postgres(?:ql)?:\/\//i.test(serialized)) errors.push("secret provider readiness must not expose secret-like values");
  return { valid: errors.length === 0, errors };
}
