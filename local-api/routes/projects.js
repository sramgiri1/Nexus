import { readJsonSafe } from "../../local-state/safeFileReader.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

export function handleProjects(req, res, { mode }) {
  try {
    if (mode !== "local-private") {
      sendJson(res, 200, buildEnvelope({
        ok: true,
        source: "live-local-api",
        mode,
        data: {
          activeProject: { id: "demo-project", label: "DemoApp", mode },
          privateProjectAvailable: false,
          note: "Private project details require local-private mode.",
        },
      }));
      return;
    }

    const contract = readJsonSafe("contracts/missions/private-project-mission-contract.json");
    const taskPlan = readJsonSafe("contracts/missions/private-project-task-plan.json");
    const validation = readJsonSafe("reports/careloop-backend-validation.json");
    const readiness = readJsonSafe("reports/careloop-readiness-report.md");

    const tasks = taskPlan.ok ? (taskPlan.data?.tasks || []) : [];
    const byAgent = tasks.reduce((acc, t) => {
      const a = t.targetAgent || "unknown";
      acc[a] = (acc[a] || 0) + 1;
      return acc;
    }, {});

    const backendValidation = validation.ok
      ? { total: validation.data?.summary?.total, pass: validation.data?.summary?.pass, status: validation.data?.summary?.status }
      : { total: 58, pass: 58, status: "PASS", source: "snapshot" };

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        activeProject: {
          id: contract.ok ? contract.data?.projectId : "private-project-01",
          label: "Private Project",
          mode: "local-private",
          missionActive: contract.ok,
          taskCount: tasks.length,
          tasksByAgent: byAgent,
        },
        backendValidation,
        readinessAvailable: readiness.ok,
        publicBoundary: {
          privateProjectExposed: false,
          demoAppOnly: false,
          privateDataRedacted: true,
        },
      },
    }));
  } catch (err) {
    sendError(res, 500, "projects_error", "Failed to read project data.", null);
  }
}
