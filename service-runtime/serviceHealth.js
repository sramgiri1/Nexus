import http from "node:http";
import https from "node:https";

import { checkPortAvailable } from "./servicePorts.js";

function requestUrl(url, timeoutMs = 2000) {
  const client = url.startsWith("https:") ? https : http;

  return new Promise((resolve) => {
    const request = client.get(url, { timeout: timeoutMs }, (response) => {
      response.resume();
      resolve({
        ok: true,
        statusCode: response.statusCode || 0,
      });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, statusCode: 0, error: "timeout" });
    });

    request.on("error", (error) => {
      resolve({ ok: false, statusCode: 0, error: error.message });
    });
  });
}

export async function checkServiceHealth(service, options = {}) {
  if (!service?.healthUrl) {
    const port = await checkPortAvailable(service?.port, service?.host || "127.0.0.1");
    return {
      ok: port.ok && port.state === "in_use",
      state: port.state === "in_use" ? "healthy" : "unreachable",
      via: "port",
      statusCode: null,
      error: port.error,
    };
  }

  const response = await requestUrl(service.healthUrl, options.timeoutMs || 2000);
  return {
    ok: response.ok,
    state: response.ok ? "healthy" : "unreachable",
    via: "http",
    statusCode: response.statusCode || null,
    error: response.error || null,
  };
}

export async function waitForServiceHealthy(service, options = {}) {
  const timeoutMs = options.timeoutMs || service.startupTimeoutMs || 20000;
  const intervalMs = options.intervalMs || 500;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await checkServiceHealth(service, options);
    if (result.ok) return result;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    ok: false,
    state: "unreachable",
    via: "timeout",
    statusCode: null,
    error: `Timed out waiting for ${service.label} to become healthy`,
  };
}
