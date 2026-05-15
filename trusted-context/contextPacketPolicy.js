export const TRUSTED_CONTEXT_PACKET_POLICY = {
  version: "1.0",
  summariesOnly: true,
  rawContentIncluded: false,
  redacted: true,
  maxSourcesDefault: 20,
  allowedModes: ["local-private", "demo", "public-safe"],
  privateModes: ["local-private"],
  privateClassifications: ["local-private", "confidential"],
  providerCallsAllowed: false,
  toolDispatchAllowed: false,
  workerRuntimeAllowed: false,
  dbWritesAllowed: false,
  runtimeAgentInjectionAllowed: false,
};

export function isSourceAllowedForPacket(source, request) {
  const reasons = [];
  const mode = request.mode || "local-private";
  if (source.forbiddenModes?.includes(mode) || (mode === "public-safe" && source.forbiddenModes?.includes("public"))) {
    reasons.push(`Forbidden in ${mode} mode.`);
  }
  if (mode !== "local-private" && TRUSTED_CONTEXT_PACKET_POLICY.privateClassifications.includes(source.dataClassification)) {
    reasons.push("Private source excluded outside local-private mode.");
  }
  if (request.projectId && source.projectId && !["selected-project", request.projectId].includes(source.projectId)) {
    reasons.push("Source belongs to a different project scope.");
  }
  return {
    allowed: reasons.length === 0,
    reasons,
  };
}
