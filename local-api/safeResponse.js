/**
 * safeResponse.js
 * Safe response layer for the Live Local API (P40-LOCAL).
 * All responses are enveloped, redacted, and mode-aware.
 */

const SECRET_PATTERN = /sk-[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9_-]{6,}|OPENAI_API_KEY=\S+|ANTHROPIC_API_KEY=\S+|DATABASE_URL=\S+/g;
const PRIVATE_NAME_PATTERN = /CareLoop|careloop/g;
const STACK_TRACE_PATTERN = /^\s+at\s+/m;

// ─── sendJson ─────────────────────────────────────────────────────────────────

export function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

// ─── sendError ────────────────────────────────────────────────────────────────

export function sendError(res, statusCode, code, message, details = null) {
  const payload = {
    ok: false,
    source: "live-local-api",
    mode: "unknown",
    generatedAt: new Date().toISOString(),
    data: null,
    warnings: [],
    errors: [{ code, message }],
  };
  if (details && !STACK_TRACE_PATTERN.test(String(details))) {
    payload.errors[0].details = String(details).slice(0, 200);
  }
  sendJson(res, statusCode, payload);
}

// ─── redactApiPayload ─────────────────────────────────────────────────────────

export function redactApiPayload(payload) {
  if (payload === null || payload === undefined) return payload;
  if (typeof payload === "string") {
    return payload
      .replace(SECRET_PATTERN, "[REDACTED]")
      .replace(PRIVATE_NAME_PATTERN, "private-project");
  }
  if (Array.isArray(payload)) {
    return payload.map(redactApiPayload);
  }
  if (typeof payload === "object") {
    const out = {};
    for (const [k, v] of Object.entries(payload)) {
      const lk = k.toLowerCase();
      if (lk.includes("secret") || lk.includes("password") || lk.includes("token") || lk.includes("apikey")) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactApiPayload(v);
      }
    }
    return out;
  }
  return payload;
}

// ─── validateApiMode ──────────────────────────────────────────────────────────

export function validateApiMode(mode) {
  const allowed = ["local-private", "demo", "local"];
  if (!allowed.includes(mode)) {
    return { ok: false, error: `Mode '${mode}' is not supported. Allowed: ${allowed.join(", ")}.` };
  }
  return { ok: true };
}

// ─── buildApiMetadata ─────────────────────────────────────────────────────────

export function buildApiMetadata(source, mode) {
  return {
    source,
    mode: mode || "local-private",
    generatedAt: new Date().toISOString(),
    apiVersion: "1.0",
    dbBacked: false,
    providerCallsEnabled: false,
    externalNetworkEnabled: false,
  };
}

// ─── buildEnvelope ───────────────────────────────────────────────────────────

export function buildEnvelope({ ok, source, mode, data, warnings = [], errors = [] }) {
  return {
    ok,
    ...buildApiMetadata(source, mode),
    data: redactApiPayload(data),
    warnings,
    errors,
  };
}
