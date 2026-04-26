// skills/auditor/code.test_coverage.js
// Verify test files exist and report test function counts.

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const ROOT = process.cwd();

async function countMatches(pattern, dir, ext) {
  try {
    const { stdout } = await execAsync(
      `grep -rn "${pattern}" "${dir}" --include="${ext}" 2>/dev/null | wc -l`,
      { timeout: 10000 }
    );
    return parseInt(stdout.trim(), 10) || 0;
  } catch { return 0; }
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function execute({ project = "careloop" } = {}) {
  const issues = [];
  const report = [];

  // ── Backend: check for test files ─────────────────────────────────────────
  const backendTestDir = path.join(ROOT, "projects", project, "test");
  const backendHasTests = await exists(backendTestDir);
  if (!backendHasTests) {
    issues.push({ severity: "warning", message: `No test/ directory found in ${project} backend` });
    report.push("Backend: no tests");
  } else {
    const count = await countMatches("it(|test(|describe(", backendTestDir, "*.js");
    report.push(`Backend: ~${count} test cases`);
    if (count === 0) issues.push({ severity: "warning", message: "Backend test directory exists but no test functions found" });
  }

  // ── iOS: check for XCTest files ───────────────────────────────────────────
  const iosTestDir = path.join(ROOT, "projects", `${project}-ios`, `${project.charAt(0).toUpperCase() + project.slice(1)}Tests`);
  const iosHasTests = await exists(iosTestDir);
  if (!iosHasTests) {
    issues.push({ severity: "warning", message: `No XCTest target directory found at ${iosTestDir}` });
    report.push("iOS: no tests");
  } else {
    const count = await countMatches("func test_", iosTestDir, "*.swift");
    report.push(`iOS: ${count} XCTest functions`);
    if (count === 0) issues.push({ severity: "warning", message: "iOS test directory exists but no test functions found" });
  }

  // PASS even with only warnings — no tests is a warning, not a blocker in Sprint 1-2
  const hasErrors = issues.some(i => i.severity === "error");
  return {
    result: hasErrors ? "FAIL" : "PASS",
    issues,
    summary: report.join(" | "),
  };
}
