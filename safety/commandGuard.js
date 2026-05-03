// safety/commandGuard.js
// Validates shell commands against an allowlist and blocked pattern list.

import { loadConfig } from "./config.js";

export const commandGuard = {
  async check(agentId, command) {
    if (!command || typeof command !== "string") return { allowed: true };

    const config = await loadConfig("command-policy");

    if (command.length > config.max_command_length) {
      return { allowed: false, reason: `Command exceeds max length (${command.length} > ${config.max_command_length})` };
    }

    const lower = command.toLowerCase();
    for (const pattern of config.blocked_patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        return { allowed: false, reason: `Command contains blocked pattern: '${pattern}'` };
      }
    }

    const firstToken = command.trim().split(/\s+/)[0];
    if (firstToken && !config.allowed_commands.includes(firstToken)) {
      return { allowed: false, reason: `Command '${firstToken}' is not in the allowed command list` };
    }

    return { allowed: true };
  },
};
