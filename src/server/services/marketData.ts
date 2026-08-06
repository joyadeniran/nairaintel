/**
 * Market data layer for NairaIntel
 *
 * Primary: NGN Market API (https://api.ngnmarket.com/v1)
 *   - Free tier ~3k calls/month
 *   - Equity prices refreshed ~every 20 min during NGX hours
 *   - Set NGNMARKET_API_KEY in env
 *
 * Fallback chain:
 *   1. NGN Market (if key configured)
 *   2. In-memory cache of last good prices
 *   3. Explicit "unavailable" (never random fake prices)
 *
 * Gemini is reserved for qualitative market intelligence (news/sentiment),
 * NOT for fabricating numeric prices.
 */

const NGNMARKET_BASE = "https://api.ngnmarket.com/v1";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const priceCache: Record<string, { price: number; ts: number; source: string }> = {};
let snapshotCache: { data: any; ts: number } | null = null;

function getApiKey(): string | null {
  return process.env.NGNMARKET_API_KEY || process.env.NGX_API_KEY || null;
}

async function ngnFetch(path: string): Promise<any | null> {
  const key = getApiKey();
  if (!key) return null;

  try {
    const res = await fetch(`${NGNMARKET_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.error(`NGN Market ${path} → ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.error(`NGN Market fetch error (${path}):`, err?.message || err);
    return null;
  }
}

/** Extract a numeric last price from various possible response shapes */
function extractPrice(payload: any, symbol: string): number | null {
  if (!payload) return null;

  // Common shapes: { data: { price } }, { data: { last_price } }, { price }, nested company object
  const d = payload.data ?? payload;
  const candidates = [
    d.price,
    d.last_price,
    d.lastPrice,
    d.close,
    d.closing_price,
    d.current_price,
    d.currentPrice,
  ];

  for (const c of candidates) {
    const n = typeof c === "string" ? parseFloat(c) : c;
    if (typeof n === "number" && !Number.isNaN(n) && n > 0) return n;
  }

  // Array of companies
  if (Array.isArray(d)) {
    const hit = d.find(
      (x: any) =>
        String(x.symbol || x.ticker || x.code || "").toUpperCase() === symbol.toUpperCase()
    );
    if (hit) return extractPrice({ data: hit }, symbol);
  }

  if (d.companies && Array.isArray(d.companies)) {
    return extractPrice({ data: d.companies }, symbol);
  }

  return null;
}

export async function getLivePrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const unique = [
    ...new Set(
      symbols
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 30) // hard cap
    ),
  ];

  const result: Record<string, number> = {};
  const missing: string[] = [];

  // Serve fresh cache first
  for (const sym of unique) {
    const cached = priceCache[sym];
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      result[sym] = cached.price;
    } else {
      missing.push(sym);
    }
  }

  if (missing.length === 0) return result;

  const key = getApiKey();
  if (!key) {
    // No provider configured — return only cached values, never invent prices
    console.warn("Market data: NGNMARKET_API_KEY not set; returning cache-only prices");
    return result;
  }

  // Fetch per-symbol (simple & reliable). Batch endpoint may exist later.
  await Promise.all(
    missing.map(async (sym) => {
      const payload = await ngnFetch(`/companies/${encodeURIComponent(sym)}`);
      const price = extractPrice(payload, sym);
      if (price != null) {
        priceCache[sym] = { price, ts: Date.now(), source: "ngnmarket" };
        result[sym] = price;
      } else if (priceCache[sym]) {
        // Stale cache better than nothing
        result[sym] = priceCache[sym].price;
      }
    })
  );

  return result;
}

export async function getMarketSnapshot(): Promise<any | null> {
  if (snapshotCache && Date.now() - snapshotCache.ts < CACHE_TTL_MS) {
    return snapshotCache.data;
  }

  const payload = await ngnFetch("/market/snapshot");
  if (payload) {
    const data = payload.data ?? payload;
    snapshotCache = { data, ts: Date.now() };
    return data;
  }
  return snapshotCache?.data ?? null;
}

export function marketDataStatus() {
  return {
    provider: getApiKey() ? "ngnmarket" : "none",
    cached_symbols: Object.keys(priceCache).length,
    snapshot_cached: !!snapshotCache,
  };
}
