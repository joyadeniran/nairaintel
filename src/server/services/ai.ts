import { initializeApp, getApps } from "firebase/app";
import { getAI, getGenerativeModel, VertexAIBackend } from "@firebase/ai";

let generativeModel: any = null;

try {
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };

  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const clientApp = getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig);
    const ai = getAI(clientApp, {
      backend: new VertexAIBackend("us-central1"),
    });
    generativeModel = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
    console.log("Firebase AI Logic (Vertex) initialized");
  }
} catch (error) {
  console.error("Error initializing Firebase AI Logic:", error);
}

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 15 * 60 * 1000;

function safeParseJsonArray(text: string): any[] {
  if (!text) return [];
  try {
    // Prefer fenced JSON block
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : text;
    const arrMatch = candidate.match(/\[[\s\S]*\]/);
    if (!arrMatch) return [];
    const parsed = JSON.parse(arrMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        headline: String(item.headline || "").slice(0, 300),
        summary: String(item.summary || "").slice(0, 2000),
        sentiment: ["Positive", "Neutral", "Negative"].includes(item.sentiment)
          ? item.sentiment
          : "Neutral",
        impact: String(item.impact || "").slice(0, 1000),
        source_url: String(item.source_url || "#").slice(0, 500),
      }))
      .filter((item) => item.headline);
  } catch (err: any) {
    console.error("AI JSON parse failed:", err?.message || err);
    return [];
  }
}

/** Qualitative market intelligence only — not for numeric prices */
export async function getMarketNews() {
  const cacheKey = "market_news";
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  if (!generativeModel) throw new Error("Generative model not initialized");

  const response = await generativeModel.generateContent(
    "What are the latest 3 major market news updates affecting the Nigerian economy and the Naira today? Provide a structured summary for each. Return ONLY a JSON array of objects with keys: headline, summary, sentiment (Positive, Neutral, or Negative), impact, and source_url."
  );

  const text =
    typeof response?.response?.text === "function"
      ? response.response.text()
      : String(response?.response?.text || "");

  const data = safeParseJsonArray(text);
  if (data.length > 0) {
    cache[cacheKey] = { data, timestamp: Date.now() };
  }
  return data;
}

export { generativeModel };
