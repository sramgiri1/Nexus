export function buildMemoryInvalidationPlan(change = {}, items = []) {
  const affected = [];
  const unaffected = [];

  for (const item of items) {
    const reasons = [];
    if (change.changeScope === "NEXUS_OS_CHANGE" && item.scope === "nexus_os") {
      reasons.push("NEXUS OS memory affected by OS change");
    }
    if (change.projectId && item.projectId === change.projectId) {
      reasons.push("Project memory affected by project change");
    }
    if (change.taskId && item.taskId === change.taskId) {
      reasons.push("Task memory affected by task change");
    }
    if (change.changeScope === "CROSS_CUTTING_CHANGE" && ["nexus_os", "project"].includes(item.scope)) {
      reasons.push("Cross-cutting change affects OS/project summaries");
    }

    if (reasons.length > 0) {
      affected.push({ memoryId: item.memoryId, action: "mark_stale_pending_validation", reasons });
    } else {
      unaffected.push(item.memoryId);
    }
  }

  return {
    planVersion: "1.0",
    generatedAt: new Date().toISOString(),
    changeScope: change.changeScope || "UNKNOWN",
    affected,
    unaffected,
    autoInvalidationEnabled: false,
    requiresValidation: affected.length > 0,
  };
}
