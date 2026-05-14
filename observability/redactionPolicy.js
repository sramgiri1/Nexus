export const ACTIVITY_FORBIDDEN_PATTERNS = [
  {
    label: "OpenAI-style API key",
    regex: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g,
  },
  {
    label: "Anthropic-style API key",
    regex: /sk-ant-[A-Za-z0-9_-]{20,}/g,
  },
  {
    label: "environment assignment",
    regex: /\b[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*\s*=\s*[^\s]+/gi,
  },
  {
    label: "PEM private key",
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    label: "stack trace",
    regex: /\n\s*at\s+.+\(.+:\d+:\d+\)/g,
  },
];

const SENSITIVE_KEY_RE = /(?:secret|password|api[_-]?key|private[_-]?key|authorization|cookie|access[_-]?token|refresh[_-]?token|auth[_-]?token|bearer[_-]?token)/i;
const SOURCE_LIKE_RE = /\b(function|class|const|let|var|import|export)\b[\s\S]{800,}/;

export function containsForbiddenActivityContent(value) {
  if (value == null) return false;
  if (typeof value === "object") {
    return Object.entries(value).some(([key, nestedValue]) => {
      if (
        SENSITIVE_KEY_RE.test(key)
        && nestedValue !== null
        && nestedValue !== undefined
        && nestedValue !== "[REDACTED]"
      ) {
        return true;
      }
      return containsForbiddenActivityContent(nestedValue);
    });
  }
  const text = String(value);
  return ACTIVITY_FORBIDDEN_PATTERNS.some((pattern) => {
    pattern.regex.lastIndex = 0;
    return pattern.regex.test(text);
  }) || SOURCE_LIKE_RE.test(text);
}

export function redactActivityValue(value) {
  if (value == null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactActivityValue(item));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEY_RE.test(key) ? "[REDACTED]" : redactActivityValue(nestedValue),
      ]),
    );
  }

  let text = String(value);
  for (const pattern of ACTIVITY_FORBIDDEN_PATTERNS) {
    pattern.regex.lastIndex = 0;
    text = text.replace(pattern.regex, "[REDACTED]");
  }
  if (SOURCE_LIKE_RE.test(text)) {
    return "[REDACTED_SOURCE_SNIPPET]";
  }
  return text;
}

export function sanitizeActivityPayload(payload = {}) {
  if (payload == null || typeof payload !== "object") {
    return redactActivityValue(payload);
  }
  return redactActivityValue(payload);
}
