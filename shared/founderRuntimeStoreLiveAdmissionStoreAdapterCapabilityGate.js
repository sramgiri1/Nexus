import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FLAGS,
  buildFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope,
  validateFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope,
} from "./founderRuntimeStoreLiveAdmissionExecutionRequestEnvelope.js";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_PHASE = "P132.3";
export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_VERSION = "1.0";

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_NAMES = [
  "adapterIdentity",
  "adapterInterfaceContract",
  "scopedReadBoundary",
  "scopedWriteBoundary",
  "migrationSafetyEvidence",
  "rollbackEvidence",
  "auditLedgerEvidence",
  "costLedgerEvidence",
  "validationEvidence",
];

export const FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_FLAGS = {
  ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FLAGS,
  founderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGateAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGateReady: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGateSatisfied: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterSelected: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterConnected: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterReadAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterWriteAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterCrudAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterRuntimeWriteAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterProviderCallAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterAgentDispatchAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterProjectMutationAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterDeployAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterReleaseAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterExportAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterPackageAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterNetworkAllowed: false,
  founderRuntimeStoreLiveAdmissionStoreAdapterSpendAllowed: false,
};

const DISABLED_REASON = "P132.3 models store adapter capability gates only; adapter selection and live DB access remain blocked.";
const OWNER_CAPABILITY = "NEXUS Store Adapter Capability Gate";

const ADAPTER_CAPABILITY_GATES = [
  {
    capabilityName: "adapterIdentity",
    publicLabel: "Adapter identity",
    blocker: "A governed adapter identity must be approved before any store adapter can be selected.",
    evidenceLabels: ["Adapter identity evidence pending"],
    activityLabels: ["Adapter identity capability gate modeled"],
  },
  {
    capabilityName: "adapterInterfaceContract",
    publicLabel: "Adapter interface contract",
    blocker: "A read/write interface contract must be reviewed before adapter selection can be considered.",
    evidenceLabels: ["Adapter interface contract pending"],
    activityLabels: ["Adapter interface capability gate modeled"],
  },
  {
    capabilityName: "scopedReadBoundary",
    publicLabel: "Scoped read boundary",
    blocker: "A scoped read boundary must be defined before any future DB read can be considered.",
    evidenceLabels: ["Scoped read boundary pending"],
    activityLabels: ["Scoped read capability gate modeled"],
  },
  {
    capabilityName: "scopedWriteBoundary",
    publicLabel: "Scoped write boundary",
    blocker: "A scoped write boundary must be defined before any future DB write can be considered.",
    evidenceLabels: ["Scoped write boundary pending"],
    activityLabels: ["Scoped write capability gate modeled"],
  },
  {
    capabilityName: "migrationSafetyEvidence",
    publicLabel: "Migration safety evidence",
    blocker: "Migration safety evidence must exist before any schema, migration, or write-plan path can be considered.",
    evidenceLabels: ["Migration safety evidence pending"],
    activityLabels: ["Migration safety capability gate modeled"],
  },
  {
    capabilityName: "rollbackEvidence",
    publicLabel: "Rollback evidence",
    blocker: "Rollback evidence must be resolved before any future adapter-backed execution can be considered.",
    evidenceLabels: ["Rollback evidence pending"],
    activityLabels: ["Rollback capability gate modeled"],
  },
  {
    capabilityName: "auditLedgerEvidence",
    publicLabel: "Audit ledger evidence",
    blocker: "Audit evidence must be resolved before any future adapter-backed execution can be considered.",
    evidenceLabels: ["Audit ledger evidence pending"],
    activityLabels: ["Audit ledger capability gate modeled"],
  },
  {
    capabilityName: "costLedgerEvidence",
    publicLabel: "Cost ledger evidence",
    blocker: "Cost evidence must be resolved before any provider, network, worker, package, deploy, or adapter spend can be considered.",
    evidenceLabels: ["Cost ledger evidence pending"],
    activityLabels: ["Cost ledger capability gate modeled"],
  },
  {
    capabilityName: "validationEvidence",
    publicLabel: "Validation evidence",
    blocker: "Validation evidence must be resolved before any future DB-backed execution can be considered.",
    evidenceLabels: ["Validation evidence pending"],
    activityLabels: ["Validation capability gate modeled"],
  },
];

