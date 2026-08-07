import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import portfolioRoutes from "../src/server/routes/portfolio.js";
import forumRoutes from "../src/server/routes/forum.js";
import newsRoutes from "../src/server/routes/news.js";
import learningRoutes from "../src/server/routes/learning.js";
import { healthPayload } from "../src/server/health.js";

const app = express();

app.use(express.json({ limit: "64kb" }));

app.use("/api/portfolio", portfolioRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api", newsRoutes);
app.use("/api/learning", learningRoutes);

const health = (_req: express.Request, res: express.Response) =>
  res.json(healthPayload("vercel"));

app.get("/api/health", health);
// Also accept health without relying on path rewrite quirks
app.get("/health", health);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
