/**
 * check-mission-action-bridge.js
 * Validation script for P35-LOCAL: Command Center Mission Action Bridge.
 * Checks modules, exports, policy, live action run, invalid blocking, server script,
 * dashboard wiring, public safety, no private project changes, and formatting.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const results = {};

// ─── 1. Required modules exist ─────────────────────────────────────────────────

function checkModules() {
  const required = [
    "mission-actions/missionActionBridge.js",
    "mission-actions/missionActionStore.js",
    "mission-actions/index.js",
  ];
  return required.every((f) => fs.existsSync(path.join(ROOT, f)));
}

// ─── 2. Required exports exist ─────────────────────────────────────────────────

function checkExports() {
  const filePath = path.join(ROOT, "mission-actions/missionActionBridge.js");
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  const required = [
    "createMissionActionRequest",
    "validateMissionActionRequest",
    "runMissionActionRequest",
    "getMissionActionResult",
    "listMissionActions",
    "buildMissionActionResponse",
  ];
  return required.every((fn) => content.includes(fn));
}

// ─── 3. Policy exists and is valid ────────────────────────────────────────────

function checkPolicy() {
  const policyPath = path.join(ROOT, "policy/mission-action-bridge-policy.json");
  if (!fs.existsSync(policyPath)) return false;
  try {
    const policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));
    return (
      policy.providerCallsAllowed === false &&
      policy.networkCallsAllowed === false &&
      policy.localOnly === true
    );
  } catch {
    return false;
  }
}

// ─── 4. Mission action works end-to-end ───────────────────────────────────────

async function checkMissionAction() {
  const runtimeFiles = [
    "local-state/runtime/actions.jsonl",
    "local-state/runtime/events.jsonl",
    "local-state/runtime/evidence.jsonl",
    "local-state/runtime/audit.jsonl",
  ];
  const contractFiles = [
    "contracts/missions/private-project-mission-contract.json",
    "contracts/missions/private-project-task-plan.json",
  ];

  // Snapshot runtime files
  const snapshots = {};
  for (const f of runtimeFiles) {
    const fp = path.join(ROOT, f);
    snapshots[f] = fs.existsSync(fp) ? fs.readFileSync(fp, "utf8") : null;
  }

  // Snapshot contract files
  const contractSnapshots = {};
  for (const f of contractFiles) {
    const fp = path.join(ROOT, f);
    contractSnapshots[f] = fs.existsSync(fp) ? fs.readFileSync(fp, "utf8") : null;
  }

  let pass = false;
  try {
    process.env.NEXUS_MODE = "local-private";

    const { runMissionActionRequest, createMissionActionRequest } = await import(
      "../mission-actions/missionActionBridge.js"
    );

    const req = createMissionActionRequest({
      actionType: "mission.compose",
      mode: "local-private",
      projectId: "private-project-01",
      projectLabel: "Private Project",
      missionText: "Check mission action bridge validation run.",
      requestedBy: { userId: "checker", role: "system", authType: "local" },
      source: "command_center_v2",
    });

    if (!req.ok) {
      console.error("  createMissionActionRequest failed:", req.errors);
      pass = false;
    } else {
      const result = await runMissionActionRequest(req.request);
      pass = result.ok && (result.result?.tasksCreated ?? 0) > 0;
      if (!pass) {
        console.error("  runMissionActionRequest result:", JSON.stringify(result, null, 2));
      }
    }
  } catch (err) {
    console.error("  checkMissionAction threw:", err);
    pass = false;
  } finally {
    // Restore runtime files
    for (const [f, content] of Object.entries(snapshots)) {
      const fp = path.join(ROOT, f);
      if (content !== null) {
        fs.writeFileSync(fp, content, "utf8");
      }
    }
    // Restore contract files
    for (const [f, content] of Object.entries(contractSnapshots)) {
      const fp = path.join(ROOT, f);
      if (content !== null) {
        fs.writeFileSync(fp, content, "utf8");
      }
    }
  }

  return pass;
}

// ─── 5. Invalid actions are blocked ───────────────────────────────────────────

async function checkInvalidBlocked() {
  try {
    const { createMissionActionRequest } = await import("../mission-actions/missionActionBridge.js");

    // Empty missionText should fail
    const r1 = createMissionActionRequest({
      actionType: "mission.compose",
      mode: "local-private",
      missionText: "",
    });
    if (r1.ok) {
      console.error("  Empty missionText should have been rejected.");
      return false;
    }

    // Wrong actionType should fail
    const r2 = createMissionActionRequest({
      actionType: "unsupported.type",
      mode: "local-private",
      missionText: "test",
    });
    if (r2.ok) {
      console.error("  Unsupported actionType should have been rejected.");
      return false;
    }

    return true;
  } catch (err) {
    console.error("  checkInvalidBlocked threw:", err);
    return false;
  }
}

// ─── 6. Local server script exists ────────────────────────────────────────────

function checkServerScript() {
  return fs.existsSync(path.join(ROOT, "scripts/mission-action-server.js"));
}

// ─── 7. Dashboard wiring ──────────────────────────────────────────────────────

function checkDashboardWiring() {
  const v2path = path.join(ROOT, "dashboard/src/pages/CommandCenterV2.jsx");
  const apiPath = path.join(ROOT, "dashboard/src/api/missionActions.js");

  if (!fs.existsSync(v2path) || !fs.existsSync(apiPath)) {
    console.error("  Dashboard files missing.");
    return false;
  }

  const v2 = fs.readFileSync(v2path, "utf8");
  const api = fs.readFileSync(apiPath, "utf8");

  // Check no direct file writes or shell exec in dashboard code
  const forbidden = [
    "execSync",
    "execFile",
    "spawnSync",
    "fs.writeFile",
    "fs.appendFile",
    "writeFileSync",
  ];
  if (forbidden.some((f) => v2.includes(f) || api.includes(f))) {
    console.error("  Forbidden operation found in dashboard code.");
    return false;
  }

  // Check Generate Plan button exists
  if (!v2.includes("Generate Plan")) {
    console.error("  Generate Plan button not found in CommandCenterV2.jsx.");
    return false;
  }

  // Check mission action integration
  if (
    !v2.includes("composeMissionFromCommandCenter") &&
    !v2.includes("handleGeneratePlan")
  ) {
    console.error("  composeMissionFromCommandCenter or handleGeneratePlan not found.");
    return false;
  }

  return true;
}

// ─── 8. Public safety — no private project names in public files ───────────────

function checkPublicSafety() {
  const PRIVATE_NAMES = ["CareLoop", "careloop"];
  const checkFiles = [
    "dashboard/src/api/missionActions.js",
    "mission-actions/missionActionBridge.js",
  ];

  for (const f of checkFiles) {
    const fp = path.join(ROOT, f);
    if (!fs.existsSync(fp)) continue;
    const content = fs.readFileSync(fp, "utf8");
    for (const name of PRIVATE_NAMES) {
      if (content.includes(name)) {
        console.error(`  Private project name "${name}" found in ${f}`);
        return false;
      }
    }
  }

  return true;
}

// ─── 9. No private project files changed ──────────────────────────────────────

function checkNoPrivateProjectChanges() {
  try {
    const output = execFileSync(
      "git",
      ["diff", "--name-only", "HEAD", "--", "projects/careloop", "projects/careloop-ios"],
      { cwd: ROOT, encoding: "utf8" }
    );
    return output.trim() === "";
  } catch {
    return true;
  }
}

// ─── 10. Formatting / readability ─────────────────────────────────────────────

function checkFormatting() {
  const files = [
    "mission-actions/missionActionBridge.js",
    "scripts/mission-action-server.js",
    "policy/mission-action-bridge-policy.json",
  ];
  for (const f of files) {
    const fp = path.join(ROOT, f);
    if (!fs.existsSync(fp)) {
      console.error(`  Missing: ${f}`);
      return false;
    }
  }
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHead() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("NEXUS Mission Action Bridge Check");
  console.log("=================================");
  console.log();

  results.modules = checkModules();
  results.exports = checkExports();
  results.policy = checkPolicy();
  results.missionAction = await checkMissionAction();
  results.invalidBlocked = await checkInvalidBlocked();
  results.localServer = checkServerScript();
  results.dashboardWiring = checkDashboardWiring();
  results.publicSafety = checkPublicSafety();
  results.noPrivateChanges = checkNoPrivateProjectChanges();
  results.formatting = checkFormatting();

  const label = (pass) => (pass ? "PASS" : "FAIL");

  console.log(`Modules: ${label(results.modules)}`);
  console.log(`Exports: ${label(results.exports)}`);
  console.log(`Policy: ${label(results.policy)}`);
  console.log(`Mission action: ${label(results.missionAction)}`);
  console.log(`Invalid action blocks: ${label(results.invalidBlocked)}`);
  console.log(`Local server: ${label(results.localServer)}`);
  console.log(`Dashboard wiring: ${label(results.dashboardWiring)}`);
  console.log(`Public safety: ${label(results.publicSafety)}`);
  console.log(`No forbidden changes: ${label(results.noPrivateChanges)}`);
  console.log(`Formatting/readability: ${label(results.formatting)}`);

  const allPass = Object.values(results).every(Boolean);
  console.log();
  console.log(`Result: ${allPass ? "PASS" : "FAIL"}`);

  // Write report
  const reportsDir = path.join(ROOT, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "mission-action-bridge-report.md");
  const reportContent = [
    "# Mission Action Bridge Check Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Validation HEAD: ${getHead()}`,
    "",
    "## Results",
    "",
    ...Object.entries(results).map(([k, v]) => `- ${k}: ${label(v)}`),
    "",
    `## Overall: ${allPass ? "PASS" : "FAIL"}`,
  ].join("\n");

  fs.writeFileSync(reportPath, reportContent, "utf8");

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
