// skills/warden/compliance.permissions.validate.js
// Verify Info.plist has required NSUsageDescription keys for all requested permissions.

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const ROOT = process.cwd();

const PERMISSION_RULES = [
  { key: "NSUserNotificationsUsageDescription", trigger: /UNUserNotificationCenter|requestAuthorization/i, label: "Push notifications" },
  { key: "NSCameraUsageDescription",            trigger: /AVCaptureSession|UIImagePickerController/i,      label: "Camera" },
  { key: "NSPhotoLibraryUsageDescription",      trigger: /PHPhotoLibrary|UIImagePickerController/i,        label: "Photo library" },
  { key: "NSLocationWhenInUseUsageDescription", trigger: /CLLocationManager/i,                             label: "Location" },
];

export async function execute({ project = "careloop" } = {}) {
  const issues = [];
  const iosRoot = path.join(ROOT, "projects", `${project}-ios`);
  const appDirCandidates = [
    path.join(iosRoot, "CareLoop"),
    path.join(iosRoot, project.charAt(0).toUpperCase() + project.slice(1)),
  ];
  const iosDir = await firstExistingDir(appDirCandidates);
  if (!iosDir) {
    return {
      result: "FAIL",
      issues: [{ severity: "error", message: `iOS app source directory not found under ${iosRoot}` }],
      summary: "iOS app directory missing",
    };
  }

  // Read Info.plist
  let plist = "";
  const plistCandidates = [
    path.join(iosDir, "Resources", "Info.plist"),
    path.join(iosDir, "Info.plist"),
  ];
  const plistPath = await firstExistingFile(plistCandidates);
  try {
    plist = await fs.readFile(plistPath, "utf8");
  } catch {
    return {
      result: "FAIL",
      issues: [{ severity: "error", message: `Info.plist not found at ${plistPath}` }],
      summary: "Info.plist missing",
    };
  }

  // Read all Swift source files
  let sourceContent = "";
  try {
    const { stdout } = await execAsync(`find "${iosDir}" -name "*.swift" -exec cat {} \\; 2>/dev/null`, { timeout: 15000 });
    sourceContent = stdout;
  } catch {}

  for (const { key, trigger, label } of PERMISSION_RULES) {
    const usedInCode = trigger.test(sourceContent);
    const inPlist    = plist.includes(key);

    if (usedInCode && !inPlist) {
      issues.push({ severity: "error", message: `${label} used in code but ${key} missing from Info.plist — App Store will reject` });
    }
    if (!usedInCode && inPlist) {
      issues.push({ severity: "warning", message: `${key} declared in Info.plist but no usage found in Swift source` });
    }
  }

  // Check all NSXxx keys have non-empty descriptions
  const emptyDesc = plist.match(/NS\w+UsageDescription<\/key>\s*<string>\s*<\/string>/g) || [];
  emptyDesc.forEach(m => {
    issues.push({ severity: "error", message: `Empty usage description: ${m.slice(0, 60)} — App Store will reject` });
  });

  const hasErrors = issues.some(i => i.severity === "error");
  return {
    result: hasErrors ? "FAIL" : "PASS",
    issues,
    summary: hasErrors ? `${issues.filter(i => i.severity === "error").length} permission errors` : "All permission keys validated",
  };
}

async function firstExistingDir(paths) {
  for (const p of paths) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) return p;
    } catch {}
  }
  return null;
}

async function firstExistingFile(paths) {
  for (const p of paths) {
    try {
      const stat = await fs.stat(p);
      if (stat.isFile()) return p;
    } catch {}
  }
  return paths[0];
}
