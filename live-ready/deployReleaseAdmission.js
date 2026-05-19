import { buildDeployReadinessGateEnvelope } from "../release-governance/p69-4-placeholder.js";
import { buildShippingReadinessGateEnvelope } from "../project-shipping/p71-4-placeholder.js";
import { createPassResult } from "../shared/resultEnvelope.js";

export const P82_DEPLOY_RELEASE_ADMISSION_PHASE = "P82.5";

const RUNTIME_FLAGS = [
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "providerSpendAllowed",
];

const REQUIRED_ADMISSION_GATES = [
  "operatorApproval",
  "explicitEnvironmentTarget",
  "rollbackPlan",
  "releaseCandidatePreview",
  "shippingManifest",
  "activityEvidence",
  "costEvidence",
  "redactionCheck",
  "validationCommands",
];

function falseRuntimeFlags() {
  return Object.fromEntries(RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function buildAdmissionRows(deployGate, shippingGate) {
  return [
    {
      admissionId: "deploy-release",
      label: "Deploy / Release",
      currentState: "blocked_by_policy",
      readinessLabel: "Blocked by policy",
      ownerCapability: "NEXUS Release Governance",
      nextAction: "Collect explicit environment target, operator approval, rollback, release candidate, activity, cost, redaction, and validation evidence before deploy/release admission.",
      blockers: [...REQUIRED_ADMISSION_GATES],
      disabledReason: "Deploy and release execution are blocked in P82.5; no environment target is mutated.",
      evidenceRefs: ["reports/p825-deploy-release-admission-report.md", "reports/p694-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No deploy, release, network call, provider call, or provider spend in P82.5.",
      deployGate,
      ...falseRuntimeFlags(),
    },
    {
      admissionId: "export-package",
      label: "Export / Package",
      currentState: "needs_setup",
      readinessLabel: "Needs setup",
      ownerCapability: "NEXUS Shipping Governance",
      nextAction: "Complete display-safe manifest, redaction, operator approval, cost review, rollback, and validation evidence before export/package admission.",
      blockers: [...REQUIRED_ADMISSION_GATES, "packagePreview", "artifactPolicy"],
      disabledReason: "Export and package creation are blocked in P82.5; no artifact is created.",
      evidenceRefs: ["reports/p825-deploy-release-admission-report.md", "reports/p714-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No package artifact, export execution, network call, deploy, release, or provider spend.",
      shippingGate,
      ...falseRuntimeFlags(),
    },
  ];
}

export function buildDeployReleaseAdmissionGate(input = {}) {
  const deployEnvelope = buildDeployReadinessGateEnvelope({
    evidenceRefs: ["reports/p825-deploy-release-admission-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P82.5"],
    nextAction: "Use this deploy readiness gate as an input to P82.5 deploy/release admission.",
  });
  const shippingEnvelope = buildShippingReadinessGateEnvelope({
    evidenceRefs: ["reports/p825-deploy-release-admission-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P82.5"],
    nextAction: "Use this shipping readiness gate as an input to P82.5 export/package admission.",
  });
  const deployGate = deployEnvelope.data?.gate || {};
  const shippingGate = shippingEnvelope.data?.gate || {};
  const admissionRows = buildAdmissionRows(deployGate, shippingGate);

  return createPassResult({
    phase: P82_DEPLOY_RELEASE_ADMISSION_PHASE,
    mode: input.mode || "live",
    source: "live-ready/deployReleaseAdmission.js",
    summary: "Deploy, release, export, and package admission gates are available; execution remains blocked.",
    data: {
      currentState: "deploy_release_admission_gates_ready",
      readinessLabel: "Needs setup",
      nextAction: "Expose live-ready activation states in Command Center through P82.6.",
      blockers: [...REQUIRED_ADMISSION_GATES],
      disabledReason: "Deploy, release, export, and package behavior require explicit admission, environment target, rollback, evidence, and validation before live use.",
      ownerCapability: "NEXUS Deploy and Release Governance",
      evidenceRefs: [
        "reports/p825-deploy-release-admission-report.md",
        "reports/p694-report.md",
        "reports/p714-report.md",
      ],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No deploy, release, export, package artifact, network call, provider call, or provider spend in P82.5.",
      admissionRows,
      deployGate,
      shippingGate,
      ...falseRuntimeFlags(),
    },
    warnings: ["Admission gates are not execution. Deploy, release, export, and package actions remain disabled."],
    evidence: ["reports/p825-deploy-release-admission-report.md", "contracts/os-roadmap/p82-execution-contracts.json"],
  });
}

export function validateDeployReleaseAdmissionGate(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  const rows = data.admissionRows || [];
  if (envelope.phase !== P82_DEPLOY_RELEASE_ADMISSION_PHASE) errors.push("phase must be P82.5");
  if (data.readinessLabel !== "Needs setup") errors.push("readinessLabel must be Needs setup");
  if (!Array.isArray(rows) || rows.length !== 2) errors.push("admissionRows must include deploy/release and export/package rows");
  for (const field of ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  for (const flag of RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  if (data.deployGate?.deployExecutionAllowed !== false || data.deployGate?.releaseExecutionAllowed !== false) {
    errors.push("deployGate execution flags must be false");
  }
  if (data.shippingGate?.exportAllowed !== false || data.shippingGate?.packageCreationAllowed !== false) {
    errors.push("shippingGate execution flags must be false");
  }
  for (const row of rows) {
    if (!["Needs setup", "Blocked by policy"].includes(row.readinessLabel)) errors.push(`${row.admissionId} invalid readinessLabel`);
    if (!Array.isArray(row.blockers)) errors.push(`${row.admissionId}.blockers must be an array`);
    for (const flag of RUNTIME_FLAGS) {
      if (row[flag] !== false) errors.push(`${row.admissionId}.${flag} must be false`);
    }
  }
  return { valid: errors.length === 0, errors };
}
