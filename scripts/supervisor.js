#!/usr/bin/env node
import { spawn } from "child_process";

const RESTART_DELAY_MS = parseInt(process.env.SUPERVISOR_RESTART_DELAY_MS || "1500", 10);
let shuttingDown = false;
let child = null;

function log(message) {
  console.log(`[supervisor] ${message}`);
}

function start() {
  if (shuttingDown) return;

  child = spawn(process.execPath, ["orchestrator/loop.js"], {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });

  log(`started orchestrator pid=${child.pid}`);

  child.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    log(`orchestrator exited (${reason})`);
    child = null;
    if (shuttingDown) return;
    setTimeout(start, RESTART_DELAY_MS);
  });

  child.on("error", (error) => {
    log(`failed to start orchestrator: ${error.message}`);
  });
}

function shutdown(signal) {
  shuttingDown = true;
  log(`shutting down on ${signal}`);
  if (child) {
    child.kill(signal);
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
