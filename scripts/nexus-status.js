import { buildServiceStatus, summarizeServiceStatus, writeServiceStatusReport } from "../service-orchestration/index.js";

const status = await buildServiceStatus();
writeServiceStatusReport(status);
console.log(summarizeServiceStatus(status));

if (status.errors.length > 0) {
  process.exitCode = 1;
}
