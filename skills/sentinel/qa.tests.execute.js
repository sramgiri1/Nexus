// skills/sentinel/qa.tests.execute.js
// Run XCTest suite via xcodebuild. Returns PASS/FAIL with test counts.

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);
const ROOT = process.cwd();

export async function execute({ scheme = "CareLoop", destination = "iPhone 16", project = "careloop" } = {}) {
  const iosDir = path.join(ROOT, "projects", `${project}-ios`);

  let stdout = "";
  let stderr = "";
  try {
    const res = await execAsync(
      `cd "${iosDir}" && xcodebuild test \
        -scheme "${scheme}" \
        -destination 'platform=iOS Simulator,name=${destination}' \
        -resultBundlePath /tmp/nexus-xctest-results \
        2>&1 | tail -60`,
      { timeout: 300000 }
    );
    stdout = res.stdout;
    stderr = res.stderr;
  } catch (e) {
    stdout = e.stdout || "";
    stderr = e.stderr || e.message;
  }

  const combined = stdout + stderr;
  const passed  = (combined.match(/Test Case .* passed/g) || []).length;
  const failed  = (combined.match(/Test Case .* failed/g) || []).length;
  const errored = combined.includes("BUILD FAILED") || combined.includes("xcodebuild: error:");

  const issues = [];
  if (errored) issues.push({ severity: "error", message: "xcodebuild BUILD FAILED — check that project.yml was regenerated via xcodegen" });
  if (failed > 0) {
    const failLines = combined.split("\n").filter(l => l.includes("failed"));
    failLines.slice(0, 10).forEach(l => issues.push({ severity: "error", message: l.trim() }));
  }

  const result = (failed === 0 && !errored) ? "PASS" : "FAIL";
  return {
    result,
    issues,
    summary: errored
      ? "Build error — run: cd projects/careloop-ios && xcodegen generate first"
      : `${passed} passed, ${failed} failed`,
  };
}
