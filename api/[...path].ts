import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import portfolioRoutes from "../src/server/routes/portfolio.js";
import forumRoutes from "../src/server/routes/forum.js";
import newsRoutes from "../src/server/routes/news.js";
import learningRoutes from "../src/server/routes/learning.js";

const app = express();

// Vercel may pass the path in different shapes — normalize
app.use((req, _res, next) => {
  // Ensure JSON body is parsed once
  next();
});

app.use(express.json({ limit: "64kb" }));

app.use("/api/portfolio", portfolioRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api", newsRoutes);
app.use("/api/learning", learningRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", platform: "vercel" });
});

// Also accept health without relying on path rewrite quirks
app.get("/health", (_req, res) => {
  res.json({ status: "ok", platform: "vercel" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
