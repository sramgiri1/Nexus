// skills/nexus/decide.release.js
// Read gate statuses from portfolio.json and make a GO / NO-GO release decision.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

const GATE_REQUIREMENTS = {
  g0: ["Market validated (TAM scan done)", "RADAR and MERIDIAN complete"],
  g1: ["PRD locked", "Sprint 1 complete", "API routes tested"],
  g2: ["Reminders + digest live", "Sprint 2 QA signed off", "APNs configured"],
  g3: ["Auth hardened (JWT)", "App Store metadata approved", "SENTINEL QA passed", "WARDEN signed off"],
};

export async function execute({ projectId = "careloop", targetGate } = {}) {
  const portPath = path.join(ROOT, "memory", "portfolio.json");
  const port     = JSON.parse(await fs.readFile(portPath, "utf8"));
  const project  = port.projects.find(p => p.id === projectId);

  if (!project) {
    return { result: "FAIL", issues: [{ severity: "error", message: `Project not found: ${projectId}` }], summary: "Unknown project" };
  }

  const gates  = project.gates || {};
  const issues = [];
  const gate   = targetGate || Object.keys(GATE_REQUIREMENTS).find(g => gates[g] !== "done") || "g3";

  // Check all gates up to and including targetGate
  const gatesInScope = Object.keys(GATE_REQUIREMENTS).slice(0, Object.keys(GATE_REQUIREMENTS).indexOf(gate) + 1);
  for (const g of gatesInScope) {
    const status = gates[g] || "pending";
    if (status !== "done") {
      issues.push({ severity: status === "blocked" ? "error" : "warning", message: `Gate ${g.toUpperCase()} is ${status}: ${GATE_REQUIREMENTS[g]?.join(", ")}` });
    }
  }

  const blockers = issues.filter(i => i.severity === "error");
  const decision = blockers.length === 0 && issues.every(i => issues.filter(ii => ii.severity === "warning").length === 0) ? "GO" : issues.length === 0 ? "GO" : "NO-GO";

  return {
    result: decision === "GO" ? "PASS" : "FAIL",
    issues,
    summary: `${projectId.toUpperCase()} ${gate.toUpperCase()} release decision: ${decision} (${issues.length} open items)`,
    data: { project: projectId, gate, decision, gateStatuses: gates },
  };
}
