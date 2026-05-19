import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const P71_2_REQUIRED_FIELDS = Object.freeze([
  "shippingId",
  "projectDisplayName",
  "exportTarget",
  "manifestState",
  "redactionState",
  "allowedFiles",
  "forbiddenFiles",
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
  "shippingItems",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_ALLOWED_FILES = Object.freeze([
  "project-shipping/p71-2-placeholder.js",
  "scripts/check-p712.js",
  "reports/p712-report.md",
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

const DEFAULT_SHIPPING_ITEMS = Object.freeze([
  {
    label: "Application source bundle",
    contentClass: "project_source",
    rawPathVisible: false,
    requiresRedaction: false,
    state: "candidate_preview",
  },
  {
    label: "Product requirements document",
    contentClass: "project_docs",
    rawPathVisible: false,
    requiresRedaction: true,
    state: "candidate_preview",
  },
  {
    label: "Validation summary",
    contentClass: "redacted_evidence_summary",
    rawPathVisible: false,
    requiresRedaction: true,
    state: "candidate_preview",
  },
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasProjectPath(paths = []) {
  return normalizeList(paths).some((filePath) => filePath === "projects/**" || filePath.startsWith("projects/"));
}

function safeDisplayName(value) {
  const name = String(value || "Founder Workspace").trim();
  return /(?:project|private)_[A-Za-z0-9_-]{6,}/.test(name) ? "Founder Workspace" : name;
}

function safeShippingItems(items = DEFAULT_SHIPPING_ITEMS) {
  return items.map((item) => {
    const redaction = summarizeRedaction(item);
    return {
      label: safeDisplayName(redaction.redacted.label),
      contentClass: String(redaction.redacted.contentClass || "project_content"),
      rawPathVisible: false,
      requiresRedaction: redaction.changed || item.requiresRedaction === true,
      state: String(item.state || "candidate_preview"),
    };
  });
}

export function createProjectShippingManifest(input = {}) {
  return {
    shippingId: input.shippingId || "project-shipping-manifest-preview",
    projectDisplayName: safeDisplayName(input.projectDisplayName),
    exportTarget: input.exportTarget || "operator-reviewed project handoff",
    manifestState: input.manifestState || "ready_for_review",
    redactionState: input.redactionState || "redaction_required_before_export",
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
    disabledReason: "P71.2 records project shipping manifests only; package creation, export execution, and project mutation remain disabled.",
    blockers: [
      "Package creation is disabled.",
      "Export execution and project mutation are disabled.",
      "Raw evidence, raw audit, raw activity, private IDs, secrets, and NEXUS internals are blocked from primary UX.",
      "Provider/tool/worker execution, DB writes, network calls, deploy/release execution, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    shippingItems: safeShippingItems(input.shippingItems || DEFAULT_SHIPPING_ITEMS),
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p712-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P71.2"])],
    costImpact: "No provider calls, package creation, export execution, network calls, deploy/release execution, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.projectShippingManifestPreview",
    nextAction: input.nextAction || "Route this manifest through P71.3 export package preview.",
    commandCenterVisible: true,
  };
}

export function validateProjectShippingManifest(manifest = {}) {
  const errors = [];
  for (const field of P71_2_REQUIRED_FIELDS) {
    if (!(field in manifest)) errors.push(`missing ${field}`);
  }
  if (!manifest.shippingId || /(?:project|private)_[A-Za-z0-9_-]{6,}/.test(manifest.shippingId)) errors.push("shippingId must be display-safe");
  if (!manifest.projectDisplayName || /(?:project|private)_[A-Za-z0-9_-]{6,}/.test(manifest.projectDisplayName)) errors.push("projectDisplayName must be display-safe");
  if (!Array.isArray(manifest.allowedFiles) || manifest.allowedFiles.length === 0) errors.push("allowedFiles must be non-empty");
  if (hasProjectPath(manifest.allowedFiles)) errors.push("allowedFiles must not include project source paths");
  if (!Array.isArray(manifest.forbiddenFiles) || !manifest.forbiddenFiles.includes("projects/**")) errors.push("forbiddenFiles must include projects/**");
  if (manifest.exportAllowed !== false || manifest.packageCreationAllowed !== false) errors.push("export/package execution must be disabled");
  if (manifest.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (manifest.providerDispatchAllowed !== false || manifest.toolExecutionAllowed !== false || manifest.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (manifest.dbWritesAllowed !== false || manifest.networkCallsAllowed !== false || manifest.providerSpendAllowed !== false) errors.push("db/network/spend must be false");
  if (manifest.deployExecutionAllowed !== false || manifest.releaseExecutionAllowed !== false) errors.push("deploy/release execution must be false");
  if (!manifest.disabledReason || /package now|export now|ship now|deploy now|release now|execute now/i.test(manifest.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(manifest.blockers) || manifest.blockers.length < 4) errors.push("blockers must be visible");
  if (!Array.isArray(manifest.shippingItems) || manifest.shippingItems.length < 3) errors.push("shippingItems must be visible");
  if (manifest.shippingItems.some((item) => item.rawPathVisible !== false)) errors.push("shippingItems must hide raw paths");
  if (!Array.isArray(manifest.evidenceRefs) || manifest.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(manifest.activityRefs) || manifest.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildProjectShippingManifestEnvelope(input = {}) {
  const manifest = createProjectShippingManifest(input);
  return createPassResult({
    phase: "P71.2",
    mode: "preview-only",
    source: "project-shipping/p71-2-placeholder.js",
    summary: "Project shipping manifest recorded without enabling package creation, export execution, or project mutation.",
    data: { manifest },
    evidence: manifest.evidenceRefs,
  });
}

export const P71_2_SAMPLE_MANIFESTS = Object.freeze([
  createProjectShippingManifest({
    evidenceRefs: ["reports/p712-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P71.2"],
  }),
]);
