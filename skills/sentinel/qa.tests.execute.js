// skills/sentinel/qa.tests.execute.js
// Run XCTest suite via xcodebuild. Returns PASS/FAIL with test counts.

import path from "path";
import fs from "fs/promises";
import { execWithXcode, listAvailableIOSDevices, resolveDeveloperDir } from "./xcode.js";

const ROOT = process.cwd();

export async function execute({ scheme = "CareLoop", destination = "iPhone 16", project = "careloop" } = {}) {
  const iosDir = path.join(ROOT, "projects", `${project}-ios`);
  const developerDir = await resolveDeveloperDir();
  if (!developerDir) {
    return {
      result: "FAIL",
      issues: [{ severity: "error", message: "Full Xcode not found. Install Xcode.app or set DEVELOPER_DIR." }],
      summary: "Xcode developer dir missing",
    };
  }
  let resolvedDestination = destination;
  let resolvedUdid = "";
  try {
    const available = await listAvailableIOSDevices();
    const exact = available.find((d) => d.name === destination);
    const fallback = available.find((d) => d.name.includes("iPhone")) || available[0];
    if (exact) {
      resolvedDestination = exact.name;
      resolvedUdid = exact.udid;
    } else if (fallback) {
      resolvedDestination = fallback.name;
      resolvedUdid = fallback.udid;
    }
  } catch {}

  let stdout = "";
  let stderr = "";
  const resultBundlePath = `/tmp/nexus-xctest-results-${process.pid}`;
  const destinationArg = resolvedUdid
    ? `id=${resolvedUdid}`
    : `platform=iOS Simulator,name=${resolvedDestination}`;
  try {
    if (resolvedUdid) {
      try {
        await execWithXcode(`xcrun simctl boot "${resolvedUdid}"`, { timeout: 30000 });
      } catch {}
      try {
        await execWithXcode(`xcrun simctl bootstatus "${resolvedUdid}" -b`, { timeout: 120000 });
      } catch {}
    }
    await execWithXcode("xcodegen generate", { timeout: 120000, cwd: iosDir });
    await fs.rm(resultBundlePath, { recursive: true, force: true });
    await fs.rm(`${resultBundlePath}.xcresult`, { recursive: true, force: true });
    const res = await execWithXcode(
      `xcodebuild test -project "CareLoop.xcodeproj" -scheme "${scheme}" -destination '${destinationArg}' -resultBundlePath "${resultBundlePath}"`,
      { timeout: 300000, cwd: iosDir }
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
  const executedMatches = [...combined.matchAll(/Executed\s+(\d+)\s+tests?/g)].map((match) => Number(match[1]));
  const executed = Math.max(...executedMatches, passed + failed);
  const errored = combined.includes("BUILD FAILED")
    || combined.includes("xcodebuild: error:")
    || combined.includes("Testing failed:")
    || combined.includes("** TEST FAILED **")
    || combined.includes("operation never finished bootstrapping");
  const noTestsRan = executed === 0;

  const issues = [];
  if (resolvedDestination !== destination) {
    issues.push({ severity: "warning", message: `Simulator "${destination}" not found. Tests ran against "${resolvedDestination}".` });
  }
  if (combined.includes("Existing file at -resultBundlePath")) {
    issues.push({ severity: "error", message: `xcodebuild result bundle path already existed: ${resultBundlePath}.xcresult` });
  }
  if (errored) issues.push({ severity: "error", message: "xcodebuild BUILD FAILED — check that project.yml was regenerated via xcodegen" });
  if (noTestsRan) {
    issues.push({ severity: "error", message: "xcodebuild reported zero executed tests. Sentinel will not mark this as PASS." });
  }
  if (failed > 0) {
    const failLines = combined.split("\n").filter(l => l.includes("failed"));
    failLines.slice(0, 10).forEach(l => issues.push({ severity: "error", message: l.trim() }));
  }

  const result = (failed === 0 && !errored && !noTestsRan) ? "PASS" : "FAIL";
  return {
    result,
    issues,
    summary: errored
      ? "Build error — run: cd projects/careloop-ios && xcodegen generate first"
      : `${passed} passed, ${failed} failed, ${executed} executed`,
  };
}
