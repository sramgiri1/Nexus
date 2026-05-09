import { readJsonSafe, listFilesSafe } from "../../local-state/safeFileReader.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

const KNOWN_CONTRACTS = [
  { id: "mission-contract", path: "contracts/missions/private-project-mission-contract.json", label: "Mission Contract" },
  { id: "task-plan", path: "contracts/missions/private-project-task-plan.json", label: "Task Plan" },
];

export function handleContracts(req, res, { mode }) {
  try {
    const contracts = KNOWN_CONTRACTS.map(c => {
      const result = readJsonSafe(c.path);
      if (!result.ok) return { id: c.id, label: c.label, available: false };
      const data = result.data;
      return {
        id: c.id,
        label: c.label,
        available: true,
        contractId: data.contractId || data.planVersion,
        contractType: data.contractType || data.planType,
        mode: data.mode,
        projectId: data.projectId,
        taskCount: Array.isArray(data.tasks) ? data.tasks.length : undefined,
        targetAgent: data.targetAgent,
        createdAt: data.createdAt,
        constraints: data.constraints,
        governance: data.governance,
        redacted: true,
      };
    });

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: { contracts, count: contracts.filter(c => c.available).length },
    }));
  } catch (err) {
    sendError(res, 500, "contracts_error", "Failed to read contracts.", null);
  }
}
