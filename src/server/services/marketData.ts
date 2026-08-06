/**
 * Market data layer for NairaIntel
 *
 * Primary: NGN Market API (https://api.ngnmarket.com/v1)
 * Free plan supports:
 *   GET /companies              — list with live prices
 *   GET /companies?search=SYM   — search by ticker
 *   GET /market/snapshot
 *
 * Note: GET /companies/:symbol is Hobby plan and returns 403 on free keys.
 * We therefore never depend on the per-symbol profile endpoint for prices.
 */

const NGNMARKET_BASE = "https://api.ngnmarket.com/v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

const priceCache: Record<string, { price: number; ts: number; source: string }> = {};
let snapshotCache: { data: any; ts: number } | null = null;
let bulkListCache: { map: Record<string, number>; ts: number } | null = null;

function getApiKey(): string | null {
  const key = process.env.NGNMARKET_API_KEY || process.env.NGX_API_KEY || null;
  return key && key.trim() ? key.trim() : null;
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
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`NGN Market ${path} → ${res.status}`, body.slice(0, 300));
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.error(`NGN Market fetch error (${path}):`, err?.message || err);
    return null;
  }
}

function num(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v) && v > 0) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}

function extractPriceFromCompany(item: any): number | null {
  if (!item || typeof item !== "object") return null;
  return (
    num(item.price) ??
    num(item.current_price) ??
    num(item.currentPrice) ??
    num(item.last_price) ??
    num(item.close) ??
    num(item.closing_price) ??
    null
  );
}

function companiesToPriceMap(payload: any): Record<string, number> {
  const map: Record<string, number> = {};
  if (!payload) return map;

  let rows: any = payload.data ?? payload;
  if (rows && !Array.isArray(rows) && Array.isArray(rows.data)) {
    rows = rows.data;
  }
  if (!Array.isArray(rows)) return map;

  for (const item of rows) {
    const sym = String(item?.symbol || item?.ticker || item?.code || "")
      .trim()
      .toUpperCase();
    const price = extractPriceFromCompany(item);
    if (sym && price != null) {
      map[sym] = price;
      priceCache[sym] = { price, ts: Date.now(), source: "ngnmarket" };
    }
  }
  return map;
}

async function fetchBulkPriceMap(): Promise<Record<string, number>> {
  if (bulkListCache && Date.now() - bulkListCache.ts < CACHE_TTL_MS) {
    return bulkListCache.map;
  }

  const payload = await ngnFetch("/companies?limit=200&page=1&sort=market_cap&order=desc");
  const map = companiesToPriceMap(payload);
  if (Object.keys(map).length > 0) {
    bulkListCache = { map, ts: Date.now() };
  }
  return map;
}

async function fetchPriceBySearch(symbol: string): Promise<number | null> {
  const payload = await ngnFetch(
    `/companies?search=${encodeURIComponent(symbol)}&limit=10`
  );
  const map = companiesToPriceMap(payload);
  if (map[symbol] != null) return map[symbol];
  const values = Object.values(map);
  return values.length === 1 ? values[0] : null;
}

export async function getLivePrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const unique = [
    ...new Set(
      symbols
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 40)
    ),
  ];

  const result: Record<string, number> = {};
  const missing: string[] = [];

  for (const sym of unique) {
    const cached = priceCache[sym];
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      result[sym] = cached.price;
    } else {
      missing.push(sym);
    }
  }

  if (missing.length === 0) return result;

  if (!getApiKey()) {
    console.warn("Market data: NGNMARKET_API_KEY not set");
    return result;
  }

  const bulk = await fetchBulkPriceMap();
  for (const sym of [...missing]) {
    if (bulk[sym] != null) {
      result[sym] = bulk[sym];
      const i = missing.indexOf(sym);
      if (i >= 0) missing.splice(i, 1);
    }
  }

  await Promise.all(
    missing.map(async (sym) => {
      const price = await fetchPriceBySearch(sym);
      if (price != null) {
        result[sym] = price;
      } else if (priceCache[sym]) {
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
    key_configured: !!getApiKey(),
    cached_symbols: Object.keys(priceCache).length,
    bulk_cached: !!bulkListCache,
    snapshot_cached: !!snapshotCache,
  };
}