function withBlockedAdapterCapabilityGate(gate) {
  return {
    ...gate,
    gateState: "blocked",
    readinessState: "missing_evidence",
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
    nextAction: "Route to P132.4 DB write plan preview only after adapter capability evidence is modeled.",
    costImpactLabel: "No provider spend",
    capabilitySatisfied: false,
    adapterCandidate: false,
    canSatisfyGate: false,
    canSelectAdapter: false,
    canConnectAdapter: false,
    canPreviewReadBoundary: false,
    canPreviewWritePlan: false,
    canRunCrud: false,
    canReadDb: false,
    canWriteDb: false,
    canWriteRuntime: false,
    canPersistRequest: false,
    canCaptureApproval: false,
    canPersistDecision: false,
    canAcceptHandoff: false,
    canGrantAuthority: false,
    canUnlockExecution: false,
    canCallProvider: false,
    canDispatchAgent: false,
    canExecuteWorker: false,
    canExecuteTool: false,
    canMutateProject: false,
    canDeploy: false,
    canRelease: false,
    canExport: false,
    canPackage: false,
    canUseNetwork: false,
    canSpend: false,
    evidenceLabels: [...gate.evidenceLabels],
    activityLabels: [...gate.activityLabels],
    authorityFlags: { ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_FLAGS },
  };
}

export function buildFounderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate() {
  const executionRequestEnvelope = buildFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope();
  const executionRequestEnvelopeValidation = validateFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope(executionRequestEnvelope);
  const adapterCapabilityGates = ADAPTER_CAPABILITY_GATES.map(withBlockedAdapterCapabilityGate);

  return {
    metadataVersion: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_VERSION,
    phaseId: FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_PHASE,
    sourceExecutionRequestEnvelopePhase: executionRequestEnvelope.phaseId,
    sourceExecutionRequestEnvelopeVersion: executionRequestEnvelope.metadataVersion,
    sourceAdmissionRequestPhase: executionRequestEnvelope.sourceAdmissionRequestPhase,
    sourceSafeDryRunPhase: executionRequestEnvelope.sourceSafeDryRunPhase,
    sourceStoreSafeDryRunPhase: executionRequestEnvelope.sourceStoreSafeDryRunPhase,
    sourceMigrationPreviewPhase: executionRequestEnvelope.sourceMigrationPreviewPhase,
    sourceRepositoryIntentPhase: executionRequestEnvelope.sourceRepositoryIntentPhase,
    sourcePersistenceBoundaryPhase: executionRequestEnvelope.sourcePersistenceBoundaryPhase,
    sourceExecutionRequestEnvelopeValid: executionRequestEnvelopeValidation.valid,
    modelOnly: true,
    gateOnly: true,
    localOnly: true,
    commandCenterVisible: false,
    adapterCapabilityPolicy: {
      mode: "store-adapter-capability-gate-only",
      disabledReason: DISABLED_REASON,
      ...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_FLAGS,
    },
    adapterCapabilityNames: [...FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_NAMES],
    adapterCapabilityGates,
    adapterCapabilityGateCount: adapterCapabilityGates.length,
    blockedAdapterCapabilityGateCount: adapterCapabilityGates.length,
    satisfiedAdapterCapabilityGateCount: 0,
    adapterSelectionCandidateCount: 0,
    adapterConnectionCandidateCount: 0,
    adapterReadBoundaryCandidateCount: 0,
    adapterWritePlanCandidateCount: 0,
    liveCrudCandidateCount: 0,
    dbReadableCandidateCount: 0,
    dbWritableCandidateCount: 0,
    runtimeWritableCandidateCount: 0,
    providerCallCandidateCount: 0,
    agentDispatchCandidateCount: 0,
    projectMutationCandidateCount: 0,
    deployCandidateCount: 0,
    releaseCandidateCount: 0,
    exportCandidateCount: 0,
    packageCandidateCount: 0,
    networkCandidateCount: 0,
    providerSpendCandidateCount: 0,
    separationBoundaries: [
      "Store adapter capability evidence is modeled separately from adapter selection.",
      "DB read and write authority remain unavailable until later explicit subphases.",
      "Provider, agent, project, deploy, release, export, package, network, and spend capabilities remain outside the store adapter gate.",
    ],
    blockers: [
      "Store adapter capability gates are not satisfied.",
      "No adapter is selected or connected.",
      "No DB schema, migration, table, raw SQL interface, read, write, runtime record, adapter executor, or CRUD executor is used.",
      "Runtime execution, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, and spend remain blocked.",
    ],
    nextAction: "Route P132.3 adapter capability gates into P132.4 DB write plan preview.",
    ownerCapability: OWNER_CAPABILITY,
    evidenceLabels: ["P132.3 store adapter capability gate model", "P132.2 execution request envelope model"],
    activityLabels: ["Store adapter capability gates modeled locally"],
    costImpactLabel: "No provider spend",
  };
}

