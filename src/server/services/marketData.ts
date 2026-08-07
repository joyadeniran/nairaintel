/**
 * NGN Market API client — aligned with https://docs.ngnmarket.com
 *
 * Auth:  Authorization: Bearer ngm_live_...
 * Base:  https://api.ngnmarket.com/v1
 * Free:  GET /companies  (list + search) — field `price`
 * Hobby: GET /companies/:symbol — not used (403 on free)
 *
 * Envelope: { success, data: { data: Company[], pagination }, meta }
 */

const NGNMARKET_BASE = "https://api.ngnmarket.com/v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

const priceCache: Record<string, { price: number; ts: number; source: string }> = {};
const quoteCache: Record<string, { quote: CompanyQuote; ts: number }> = {};
let snapshotCache: { data: any; ts: number } | null = null;
let bulkListCache: { map: Record<string, number>; ts: number } | null = null;
let bulkQuoteCache: { quotes: CompanyQuote[]; ts: number } | null = null;

const recentLogs: Array<{ at: string; level: string; message: string; detail?: any }> = [];

function safeDetail(detail: any): any {
  if (detail === undefined) return undefined;
  if (typeof detail === "string") return detail.slice(0, 500);
  try {
    return JSON.parse(JSON.stringify(detail));
  } catch {
    return String(detail).slice(0, 500);
  }
}

function log(level: "info" | "warn" | "error", message: string, detail?: any) {
  recentLogs.unshift({ at: new Date().toISOString(), level, message, detail: safeDetail(detail) });
  while (recentLogs.length > 30) recentLogs.pop();
  const line = `[NGN Market] ${message}`;
  if (level === "error") console.error(line, detail ?? "");
  else if (level === "warn") console.warn(line, detail ?? "");
  else console.log(line, detail ?? "");
}

