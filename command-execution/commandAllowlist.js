import fs from "node:fs";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";

const ALLOWLIST_PATH = "policy/command-execution-allowlist.json";

// Block patterns matched against the full "command args" string.
const BLOCKED_PATTERNS = [
  /npm\s+install/i,
  /npm\s+run\s+(dev|start|migrate|studio|qa:|test:watch)/i,
  /npm\s+start/i,
  /npx\s+prisma\s+(migrate|db|reset|seed)/i,
  /xcodebuild/i,
];

const PATH_TRAVERSAL_PATTERN = /\.\.|^\/|^~\//;

export function loadCommandExecutionAllowlist() {
  const root = getRepoRoot();
  const fullPath = path.join(root, ALLOWLIST_PATH);
  if (!fs.existsSync(fullPath)) {
    return { ok: false, error: "Command execution allowlist not found.", allowlist: null };
  }
  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    return { ok: true, error: null, allowlist: JSON.parse(raw) };
  } catch (err) {
    return { ok: false, error: `Failed to parse allowlist: ${err.message}`, allowlist: null };
  }
}

function commandString(command, args) {
  return [command, ...(args ?? [])].join(" ");
}

export function isCommandAllowed(input = {}) {
  return validateCommandAgainstAllowlist(input).allowed;
}

export function validateCommandAgainstAllowlist(input = {}) {
  const {
    projectId = "",
    command = "",
    args = [],
    workingDirectory = "",
    mode = "",
  } = input;

  const blocked = [];
  const warnings = [];

  // Mode check.
  if (mode !== "local-private" && mode !== "test") {
    return {
      allowed: false,
      commandId: "",
      reason: `Command execution requires local-private or test mode. Got: ${mode}`,
      riskLevel: "critical",
      requiresApproval: true,
      requiresDb: false,
      requiresNetwork: false,
      mutationAllowed: false,
      blockedBy: ["mode_denied"],
      warnings,
    };
  }

  // Path traversal guard.
  if (PATH_TRAVERSAL_PATTERN.test(workingDirectory)) {
    return {
      allowed: false,
      commandId: "",
      reason: "Path traversal or absolute path detected in workingDirectory.",
      riskLevel: "critical",
      requiresApproval: true,
      requiresDb: false,
      requiresNetwork: false,
      mutationAllowed: false,
      blockedBy: ["path_traversal"],
      warnings,
    };
  }

  // Static block patterns.
  const fullCommand = commandString(command, args);
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(fullCommand)) {
      blocked.push("blocked_command_pattern");
    }
  }
  if (blocked.length > 0) {
    return {
      allowed: false,
      commandId: "",
      reason: `Command matches blocked pattern: ${fullCommand}`,
      riskLevel: "high",
      requiresApproval: true,
      requiresDb: false,
      requiresNetwork: false,
      mutationAllowed: false,
      blockedBy: blocked,
      warnings,
    };
  }

  // Load allowlist and find matching entry.
  const { ok, error, allowlist } = loadCommandExecutionAllowlist();
  if (!ok || !allowlist) {
    return {
      allowed: false,
      commandId: "",
      reason: error ?? "Allowlist unavailable; defaulting to deny.",
      riskLevel: "critical",
      requiresApproval: true,
      requiresDb: false,
      requiresNetwork: false,
      mutationAllowed: false,
      blockedBy: ["allowlist_unavailable"],
      warnings,
    };
  }

  const entry = (allowlist.allowedCommands ?? []).find(
    (e) =>
      e.projectId === projectId &&
      e.command === command &&
      JSON.stringify(e.args ?? []) === JSON.stringify(args) &&
      e.workingDirectory === workingDirectory
  );

  if (!entry) {
    return {
      allowed: false,
      commandId: "",
      reason: `No allowlist entry matched: projectId=${projectId} command=${fullCommand} dir=${workingDirectory}`,
      riskLevel: "high",
      requiresApproval: true,
      requiresDb: false,
      requiresNetwork: false,
      mutationAllowed: false,
      blockedBy: ["not_in_allowlist"],
      warnings,
    };
  }

  return {
    allowed: true,
    commandId: entry.commandId,
    reason: "Command is permitted by allowlist.",
    riskLevel: entry.riskLevel ?? "medium",
    requiresApproval: entry.requiresApproval ?? false,
    requiresDb: entry.requiresDb ?? false,
    requiresNetwork: entry.requiresNetwork ?? false,
    mutationAllowed: entry.mutationAllowed ?? false,
    timeoutSeconds: entry.timeoutSeconds ?? 120,
    captureOutput: entry.captureOutput ?? true,
    redactOutput: entry.redactOutput ?? true,
    blockedBy: [],
    warnings,
  };
}
