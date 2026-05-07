import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";
import {
  getNexusMode,
  isLocalPrivateMode,
  validatePrivateProjectAccess,
} from "../private-mode/index.js";

const IOS_ROOT = "projects/careloop-ios";
const PROJECT_ID = "careloop-ios";

function requireAllowedMode(mode) {
  return isLocalPrivateMode(mode) || mode === "test";
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

export function detectCareLoopIosStructure(root) {
  const absoluteRoot = path.isAbsolute(root) ? root : path.join(getRepoRoot(), root);

  const entries = safeReadDir(absoluteRoot);

  const hasXcodeproj = entries.some((entry) => entry.endsWith(".xcodeproj"));
  const hasXcworkspace = entries.some((entry) => entry.endsWith(".xcworkspace"));
  const hasPackageSwift = entries.includes("Package.swift");
  const hasPodfile = entries.includes("Podfile");
  const hasProjectYml = entries.includes("project.yml");

  const sourceDirectories = entries.filter((entry) => {
    const abs = path.join(absoluteRoot, entry);
    return (
      safeIsDirectory(abs) &&
      !entry.startsWith(".") &&
      !entry.endsWith(".xcodeproj") &&
      !entry.endsWith(".xcworkspace") &&
      entry !== "Pods" &&
      entry !== "build"
    );
  });

  const testDirectory = entries.find((entry) => {
    const abs = path.join(absoluteRoot, entry);
    return (
      safeIsDirectory(abs) &&
      (entry.endsWith("Tests") || entry.toLowerCase().includes("test"))
    );
  });

  const hasDocs = entries.includes("docs") && safeIsDirectory(path.join(absoluteRoot, "docs"));
  const hasReadme = entries.includes("README.md");

  const infoPlistPaths = [];
  for (const sourceDir of sourceDirectories) {
    const resourcesDir = path.join(absoluteRoot, sourceDir, "Resources");
    if (safeExists(resourcesDir) && safeExists(path.join(resourcesDir, "Info.plist"))) {
      infoPlistPaths.push(`${sourceDir}/Resources/Info.plist`);
    }
    if (safeExists(path.join(absoluteRoot, sourceDir, "Info.plist"))) {
      infoPlistPaths.push(`${sourceDir}/Info.plist`);
    }
  }

  return {
    xcodeproj: hasXcodeproj,
    xcworkspace: hasXcworkspace,
    packageSwift: hasPackageSwift,
    podfile: hasPodfile,
    projectYml: hasProjectYml,
    sources: sourceDirectories.length > 0,
    sourceDirectories,
    tests: Boolean(testDirectory),
    testDirectory: testDirectory ?? null,
    docs: hasDocs,
    readme: hasReadme,
    infoPlist: infoPlistPaths.length > 0,
    infoPlistPaths,
  };
}

export function summarizeCareLoopIosInventory(inventory) {
  const lines = [];
  lines.push(`iOS root: ${inventory.root}`);
  lines.push(`Exists: ${inventory.exists}`);
  if (inventory.exists) {
    lines.push(`Xcode project: ${inventory.iosProject.xcodeproj}`);
    lines.push(`Xcode workspace: ${inventory.iosProject.xcworkspace}`);
    lines.push(`Package.swift: ${inventory.iosProject.packageSwift}`);
    lines.push(`Podfile: ${inventory.iosProject.podfile}`);
    lines.push(`project.yml: ${inventory.iosProject.projectYml}`);
    lines.push(`Source directories: ${inventory.structure.sources}`);
    lines.push(`Tests: ${inventory.structure.tests}`);
    lines.push(`Docs: ${inventory.structure.docs}`);
  }
  if (inventory.warnings.length) {
    lines.push(`Warnings: ${inventory.warnings.join("; ")}`);
  }
  return lines.join("\n");
}

export function inventoryCareLoopIos(options = {}) {
  const mode = getNexusMode({ NEXUS_MODE: options.mode ?? process.env.NEXUS_MODE });
  const errors = [];
  const warnings = [];

  if (!requireAllowedMode(mode)) {
    return {
      projectId: PROJECT_ID,
      root: IOS_ROOT,
      mode,
      exists: false,
      iosProject: { xcodeproj: false, xcworkspace: false, packageSwift: false, podfile: false, projectYml: false },
      structure: { sources: false, tests: false, docs: false },
      warnings: [],
      errors: [`Mode '${mode}' does not allow private project access.`],
    };
  }

  const access = validatePrivateProjectAccess({
    projectId: PROJECT_ID,
    relativePath: IOS_ROOT,
    mode,
    purpose: "inventory",
    actor: options.actor ?? "system",
  });

  if (!access.allowed) {
    return {
      projectId: PROJECT_ID,
      root: IOS_ROOT,
      mode,
      exists: false,
      iosProject: { xcodeproj: false, xcworkspace: false, packageSwift: false, podfile: false, projectYml: false },
      structure: { sources: false, tests: false, docs: false },
      warnings: [],
      errors: [`Access denied: ${access.reason}`],
    };
  }

  const absoluteRoot = path.join(getRepoRoot(), IOS_ROOT);
  const rootExists = safeExists(absoluteRoot);

  if (!rootExists) {
    warnings.push(`iOS root does not exist: ${IOS_ROOT}`);
    return {
      projectId: PROJECT_ID,
      root: IOS_ROOT,
      mode,
      exists: false,
      iosProject: { xcodeproj: false, xcworkspace: false, packageSwift: false, podfile: false, projectYml: false },
      structure: { sources: false, tests: false, docs: false },
      warnings,
      errors,
    };
  }

  const structure = detectCareLoopIosStructure(IOS_ROOT);

  return {
    projectId: PROJECT_ID,
    root: IOS_ROOT,
    mode,
    exists: true,
    iosProject: {
      xcodeproj: structure.xcodeproj,
      xcworkspace: structure.xcworkspace,
      packageSwift: structure.packageSwift,
      podfile: structure.podfile,
      projectYml: structure.projectYml,
    },
    structure: {
      sources: structure.sources,
      sourceDirectories: structure.sourceDirectories,
      tests: structure.tests,
      testDirectory: structure.testDirectory,
      docs: structure.docs,
      readme: structure.readme,
      infoPlist: structure.infoPlist,
    },
    warnings,
    errors,
  };
}
