import { createPassResult } from "../shared/resultEnvelope.js";
import { createProjectShippingManifest, validateProjectShippingManifest } from "./p71-2-placeholder.js";

export const P71_3_REQUIRED_FIELDS = Object.freeze([
  "packagePreviewId",
  "shippingId",
  "projectDisplayName",
  "packageState",
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
  "previewItems",
  "blockedItems",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_ALLOWED_FILES = Object.freeze([
  "project-shipping/p71-3-placeholder.js",
  "scripts/check-p713.js",
  "reports/p713-report.md",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "artifacts/project-release/**",
  "providers/**",
  "tool-governance/adapters/**",
  "worker-runtime/workerRunner.js",
  "worker-runtime/queueRunner.js",
  "db/**",
  "prisma/**",
  "deploy/**",
  "release/**",
  "scripts/export*.js",
  "scripts/package*.js",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function previewItemsFromManifest(manifest) {
  return manifest.shippingItems.map((item) => ({
    label: item.label,
    contentClass: item.contentClass,
    packageAction: "preview_only",
    rawPathVisible: false,
    requiresRedaction: item.requiresRedaction === true,
  }));
}

export function createExportPackagePreview(input = {}) {
  const manifest = input.manifest || createProjectShippingManifest(input);
  const manifestValidation = validateProjectShippingManifest(manifest);
  return {
    packagePreviewId: input.packagePreviewId || "export-package-preview",
    shippingId: manifest.shippingId,
    projectDisplayName: manifest.projectDisplayName,
    packageState: input.packageState || "preview_ready_for_review",
    artifactCreated: false,
    allowedFiles: normalizeList(input.allowedFiles).length > 0 ? normalizeList(input.allowedFiles) : [...DEFAULT_ALLOWED_FILES],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
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
    disabledReason: "P71.3 creates export package previews only; no package artifact is created and export execution remains disabled.",
    blockers: [
      "Package artifact creation is disabled.",
      "Export execution and project mutation are disabled.",
      "Raw project paths, private IDs, raw evidence, secrets, and NEXUS internals are blocked.",
      "Provider/tool/worker execution, DB writes, network calls, deploy/release execution, and provider spend remain disabled.",
      ...(manifestValidation.valid ? [] : manifestValidation.errors),
      ...normalizeList(input.blockers),
    ],
    previewItems: previewItemsFromManifest(manifest),
    blockedItems: [
      "NEXUS OS internals",
      "Raw evidence, audit, and activity",
      "Secrets and local runtime state",
      "DemoApp data outside demo mode",
    ],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p713-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P71.3"])],
    costImpact: "No provider calls, package artifact creation, export execution, network calls, deploy/release execution, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.exportPackagePreview",
    nextAction: input.nextAction || "Route this package preview through P71.4 shipping readiness gate.",
    commandCenterVisible: true,
  };
}

export function validateExportPackagePreview(preview = {}) {
  const errors = [];
  for (const field of P71_3_REQUIRED_FIELDS) {
    if (!(field in preview)) errors.push(`missing ${field}`);
  }
  if (preview.artifactCreated !== false) errors.push("artifactCreated must be false");
  if (preview.exportAllowed !== false || preview.packageCreationAllowed !== false) errors.push("export/package execution must be disabled");
  if (preview.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (preview.providerDispatchAllowed !== false || preview.toolExecutionAllowed !== false || preview.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (preview.dbWritesAllowed !== false || preview.networkCallsAllowed !== false || preview.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (preview.deployExecutionAllowed !== false || preview.releaseExecutionAllowed !== false) errors.push("deploy/release execution must be false");
  if (!Array.isArray(preview.forbiddenFiles) || !preview.forbiddenFiles.includes("projects/**") || !preview.forbiddenFiles.includes("artifacts/project-release/**")) errors.push("forbiddenFiles must include project and artifact paths");
  if (!Array.isArray(preview.previewItems) || preview.previewItems.length < 3) errors.push("previewItems must be visible");
  if (preview.previewItems.some((item) => item.rawPathVisible !== false || item.packageAction !== "preview_only")) errors.push("previewItems must hide paths and stay preview-only");
  if (!Array.isArray(preview.blockedItems) || preview.blockedItems.length < 3) errors.push("blockedItems must be visible");
  if (!preview.disabledReason || /package now|export now|ship now|deploy now|release now|execute now/i.test(preview.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildExportPackagePreviewEnvelope(input = {}) {
  const preview = createExportPackagePreview(input);
  return createPassResult({
    phase: "P71.3",
    mode: "preview-only",
    source: "project-shipping/p71-3-placeholder.js",
    summary: "Export package preview recorded without creating package artifacts or enabling export execution.",
    data: { preview },
    evidence: preview.evidenceRefs,
  });
}

export const P71_3_SAMPLE_PREVIEWS = Object.freeze([
  createExportPackagePreview({
    evidenceRefs: ["reports/p713-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P71.3"],
  }),
]);
