import { Router, Request, Response } from "express";
import { getMarketNews } from "../services/ai.js";
import {
  getLivePrices,
  getMarketSnapshot,
  marketDataStatus,
  probeMarketConnection,
} from "../services/marketData.js";

const router = Router();

const buckets = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_NEWS = 10;
const MAX_PRICES = 30;

function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

function clientKey(req: Request, suffix: string) {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";
  return `${ip}:${suffix}`;
}

router.get("/news", async (req: Request, res: Response) => {
  if (!rateLimit(clientKey(req, "news"), MAX_NEWS)) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }

  try {
    const news = await getMarketNews();
    return res.json(Array.isArray(news) ? news : []);
  } catch (e: any) {
    console.error("AI Error (News):", e.message || e);
    return res.json([
      {
        headline: "NGX market data temporarily unavailable",
        summary:
          "Live AI market brief could not be generated. Check portfolio prices via the market data provider, or retry shortly.",
        sentiment: "Neutral",
        impact: "No change to your positions from this notice alone.",
        source_url: "#",
      },
    ]);
  }
});

router.post("/live-prices", async (req: Request, res: Response) => {
  if (!rateLimit(clientKey(req, "prices"), MAX_PRICES)) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }

  const symbols = req.body?.symbols;
  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.json({});
  }

  const clean = symbols
    .filter((s: unknown) => typeof s === "string")
    .map((s: string) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30);

  try {
    const prices = await getLivePrices(clean);
    return res.json(prices);
  } catch (e: any) {
    console.error("Live prices error:", e.message || e);
    return res.json({});
  }
});

router.get("/market-snapshot", async (req: Request, res: Response) => {
  if (!rateLimit(clientKey(req, "snapshot"), MAX_NEWS)) {
    return res.status(429).json({ error: "Too many requests." });
  }
  const snap = await getMarketSnapshot();
  if (!snap) {
    return res.status(503).json({ error: "Market snapshot unavailable", status: marketDataStatus() });
  }
  return res.json(snap);
});

/**
 * Diagnostics.
 * - Default: current in-memory status (may be empty on cold start)
 * - ?probe=1: actually calls NGN Market (DANGCEM search + bulk) and returns logs
 */
router.get("/market-status", async (req: Request, res: Response) => {
  const shouldProbe =
    req.query.probe === "1" ||
    req.query.probe === "true" ||
    req.query.probe === undefined; // default probe so cold status is useful

  let probe: any = null;
  if (shouldProbe) {
    try {
      probe = await probeMarketConnection();
    } catch (e: any) {
      probe = { ok: false, error: e?.message || String(e) };
    }
  }

  return res.json({
    ...marketDataStatus(),
    probe,
  });
});

export default router;
