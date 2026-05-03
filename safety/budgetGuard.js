// safety/budgetGuard.js
// Tracks token + cost usage per day/month/agent.
// Reads limits from guardrails/budget.json.
// Writes actuals to memory/system-usage.json.

import fs   from "fs/promises";
import path from "path";
import { loadConfig } from "./config.js";

const ROOT       = process.cwd();
const USAGE_FILE = path.join(ROOT, "memory", "system-usage.json");

async function readUsage() {
  try {
    const raw = await fs.readFile(USAGE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { daily: {}, monthly: {}, perAgent: {}, lastUpdated: new Date().toISOString() };
  }
}

async function writeUsage(usage) {
  usage.lastUpdated = new Date().toISOString();
  await fs.writeFile(USAGE_FILE, JSON.stringify(usage, null, 2));
}

export const budgetGuard = {
  async check(agentId, estimatedTokens, estimatedCost) {
    const config = await loadConfig("budget");
    const usage  = await readUsage();
    const today  = new Date().toISOString().slice(0, 10);

    const dailyTokens = (usage.daily[today]?.tokens || 0);
    const dailyCost   = (usage.daily[today]?.cost_usd || 0);

    if (dailyTokens + estimatedTokens > config.limits.daily_tokens) {
      return {
        allowed: false,
        reason: `Daily token limit reached (${dailyTokens.toLocaleString()} used / ${config.limits.daily_tokens.toLocaleString()} limit)`,
      };
    }
    if (dailyCost + estimatedCost > config.limits.daily_cost_usd) {
      return {
        allowed: false,
        reason: `Daily cost limit reached ($${dailyCost.toFixed(2)} used / $${config.limits.daily_cost_usd} limit)`,
      };
    }
    return { allowed: true };
  },

  async recordUsage(agentId, inputTokens, outputTokens, model, opts = {}) {
    const { provider, executionMode, taskType, fallbackUsed, batchId } = opts;

    const config = await loadConfig("budget");
    const costs  = config.model_costs[model] || config.default_model_costs;
    // Batch calls cost half; local (Ollama) calls cost nothing
    const modeMultiplier = provider === "ollama" ? 0 : (executionMode === "batch" ? 0.5 : 1.0);
    const baseCost = (inputTokens / 1000) * costs.input_per_1k + (outputTokens / 1000) * costs.output_per_1k;
    const cost     = baseCost * modeMultiplier;
    const tokens   = inputTokens + outputTokens;

    const usage = await readUsage();
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);

    if (!usage.daily[today]) usage.daily[today] = { tokens: 0, cost_usd: 0 };
    usage.daily[today].tokens   += tokens;
    usage.daily[today].cost_usd += cost;

    // Track by provider within daily
    if (provider) {
      if (!usage.daily[today].byProvider) usage.daily[today].byProvider = {};
      if (!usage.daily[today].byProvider[provider]) usage.daily[today].byProvider[provider] = { tokens: 0, cost_usd: 0 };
      usage.daily[today].byProvider[provider].tokens   += tokens;
      usage.daily[today].byProvider[provider].cost_usd += cost;
    }

    if (!usage.monthly[month]) usage.monthly[month] = { tokens: 0, cost_usd: 0 };
    usage.monthly[month].tokens   += tokens;
    usage.monthly[month].cost_usd += cost;

    if (agentId) {
      if (!usage.perAgent[agentId]) usage.perAgent[agentId] = { tokens: 0, cost_usd: 0 };
      usage.perAgent[agentId].tokens   += tokens;
      usage.perAgent[agentId].cost_usd += cost;
    }

    // Append recent entry with full metadata (capped at 200)
    if (!usage.recentEntries) usage.recentEntries = [];
    usage.recentEntries.push({
      timestamp:        new Date().toISOString(),
      agentId,
      provider:         provider    || "unknown",
      model,
      executionMode:    executionMode || "realtime",
      taskType:         taskType    || null,
      inputTokens,
      outputTokens,
      estimatedCostUsd: cost,
      fallbackUsed:     fallbackUsed || false,
      batchId:          batchId     || null,
    });
    if (usage.recentEntries.length > 200) usage.recentEntries = usage.recentEntries.slice(-200);

    await writeUsage(usage);
    return { tokens, cost_usd: cost };
  },

  estimateCost(model, estimatedTokens) {
    // Rough: 60% input, 40% output tokens
    const inputTokens  = Math.floor(estimatedTokens * 0.6);
    const outputTokens = Math.floor(estimatedTokens * 0.4);
    // Default to Sonnet pricing as conservative estimate
    return (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;
  },
};
