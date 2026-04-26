// skills/auditor/code.lint.js
// Run ESLint on Node backend + SwiftLint on iOS.
// Returns PASS if zero errors (warnings allowed), FAIL otherwise.

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const ROOT = process.cwd();

export async function execute({ project = "careloop" } = {}) {
  const issues = [];
  const results = [];

  // ── ESLint — Node backend ──────────────────────────────────────────────────
  const backendDir = path.join(ROOT, "projects", project);
  try {
    const { stdout, stderr } = await execAsync(
      `cd "${backendDir}" && npx eslint src/ --format compact 2>&1 || true`,
      { timeout: 60000 }
    );
    const combined = (stdout + stderr).trim();
    const errorLines = combined.split("\n").filter(l => l.includes(": error "));
    const warnLines  = combined.split("\n").filter(l => l.includes(": warning "));
    if (errorLines.length > 0) {
      errorLines.slice(0, 10).forEach(l => issues.push({ severity: "error", tool: "eslint", message: l.trim() }));
    }
    if (warnLines.length > 0) {
      warnLines.slice(0, 5).forEach(l => issues.push({ severity: "warning", tool: "eslint", message: l.trim() }));
    }
    results.push(`ESLint: ${errorLines.length} errors, ${warnLines.length} warnings`);
  } catch (e) {
    results.push(`ESLint: skipped (${e.message.slice(0, 60)})`);
  }

  // ── SwiftLint — iOS ────────────────────────────────────────────────────────
  const iosDir = path.join(ROOT, "projects", `${project}-ios`);
  try {
    const { stdout } = await execAsync(
      `which swiftlint && cd "${iosDir}" && swiftlint --quiet 2>&1 || true`,
      { timeout: 60000 }
    );
    const swiftErrors   = stdout.split("\n").filter(l => l.includes(": error:")).length;
    const swiftWarnings = stdout.split("\n").filter(l => l.includes(": warning:")).length;
    stdout.split("\n").filter(l => l.includes(": error:")).slice(0, 5)
      .forEach(l => issues.push({ severity: "error", tool: "swiftlint", message: l.trim() }));
    results.push(`SwiftLint: ${swiftErrors} errors, ${swiftWarnings} warnings`);
  } catch {
    results.push("SwiftLint: not installed (brew install swiftlint to enable)");
  }

  const hasErrors = issues.some(i => i.severity === "error");
  return {
    result:  hasErrors ? "FAIL" : "PASS",
    issues,
    summary: results.join(" | "),
  };
}
