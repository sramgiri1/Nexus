import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path  from "path";
import fs    from "fs";

export default defineConfig({
  plugins: [
    react(),

    // Serve ../memory/*.json at /memory/*
    {
      name: "memory-serve",
      configureServer(server) {
        server.middlewares.use("/memory", (req, res, next) => {
          const file = path.resolve(__dirname, "../memory", req.url.replace(/^\//, "").split("?")[0]);
          if (fs.existsSync(file) && file.endsWith(".json")) {
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-cache");
            res.end(fs.readFileSync(file, "utf8"));
          } else {
            next();
          }
        });
      },
    },

    // Skill runner API — POST /api/skill { agent, skill, input }
    {
      name: "skill-api",
      configureServer(server) {
        server.middlewares.use("/api/skill", (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405; res.end("Method Not Allowed"); return;
          }
          let body = "";
          req.on("data", chunk => { body += chunk; });
          req.on("end", async () => {
            try {
              const { agent, skill, input } = JSON.parse(body);
              const skillsPath = path.resolve(__dirname, "../skills/index.js");
              // Use a cache-busted import to get fresh results
              const mod = await import(`${skillsPath}?t=${Date.now()}`).catch(
                () => import(skillsPath)
              );
              const result = await mod.executeSkill(agent, skill, input || {});
              res.setHeader("Content-Type", "application/json");
              res.setHeader("Cache-Control", "no-cache");
              res.end(JSON.stringify(result));
            } catch (e) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 500;
              res.end(JSON.stringify({
                result: "FAIL",
                summary: e.message || "Skill execution failed",
                issues: [{ severity: "error", message: String(e.message) }],
                data: null,
              }));
            }
          });
        });
      },
    },
  ],
  server: { port: 5173, open: true },
});
