import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";
import {
  loadPrivateProjectAllowlist,
  validatePrivateProjectAccess,
} from "./privateProjectPolicy.js";
import { getNexusMode, isLocalPrivateMode } from "./privateMode.js";

const PUBLIC_SURFACE_FILES = [
  "README.md",
  "docs/demo-walkthrough.md",
  "docs/safety-model.md",
  "docs/use-cases.md",
  "docs/roadmap.md",
  "docs/PUBLIC_REPO_BOUNDARY.md",
  "docs/architecture/DEMO_SHOWCASE_MODE.md",
  "docs/architecture/AGENTIC_OS_ARCHITECTURE.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md",
  "docs/architecture/LOCAL_STATE_ADAPTER.md",
  "docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md",
  "dashboard/src/App.jsx",
  "dashboard/src/data/studio.js",
  "dashboard/src/pages/CommandCenter.jsx",
  "dashboard/src/hooks/useStudioData.js",
  "dashboard/tests/routes.spec.js",
  "demo/README.md",
  "demo/scenarios/demoapp-sprint.json",
  "demo/reports/release-decision.json",
  "demo/reports/showcase-summary.json",
];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAllowlistEntries() {
  const allowlist = loadPrivateProjectAllowlist();
  return allowlist.ok ? allowlist.entries : [];
}

function buildPrivateProjectPatterns() {
  const entries = getAllowlistEntries();
  const projectNames = [
    ...new Set(
      entries.flatMap((entry) => [
        normalizeString(entry.projectId),
        normalizeString(entry.root).split("/").filter(Boolean).at(-1) || "",
      ])
    ),
  ].filter(Boolean);

  return projectNames.map(
    (projectName) => new RegExp(escapeRegExp(projectName), "i")
  );
}

function readTopLevelInventory(relativeRoot) {
  const repoRoot = getRepoRoot();
  const absoluteRoot = path.join(repoRoot, relativeRoot);

  if (!fs.existsSync(absoluteRoot)) {
    return {
      exists: false,
      topLevelEntries: 0,
      topLevelDirectories: 0,
      topLevelFiles: 0,
    };
  }

  const entries = fs.readdirSync(absoluteRoot, { withFileTypes: true });
  return {
    exists: true,
    topLevelEntries: entries.length,
    topLevelDirectories: entries.filter((entry) => entry.isDirectory()).length,
    topLevelFiles: entries.filter((entry) => entry.isFile()).length,
  };
}

export function listAllowedPrivateProjects(mode) {
  const resolvedMode = getNexusMode({ NEXUS_MODE: mode });
  const allowlist = loadPrivateProjectAllowlist();
  if (!allowlist.ok) {
    return [];
  }

  if (!isLocalPrivateMode(resolvedMode) && resolvedMode !== "test") {
    return [];
  }

  return allowlist.entries
    .filter(
      (entry) =>
        Array.isArray(entry.allowedModes) &&
        entry.allowedModes.includes(resolvedMode)
    )
    .map((entry) => ({
      projectId: normalizeString(entry.projectId),
      root: normalizeString(entry.root),
      allowedPurposes: Array.isArray(entry.allowedPurposes)
        ? [...entry.allowedPurposes]
        : [],
    }));
}

export function scanPrivateProjectBoundary(options = {}) {
  const mode = getNexusMode({ NEXUS_MODE: options.mode });
  const warnings = [];
  const errors = [];
  const allowedProjects = listAllowedPrivateProjects(mode);

  if (!isLocalPrivateMode(mode) && mode !== "test") {
    warnings.push(
      "Private project inventory is disabled outside local-private and test modes."
    );
    return {
      mode,
      allowedProjects: [],
      scannedProjects: [],
      warnings,
      errors,
    };
  }

  const scannedProjects = allowedProjects.map((entry) => {
    const access = validatePrivateProjectAccess({
      projectId: entry.projectId,
      relativePath: entry.root,
      mode,
      purpose: "inventory",
      actor: options.actor || "system",
    });

    if (!access.allowed) {
      errors.push(
        `Inventory access was denied for ${entry.projectId}: ${access.reason}`
      );
    }

    return {
      projectId: entry.projectId,
      root: entry.root,
      ...readTopLevelInventory(entry.root),
      allowedPurposes: entry.allowedPurposes,
    };
  });

  return {
    mode,
    allowedProjects,
    scannedProjects,
    warnings,
    errors,
  };
}

export function validateNoPrivateLeakageInPublicMode() {
  const warnings = [];
  const errors = [];
  const patterns = buildPrivateProjectPatterns();

  for (const relativePath of PUBLIC_SURFACE_FILES) {
    const absolutePath = path.join(getRepoRoot(), relativePath);
    if (!fs.existsSync(absolutePath)) {
      warnings.push(`Public surface file missing during scan: ${relativePath}`);
      continue;
    }

    const text = fs.readFileSync(absolutePath, "utf8");
    if (patterns.some((pattern) => pattern.test(text))) {
      errors.push(
        `Private project reference detected in public/demo surface: ${relativePath}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    scannedFiles: [...PUBLIC_SURFACE_FILES],
    errors,
    warnings,
  };
}
