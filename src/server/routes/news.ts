import { Router, Request, Response, NextFunction } from "express";
import { getMarketNews } from "../services/ai.js";
import {
  getLivePrices,
  getMarketSnapshot,
  probeMarketConnection,
} from "../services/marketData.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const buckets = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_NEWS = 10;
const MAX_PRICES = 30;
const BUCKET_CLEANUP_INTERVAL = 5 * 60_000;

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

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.reset) buckets.delete(key);
  }
}, BUCKET_CLEANUP_INTERVAL).unref();

function clientKey(req: Request, suffix: string) {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";
  return `${ip}:${suffix}`;
}

function sanitizeSymbols(input: unknown): string[] {
  let list: string[] = [];
  if (Array.isArray(input)) {
    list = input.filter((s) => typeof s === "string") as string[];
  } else if (typeof input === "string") {
    list = input.split(/[,\s]+/);
  }
  return [
    ...new Set(
      list
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 30)
    ),
  ];
}

router.get("/news", asyncHandler(async (req: Request, res: Response) => {
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
}));

async function handleLivePrices(symbols: string[], res: Response) {
  if (symbols.length === 0) return res.json({});
  try {
    const prices = await getLivePrices(symbols);
    return res.json(prices);
  } catch (e: any) {
    console.error("Live prices error:", e.message || e);
    return res.json({});
  }
}

router.post("/live-prices", asyncHandler(async (req: Request, res: Response) => {
  if (!rateLimit(clientKey(req, "prices"), MAX_PRICES)) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }
  return handleLivePrices(sanitizeSymbols(req.body?.symbols), res);
}));

// GET variant: /api/live-prices?symbols=DANGCEM,MTNN
router.get("/live-prices", asyncHandler(async (req: Request, res: Response) => {
  if (!rateLimit(clientKey(req, "prices"), MAX_PRICES)) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }
  return handleLivePrices(sanitizeSymbols(req.query.symbols), res);
}));

router.get("/market-snapshot", asyncHandler(async (req: Request, res: Response) => {
  if (!rateLimit(clientKey(req, "snapshot"), MAX_NEWS)) {
    return res.status(429).json({ error: "Too many requests." });
  }
  try {
    const snap = await getMarketSnapshot();
    if (!snap) {
      return res.status(503).json({ error: "Market snapshot unavailable" });
    }
    return res.json(snap);
  } catch (e: any) {
    console.error("Market snapshot error:", e?.message || e);
    return res.status(503).json({ error: "Market snapshot unavailable" });
  }
}));

router.get("/market-status", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const shouldProbe =
    req.query.probe === "1" ||
    req.query.probe === "true" ||
    req.query.probe === undefined;

  let probe: any = null;
  if (shouldProbe) {
    try {
      probe = await probeMarketConnection();
    } catch (e: any) {
      probe = { ok: false, error: "Connection test failed" };
    }
  }

  return res.json({
    provider: "ngnmarket",
    probe,
  });
}));

export default router;
