import { defineConfig, loadEnv } from "vite";
import { handleStore } from "./server/store.js";
import { handleContact } from "./server/contact.js";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    esbuild: { jsx: "automatic" },
    plugins: [
      {
        name: "local-contact-endpoint",
        configureServer(server) {
          server.middlewares.use("/api/store", async (req, res) => {
            const query = Object.fromEntries(
              new URL(req.url, "http://localhost").searchParams,
            );
            const chunks = [];
            let size = 0;
            try {
              for await (const chunk of req) {
                size += chunk.length;
                if (size <= 4300000) chunks.push(chunk);
              }
              const result =
                size > 4300000
                  ? { status: 413, body: { error: "Request too large" } }
                  : await handleStore(
                      {
                        method: req.method,
                        query,
                        body: Buffer.concat(chunks).toString("utf8"),
                        contentType: req.headers["content-type"],
                        token: (req.headers.authorization || "").replace(
                          /^Bearer /i,
                          "",
                        ),
                        ip: req.socket.remoteAddress,
                      },
                      env,
                    );
              res.statusCode = result.status;
              res.setHeader("Content-Type", "application/json");
              res.setHeader("Cache-Control", "no-store");
              res.end(JSON.stringify(result.body));
            } catch {
              res.statusCode = 503;
              res.end(JSON.stringify({ error: "Service unavailable" }));
            }
          });
          server.middlewares.use("/api/contact", async (req, res) => {
            const chunks = [];
            let size = 0;
            let exceeded = false;
            try {
              for await (const chunk of req) {
                size += chunk.length;
                if (size > 12000) exceeded = true;
                if (!exceeded) chunks.push(chunk);
              }
            } catch {
              if (!res.destroyed) {
                res.statusCode = 400;
                res.end();
              }
              return;
            }
            const body = Buffer.concat(chunks).toString("utf8");
            const result = exceeded
              ? { status: 413, body: { error: "Request too large" } }
              : await handleContact(
                  {
                    method: req.method,
                    body,
                    ip: req.socket.remoteAddress,
                    contentType: req.headers["content-type"] || "",
                  },
                  env,
                );
            res.statusCode = result.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result.body));
          });
        },
      },
    ],
  };
});
