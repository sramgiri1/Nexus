import { runNexusDoctor, summarizeDoctorResult, writeDoctorReport } from "../service-orchestration/index.js";

const result = await runNexusDoctor();
writeDoctorReport(result);
console.log(summarizeDoctorResult(result));

if (result.errors.length > 0) {
  process.exitCode = 1;
}
