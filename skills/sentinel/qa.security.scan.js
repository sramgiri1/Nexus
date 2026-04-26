// skills/sentinel/qa.security.scan.js
// Scan source files for hardcoded secrets, tracked .env files, and API keys in iOS binary.

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const ROOT = process.cwd();

const SECRET_PATTERNS = [
  { pattern: "API_KEY\\s*=\\s*[\"'][^\"']{8,}", label: "Hardcoded API key" },
  { pattern: "password\\s*=\\s*[\"'][^\"']{4,}", label: "Hardcoded password" },
  { pattern: "sk-[a-zA-Z0-9]{20,}", label: "OpenAI secret key" },
  { pattern: "APNS_KEY\\s*=\\s*[\"'][^\"']+", label: "Hardcoded APNs key" },
  { pattern: "resend_[a-zA-Z0-9_]{20,}", label: "Resend API key" },
];

async function grepSource(pattern, dir) {
  try {
    const { stdout } = await execAsync(
      `grep -rn "${pattern}" "${dir}" --include="*.js" --include="*.ts" --include="*.swift" --exclude-dir=node_modules 2>/dev/null | head -5 || true`,
      { timeout: 15000 }
    );
    return stdout.trim().split("\n").filter(Boolean);
  } catch { return []; }
}

export async function execute({ project = "careloop" } = {}) {
  const issues = [];
  const projectDir = path.join(ROOT, "projects", project);
  const iosDir     = path.join(ROOT, "projects", `${project}-ios`);

  // Check if .env is tracked in git
  try {
    const { stdout } = await execAsync(`git -C "${ROOT}" ls-files projects/${project}/.env 2>/dev/null || true`, { timeout: 10000 });
    if (stdout.trim()) issues.push({ severity: "error", message: `.env file is tracked by git in ${project} — run: git rm --cached projects/${project}/.env` });
  } catch {}

  // Scan for secret patterns in source
  for (const { pattern, label } of SECRET_PATTERNS) {
    const hits = await grepSource(pattern, projectDir);
    const iosHits = await grepSource(pattern, iosDir);
    [...hits, ...iosHits].forEach(line => {
      // Skip .env.example files
      if (line.includes(".example")) return;
      issues.push({ severity: "error", message: `${label} detected: ${line.slice(0, 120)}` });
    });
  }

  // Check if x-api-key value is hardcoded in iOS (Sprint 3: should use JWT)
  try {
    const { stdout } = await execAsync(`grep -rn "x-api-key" "${iosDir}" --include="*.swift" 2>/dev/null || true`, { timeout: 10000 });
    const hardcoded = stdout.split("\n").filter(l => l.includes("=") && !l.includes("//") && l.includes('"'));
    if (hardcoded.length > 0) {
      issues.push({ severity: "warning", message: `x-api-key value appears hardcoded in iOS — ensure it comes from Info.plist or secure storage` });
    }
  } catch {}

  const hasErrors = issues.some(i => i.severity === "error");
  return {
    result: hasErrors ? "FAIL" : "PASS",
    issues,
    summary: `Security scan: ${issues.filter(i => i.severity === "error").length} secrets found, ${issues.filter(i => i.severity === "warning").length} warnings`,
  };
}
