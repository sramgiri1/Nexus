import { getToolRegistry } from "./toolRegistry.js";
import { buildToolGatewayDecision, createToolGatewayContext } from "./toolGateway.js";
import { TOOL_GATEWAY_DECISIONS } from "./toolDecision.js";

function normalize(value) {
  return String(value || "").toLowerCase();
}

function toSearchSummary(tool, matchedFields = []) {
  return {
    toolId: tool.toolId,
    displayName: tool.displayName,
    category: tool.category,
    interfaceType: tool.interfaceType,
    status: tool.status,
    riskLevel: tool.riskLevel,
    owner: tool.owner,
    matchedFields,
  };
}

export function searchTools(query = "", context = {}) {
  const normalizedQuery = normalize(query);
  const gatewayContext = createToolGatewayContext(context);
  const results = [];

  for (const tool of getToolRegistry()) {
    const searchable = {
      toolId: tool.toolId,
      displayName: tool.displayName,
      category: tool.category,
      description: tool.description,
      owner: tool.owner,
      allowedMethods: tool.allowedMethods.join(" "),
    };
    const matchedFields = Object.entries(searchable)
      .filter(([, value]) => !normalizedQuery || normalize(value).includes(normalizedQuery))
      .map(([field]) => field);
    if (matchedFields.length === 0) continue;

    const decision = buildToolGatewayDecision({
      requestType: "tool.lookup",
      toolId: tool.toolId,
      method: tool.allowedMethods[0],
      context: gatewayContext,
    });
    if (decision.decision === TOOL_GATEWAY_DECISIONS.ALLOW_METADATA_ONLY) {
      results.push(toSearchSummary(tool, matchedFields));
    }
  }

  return results;
}

export function summarizeToolSearchResults(results = []) {
  return {
    resultCount: results.length,
    categories: [...new Set(results.map((result) => result.category))],
    riskLevels: [...new Set(results.map((result) => result.riskLevel))],
  };
}
