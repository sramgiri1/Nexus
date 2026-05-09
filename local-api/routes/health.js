import { sendJson, buildEnvelope } from "../safeResponse.js";

export function handleHealth(req, res, { mode }) {
  sendJson(res, 200, buildEnvelope({
    ok: true,
    source: "live-local-api",
    mode,
    data: {
      service: "nexus-local-api",
      phase: "P40-LOCAL",
      apiVersion: "1.0",
      localOnly: true,
      bindHost: "127.0.0.1",
      dbBacked: false,
      providerCallsEnabled: false,
      externalNetworkEnabled: false,
    },
  }));
}
