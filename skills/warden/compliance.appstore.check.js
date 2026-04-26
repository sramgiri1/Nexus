// skills/warden/compliance.appstore.check.js
// Validate App Store metadata character limits and content rules.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

const LIMITS = {
  name:        { max: 30,   label: "App name" },
  subtitle:    { max: 30,   label: "Subtitle" },
  promotional: { max: 170,  label: "Promotional text" },
  description: { max: 4000, label: "Description" },
};

const FORBIDDEN_CLAIMS = [
  { pattern: /hipaa compliant|hipaa certified/i, label: "HIPAA compliance claim (CareLoop is not HIPAA-covered)" },
  { pattern: /fda approved|fda cleared/i,        label: "FDA approval claim" },
  { pattern: /cure|treat|diagnose|prescri/i,     label: "Medical claims (prohibited)" },
  { pattern: /best app|#1 app|\bnumber one\b/i,  label: "Superlative claim without evidence" },
];

export async function execute({ project = "careloop" } = {}) {
  const issues = [];
  const metaPath = path.join(ROOT, "projects", project, "docs", "marketing", "app-store.md");

  let content = "";
  try {
    content = await fs.readFile(metaPath, "utf8");
  } catch {
    return {
      result: "FAIL",
      issues: [{ severity: "warning", message: `app-store.md not found at ${metaPath} — run BEACON to generate it` }],
      summary: "App Store metadata not yet written",
    };
  }

  // Extract fields by common markdown patterns
  const extract = (label) => {
    const re = new RegExp(`(?:^|\\n)(?:#{1,3}\\s*)?${label}[:\\s]*\\n?([^\\n#]{1,500})`, "i");
    const m  = content.match(re);
    return m ? m[1].trim() : null;
  };

  const fields = {
    name:        extract("app name") || extract("name"),
    subtitle:    extract("subtitle"),
    promotional: extract("promotional"),
    description: extract("description"),
  };

  // Check character limits
  for (const [field, { max, label }] of Object.entries(LIMITS)) {
    const val = fields[field];
    if (!val) {
      issues.push({ severity: "warning", message: `${label} not found in app-store.md` });
    } else if (val.length > max) {
      issues.push({ severity: "error", message: `${label} is ${val.length} chars (limit: ${max}) — trim by ${val.length - max} chars` });
    }
  }

  // Check forbidden claims in the whole doc
  for (const { pattern, label } of FORBIDDEN_CLAIMS) {
    if (pattern.test(content)) {
      issues.push({ severity: "error", message: `Forbidden claim: ${label}` });
    }
  }

  const hasErrors = issues.some(i => i.severity === "error");
  return {
    result: hasErrors ? "FAIL" : "PASS",
    issues,
    summary: hasErrors
      ? `App Store metadata has ${issues.filter(i => i.severity === "error").length} issues`
      : "App Store metadata passes all checks",
  };
}
