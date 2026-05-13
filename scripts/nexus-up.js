import process from "node:process";

import {
  buildBootPlan,
  startService,
  readServiceState,
  writeServiceState,
  upsertServiceStateEntry,
} from "../service-runtime/index.js";

function parseArgs(argv) {
  const args = { dryRun: false, dev: false, force: false, skipDashboard: false, serviceId: null };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--dry-run") args.dryRun = true;
    else if (token === "--dev") args.dev = true;
    else if (token === "--force") args.force = true;
    else if (token === "--skip-dashboard") args.skipDashboard = true;
    else if (token === "--service") {
      args.serviceId = argv[index + 1] || null;
      index += 1;
    }
  }
  return args;
}

const options = parseArgs(process.argv.slice(2));
process.env.NEXUS_MODE = "local-private";

const plan = await buildBootPlan(options);
if (!plan.ok) {
  console.log("NEXUS OS Local Boot\n===================");
  console.log("Mode: local-private");
  for (const error of plan.errors) console.log(`- ERROR: ${error}`);
  console.log("Result: FAIL");
  process.exit(1);
}

let state = readServiceState();
const results = [];

for (const item of plan.services) {
  const { service, action, reason } = item;
  if (action === "disabled") {
    const detail = service.id === "db"
      ? "disabled, file-backed fallback active"
      : "disabled, planned";
    results.push({ label: service.label, status: "skipped", detail });
    continue;
  }

  if (action === "skipped") {
    results.push({ label: service.label, status: "skipped", detail: reason });
    continue;
  }

  if (action === "failed") {
    results.push({ label: service.label, status: "failed", detail: reason });
    continue;
  }

  if (action === "already-running") {
    state = writeServiceState(upsertServiceStateEntry(state, {
      id: service.id,
      label: service.label,
      status: "running",
      pid: null,
      port: service.port ?? null,
      host: service.host,
      startedAt: null,
      stoppedAt: null,
      healthUrl: service.healthUrl || null,
      logPath: "",
      lastError: "",
      managedByNexus: false,
    }));
    results.push({ label: service.label, status: "running", detail: reason });
    continue;
  }

  if (options.dryRun) {
    results.push({ label: service.label, status: "planned", detail: reason });
    continue;
  }

  const started = await startService(service, options);
  state = writeServiceState(upsertServiceStateEntry(state, started.state));
  results.push({
    label: service.label,
    status: started.ok ? "running" : "failed",
    detail: started.ok ? `Managed PID ${started.state.pid}` : started.state.lastError,
  });
}

const requiredFailures = plan.services
  .filter((item) => item.service.required === true)
  .some((item) => {
    const result = results.find((entry) => entry.label === item.service.label);
    return result && result.status === "failed";
  });

console.log("NEXUS OS Local Boot\n===================");
console.log("Mode: local-private");
console.log("Services:");
for (const result of results) {
  console.log(`- ${result.label}: ${result.status}${result.detail ? ` (${result.detail})` : ""}`);
}
console.log("Open:");
console.log("http://127.0.0.1:5173");
console.log("Safety:");
console.log("- External network: disabled");
console.log("- Provider calls: disabled");
console.log("- DB writes: disabled");
console.log("- Bind address: 127.0.0.1");

if (requiredFailures) {
  process.exitCode = 1;
}
