#!/usr/bin/env node
// scripts/reset-memory.js — reset memory files to defaults (preserves projects)
import fs   from "fs/promises";
import path from "path";

const ROOT = process.cwd();
console.log("Resetting task queue...");
await fs.writeFile(path.join(ROOT,"memory","task-queue.json"), JSON.stringify({lastUpdated:new Date().toISOString(),queue:[],completed:[],failed:[]},null,2));
console.log("✓ task-queue.json reset");
console.log("\nMemory reset complete. Portfolio and agent status preserved.");
console.log("Run: npm run status  to verify.");
