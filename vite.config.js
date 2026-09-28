import { defineConfig, loadEnv } from "vite";
import { handleContact } from "./server/contact.js";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    esbuild: { jsx: "automatic" },
    plugins: [
      {
        name: "local-contact-endpoint",
        configureServer(server) {
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
