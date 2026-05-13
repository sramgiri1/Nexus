import net from "node:net";

export function isLocalhostHost(host) {
  return host === "127.0.0.1" || host === "localhost";
}

export function normalizePort(port) {
  if (port === null || port === undefined || port === "") return null;
  const parsed = Number(port);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return null;
  }
  return parsed;
}

export function checkPortAvailable(port, host = "127.0.0.1") {
  const normalizedPort = normalizePort(port);
  if (!normalizedPort) {
    return Promise.resolve({
      ok: true,
      host,
      port: null,
      state: "not_applicable",
      error: null,
    });
  }

  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.once("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        resolve({
          ok: true,
          host,
          port: normalizedPort,
          state: "in_use",
          error: null,
        });
        return;
      }
      resolve({
        ok: false,
        host,
        port: normalizedPort,
        state: "error",
        error: error?.message || "unknown port check error",
      });
    });

    server.listen({ host, port: normalizedPort }, () => {
      server.close(() => {
        resolve({
          ok: true,
          host,
          port: normalizedPort,
          state: "available",
          error: null,
        });
      });
    });
  });
}

export async function summarizePortStatus(services) {
  const checks = await Promise.all(
    (services || []).map(async (service) => ({
      id: service.id,
      label: service.label,
      required: service.required === true,
      enabled: service.enabled === true,
      host: service.host || "127.0.0.1",
      port: normalizePort(service.port),
      result: await checkPortAvailable(service.port, service.host || "127.0.0.1"),
    })),
  );

  const summary = {
    total: checks.length,
    available: checks.filter((entry) => entry.result.state === "available").length,
    inUse: checks.filter((entry) => entry.result.state === "in_use").length,
    notApplicable: checks.filter((entry) => entry.result.state === "not_applicable").length,
    errors: checks.filter((entry) => entry.result.state === "error").length,
  };

  return { checks, summary };
}
