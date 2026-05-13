import process from "node:process";

import { stopAllServices, readServiceState, getServiceStateEntry } from "../service-runtime/index.js";

const stateBefore = readServiceState();
const results = await stopAllServices();
const failed = results.some((result) => result.ok !== true && result.action !== "skipped");

console.log("NEXUS OS Local Shutdown\n=======================");
console.log("Services:");
for (const result of results) {
  const label = getServiceStateEntry(stateBefore, result.serviceId)?.label || result.serviceId || "unknown";
  console.log(`- ${label}: ${result.action}${result.reason ? ` (${result.reason})` : ""}`);
}
console.log(`Result: ${failed ? "FAIL" : "PASS"}`);

if (failed) {
  process.exitCode = 1;
}
