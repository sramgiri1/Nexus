// safety/fileScopeGuard.js
// Prevents agents from writing outside their allowed scope.
// write_file paths are relative to projects/, so checks focus on path traversal.

import { loadConfig } from "./config.js";

export const fileScopeGuard = {
  async check(agentId, filePath) {
    if (!filePath || typeof filePath !== "string") return { allowed: true };

    const config     = await loadConfig("file-scope");
    const normalized = filePath.replace(/\\/g, "/");

    // Block raw path traversal attempts
    for (const pattern of config.blocked_path_patterns) {
      if (normalized.includes(pattern)) {
        return { allowed: false, reason: `Write to blocked path pattern '${pattern}' denied for agent '${agentId}'` };
      }
    }

    // Block writes to protected memory paths
    for (const p of config.protected_memory_paths) {
      if (normalized === p || normalized.endsWith(`/${p}`)) {
        if (!config.agents_with_full_memory_write.includes(agentId)) {
          return { allowed: false, reason: `Write to protected path '${p}' denied for agent '${agentId}'` };
        }
      }
    }

    // Verifier (auditor / sentinel / warden) path restrictions
    if (config.verifier_agents?.includes(agentId)) {
      const r = config.verifier_write_restrictions?.[agentId];
      if (r) {
        // Blocked patterns always win, regardless of allowed list
        for (const pattern of r.blocked_contains ?? []) {
          if (normalized.includes(pattern)) {
            return { allowed: false, reason: `Verifier '${agentId}' blocked from writing to path containing '${pattern}': ${filePath}` };
          }
        }

        // At least one allowed prefix or allowed segment must match
        let pathAllowed = (r.allowed_prefixes ?? []).some(p => normalized.startsWith(p))
                       || (r.allowed_segments ?? []).some(s => normalized.includes(s));

        if (!pathAllowed) {
          return { allowed: false, reason: `Verifier '${agentId}' is not permitted to write to '${filePath}' — not in allowed paths (allowed prefixes: ${(r.allowed_prefixes ?? []).join(", ") || "none"}, segments: ${(r.allowed_segments ?? []).join(", ") || "none"})` };
        }
      }
    }

    return { allowed: true };
  },
};
