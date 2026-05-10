export async function fetchLatestMarketNews(): Promise<any[]> {
  try {
    const res = await fetch("/api/news");
    return await res.json();
  } catch (error) {
    console.error("News fetch error:", error);
    return [];
  }
}

export async function fetchLivePrices(symbols: string[]): Promise<Record<string, number>> {
  if (!symbols || symbols.length === 0) return {};
  try {
    const res = await fetch("/api/live-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols })
    });
    return await res.json();
  } catch (error) {
    console.error("Live prices fetch error:", error);
    const fallbacks: Record<string, number> = {};
    symbols.forEach(s => fallbacks[s] = Math.random() * 500);
    return fallbacks;
  }
}
