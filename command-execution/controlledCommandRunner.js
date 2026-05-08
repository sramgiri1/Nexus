import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { getRepoRoot } from "../local-state/safeFileReader.js";
import { snapshotProjectTree, compareProjectTreeBeforeAfter } from "./commandPreflight.js";

const MAX_OUTPUT_PREVIEW_CHARS = 4000;

// Patterns to redact from command output.
const REDACT_PATTERNS = [
  { label: "openai_key", pattern: /sk-[A-Za-z0-9]{10,}/g, replacement: "[REDACTED_KEY]" },
  { label: "anthropic_key", pattern: /sk-ant-[A-Za-z0-9_-]{6,}/g, replacement: "[REDACTED_KEY]" },
  { label: "openai_env", pattern: /OPENAI_API_KEY=[^\s]*/g, replacement: "OPENAI_API_KEY=[REDACTED]" },
  { label: "anthropic_env", pattern: /ANTHROPIC_API_KEY=[^\s]*/g, replacement: "ANTHROPIC_API_KEY=[REDACTED]" },
  { label: "database_url", pattern: /DATABASE_URL=[^\s]*/g, replacement: "DATABASE_URL=[REDACTED]" },
  { label: "private_key", pattern: /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g, replacement: "[REDACTED_PRIVATE_KEY]" },
  { label: "bearer_token", pattern: /Bearer\s+[A-Za-z0-9._-]{20,}/g, replacement: "Bearer [REDACTED]" },
];

export function redactCommandOutput(text) {
  if (typeof text !== "string") return "";
  let redacted = text;
  for (const { pattern, replacement } of REDACT_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

function hashOutput(text) {
  if (!text) return "";
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function capOutput(text, maxChars) {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + `\n... [truncated at ${maxChars} chars, total ${text.length}]`;
}

export function normalizeCommandResult(result = {}) {
  return {
    ok: result.ok ?? false,
    status: result.status ?? "FAIL",
    commandId: result.commandId ?? "",
    exitCode: typeof result.exitCode === "number" ? result.exitCode : -1,
    durationMs: typeof result.durationMs === "number" ? result.durationMs : 0,
    stdoutPreview: result.stdoutPreview ?? "",
    stderrPreview: result.stderrPreview ?? "",
    outputHash: result.outputHash ?? "",
    mutationDetected: result.mutationDetected ?? false,
    mutatedPaths: Array.isArray(result.mutatedPaths) ? result.mutatedPaths : [],
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
    errors: Array.isArray(result.errors) ? result.errors : [],
  };
}

export function createCommandEvidence(input = {}) {
  return {
    type: "controlled_command_result",
    commandId: input.commandId ?? "",
    status: input.status ?? "UNKNOWN",
    exitCode: input.exitCode ?? -1,
    durationMs: input.durationMs ?? 0,
    outputHash: input.outputHash ?? "",
    mutationDetected: input.mutationDetected ?? false,
    redacted: true,
    classification: "confidential",
  };
}

export function runControlledCommand(input = {}) {
  const {
    projectId = "",
    commandId = "",
    command = "",
    args = [],
    workingDirectory = "",
    timeoutSeconds = 120,
    mode = "",
    captureOutput = true,
    redactOutput = true,
  } = input;

  const errors = [];
  const warnings = [];

  if (mode !== "local-private" && mode !== "test") {
    return normalizeCommandResult({
      ok: false,
      status: "BLOCKED",
      commandId,
      errors: [`Command runner requires local-private or test mode. Got: ${mode}`],
    });
  }

  const root = getRepoRoot();
  const absWorkingDir = path.resolve(path.join(root, workingDirectory));

  // Safety: working directory must be inside the repo root.
  if (!absWorkingDir.startsWith(root)) {
    return normalizeCommandResult({
      ok: false,
      status: "BLOCKED",
      commandId,
      errors: ["Working directory is outside repo root."],
    });
  }

  // Snapshot project tree before execution.
  const snapshotBefore = snapshotProjectTree(workingDirectory);

  const startMs = Date.now();
  let spawnResult;
  try {
    spawnResult = spawnSync(command, args, {
      cwd: absWorkingDir,
      timeout: timeoutSeconds * 1000,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      // Do not inherit parent env with secrets; pass a minimal safe env.
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
        NODE_PATH: process.env.NODE_PATH ?? "",
        // npm needs these for operation.
        npm_config_cache: process.env.npm_config_cache ?? "",
        TMPDIR: process.env.TMPDIR ?? "/tmp",
      },
    });
  } catch (err) {
    return normalizeCommandResult({
      ok: false,
      status: "FAIL",
      commandId,
      durationMs: Date.now() - startMs,
      errors: [`Command spawn failed: ${err.message}`],
      warnings,
    });
  }
  const durationMs = Date.now() - startMs;

  // Handle timeout.
  if (spawnResult.signal === "SIGTERM" || spawnResult.error?.code === "ETIMEDOUT") {
    return normalizeCommandResult({
      ok: false,
      status: "TIMEOUT",
      commandId,
      exitCode: spawnResult.status ?? -1,
      durationMs,
      errors: [`Command timed out after ${timeoutSeconds}s.`],
      warnings,
    });
  }

  // Handle spawn error (command not found, etc.).
  if (spawnResult.error) {
    return normalizeCommandResult({
      ok: false,
      status: "FAIL",
      commandId,
      exitCode: spawnResult.status ?? -1,
      durationMs,
      errors: [`Command execution error: ${spawnResult.error.message}`],
      warnings,
    });
  }

  // Process output.
  const rawStdout = spawnResult.stdout ?? "";
  const rawStderr = spawnResult.stderr ?? "";
  const processedStdout = redactOutput ? redactCommandOutput(rawStdout) : rawStdout;
  const processedStderr = redactOutput ? redactCommandOutput(rawStderr) : rawStderr;
  const combinedOutput = processedStdout + processedStderr;
  const outputHash = hashOutput(combinedOutput);

  // Snapshot after execution.
  const snapshotAfter = snapshotProjectTree(workingDirectory);
  const treeComparison = compareProjectTreeBeforeAfter(snapshotBefore, snapshotAfter);

  if (treeComparison.mutationDetected) {
    warnings.push(
      `Project mutation detected after command. Added: ${treeComparison.added.length}, Removed: ${treeComparison.removed.length}, Modified: ${treeComparison.modified.length}`
    );
  }

  const exitCode = spawnResult.status ?? -1;
  const ok = exitCode === 0;
  const status = ok ? "PASS" : "FAIL";

  return normalizeCommandResult({
    ok,
    status,
    commandId,
    exitCode,
    durationMs,
    stdoutPreview: capOutput(processedStdout, MAX_OUTPUT_PREVIEW_CHARS),
    stderrPreview: capOutput(processedStderr, MAX_OUTPUT_PREVIEW_CHARS),
    outputHash,
    mutationDetected: treeComparison.mutationDetected,
    mutatedPaths: [
      ...treeComparison.added.map((p) => `added:${p}`),
      ...treeComparison.removed.map((p) => `removed:${p}`),
      ...treeComparison.modified.map((p) => `modified:${p}`),
    ],
    warnings,
    errors,
  });
}
