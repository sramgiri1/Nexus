// skills/warden/compliance.privacy.check.js
// Verify privacy.html contains all required sections for FTC compliance.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

const REQUIRED_SECTIONS = [
  { label: "Data collected section",        pattern: /data collected|information we collect/i },
  { label: "FTC Health Breach Rule mention", pattern: /ftc|health breach notification/i },
  { label: "Contact email",                  pattern: /suchethram@gmail\.com|contact us/i },
  { label: "No clinic integration statement",pattern: /clinic|healthcare provider|hipaa/i },
  { label: "Data retention",                 pattern: /retention|how long|delete/i },
  { label: "Third-party services",           pattern: /third.party|resend|railway|apns|apple/i },
];

export async function execute({ project = "careloop" } = {}) {
  const issues = [];
  const privacyPath = path.join(ROOT, "projects", project, "docs", "privacy.html");

  let content = "";
  try {
    content = await fs.readFile(privacyPath, "utf8");
  } catch {
    return {
      result: "FAIL",
      issues: [{ severity: "error", message: `privacy.html not found at ${privacyPath}` }],
      summary: "privacy.html missing — run CANVAS to generate it",
    };
  }

  for (const { label, pattern } of REQUIRED_SECTIONS) {
    if (!pattern.test(content)) {
      issues.push({ severity: "warning", message: `Missing section: ${label}` });
    }
  }

  // Verify no HIPAA claim (we use FTC rule, not HIPAA)
  if (/hipaa compliant|hipaa certified/i.test(content)) {
    issues.push({ severity: "error", message: "privacy.html incorrectly claims HIPAA compliance — CareLoop is under FTC Health Breach Rule, not HIPAA" });
  }

  const hasErrors = issues.some(i => i.severity === "error");
  const missing   = issues.filter(i => i.severity === "warning").length;
  return {
    result: hasErrors ? "FAIL" : (missing > 0 ? "PASS" : "PASS"),
    issues,
    summary: hasErrors
      ? "Privacy policy has compliance errors"
      : missing > 0
        ? `Privacy policy found but missing ${missing} section(s)`
        : "Privacy policy complete — all required sections present",
  };
}
