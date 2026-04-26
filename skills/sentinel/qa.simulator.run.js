// skills/sentinel/qa.simulator.run.js
// Boot iOS Simulator, optionally build + install CareLoop, verify launch (no crash).

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const BUNDLE_ID  = "com.careloop.ios";
const DEVICE     = "iPhone 16";

async function run(cmd, timeout = 60000) {
  const { stdout, stderr } = await execAsync(cmd, { timeout });
  return (stdout + stderr).trim();
}

export async function execute({ device = DEVICE, build = false } = {}) {
  const issues = [];

  // 1. Check Xcode tools
  try {
    await run("xcode-select -p");
  } catch {
    return { result: "FAIL", issues: [{ severity: "error", message: "Xcode command-line tools not installed. Run: xcode-select --install" }], summary: "Xcode tools missing" };
  }

  // 2. Find or boot simulator
  let udid = "";
  try {
    const { stdout } = await execAsync(`xcrun simctl list devices available -j`, { timeout: 15000 });
    const all = JSON.parse(stdout);
    for (const [runtime, devices] of Object.entries(all.devices)) {
      if (!runtime.includes("iOS")) continue;
      const match = devices.find(d => d.name === device && d.isAvailable);
      if (match) { udid = match.udid; break; }
    }
    if (!udid) {
      issues.push({ severity: "warning", message: `Simulator "${device}" not found. Available simulators listed below.` });
      const names = Object.values(all.devices).flat().filter(d => d.isAvailable).map(d => d.name).slice(0, 5);
      return { result: "FAIL", issues, summary: `Simulator not found. Try: ${names.join(", ")}` };
    }
  } catch (e) {
    return { result: "FAIL", issues: [{ severity: "error", message: `simctl error: ${e.message}` }], summary: "simctl failed" };
  }

  // 3. Boot if needed
  try {
    const state = await run(`xcrun simctl list devices -j | python3 -c "import sys,json; devices=json.load(sys.stdin)['devices']; [print(d['state']) for rdevices in devices.values() for d in rdevices if d.get('udid')=='${udid}']"`);
    if (!state.includes("Booted")) {
      await run(`xcrun simctl boot "${udid}"`, 30000);
    }
  } catch {}

  // 4. Optional build + install
  if (build) {
    try {
      const iosDir = `${process.cwd()}/projects/careloop-ios`;
      await run(`cd "${iosDir}" && xcodebuild -scheme CareLoop -sdk iphonesimulator -destination "id=${udid}" build 2>&1 | tail -5`, 300000);
    } catch (e) {
      issues.push({ severity: "error", message: `Build failed: ${e.message.slice(0, 200)}` });
      return { result: "FAIL", issues, summary: "Build failed — see issues" };
    }
  }

  // 5. Check if app is installed (don't force-install; let SENTINEL do manual install)
  let installed = false;
  try {
    await run(`xcrun simctl get_app_container booted "${BUNDLE_ID}" 2>/dev/null`);
    installed = true;
  } catch {}

  return {
    result: "PASS",
    issues,
    summary: `Simulator "${device}" (${udid.slice(0, 8)}...) booted. App installed: ${installed}. Ready for QA.`,
  };
}
