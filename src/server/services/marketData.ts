/**
 * NGN Market API client — aligned with https://docs.ngnmarket.com
 *
 * Auth:  Authorization: Bearer ngm_live_...
 * Base:  https://api.ngnmarket.com/v1
 * Free:  GET /companies  (list + search) — includes `price` field
 * Hobby: GET /companies/:symbol — NOT used (403 PLAN_REQUIRED on free)
 *
 * Response envelope:
 * {
 *   success: true,
 *   data: { data: Company[], pagination: {...} },
 *   meta: { plan, calls_used, calls_remaining, reset_at }
 * }
 *
 * Company list item price field is `price` (not current_price in list schema).
 */

const NGNMARKET_BASE = "https://api.ngnmarket.com/v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

const priceCache: Record<string, { price: number; ts: number; source: string }> = {};
let snapshotCache: { data: any; ts: number } | null = null;
let bulkListCache: { map: Record<string, number>; ts: number } | null = null;

/** Last failures — exposed via /api/market-status for debugging */
const recentLogs: Array<{ at: string; level: string; message: string; detail?: any }> = [];

function log(level: "info" | "warn" | "error", message: string, detail?: any) {
  const entry = {
    at: new Date().toISOString(),
    level,
    message,
    detail:
      detail === undefined
        ? undefined
        : typeof detail === "string"
          ? detail.slice(0, 500)
          : JSON.parse(JSON.stringify(detail, null, 0).slice?.(0, 500) ?? JSON.stringify(detail).slice(0, 500)),
  };
  recentLogs.unshift(entry);
  if (recentLogs.length > 30) recentLogs.pop();
  const line = `[NGN Market] ${message}`;
  if (level === "error") console.error(line, detail ?? "");
  else if (level === "warn") console.warn(line, detail ?? "");
  else console.log(line, detail ?? "");
}

function getApiKey(): string | null {
  const key = (process.env.NGNMARKET_API_KEY || process.env.NGX_API_KEY || "").trim();
  if (!key) return null;
  // Strip accidental quotes from Vercel paste
  return key.replace(/^["']|["']$/g, "");
}

async function ngnFetch(path: string): Promise<{ ok: boolean; status: number; body: any }> {
  const key = getApiKey();
  if (!key) {
    log("warn", "NGNMARKET_API_KEY not set in environment");
    return { ok: false, status: 0, body: { error: { code: "MISSING_ENV_KEY" } } };
  }

  const url = `${NGNMARKET_BASE}${path}`;
  log("info", `Request ${path}`, { key_prefix: key.slice(0, 12) + "…" });

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text.slice(0, 300) };
    }

    if (!res.ok) {
      const code = body?.error?.code || body?.code || `HTTP_${res.status}`;
      const message = body?.error?.message || body?.message || res.statusText;
      log("error", `Failed ${path} → ${res.status} ${code}`, { message, body });
      return { ok: false, status: res.status, body };
    }

    // Docs: success envelope may still include success:false in edge cases
    if (body && body.success === false) {
      log("error", `API success=false on ${path}`, body.error || body);
      return { ok: false, status: res.status, body };
    }

    log("info", `OK ${path}`, {
      plan: body?.meta?.plan,
      calls_remaining: body?.meta?.calls_remaining,
    });
    return { ok: true, status: res.status, body };
  } catch (err: any) {
    log("error", `Network error on ${path}`, err?.message || String(err));
    return { ok: false, status: 0, body: { error: { code: "NETWORK", message: err?.message } } };
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
  // Official list schema uses `price`
  return (
    num(item.price) ??
    num(item.current_price) ??
    num(item.currentPrice) ??
    num(item.last_price) ??
    num(item.close) ??
    null
  );
}

/**
 * Official shape:
 * body.data.data = Company[]
 * Also tolerate body.data = Company[] for resilience.
 */
