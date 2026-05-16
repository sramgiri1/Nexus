import { readFileSync } from "node:fs";

export const SECRET_LIKE_PATTERNS = [
  { id: "openai-key", pattern: /\bsk-(?!activation\b)[A-Za-z0-9_-]{12,}\b/g },
  { id: "pem-private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { id: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: "database-url", pattern: /\bDATABASE_URL\s*=\s*[^ \n]+/gi },
  { id: "bearer-token", pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/g },
  { id: "oauth-client-secret", pattern: /\boauth[_-]?client[_-]?secret\s*[:=]\s*[^ \n]+/gi },
];

const ALLOWLIST = ["sk-activation"];

export function scanTextForSecretLikeValues(text = "", options = {}) {
  const findings = [];
  for (const { id, pattern } of SECRET_LIKE_PATTERNS) {
    for (const match of String(text).matchAll(pattern)) {
      const value = match[0];
      if ([...(options.allowlist || []), ...ALLOWLIST].includes(value)) continue;
      findings.push({ patternId: id, index: match.index, preview: "[REDACTED]" });
    }
  }
  return findings;
}

export function scanFileForSecretLikeValues(filePath, options = {}) {
  if (/\/?\.env(\.|$)/.test(filePath)) {
    return [{ patternId: "blocked-env-read", index: 0, preview: "[ENV FILE READ BLOCKED]" }];
  }
  return scanTextForSecretLikeValues(readFileSync(filePath, "utf8"), options);
}

export function redactSecretLikeText(text = "") {
  let output = String(text);
  for (const { pattern } of SECRET_LIKE_PATTERNS) {
    output = output.replace(pattern, (value) => (ALLOWLIST.includes(value) ? value : "[REDACTED_SECRET]"));
  }
  return output;
}

export function assertNoSecretLikeValuesInFiles(files = [], options = {}) {
  const findings = [];
  for (const file of files) {
    const fileFindings = scanFileForSecretLikeValues(file, options).map((finding) => ({ file, ...finding }));
    findings.push(...fileFindings);
  }
  return { ok: findings.length === 0, findings };
}
