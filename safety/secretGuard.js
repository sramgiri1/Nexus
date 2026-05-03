// safety/secretGuard.js
// Scans file content for high-confidence secret patterns before write.
// Synchronous — no I/O, runs inline on every write_file call.

const SECRET_PATTERNS = [
  { name: "anthropic_key",  re: /sk-ant-[a-zA-Z0-9\-_]{30,}/g },
  { name: "openai_key",     re: /sk-(?:proj-)?[a-zA-Z0-9]{32,}/g },
  { name: "aws_access_key", re: /AKIA[A-Z0-9]{16}/g },
  { name: "github_token",   re: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
  { name: "private_key",    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "stripe_key",     re: /(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,}/g },
  { name: "sendgrid_key",   re: /SG\.[a-zA-Z0-9\-_]{22,}\.[a-zA-Z0-9\-_]{43,}/g },
  // JWT: three base64url segments — common form for Supabase anon/service keys
  { name: "jwt_token",      re: /eyJ[a-zA-Z0-9_-]{16,}\.[a-zA-Z0-9_-]{16,}\.[a-zA-Z0-9_-]{16,}/g },
  // Database URLs with embedded credentials: protocol://user:pass@host
  { name: "database_url",   re: /(?:postgresql|postgres|mysql|mongodb|redis):\/\/[^\s:@/]+:[^@\s]{4,}@/gi },
  // Resend API key
  { name: "resend_key",     re: /re_[a-zA-Z0-9]{32,}/g },
];

const ENV_ASSIGNMENT_RE = /^(?:ANTHROPIC|OPENAI|AWS|STRIPE|SENDGRID|RESEND|SUPABASE|DATABASE)[_A-Z]*\s*=\s*[^\s]{16,}/m;

// Extensions that should not be secret-scanned (docs, existing configs checked in)
const SKIP_EXTENSIONS = new Set([".md", ".txt", ".lock", ".png", ".jpg", ".gif", ".pdf"]);

export const secretGuard = {
  check(content, filePath = "") {
    if (!content || content.length < 20) return { allowed: true };

    const ext = filePath.includes(".") ? "." + filePath.split(".").pop().toLowerCase() : "";
    if (SKIP_EXTENSIONS.has(ext)) return { allowed: true };

    for (const { name, re } of SECRET_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(content)) {
        return {
          allowed: false,
          reason:  `Potential secret detected (${name}) in file content — write blocked`,
          pattern: name,
        };
      }
    }

    // Extra check for .env files or files with env-like assignments
    const base = filePath.split("/").pop() || "";
    if (base === ".env" || base.startsWith(".env.") || ext === ".env") {
      if (ENV_ASSIGNMENT_RE.test(content)) {
        return {
          allowed: false,
          reason:  "Potential .env secret assignment detected — write blocked",
          pattern: "env_assignment",
        };
      }
    }

    return { allowed: true };
  },
};
