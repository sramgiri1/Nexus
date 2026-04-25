import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path  from "path";
import fs    from "fs";

export default defineConfig({
  plugins: [
    react(),
    // Plugin to serve ../memory/*.json files at /memory/*
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
  ],
  server: { port: 5173, open: true },
});
