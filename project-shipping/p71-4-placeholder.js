import { createPassResult } from "../shared/resultEnvelope.js";
import { createExportPackagePreview, validateExportPackagePreview } from "./p71-3-placeholder.js";

export const P71_4_REQUIRED_FIELDS = Object.freeze([
  "gateId",
  "packagePreviewId",
  "shippingId",
  "approvalState",
  "manifestReady",
  "previewReady",
  "redactionReady",
  "evidenceReady",
  "costReviewReady",
  "artifactCreated",
  "exportAllowed",
  "packageCreationAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "providerSpendAllowed",
  "disabledReason",
  "blockers",
  "requiredEvidence",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createShippingReadinessGate(input = {}) {
  const preview = input.preview || createExportPackagePreview(input);
  const previewValidation = validateExportPackagePreview(preview);
  return {
    gateId: input.gateId || "shipping-readiness-gate-preview",
    packagePreviewId: preview.packagePreviewId,
    shippingId: preview.shippingId,
    approvalState: input.approvalState || "operator_review_required",
    manifestReady: previewValidation.valid,
    previewReady: previewValidation.valid,
    redactionReady: preview.previewItems.every((item) => item.rawPathVisible === false),
    evidenceReady: Array.isArray(preview.evidenceRefs) && preview.evidenceRefs.length > 0,
    costReviewReady: String(preview.costImpact || "").includes("No provider calls"),
    artifactCreated: false,
    exportAllowed: false,
    packageCreationAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    dbWritesAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P71.4 records shipping readiness only; package creation and export execution remain disabled.",
    blockers: [
      "Operator approval is required before any future shipping execution phase.",
      "Package creation and export execution are disabled.",
      "Project mutation and package artifact creation are disabled.",
      "Provider/tool/worker execution, DB writes, network calls, deploy/release execution, and provider spend remain disabled.",
      ...(previewValidation.valid ? [] : previewValidation.errors),
      ...normalizeList(input.blockers),
    ],
    requiredEvidence: [
      "Display-safe shipping manifest",
      "Preview-only package contents",
      "Redaction review",
      "Operator approval record",
      "Cost impact review",
    ],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), ...preview.evidenceRefs, "reports/p714-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), ...preview.activityRefs, "os-roadmap/phase-status.json#P71.4"])],
    costImpact: "No provider calls, package artifact creation, export execution, network calls, deploy/release execution, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.shippingReadinessGate",
    nextAction: input.nextAction || "Expose this readiness gate in P71.5 Command Center shipping UX.",
    commandCenterVisible: true,
  };
}

export function validateShippingReadinessGate(gate = {}) {
  const errors = [];
  for (const field of P71_4_REQUIRED_FIELDS) {
    if (!(field in gate)) errors.push(`missing ${field}`);
  }
  if (gate.approvalState !== "operator_review_required") errors.push("approvalState must require operator review");
  if (gate.artifactCreated !== false) errors.push("artifactCreated must be false");
  if (gate.exportAllowed !== false || gate.packageCreationAllowed !== false) errors.push("export/package execution must be disabled");
  if (gate.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (gate.providerDispatchAllowed !== false || gate.toolExecutionAllowed !== false || gate.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (gate.dbWritesAllowed !== false || gate.networkCallsAllowed !== false || gate.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (gate.deployExecutionAllowed !== false || gate.releaseExecutionAllowed !== false) errors.push("deploy/release execution must be false");
  if (gate.manifestReady !== true || gate.previewReady !== true || gate.redactionReady !== true) errors.push("manifest, preview, and redaction readiness must be true");
  if (gate.evidenceReady !== true || gate.costReviewReady !== true) errors.push("evidence and cost review must be ready");
  if (!Array.isArray(gate.blockers) || gate.blockers.length < 4) errors.push("blockers must be visible");
  if (!Array.isArray(gate.requiredEvidence) || gate.requiredEvidence.length < 5) errors.push("requiredEvidence must be visible");
  if (!gate.disabledReason || /package now|export now|ship now|deploy now|release now|execute now/i.test(gate.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(gate.evidenceRefs) || gate.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(gate.activityRefs) || gate.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildShippingReadinessGateEnvelope(input = {}) {
  const gate = createShippingReadinessGate(input);
  return createPassResult({
    phase: "P71.4",
    mode: "preview-only",
    source: "project-shipping/p71-4-placeholder.js",
    summary: "Shipping readiness gate recorded without enabling package creation or export execution.",
    data: { gate },
    evidence: gate.evidenceRefs,
  });
}

export const P71_4_SAMPLE_GATES = Object.freeze([
  createShippingReadinessGate({
    evidenceRefs: ["reports/p714-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P71.4"],
  }),
]);
