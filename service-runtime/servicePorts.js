import net from "node:net";

export function isLocalhostHost(host) {
  return host === "127.0.0.1" || host === "localhost";
}

export function normalizePort(port) {
  if (port === null || port === undefined || port === "") return null;
  const normalized = Number(port);
  if (!Number.isInteger(normalized) || normalized <= 0 || normalized > 65535) return null;
  return normalized;
}

export function checkPortAvailable(port, host = "127.0.0.1") {
  const normalizedPort = normalizePort(port);
  if (normalizedPort === null) {
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
        resolve({ ok: true, host, port: normalizedPort, state: "in_use", error: null });
        return;
      }

      resolve({
        ok: false,
        host,
        port: normalizedPort,
        state: "error",
        error: error?.message || "Unknown port error",
      });
    });

    server.listen({ host, port: normalizedPort }, () => {
      server.close(() => {
        resolve({ ok: true, host, port: normalizedPort, state: "available", error: null });
      });
    });
  });
}