export function validateFounderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate(gate = {}) {
  const errors = [];
  if (gate.metadataVersion !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_VERSION) {
    errors.push("Unexpected store adapter capability gate version.");
  }
  if (gate.phaseId !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_GATE_PHASE) {
    errors.push("Unexpected store adapter capability gate phase.");
  }
  if (gate.sourceExecutionRequestEnvelopePhase !== "P132.2" || gate.sourceExecutionRequestEnvelopeVersion !== "1.0") {
    errors.push("Store adapter capability gate must reuse P132.2 execution request envelope evidence.");
  }
  if (gate.sourceAdmissionRequestPhase !== "P131.2" || gate.sourceSafeDryRunPhase !== "P130.4" || gate.sourceStoreSafeDryRunPhase !== "P129.5" || gate.sourceMigrationPreviewPhase !== "P129.4" || gate.sourceRepositoryIntentPhase !== "P129.3" || gate.sourcePersistenceBoundaryPhase !== "P128.2") {
    errors.push("Store adapter capability gate must preserve store/admission lineage.");
  }
  if (gate.modelOnly !== true || gate.gateOnly !== true || gate.localOnly !== true || gate.commandCenterVisible !== false) {
    errors.push("Store adapter capability gate must remain local hidden gate metadata.");
  }
  if (gate.adapterCapabilityPolicy?.mode !== "store-adapter-capability-gate-only") {
    errors.push("Store adapter capability gate policy must remain gate-only.");
  }
  const policyValues = Object.values(gate.adapterCapabilityPolicy || {}).filter((value) => typeof value === "boolean");
  if (!policyValues.every((value) => value === false)) {
    errors.push("Store adapter capability gate policy booleans must remain false.");
  }
  if (!Array.isArray(gate.adapterCapabilityGates) || gate.adapterCapabilityGates.length !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_NAMES.length) {
    errors.push("Store adapter capability gates are incomplete.");
  }
  if (gate.adapterCapabilityGateCount !== FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_NAMES.length || gate.blockedAdapterCapabilityGateCount !== gate.adapterCapabilityGateCount || gate.satisfiedAdapterCapabilityGateCount !== 0) {
    errors.push("Store adapter capability gate counts must remain fully blocked.");
  }
  for (const countKey of [
    "adapterSelectionCandidateCount",
    "adapterConnectionCandidateCount",
    "adapterReadBoundaryCandidateCount",
    "adapterWritePlanCandidateCount",
    "liveCrudCandidateCount",
    "dbReadableCandidateCount",
    "dbWritableCandidateCount",
    "runtimeWritableCandidateCount",
    "providerCallCandidateCount",
    "agentDispatchCandidateCount",
    "projectMutationCandidateCount",
    "deployCandidateCount",
    "releaseCandidateCount",
    "exportCandidateCount",
    "packageCandidateCount",
    "networkCandidateCount",
    "providerSpendCandidateCount",
  ]) {
    if (gate[countKey] !== 0) errors.push(`${countKey} must remain zero.`);
  }
  for (const capabilityGate of gate.adapterCapabilityGates || []) {
    if (!FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_STORE_ADAPTER_CAPABILITY_NAMES.includes(capabilityGate.capabilityName)) {
      errors.push("Store adapter capability name must be allowlisted.");
    }
    if (capabilityGate.gateState !== "blocked" || capabilityGate.readinessState !== "missing_evidence" || capabilityGate.disabledReason !== DISABLED_REASON) {
      errors.push(`${capabilityGate.capabilityName || "adapter capability"} must remain blocked with the expected disabled reason.`);
    }
    const gateValues = Object.values(capabilityGate).filter((value) => typeof value === "boolean");
    if (!gateValues.every((value) => value === false)) {
      errors.push(`${capabilityGate.capabilityName || "adapter capability"} booleans must remain false.`);
    }
    const authorityValues = Object.values(capabilityGate.authorityFlags || {}).filter((value) => typeof value === "boolean");
    if (!authorityValues.every((value) => value === false)) {
      errors.push(`${capabilityGate.capabilityName || "adapter capability"} authority flags must remain false.`);
    }
  }
  if (!Array.isArray(gate.separationBoundaries) || gate.separationBoundaries.length < 3) {
    errors.push("Store adapter capability gate separation boundaries are incomplete.");
  }
  if (!Array.isArray(gate.blockers) || gate.blockers.length < 4) {
    errors.push("Store adapter capability gate blockers are incomplete.");
  }
  return { valid: errors.length === 0, errors };
}
