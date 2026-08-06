import { apiFetch } from "../lib/api";

export async function fetchLatestMarketNews(): Promise<any[]> {
  try {
    const res = await apiFetch("/api/news");
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("News fetch error:", error);
    return [];
  }
}

export async function fetchLivePrices(symbols: string[]): Promise<Record<string, number>> {
  if (!symbols || symbols.length === 0) return {};

  const clean = [
    ...new Set(
      symbols
        .map((s) => String(s || "").trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
  if (clean.length === 0) return {};

  try {
    const res = await apiFetch("/api/live-prices", {
      method: "POST",
      body: JSON.stringify({ symbols: clean }),
    });

    if (!res.ok) {
      console.warn("[live-prices] HTTP", res.status);
      return {};
    }

    const data = await res.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      console.warn("[live-prices] unexpected body", data);
      return {};
    }

    // Normalize keys to uppercase for safe lookup
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(data)) {
      const n = typeof v === "number" ? v : parseFloat(String(v));
      if (!Number.isNaN(n) && n > 0) out[k.toUpperCase()] = n;
    }
    console.info("[live-prices] resolved", Object.keys(out).length, "of", clean.length);
    return out;
  } catch (error) {
    console.error("Live prices fetch error:", error);
    return {};
  }
}
