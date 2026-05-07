import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";
import {
  getNexusMode,
  isLocalPrivateMode,
  validatePrivateProjectAccess,
} from "../private-mode/index.js";

const BACKEND_ROOT = "projects/careloop";
const PROJECT_ID = "careloop";

const BLOCKED_SCAN_DIRS = new Set([".git", "node_modules"]);
const BLOCKED_SCAN_FILES = new Set([".env", ".env.local", ".env.production"]);

const KNOWN_CONFIG_FILENAMES = [
  "tsconfig.json",
  "jsconfig.json",
  ".eslintrc.json",
  ".eslintrc.js",
  ".eslintrc.cjs",
  "eslint.config.js",
  ".prettierrc",
  ".prettierrc.json",
  "prettier.config.js",
  "vitest.config.js",
  "vitest.config.ts",
  "jest.config.js",
  "jest.config.ts",
  ".env.example",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

function resolveRoot() {
  return path.join(getRepoRoot(), BACKEND_ROOT);
}

function safeExists(absolutePath) {
  try {
    return fs.existsSync(absolutePath);
  } catch {
    return false;
  }
}

function safeIsDirectory(absolutePath) {
  try {
    return fs.statSync(absolutePath).isDirectory();
  } catch {
    return false;
  }
}

function safeReadDir(absolutePath) {
  try {
    return fs.readdirSync(absolutePath);
  } catch {
    return [];
  }
}

function requireAllowedMode(mode) {
  return isLocalPrivateMode(mode) || mode === "test";
}

export function readPackageSummary(relativePath) {
  const absolutePath = path.join(getRepoRoot(), relativePath);
  if (!safeExists(absolutePath)) {
    return { exists: false, name: null, scripts: [], dependencies: [], devDependencies: [] };
  }

  try {
    const raw = fs.readFileSync(absolutePath, "utf8");
    const data = JSON.parse(raw);
    return {
      exists: true,
      name: typeof data.name === "string" ? data.name : null,
      scripts: Object.keys(data.scripts ?? {}),
      dependencies: Object.keys(data.dependencies ?? {}),
      devDependencies: Object.keys(data.devDependencies ?? {}),
    };
  } catch {
    return { exists: true, name: null, scripts: [], dependencies: [], devDependencies: [], parseError: true };
  }
}

export function detectCareLoopBackendStructure(root) {
  const absoluteRoot = path.isAbsolute(root) ? root : path.join(getRepoRoot(), root);

  const check = (rel) => safeExists(path.join(absoluteRoot, rel));
  const checkDir = (rel) => safeExists(path.join(absoluteRoot, rel)) && safeIsDirectory(path.join(absoluteRoot, rel));

  const entries = safeReadDir(absoluteRoot);
  const configs = KNOWN_CONFIG_FILENAMES.filter((filename) => entries.includes(filename));

  const risks = [];
  if (check(".env")) {
    risks.push("WARNING: .env file detected — not read by inventory; remove from repo root if present");
  }

  return {
    src: checkDir("src"),
    tests: checkDir("test") || checkDir("tests"),
    docs: checkDir("docs"),
    prisma: checkDir("prisma"),
    schemaPrisma: check("prisma/schema.prisma"),
    envExample: check(".env.example"),
    readme: check("README.md"),
    configs,
    risks,
  };
}

export function summarizeCareLoopBackendInventory(inventory) {
  const lines = [];
  lines.push(`Backend root: ${inventory.root}`);
  lines.push(`Exists: ${inventory.exists}`);
  if (inventory.package.exists) {
    lines.push(`Package name: ${inventory.package.name ?? "(unknown)"}`);
    lines.push(`Scripts: ${inventory.package.scripts.join(", ") || "(none)"}`);
    lines.push(`Dependencies: ${inventory.package.dependencies.join(", ") || "(none)"}`);
  }
  lines.push(`Source dir: ${inventory.structure.src}`);
  lines.push(`Tests: ${inventory.structure.tests}`);
  lines.push(`Prisma: ${inventory.structure.prisma}, schema: ${inventory.structure.schemaPrisma}`);
  lines.push(`Docs: ${inventory.structure.docs}`);
  if (inventory.risks.length) {
    lines.push(`Risks: ${inventory.risks.join("; ")}`);
  }
  return lines.join("\n");
}

export function inventoryCareLoopBackend(options = {}) {
  const mode = getNexusMode({ NEXUS_MODE: options.mode ?? process.env.NEXUS_MODE });
  const errors = [];
  const warnings = [];

  if (!requireAllowedMode(mode)) {
    return {
      projectId: PROJECT_ID,
      root: BACKEND_ROOT,
      mode,
      exists: false,
      package: { exists: false, name: null, scripts: [], dependencies: [], devDependencies: [] },
      structure: { src: false, tests: false, docs: false, prisma: false, schemaPrisma: false, envExample: false },
      configs: [],
      risks: [],
      warnings: [],
      errors: [`Mode '${mode}' does not allow private project access.`],
    };
  }

  const access = validatePrivateProjectAccess({
    projectId: PROJECT_ID,
    relativePath: BACKEND_ROOT,
    mode,
    purpose: "inventory",
    actor: options.actor ?? "system",
  });

  if (!access.allowed) {
    return {
      projectId: PROJECT_ID,
      root: BACKEND_ROOT,
      mode,
      exists: false,
      package: { exists: false, name: null, scripts: [], dependencies: [], devDependencies: [] },
      structure: { src: false, tests: false, docs: false, prisma: false, schemaPrisma: false, envExample: false },
      configs: [],
      risks: [],
      warnings: [],
      errors: [`Access denied: ${access.reason}`],
    };
  }

  const absoluteRoot = resolveRoot();
  const rootExists = safeExists(absoluteRoot);

  if (!rootExists) {
    warnings.push(`Backend root does not exist: ${BACKEND_ROOT}`);
    return {
      projectId: PROJECT_ID,
      root: BACKEND_ROOT,
      mode,
      exists: false,
      package: { exists: false, name: null, scripts: [], dependencies: [], devDependencies: [] },
      structure: { src: false, tests: false, docs: false, prisma: false, schemaPrisma: false, envExample: false },
      configs: [],
      risks: [],
      warnings,
      errors,
    };
  }

  const packageSummary = readPackageSummary(`${BACKEND_ROOT}/package.json`);
  const structure = detectCareLoopBackendStructure(BACKEND_ROOT);

  return {
    projectId: PROJECT_ID,
    root: BACKEND_ROOT,
    mode,
    exists: true,
    package: {
      exists: packageSummary.exists,
      name: packageSummary.name,
      scripts: packageSummary.scripts,
      dependencies: packageSummary.dependencies,
      devDependencies: packageSummary.devDependencies,
    },
    structure: {
      src: structure.src,
      tests: structure.tests,
      docs: structure.docs,
      prisma: structure.prisma,
      schemaPrisma: structure.schemaPrisma,
      envExample: structure.envExample,
    },
    configs: structure.configs,
    risks: structure.risks,
    warnings,
    errors,
  };
}
