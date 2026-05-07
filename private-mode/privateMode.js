const VALID_MODES = new Set(["public", "demo", "local-private", "test"]);

function normalizeModeCandidate(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getNexusMode(env = {}) {
  const rawMode =
    typeof env === "string"
      ? env
      : env.NEXUS_MODE ??
        env.nexusMode ??
        env.mode ??
        env.MODE ??
        env.nexus_mode ??
        "";
  const normalizedMode = normalizeModeCandidate(rawMode);

  return VALID_MODES.has(normalizedMode) ? normalizedMode : "demo";
}

export function isPublicMode(mode) {
  return getNexusMode({ NEXUS_MODE: mode }) === "public";
}

export function isDemoMode(mode) {
  return getNexusMode({ NEXUS_MODE: mode }) === "demo";
}

export function isLocalPrivateMode(mode) {
  return getNexusMode({ NEXUS_MODE: mode }) === "local-private";
}

export function requireLocalPrivateMode(mode) {
  const normalizedInput = normalizeModeCandidate(mode);
  const resolvedMode = getNexusMode({ NEXUS_MODE: mode });
  const warnings = [];
  const errors = [];

  if (
    normalizedInput &&
    !VALID_MODES.has(normalizedInput) &&
    resolvedMode === "demo"
  ) {
    warnings.push("Unknown mode resolved to demo.");
  }

  if (resolvedMode !== "local-private") {
    errors.push("local-private mode is required.");
  }

  return {
    ok: errors.length === 0,
    mode: resolvedMode,
    errors,
    warnings,
  };
}
