#!/usr/bin/env node
// scripts/skill.js
// Run a skill directly from the CLI.
//
// Usage:
//   npm run skill <agent> <skill> [--input '{"key":"val"}']
//   npm run skill auditor code.lint
//   npm run skill auditor code.diff_review --input '{"base":"HEAD~2"}'
//   npm run skill sentinel qa.tests.execute
//   npm run skill warden compliance.privacy.check
//   npm run skill nexus read.system_state
//   npm run skill -- --list    ← list all available skills

import "dotenv/config";
import { executeSkill, listSkills } from "../skills/index.js";

const args = process.argv.slice(2);

if (args.includes("--list") || args[0] === "list") {
  const skills = listSkills();
  console.log("\nAvailable skills:\n");
  let lastAgent = "";
  for (const { key, agent, skill } of skills) {
    if (agent !== lastAgent) { console.log(`  ${agent.toUpperCase()}`); lastAgent = agent; }
    console.log(`    npm run skill ${agent} ${skill}`);
  }
  console.log();
  process.exit(0);
}

const [agent, skill, ...rest] = args;

if (!agent || !skill) {
  console.error("Usage: npm run skill <agent> <skill> [--input '{...}']");
  console.error("       npm run skill -- --list");
  process.exit(1);
}

let input = {};
const inputIdx = rest.indexOf("--input");
if (inputIdx !== -1 && rest[inputIdx + 1]) {
  try {
    input = JSON.parse(rest[inputIdx + 1]);
  } catch {
    console.error("Error: --input must be valid JSON");
    process.exit(1);
  }
}

console.log(`\n⚙  Running skill: ${agent}.${skill}`);
if (Object.keys(input).length) console.log(`   Input: ${JSON.stringify(input)}`);
console.log();

const result = await executeSkill(agent, skill, input);

const icon = result.result === "PASS" ? "✓" : result.result === "FAIL" ? "✗" : "ℹ";
const color = result.result === "PASS" ? "\x1b[32m" : result.result === "FAIL" ? "\x1b[31m" : "\x1b[36m";
const reset = "\x1b[0m";

console.log(`${color}${icon} ${result.result}${reset}  ${result.summary}`);

if (result.issues?.length) {
  console.log("\n  Issues:");
  result.issues.forEach(i => {
    const c = i.severity === "error" ? "\x1b[31m" : "\x1b[33m";
    console.log(`  ${c}[${i.severity}]${reset} ${i.message}`);
  });
}

if (result.data) {
  console.log("\n  Data:");
  console.log("  " + JSON.stringify(result.data, null, 2).replace(/\n/g, "\n  "));
}

console.log();
process.exit(result.result === "FAIL" ? 1 : 0);
