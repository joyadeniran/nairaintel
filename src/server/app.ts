import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import portfolioRoutes from "./routes/portfolio.js";
import forumRoutes from "./routes/forum.js";
import newsRoutes from "./routes/news.js";
import learningRoutes from "./routes/learning.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  // Limit JSON body size to reduce abuse surface
  app.use(express.json({ limit: "64kb" }));

  // API Routes
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/forum", forumRoutes);
  app.use("/api", newsRoutes);
  app.use("/api/learning", learningRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  });

  if (process.env.NODE_ENV === "development") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "../../dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}