function companiesToPriceMap(body: any): Record<string, number> {
  const map: Record<string, number> = {};
  if (!body) return map;

  let rows: any =
    body?.data?.data ?? // official envelope
    (Array.isArray(body?.data) ? body.data : null) ??
    (Array.isArray(body) ? body : null);

  if (!Array.isArray(rows)) {
    log("warn", "Could not find companies array in response", {
      keys: body && typeof body === "object" ? Object.keys(body) : typeof body,
      dataKeys:
        body?.data && typeof body.data === "object" && !Array.isArray(body.data)
          ? Object.keys(body.data)
          : undefined,
    });
    return map;
  }

  for (const item of rows) {
    const sym = String(item?.symbol || item?.ticker || "")
      .trim()
      .toUpperCase();
    const price = extractPriceFromCompany(item);
    if (sym && price != null) {
      map[sym] = price;
      priceCache[sym] = { price, ts: Date.now(), source: "ngnmarket" };
    }
  }

  log("info", `Parsed ${Object.keys(map).length} prices from ${rows.length} rows`);
  return map;
}

async function fetchBulkPriceMap(): Promise<Record<string, number>> {
  if (bulkListCache && Date.now() - bulkListCache.ts < CACHE_TTL_MS) {
    return bulkListCache.map;
  }

  // Free plan — max limit 200
  const { ok, body } = await ngnFetch(
    "/companies?limit=200&page=1&sort=market_cap&order=desc"
  );
  if (!ok) return bulkListCache?.map || {};

  const map = companiesToPriceMap(body);
  if (Object.keys(map).length > 0) {
    bulkListCache = { map, ts: Date.now() };
  } else {
    log("warn", "Bulk companies returned 0 parseable prices");
  }
  return map;
}

async function fetchPriceBySearch(symbol: string): Promise<number | null> {
  const { ok, body } = await ngnFetch(
    `/companies?search=${encodeURIComponent(symbol)}&limit=10`
  );
  if (!ok) return null;
  const map = companiesToPriceMap(body);
  if (map[symbol] != null) return map[symbol];
  // exact match preferred; if single hit, use it
  const entries = Object.entries(map);
  if (entries.length === 1) return entries[0][1];
  // partial search can return many — pick exact only
  log("warn", `Search for ${symbol} returned no exact match`, {
    found: Object.keys(map),
  });
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
        .slice(0, 40)
    ),
  ];

  log("info", `getLivePrices requested`, { symbols: unique });

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

  if (missing.length === 0) {
    log("info", "All prices served from cache", result);
    return result;
  }

  if (!getApiKey()) {
    log("error", "Cannot fetch prices — NGNMARKET_API_KEY missing");
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

  if (missing.length) {
    log("info", `Still missing after bulk, searching`, { missing });
    await Promise.all(
      missing.map(async (sym) => {
        const price = await fetchPriceBySearch(sym);
        if (price != null) result[sym] = price;
        else if (priceCache[sym]) result[sym] = priceCache[sym].price;
      })
    );
  }

  log("info", `getLivePrices result`, {
    requested: unique.length,
    resolved: Object.keys(result).length,
    result,
  });

  return result;
}

export async function getMarketSnapshot(): Promise<any | null> {
  if (snapshotCache && Date.now() - snapshotCache.ts < CACHE_TTL_MS) {
    return snapshotCache.data;
  }

  const { ok, body } = await ngnFetch("/market/snapshot");
  if (ok && body) {
    const data = body.data ?? body;
    snapshotCache = { data, ts: Date.now() };
    return data;
  }
  return snapshotCache?.data ?? null;
}

export function marketDataStatus() {
  const key = getApiKey();
  return {
    provider: key ? "ngnmarket" : "none",
    key_configured: !!key,
    key_prefix: key ? key.slice(0, 12) + "…" : null,
    key_looks_valid: key ? key.startsWith("ngm_") || key.startsWith("ngnm_") : false,
    docs: {
      base: NGNMARKET_BASE,
      auth: "Authorization: Bearer ngm_live_…",
      free_endpoint: "GET /companies?limit=200",
      note: "GET /companies/:symbol requires Hobby plan — we do not use it",
    },
    cached_symbols: Object.keys(priceCache).length,
    sample_cache: Object.fromEntries(Object.entries(priceCache).slice(0, 5).map(([k, v]) => [k, v.price])),
    bulk_cached: !!bulkListCache,
    snapshot_cached: !!snapshotCache,
    recent_logs: recentLogs.slice(0, 15),
  };
}
