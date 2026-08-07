import { initializeApp, getApps } from "firebase/app";
import { getAI, getGenerativeModel, VertexAIBackend } from "@firebase/ai";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

/**
 * Two generation backends, preferred order:
 *
 *  1. GEMINI_API_KEY + @google/genai — a real server-side SDK. This is the path
 *     that works in a serverless function.
 *  2. VITE_FIREBASE_* + Firebase AI Logic (Vertex) — the browser SDK. It is kept
 *     for local/dev parity but authenticates as a *client*, so it generally fails
 *     inside a serverless function. Do not rely on it in production.
 *
 * If neither is configured, getMarketNews() throws and the route returns an empty
 * feed rather than inventing a headline.
 */
let genaiClient: GoogleGenAI | null = null;
let generativeModel: any = null;

const geminiKey = (process.env.GEMINI_API_KEY || "").trim();

if (geminiKey) {
  try {
    genaiClient = new GoogleGenAI({ apiKey: geminiKey });
    console.log("Gemini (server SDK) initialized");
  } catch (error) {
    console.error("Error initializing Gemini server SDK:", error);
  }
}

if (!genaiClient) {
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
      generativeModel = getGenerativeModel(ai, { model: MODEL });
      console.log(
        "Firebase AI Logic (Vertex) initialized — client SDK, may fail on serverless. Set GEMINI_API_KEY for a server-side path."
      );
    } else {
      console.warn(
        "No AI backend configured. Set GEMINI_API_KEY to enable the market news feed."
      );
    }
  } catch (error) {
    console.error("Error initializing Firebase AI Logic:", error);
  }
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

const NEWS_PROMPT =
  "What are the latest 3 major market news updates affecting the Nigerian economy and the Naira today? Provide a structured summary for each. Return ONLY a JSON array of objects with keys: headline, summary, sentiment (Positive, Neutral, or Negative), impact, and source_url.";

/** Both SDKs expose the response text differently — normalise to a string. */
function responseText(response: any): string {
  if (!response) return "";
  // @google/genai: response.text (string getter)
  if (typeof response.text === "string") return response.text;
  if (typeof response.text === "function") return response.text();
  // @firebase/ai: response.response.text()
  const inner = response.response;
  if (inner) {
    if (typeof inner.text === "function") return inner.text();
    if (typeof inner.text === "string") return inner.text;
  }
  return "";
}

/** Qualitative market intelligence only — not for numeric prices */
export async function getMarketNews() {
  const cacheKey = "market_news";
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  let response: any;
  if (genaiClient) {
    response = await genaiClient.models.generateContent({
      model: MODEL,
      contents: NEWS_PROMPT,
    });
  } else if (generativeModel) {
    response = await generativeModel.generateContent(NEWS_PROMPT);
  } else {
    throw new Error(
      "No AI backend configured — set GEMINI_API_KEY to enable the market news feed"
    );
  }

  const data = safeParseJsonArray(responseText(response));
  if (data.length > 0) {
    cache[cacheKey] = { data, timestamp: Date.now() };
  }
  return data;
}

export { generativeModel };
