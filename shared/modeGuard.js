const SUPPORTED_MODES = new Set(["local-private", "test", "demo", "public-safe", "unknown"]);

export function getNexusMode(env = process.env) {
  const mode = env.NEXUS_MODE || env.MODE || "unknown";
  return SUPPORTED_MODES.has(mode) ? mode : "unknown";
}

export function isLocalPrivateMode(mode) {
  return mode === "local-private";
}

export function isTestMode(mode) {
  return mode === "test";
}

export function isDemoMode(mode) {
  return mode === "demo";
}

export function isPublicSafeMode(mode) {
  return mode === "public-safe";
}

export function buildModeGuardResult(mode = "unknown", allowedModes = []) {
  const normalizedMode = SUPPORTED_MODES.has(mode) ? mode : "unknown";
  const allowed = allowedModes.includes(normalizedMode);
  return {
    ok: allowed,
    mode: normalizedMode,
    allowedModes,
    status: allowed ? "PASS" : "BLOCKED",
    reason: allowed ? "" : `Mode ${normalizedMode} is not allowed for this operation.`,
  };
}

export function requireMode(mode, allowedModes = []) {
  return buildModeGuardResult(mode, allowedModes);
}
