import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import portfolioRoutes from "./routes/portfolio.js";
import forumRoutes from "./routes/forum.js";
import newsRoutes from "./routes/news.js";
import learningRoutes from "./routes/learning.js";
import { db } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();
  app.use(express.json());

  // Mock User Initialization for SQLite
  const defaultUser = db.prepare("SELECT * FROM users WHERE username = ?").get("investor_naija");
  if (!defaultUser) {
    db.prepare("INSERT INTO users (username, email) VALUES (?, ?)").run("investor_naija", "naija@example.com");
    
    // Add some initial investments
    db.prepare("INSERT INTO investments (user_id, type, symbol, name, entry_price, quantity, date_acquired) VALUES (?, ?, ?, ?, ?, ?, ?)").run(1, 'stock', 'DANGCEM', 'Dangote Cement', 280.00, 1500, '2022-01-01');
    db.prepare("INSERT INTO investments (user_id, type, symbol, name, entry_price, quantity, date_acquired) VALUES (?, ?, ?, ?, ?, ?, ?)").run(1, 'stock', 'GTCO', 'GTBank', 31.50, 3000, '2022-02-01');
    db.prepare("INSERT INTO investments (user_id, type, symbol, name, entry_price, quantity, date_acquired) VALUES (?, ?, ?, ?, ?, ?, ?)").run(1, 'stock', 'MTNN', 'MTN Nigeria', 180.00, 1200, '2022-03-01');
    db.prepare("INSERT INTO investments (user_id, type, symbol, name, entry_price, quantity, date_acquired) VALUES (?, ?, ?, ?, ?, ?, ?)").run(1, 'tbill', '91-Day T-Bill', '91-Day T-Bill 6.75%', 1440000, 1, '2022-05-12');

    // Add some initial forum posts
    db.prepare("INSERT INTO forum_posts (user_id, category, title, content) VALUES (?, ?, ?, ?)").run(1, 'Stock Talk', 'Is Dangote Cement undervalued at current price?', 'Community discussion about Dangote Cement valuation.');
    db.prepare("INSERT INTO forum_posts (user_id, category, title, content) VALUES (?, ?, ?, ?)").run(1, 'Investment Strategies', 'Best long term dividend stocks in Nigeria?', 'Looking for recommendations for dividend growth.');
  }

  // API Routes
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/forum", forumRoutes);
  app.use("/api", newsRoutes); // This handles /api/news and /api/live-prices
  app.use("/api/learning", learningRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Vite or Static Assets
  if (process.env.NODE_ENV === "development") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note: Adjusted path for build
    const distPath = path.resolve(__dirname, "../../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}
