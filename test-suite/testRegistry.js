/**
 * test-suite/testRegistry.js
 * Combined registry access for project and OS test suites.
 * Registry/visibility only — no test execution.
 */

import { buildProjectTestSuites } from "./projectTestSuites.js";
import { buildOsTestSuites } from "./osTestSuites.js";

/**
 * Get the combined registry of all project and OS test suites.
 */
export function getTestRegistry(context = {}) {
  const projectSuites = buildProjectTestSuites(context);
  let osSuites = [];
  try {
    osSuites = buildOsTestSuites(context);
  } catch {
    // osTestSuites may not be available yet
  }
  return [...projectSuites, ...osSuites];
}

/**
 * Find a suite by suiteId in the combined registry.
 */
export function getTestRegistryById(suiteId, context = {}) {
  const registry = getTestRegistry(context);
  return registry.find((s) => s.suiteId === suiteId) || null;
}

/**
 * Filter the registry by scope, layer, or tool.
 */
export function filterRegistry(registry, filter = {}) {
  if (!Array.isArray(registry)) return [];
  return registry.filter((suite) => {
    if (filter.scope && suite.scope !== filter.scope) return false;
    if (filter.layer && suite.layer !== filter.layer) return false;
    if (filter.tool && suite.tool !== filter.tool) return false;
    if (filter.ownerAgent && suite.ownerAgent !== filter.ownerAgent) return false;
    if (filter.projectId && suite.projectId !== filter.projectId) return false;
    return true;
  });
}
