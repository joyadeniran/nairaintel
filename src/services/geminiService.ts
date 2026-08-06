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
  try {
    const res = await apiFetch("/api/live-prices", {
      method: "POST",
      body: JSON.stringify({ symbols }),
    });
    if (!res.ok) return {};
    return await res.json();
  } catch (error) {
    console.error("Live prices fetch error:", error);
    // Never invent prices
    return {};
  }
}
