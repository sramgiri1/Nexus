import { createWriteStream, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

import { checkServiceHealth, waitForServiceHealthy } from "./serviceHealth.js";
import { loadServiceManifest, validateServiceManifest, listServices, getServiceById } from "./serviceManifest.js";
import { checkPortAvailable, isLocalhostHost } from "./servicePorts.js";
import {
  ensureServiceRuntimePaths,
  getServiceStatePaths,
  loadServiceState,
  saveServiceState,
  getServiceStateEntry,
  upsertServiceStateEntry,
} from "./serviceStateStore.js";

const ROOT = process.cwd();

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function buildSafeEnv(service) {
  const env = {
    NEXUS_MODE: "local-private",
    NODE_ENV: "development",
  };

  for (const key of ["PATH", "HOME", "USER", "TMPDIR", "TMP", "TEMP", "SHELL", "TERM"]) {
    if (process.env[key]) env[key] = process.env[key];
  }

  for (const [key, value] of Object.entries(service.env || {})) {
    env[key] = String(value);
  }

  return env;
}

function redactLogChunk(chunk) {
  return String(chunk)
    .replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED_KEY]")
    .replace(/(OPENAI_API_KEY|ANTHROPIC_API_KEY|DATABASE_URL)=\S+/g, "$1=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]");
}

function getSpawnCommand(service) {
  if (service.command === "npm") {
    return {
      command: npmCommand(),
      args: Array.isArray(service.args) ? service.args : [],
    };
  }

  return {
    command: service.command,
    args: Array.isArray(service.args) ? service.args : [],
  };
}

function pidExists(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isManagedProcessAlive(entry) {
  return entry?.managedByNexus === true && pidExists(entry?.pid);
}

export function readServiceState() {
  return loadServiceState();
}

export function writeServiceState(state) {
  return saveServiceState(state);
}

export function isServiceRunning(serviceState) {
  return serviceState?.status === "running" && pidExists(serviceState?.pid);
}

export function validateLocalOnlyService(service) {
  const errors = [];
  if (!service) errors.push("Service missing.");
  if (service?.enabled === true && !isLocalhostHost(service.host)) {
    errors.push(`${service.id} must bind to 127.0.0.1 or localhost.`);
  }
  if (service?.externalNetworkAllowed !== false) {
    errors.push(`${service?.id || "service"} must keep externalNetworkAllowed false.`);
  }
  if (service?.modeRequired !== "local-private") {
    errors.push(`${service?.id || "service"} must require local-private mode.`);
  }
  if (service?.writesAllowed === true && service.id !== "db") {
    errors.push(`${service.id} must not allow writes in P41.6.2.`);
  }
  return { ok: errors.length === 0, errors };
}

export async function buildBootPlan(options = {}) {
  const manifestResult = loadServiceManifest();
  if (!manifestResult.ok) {
    return { ok: false, errors: [...manifestResult.errors], warnings: [], services: [] };
  }

  const validation = validateServiceManifest(manifestResult.manifest);
  if (!validation.ok) {
    return { ok: false, errors: [...validation.errors], warnings: [...validation.warnings], services: [] };
  }

  const serviceState = readServiceState();
  const requestedId = options.serviceId || null;
  const skipDashboard = options.skipDashboard === true;
  const services = listServices(manifestResult.manifest)
    .filter((service) => (requestedId ? service.id === requestedId : true))
    .sort((a, b) => (a.startOrder || 999) - (b.startOrder || 999));

  const plan = [];
  const warnings = [];
  const errors = [];

  for (const service of services) {
    if (skipDashboard && service.id === "command-center") {
      plan.push({ service, action: "skipped", reason: "Skipped by CLI option." });
      continue;
    }

    const boundary = validateLocalOnlyService(service);
    if (!boundary.ok) {
      errors.push(...boundary.errors);
      plan.push({ service, action: "failed", reason: boundary.errors.join("; ") });
      continue;
    }

    if (service.enabled !== true) {
      plan.push({ service, action: "disabled", reason: service.currentPhaseBehavior || "Disabled by design." });
      continue;
    }

    const stateEntry = getServiceStateEntry(serviceState, service.id);
    const health = await checkServiceHealth(service, { timeoutMs: 1000 });
    const port = await checkPortAvailable(service.port, service.host);
    const managedAlive = isManagedProcessAlive(stateEntry);

    if (managedAlive && health.ok) {
      plan.push({ service, action: "already-running", reason: "Managed by NEXUS." });
      continue;
    }

    if (health.ok) {
      plan.push({ service, action: "already-running", reason: "Service already healthy outside NEXUS management." });
      continue;
    }

    if (port.state === "in_use") {
      const message = `${service.label} port ${service.port} is already in use and not healthy.`;
      if (options.force && managedAlive) {
        warnings.push(`Force restart requested for ${service.id}.`);
        plan.push({ service, action: "restart", reason: message });
      } else {
        errors.push(message);
        plan.push({ service, action: "failed", reason: message });
      }
      continue;
    }

    plan.push({ service, action: options.dryRun ? "would-start" : "start", reason: "Eligible to start." });
  }

  return { ok: errors.length === 0, manifest: manifestResult.manifest, services: plan, warnings, errors };
}

export async function startService(service, options = {}) {
  ensureServiceRuntimePaths();
  const { logsDir } = getServiceStatePaths();
  const cwd = resolve(ROOT, service.cwd || ".");
  const logPath = join(logsDir, `${service.id}.log`);
  const logStream = createWriteStream(logPath, { flags: "a" });

  const { command, args } = getSpawnCommand(service);
  const child = spawn(command, args, {
    cwd,
    env: buildSafeEnv(service),
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => logStream.write(redactLogChunk(chunk)));
  child.stderr.on("data", (chunk) => logStream.write(redactLogChunk(chunk)));

  const exitedEarly = await new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(async () => {
      if (settled) return;
      settled = true;
      const health = await waitForServiceHealthy(service, { timeoutMs: service.startupTimeoutMs || 20000 });
      resolve({ exited: false, health });
    }, 250);

    child.once("exit", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        exited: true,
        code,
        signal,
        health: {
          ok: false,
          error: `Process exited before health check (${code ?? signal ?? "unknown"}).`,
        },
      });
    });
  });

  child.unref();

  if (exitedEarly.exited || !exitedEarly.health.ok) {
    return {
      ok: false,
      service,
      state: {
        id: service.id,
        label: service.label,
        status: "failed",
        pid: child.pid || null,
        port: service.port ?? null,
        host: service.host,
        startedAt: new Date().toISOString(),
        stoppedAt: new Date().toISOString(),
        healthUrl: service.healthUrl || null,
        logPath: logPath.replace(`${ROOT}/`, ""),
        lastError: exitedEarly.health.error || "Service failed to become healthy",
        managedByNexus: true,
      },
    };
  }

  return {
    ok: true,
    service,
    state: {
      id: service.id,
      label: service.label,
      status: "running",
      pid: child.pid || null,
      port: service.port ?? null,
      host: service.host,
      startedAt: new Date().toISOString(),
      stoppedAt: null,
      healthUrl: service.healthUrl || null,
      logPath: logPath.replace(`${ROOT}/`, ""),
      lastError: "",
      managedByNexus: true,
    },
  };
}

