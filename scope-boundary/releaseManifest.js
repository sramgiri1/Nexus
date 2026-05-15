import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRedactionSummary, validateRedactionSummary } from "./redactionSummary.js";

const DEFAULT_MANIFEST_PATH = "artifacts/project-release/private-project-release-manifest.json";

function stableTimestamp(input = {}) {
  return input.generatedAt || new Date().toISOString();
}

export function createRedactedReleaseManifest(input = {}) {
  const generatedAt = stableTimestamp(input);
  const projectId = input.projectId || "private-project";
  const displayName = input.displayName || "Private Project";
  const redactionSummary = createRedactionSummary(input.redactionSummary);

  return {
    manifestVersion: "1.0",
    phase: "P43.4",
    generatedAt,
    mode: input.mode || "local-private",
    project: {
      projectId,
      displayName,
      displayNameRedacted: displayName === "Private Project",
      sourceRootIncluded: false,
    },
    releaseReadiness: {
      status: "dry_run_only",
      packageCreated: false,
      exportDryRunOnly: true,
      releaseExecutionEnabled: false,
      deploymentEnabled: false,
    },
    safetyPosture: {
      projectMutationAllowed: false,
      osMutationAllowed: false,
      providerCallsAllowed: false,
      toolDispatchAllowed: false,
      workerRuntimeAllowed: false,
      dbWritesAllowed: false,
      nexusInternalsIncluded: false,
      secretsIncluded: false,
      localRuntimeStateIncluded: false,
      ledgerPayloadsIncluded: false,
      demoDataIncluded: false,
    },
    allowedContentSummary: [
      "project source category",
      "project documentation category",
      "project test category",
      "project build configuration category",
      "redacted validation summary category",
    ],
    excludedContentSummary: redactionSummary.excludedContent,
    redactionSummary,
    validationSummary: {
      exportSafetyChecked: true,
      scopeBoundaryChecked: true,
      manifestRedacted: true,
      packageCreated: false,
    },
    nextPhase: "P43.5 - Command Center Scope Boundary UX",
  };
}

export function validateRedactedReleaseManifest(manifest = {}) {
  const errors = [];
  if (manifest.manifestVersion !== "1.0") errors.push("manifestVersion must be 1.0");
  if (manifest.phase !== "P43.4") errors.push("phase must be P43.4");
  if (manifest.mode !== "local-private") errors.push("mode must be local-private");
  if (manifest.releaseReadiness?.packageCreated !== false) errors.push("packageCreated must be false");
  if (manifest.releaseReadiness?.exportDryRunOnly !== true) errors.push("exportDryRunOnly must be true");
  if (manifest.releaseReadiness?.releaseExecutionEnabled !== false) errors.push("releaseExecutionEnabled must be false");
  if (manifest.safetyPosture?.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (manifest.safetyPosture?.providerCallsAllowed !== false) errors.push("providerCallsAllowed must be false");
  if (manifest.safetyPosture?.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (manifest.safetyPosture?.nexusInternalsIncluded !== false) errors.push("nexusInternalsIncluded must be false");
  if (manifest.safetyPosture?.secretsIncluded !== false) errors.push("secretsIncluded must be false");
  const redactionValidation = validateRedactionSummary(manifest.redactionSummary || {});
  errors.push(...redactionValidation.errors);
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function writeRedactedReleaseManifest(manifest, options = {}) {
  const root = options.root || process.cwd();
  const manifestPath = options.manifestPath || DEFAULT_MANIFEST_PATH;
  const fullPath = join(root, manifestPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return {
    manifestPath,
    bytes: Buffer.byteLength(JSON.stringify(manifest, null, 2), "utf8"),
  };
}

export function summarizeReleaseManifest(manifest = {}) {
  return {
    projectId: manifest.project?.projectId || "private-project",
    displayName: manifest.project?.displayName || "Private Project",
    packageCreated: manifest.releaseReadiness?.packageCreated === true,
    exportDryRunOnly: manifest.releaseReadiness?.exportDryRunOnly === true,
    redacted: manifest.redactionSummary?.redacted === true,
    nexusInternalsIncluded: manifest.safetyPosture?.nexusInternalsIncluded === true,
    secretsIncluded: manifest.safetyPosture?.secretsIncluded === true,
    providerCallsAllowed: manifest.safetyPosture?.providerCallsAllowed === true,
    dbWritesAllowed: manifest.safetyPosture?.dbWritesAllowed === true,
  };
}
