import { Router } from "express";
import { getMarketNews, getLivePrices } from "../services/ai.js";

const router = Router();

router.get("/news", async (req, res) => {
  try {
    const news = await getMarketNews();
    res.json(news);
  } catch (e: any) {
    console.error("AI Error (News):", e.message || e);
    // Fallback
    res.json([
      {
        headline: "NGX Index Surges Amid Banking Sector Rally",
        summary: "The Nigerian equities market recorded significant gains today, driven by strong buying interest in top-tier banking stocks following impressive Q3 earnings reports.",
        sentiment: "Positive",
        impact: "Could lead to sustained bullish momentum in the financial sector for the week.",
        source_url: "#"
      },
      {
        headline: "CBN Retains MPR to Combat Inflation",
        summary: "The Central Bank of Nigeria has opted to hold the Monetary Policy Rate (MPR) constant at its latest MPC meeting, citing the need to observe the effects of previous hikes.",
        sentiment: "Neutral",
        impact: "Fixed income yields will likely stabilize, making T-Bills moderately attractive.",
        source_url: "#"
      },
      {
        headline: "FMCG Companies Squeeze Margins Over FX Rates",
        summary: "Major Fast Moving Consumer Goods companies continue to report margin compressions due to the high cost of foreign exchange for raw material imports.",
        sentiment: "Negative",
        impact: "Expect potential price target downgrades for high-import reliant manufacturers.",
        source_url: "#"
      }
    ]);
  }
});

router.post("/live-prices", async (req, res) => {
  const { symbols } = req.body;
  if (!symbols || symbols.length === 0) return res.json({});

  try {
    const prices = await getLivePrices(symbols);
    res.json(prices);
  } catch (e: any) {
    console.error("AI Error (Live Prices):", e.message || e);
    // Fallback
    const fallbacks: Record<string, number> = {};
    symbols.forEach((s: string) => fallbacks[s] = Math.random() * 500);
    res.json(fallbacks);
  }
});

export default router;