function getApiKey(): string | null {
  const key = (process.env.NGNMARKET_API_KEY || process.env.NGX_API_KEY || "").trim();
  if (!key) return null;
  return key.replace(/^["']|["']$/g, "");
}

async function ngnFetch(path: string): Promise<{ ok: boolean; status: number; body: any }> {
  const key = getApiKey();
  if (!key) {
    log("warn", "NGNMARKET_API_KEY not set in environment");
    return { ok: false, status: 0, body: { error: { code: "MISSING_ENV_KEY" } } };
  }

  log("info", `Request ${path}`, { key_prefix: key.slice(0, 12) + "…" });

  try {
    const res = await fetch(`${NGNMARKET_BASE}${path}`, {
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

/** Positive-only coercion — used for prices, which are never <= 0. */
function num(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v) && v > 0) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}

/** Signed coercion — used for deltas, which are legitimately negative or zero. */
function signedNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, "").replace(/%/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export interface CompanyQuote {
  symbol: string;
  name: string;
  price: number;
  change: number | null;
  change_percent: number | null;
}

function extractPriceFromCompany(item: any): number | null {
  if (!item || typeof item !== "object") return null;
  return (
    num(item.price) ??
    num(item.current_price) ??
    num(item.currentPrice) ??
    num(item.last_price) ??
    num(item.close) ??
    null
  );
}

function extractQuote(item: any): CompanyQuote | null {
  const symbol = String(item?.symbol || item?.ticker || "").trim().toUpperCase();
  const price = extractPriceFromCompany(item);
  if (!symbol || price == null) return null;

  const name = String(
    item?.name ||
      item?.company_name ||
      item?.companyName ||
      item?.long_name ||
      item?.security_name ||
      symbol
  )
    .trim()
    .slice(0, 120);

  return {
    symbol,
    name,
    price,
    change: signedNum(item?.change ?? item?.price_change ?? item?.change_amount),
    change_percent: signedNum(
      item?.change_percent ?? item?.percent_change ?? item?.changePercent ?? item?.pct_change
    ),
  };
}

/** Pull the companies array out of the API envelope, tolerating shape drift. */
function companiesRows(body: any): any[] | null {
  const rows: any =
    body?.data?.data ??
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
    return null;
  }
  return rows;
}

function companiesToQuotes(body: any): CompanyQuote[] {
  if (!body) return [];
  const rows = companiesRows(body);
  if (!rows) return [];

  const quotes: CompanyQuote[] = [];
  for (const item of rows) {
    const q = extractQuote(item);
    if (q) {
      quotes.push(q);
      priceCache[q.symbol] = { price: q.price, ts: Date.now(), source: "ngnmarket" };
      quoteCache[q.symbol] = { quote: q, ts: Date.now() };
    }
  }

  log("info", `Parsed ${quotes.length} quotes from ${rows.length} rows`);
  return quotes;
}

function companiesToPriceMap(body: any): Record<string, number> {
  const map: Record<string, number> = {};
  for (const q of companiesToQuotes(body)) map[q.symbol] = q.price;
  return map;
}

async function fetchBulkQuotes(): Promise<CompanyQuote[]> {
  if (bulkQuoteCache && Date.now() - bulkQuoteCache.ts < CACHE_TTL_MS) {
    return bulkQuoteCache.quotes;
  }

  const { ok, body } = await ngnFetch(
    "/companies?limit=200&page=1&sort=market_cap&order=desc"
  );
  if (!ok) return bulkQuoteCache?.quotes || [];

  const quotes = companiesToQuotes(body);
  if (quotes.length > 0) {
    bulkQuoteCache = { quotes, ts: Date.now() };
    const map: Record<string, number> = {};
    for (const q of quotes) map[q.symbol] = q.price;
    bulkListCache = { map, ts: Date.now() };
  } else {
    log("warn", "Bulk companies returned 0 parseable quotes");
  }
  return quotes;
}

async function fetchBulkPriceMap(): Promise<Record<string, number>> {
  if (bulkListCache && Date.now() - bulkListCache.ts < CACHE_TTL_MS) {
    return bulkListCache.map;
  }
  await fetchBulkQuotes();
  return bulkListCache?.map || {};
}

/**
 * Every listed company we can see, most valuable first — backs the ticker tape.
 * Served from the same 10-minute bulk cache as live prices, so rendering the
 * tape costs no extra upstream calls.
 */
export async function getAllQuotes(): Promise<CompanyQuote[]> {
  if (!getApiKey()) {
    log("error", "Cannot list tickers — NGNMARKET_API_KEY missing");
    return [];
  }
  return fetchBulkQuotes();
}

/**
 * Ticker/name search for the add-asset picker. Filters the cached bulk list
 * first and only hits the API when the cache cannot satisfy the query.
 */
export async function searchCompanies(query: string, limit = 8): Promise<CompanyQuote[]> {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  if (!getApiKey()) {
    log("error", "Cannot search companies — NGNMARKET_API_KEY missing");
    return [];
  }

  // Exact ticker first, then ticker prefix, then name/substring hits.
  const relevance = (c: CompanyQuote) => {
    const sym = c.symbol.toLowerCase();
    if (sym === q) return 0;
    if (sym.startsWith(q)) return 1;
    if (sym.includes(q)) return 2;
    if (c.name.toLowerCase().startsWith(q)) return 3;
    return 4;
  };
  const sorted = (list: CompanyQuote[]) =>
    [...list].sort((a, b) => relevance(a) - relevance(b) || a.symbol.localeCompare(b.symbol));

  // The cached bulk list is every company, so it must be filtered here.
  const matches = (c: CompanyQuote) =>
    c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);

  const cached = sorted((await fetchBulkQuotes()).filter(matches)).slice(0, limit);
  if (cached.length > 0) return cached;

  // Upstream has already filtered by the search term, so rank but do not
  // re-filter — it may legitimately match on fields we do not parse.
  const { ok, body } = await ngnFetch(
    `/companies?search=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!ok) return [];
  return sorted(companiesToQuotes(body)).slice(0, limit);
}

async function fetchPriceBySearch(symbol: string): Promise<number | null> {
  const { ok, body } = await ngnFetch(
    `/companies?search=${encodeURIComponent(symbol)}&limit=10`
  );
  if (!ok) return null;
  const map = companiesToPriceMap(body);
  if (map[symbol] != null) return map[symbol];
  const entries = Object.entries(map);
  if (entries.length === 1) return entries[0][1];
  log("warn", `Search for ${symbol} returned no exact match`, { found: Object.keys(map) });
  return null;
}

export async function getLivePrices(symbols: string[]): Promise<Record<string, number>> {
  const unique = [
    ...new Set(
      symbols
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 40)
    ),
  ];

  log("info", "getLivePrices requested", { symbols: unique });

  const result: Record<string, number> = {};
  const missing: string[] = [];

  for (const sym of unique) {
    const cached = priceCache[sym];
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) result[sym] = cached.price;
    else missing.push(sym);
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
    log("info", "Still missing after bulk, searching", { missing });
    await Promise.all(
      missing.map(async (sym) => {
        const price = await fetchPriceBySearch(sym);
        if (price != null) result[sym] = price;
        else if (priceCache[sym]) result[sym] = priceCache[sym].price;
      })
    );
  }

  log("info", "getLivePrices result", {
    requested: unique.length,
    resolved: Object.keys(result).length,
    result,
  });

  return result;
}

export async function getMarketSnapshot(): Promise<any | null> {
  if (snapshotCache && Date.now() - snapshotCache.ts < CACHE_TTL_MS) return snapshotCache.data;

  const { ok, body } = await ngnFetch("/market/snapshot");
  if (ok && body) {
    const data = body.data ?? body;
    snapshotCache = { data, ts: Date.now() };
    return data;
  }
  return snapshotCache?.data ?? null;
}

/**
 * Actively test the NGN Market connection (for diagnostics on cold serverless instances).
 */
export async function probeMarketConnection(): Promise<{
  ok: boolean;
  sample: Record<string, number>;
  error?: any;
}> {
  log("info", "probeMarketConnection started");
  const { ok, status, body } = await ngnFetch(
    "/companies?search=DANGCEM&limit=5"
  );

  if (!ok) {
    return {
      ok: false,
      sample: {},
      error: body?.error || { status, body },
    };
  }

  const map = companiesToPriceMap(body);
  const sample = Object.fromEntries(Object.entries(map).slice(0, 5));

  // Also try bulk for cache warmup
  await fetchBulkPriceMap();

  return {
    ok: Object.keys(map).length > 0,
    sample,
    error:
      Object.keys(map).length === 0
        ? { code: "PARSE_EMPTY", message: "API OK but no prices parsed", bodyKeys: body && Object.keys(body) }
        : undefined,
  };
}

