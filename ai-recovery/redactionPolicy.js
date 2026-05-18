import {
  containsForbiddenSecretKey,
  containsSecretLikeValue,
  redactObject,
  summarizeRedaction,
} from "../shared/redaction.js";

export const SNAPSHOT_REDACTION_LEVELS = Object.freeze([
  "public_summary",
  "internal_redacted",
  "restricted_metadata",
]);

export const SNAPSHOT_REDACTION_POLICY = Object.freeze({
  rawPromptStorageAllowed: false,
  rawResponseStorageAllowed: false,
  rawToolPayloadStorageAllowed: false,
  rawProjectIdPrimaryUxAllowed: false,
  rawPrivateIdPrimaryUxAllowed: false,
  providerDispatchAllowed: false,
  toolDispatchAllowed: false,
  projectMutationAllowed: false,
  dbWriteAllowed: false,
  deployAllowed: false,
});

const RAW_FIELD_PATTERNS = [
  /raw/i,
  /prompt/i,
  /response/i,
  /payload/i,
  /token/i,
  /secret/i,
  /password/i,
  /private/i,
];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function walkEntries(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => walkEntries(item, `${prefix}[${index}]`));
  }

  if (!value || typeof value !== "object") {
    return [{ path: prefix || "(root)", key: "", value }];
  }

  return Object.entries(value).flatMap(([key, entryValue]) => {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    return [{ path: nextPath, key, value: entryValue }, ...walkEntries(entryValue, nextPath)];
  });
}

export function redactSnapshotPayload(payload = {}) {
  return redactObject(payload);
}

export function summarizeSnapshotRedaction(payload = {}) {
  return summarizeRedaction(payload);
}

export function validateSnapshotRedaction(payload = {}, options = {}) {
  const errors = [];
  const warnings = [];
  const entries = walkEntries(payload);

  for (const entry of entries) {
    if (containsForbiddenSecretKey(entry.key)) {
      errors.push(`forbidden_key:${entry.path}`);
    }

    if (typeof entry.value === "string" && containsSecretLikeValue(entry.value)) {
      errors.push(`secret_like_value:${entry.path}`);
    }

    if (
      options.blockRawFields !== false
      && RAW_FIELD_PATTERNS.some((pattern) => pattern.test(entry.key))
      && normalizeString(entry.value)
    ) {
      warnings.push(`raw_like_field:${entry.path}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateRedactionLevel(level = "") {
  return SNAPSHOT_REDACTION_LEVELS.includes(level);
}
