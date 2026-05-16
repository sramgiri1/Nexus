const REDACTED = "[REDACTED]";
const FORBIDDEN_KEY_PATTERNS = [
  /api[_-]?key/i,
  /token/i,
  /secret/i,
  /password/i,
  /private[_-]?key/i,
  /database[_-]?url/i,
  /provider[_-]?key/i,
];

const SECRET_VALUE_PATTERNS = [
  /^sk-[A-Za-z0-9_-]{12,}/,
  /^xox[baprs]-[A-Za-z0-9-]{10,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /^[A-Za-z0-9_=-]{24,}\.[A-Za-z0-9_=-]{12,}\.[A-Za-z0-9_=-]{12,}$/,
  /postgres(?:ql)?:\/\/[^ \n]+/i,
  /mysql:\/\/[^ \n]+/i,
  /mongodb(?:\+srv)?:\/\/[^ \n]+/i,
  /\b[A-Za-z0-9+/]{36,}={0,2}\b/,
];

export function containsForbiddenSecretKey(key = "") {
  return FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(String(key)));
}

export function containsSecretLikeValue(value = "") {
  if (typeof value !== "string") return false;
  return SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

export function redactValue(value) {
  if (containsSecretLikeValue(value)) return REDACTED;
  return value;
}

export function redactObject(obj) {
  if (Array.isArray(obj)) return obj.map((item) => redactObject(item));
  if (!obj || typeof obj !== "object") return redactValue(obj);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      containsForbiddenSecretKey(key) ? REDACTED : redactObject(value),
    ]),
  );
}

export function summarizeRedaction(payload) {
  const redacted = redactObject(payload);
  const serializedOriginal = JSON.stringify(payload);
  const serializedRedacted = JSON.stringify(redacted);
  return {
    redacted,
    changed: serializedOriginal !== serializedRedacted,
    redactionCount: (serializedRedacted.match(new RegExp(REDACTED, "g")) || []).length,
  };
}