function killManagedPid(entry, signal) {
  if (!entry?.managedByNexus || !Number.isInteger(entry.pid)) return false;
  try {
    process.kill(-entry.pid, signal);
    return true;
  } catch {
    try {
      process.kill(entry.pid, signal);
      return true;
    } catch {
      return false;
    }
  }
}

async function waitForPidExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!pidExists(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return !pidExists(pid);
}

export async function stopService(serviceId, options = {}) {
  const state = readServiceState();
  const entry = getServiceStateEntry(state, serviceId);
  if (!entry) {
    return {
      ok: true,
      serviceId,
      action: "skipped",
      reason: "No service state entry found.",
      state,
    };
  }

  if (entry.managedByNexus !== true) {
    const nextState = writeServiceState(upsertServiceStateEntry(state, {
      ...entry,
      status: pidExists(entry.pid) ? "running" : "stopped",
      stoppedAt: pidExists(entry.pid) ? entry.stoppedAt : new Date().toISOString(),
      lastError: pidExists(entry.pid) ? entry.lastError || "Unmanaged process preserved." : "",
    }));
    return {
      ok: true,
      serviceId,
      action: "skipped",
      reason: "Process is not managed by NEXUS.",
      state: nextState,
    };
  }

  if (!pidExists(entry.pid)) {
    const nextState = writeServiceState(upsertServiceStateEntry(state, {
      ...entry,
      status: "stopped",
      stoppedAt: new Date().toISOString(),
      lastError: "",
    }));
    return {
      ok: true,
      serviceId,
      action: "stopped",
      reason: "PID no longer exists; marked stopped.",
      state: nextState,
    };
  }

  killManagedPid(entry, "SIGTERM");
  let stopped = await waitForPidExit(entry.pid, options.shutdownTimeoutMs || entry.shutdownTimeoutMs || 15000);
  let forced = false;

  if (!stopped) {
    forced = killManagedPid(entry, "SIGKILL");
    stopped = await waitForPidExit(entry.pid, 2000);
  }

  const nextState = writeServiceState(upsertServiceStateEntry(state, {
    ...entry,
    status: stopped ? "stopped" : "failed",
    stoppedAt: new Date().toISOString(),
    lastError: stopped ? "" : "Managed process did not stop cleanly.",
  }));

  return {
    ok: stopped,
    serviceId,
    action: stopped ? "stopped" : "failed",
    reason: stopped ? (forced ? "Stopped after SIGKILL." : "Stopped after SIGTERM.") : "Managed process still running after shutdown attempt.",
    state: nextState,
  };
}

export async function stopAllServices(options = {}) {
  const manifestResult = loadServiceManifest();
  const state = readServiceState();
  const manifestServices = manifestResult.ok ? listServices(manifestResult.manifest) : [];
  const candidates = [...manifestServices]
    .filter((service) => getServiceStateEntry(state, service.id))
    .sort((a, b) => (b.stopOrder || 0) - (a.stopOrder || 0));

  const results = [];
  for (const service of candidates) {
    results.push(await stopService(service.id, { shutdownTimeoutMs: service.shutdownTimeoutMs || options.shutdownTimeoutMs }));
  }
  return results;
}
