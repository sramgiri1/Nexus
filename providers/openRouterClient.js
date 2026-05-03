// providers/openRouterClient.js
// All OpenRouter-specific request building and task-type guard logic lives here.
// Nothing in runner.js should contain OpenRouter-specific body fields.

import fs   from "fs/promises";
import path from "path";

const ROOT = process.cwd();

export async function loadOpenRouterPolicy() {
  try {
    const raw = await fs.readFile(path.join(ROOT, "config", "openrouter-policy.json"), "utf8");
    return JSON.parse(raw);
  } catch { return null; }
}

/**
 * Check whether OpenRouter is blocked for a given task type.
 * Pass a pre-loaded policy to avoid repeated file reads in hot loops.
 */
export async function isOpenRouterBlockedForTask(taskType, orPolicy = null) {
  const policy = orPolicy || await loadOpenRouterPolicy();
  if (!policy?.enabled) return true; // disabled entirely → treat as blocked
  return policy.neverUseFor?.includes(taskType) ?? false;
}

/**
 * Build the full request body for an OpenRouter chat.completions call.
 * Includes provider routing preferences, which are OpenRouter-specific.
 * The API key lives in the client — this body is safe to log (no secrets).
 *
 * @param {{ model, messages, tools, maxTokens, providerPolicy }} opts
 *   providerPolicy — the parsed openrouter-policy.json (or null for defaults)
 * @returns {object} request body
 */
export function buildOpenRouterRequest({ model, messages, tools, maxTokens, providerPolicy }) {
  const body = {
    model,
    max_tokens: maxTokens,
    messages,
  };

  if (tools?.length) {
    body.tools       = tools;
    body.tool_choice = "auto";
  }

  // Provider routing object — controls OpenRouter's internal model selection.
  // Confined here so runner.js stays provider-agnostic.
  body.provider = {
    allow_fallbacks:    providerPolicy?.allowFallbacks    ?? true,
    require_parameters: providerPolicy?.requireParameters ?? true,
    data_collection:    providerPolicy?.dataCollection    ?? "deny",
    sort:               providerPolicy?.providerPreference?.sort ?? "price",
  };

  return body;
}
