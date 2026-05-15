import { listMemoryItems } from "./memoryStore.js";

export function buildMemoryIndex(options = {}) {
  const items = options.items || listMemoryItems(options);
  const byScope = {};
  const byProject = {};
  const byAgent = {};

  for (const item of items) {
    byScope[item.scope] = (byScope[item.scope] || 0) + 1;
    if (item.projectId) byProject[item.projectId] = (byProject[item.projectId] || 0) + 1;
    for (const agent of item.allowedAgents || []) {
      byAgent[agent] = (byAgent[agent] || 0) + 1;
    }
  }

  return {
    indexVersion: "1.0",
    itemCount: items.length,
    byScope,
    byProject,
    byAgent,
    generatedAt: new Date().toISOString(),
  };
}

export function summarizeMemoryStore(options = {}) {
  const index = buildMemoryIndex(options);
  return {
    itemCount: index.itemCount,
    scopes: Object.keys(index.byScope).length,
    projects: Object.keys(index.byProject).length,
    agents: Object.keys(index.byAgent).length,
  };
}
