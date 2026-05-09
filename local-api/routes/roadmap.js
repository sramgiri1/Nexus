import { sendJson, buildEnvelope } from "../safeResponse.js";

const PHASES = [
  { phase: "P34–P35", label: "Command Center V2 + Mission Action Bridge", status: "COMPLETE" },
  { phase: "P36", label: "Agentic Workspace Home + Workflow Templates", status: "COMPLETE" },
  { phase: "P37", label: "Task Activation + Agent Assignment from UI", status: "COMPLETE" },
  { phase: "P38", label: "Agent Workbench + Human Review Loop", status: "COMPLETE" },
  { phase: "P39", label: "First Controlled Implementation Workflow from UI", status: "COMPLETE" },
  { phase: "P40", label: "Live Local API Backend for Command Center", status: "IN_PROGRESS", current: true },
  { phase: "P41", label: "DB Foundation + Durable State", status: "PLANNED", next: true },
  { phase: "P42", label: "Agent Execution + Governed Build Loop", status: "PLANNED" },
  { phase: "P43", label: "Public Demo + Investor View", status: "PLANNED" },
  { phase: "P44", label: "Production Deploy Readiness", status: "PLANNED" },
  { phase: "P45", label: "Multi-Project + Tenant Foundation", status: "PLANNED" },
];

export function handleRoadmap(req, res, { mode }) {
  const current = PHASES.find(p => p.current);
  const next = PHASES.find(p => p.next);

  sendJson(res, 200, buildEnvelope({
    ok: true,
    source: "live-local-api",
    mode,
    data: {
      phases: PHASES,
      currentPhase: current?.phase,
      currentLabel: current?.label,
      nextPhase: next?.phase,
      nextLabel: next?.label,
      complete: PHASES.filter(p => p.status === "COMPLETE").length,
      total: PHASES.length,
    },
  }));
}
