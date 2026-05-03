// skills/sentinel/qa.logs.analyze.js
// Capture 8s of simulator error logs after app launch. Flag crashes and exceptions.

import { spawn } from "child_process";
import { execWithXcode, resolveDeveloperDir } from "./xcode.js";

const BUNDLE_ID = "com.careloop.ios";

export async function execute({ durationMs = 8000 } = {}) {
  const issues = [];
  const developerDir = await resolveDeveloperDir();
  if (!developerDir) {
    return {
      result: "FAIL",
      issues: [{ severity: "error", message: "Full Xcode not found. Install Xcode.app or set DEVELOPER_DIR." }],
      summary: "Xcode developer dir missing",
    };
  }

  // Verify simulator is booted
  let booted = false;
  try {
    const { stdout } = await execWithXcode("xcrun simctl list devices -j", { timeout: 10000 });
    const all = JSON.parse(stdout);
    booted = Object.values(all.devices).flat().some(d => d.state === "Booted");
  } catch {}

  if (!booted) {
    return { result: "FAIL", issues: [{ severity: "error", message: "No simulator booted. Run qa.simulator.run first." }], summary: "No booted simulator" };
  }

  // Launch app and capture logs
  try { await execWithXcode(`xcrun simctl launch booted "${BUNDLE_ID}"`, { timeout: 15000 }); } catch {}

  const logs = await new Promise((resolve) => {
    const chunks = [];
    let settled = false;
    const proc = spawn("xcrun", ["simctl", "spawn", "booted", "log", "stream", "--level", "error", "--predicate", `process == "${BUNDLE_ID}" OR subsystem == "com.careloop"`], {
      env: { ...process.env, DEVELOPER_DIR: developerDir },
    });
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(chunks.join(""));
    };
    proc.stdout.on("data", d => chunks.push(d.toString()));
    proc.stderr.on("data", d => chunks.push(d.toString()));
    proc.on("close", finish);
    proc.on("error", (err) => {
      chunks.push(String(err));
      finish();
    });
    setTimeout(() => {
      if (!proc.killed) proc.kill("SIGKILL");
      setTimeout(finish, 250);
    }, durationMs);
  });

  const lines = logs.split("\n").filter(Boolean);
  const crashes = lines.filter(l => /crash|exception|fatal|sigterm|sigkill/i.test(l));
  const errors  = lines.filter(l => /error:/i.test(l));

  crashes.slice(0, 5).forEach(l => issues.push({ severity: "error",   message: `CRASH: ${l.slice(0, 150)}` }));
  errors.slice(0, 8).forEach(l  => issues.push({ severity: "warning", message: `Error log: ${l.slice(0, 150)}` }));

  const hasCrash = crashes.length > 0;
  return {
    result: hasCrash ? "FAIL" : "PASS",
    issues,
    summary: `${durationMs / 1000}s log capture: ${crashes.length} crashes, ${errors.length} errors`,
  };
}
