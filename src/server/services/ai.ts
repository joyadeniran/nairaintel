import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, VertexAIBackend } from "@firebase/ai";
import dotenv from "dotenv";

dotenv.config();

let generativeModel: any = null;

try {
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  };

  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const clientApp = initializeApp(firebaseConfig);
    const ai = getAI(clientApp, { 
      backend: new VertexAIBackend("us-central1") 
    });
    generativeModel = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
    console.log("Firebase AI Logic (Vertex) initialized successfully");
  }
} catch (error) {
  console.error("Error initializing Firebase AI Logic:", error);
}

// Simple Cache for News and Prices
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function getMarketNews() {
  const cacheKey = 'market_news';
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
    return cache[cacheKey].data;
  }

  if (!generativeModel) throw new Error("Generative model not initialized");

  const response = await generativeModel.generateContent(
    "What are the latest 3 major market news updates affecting the Nigerian economy and the Naira today? Provide a structured summary for each. Return ONLY a JSON array of objects with keys: headline, summary, sentiment (Positive, Neutral, or Negative), impact, and source_url."
  );
  
  const text = response.response.text();
  const jsonMatch = text.match(/\[.*\]/s);
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  
  if (data.length > 0) {
    cache[cacheKey] = { data, timestamp: Date.now() };
  }
  return data;
}

export async function getLivePrices(symbols: string[]) {
  const cacheKey = `prices_${symbols.sort().join(',')}`;
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
    return cache[cacheKey].data;
  }

  if (!generativeModel) throw new Error("Generative model not initialized");

  const response = await generativeModel.generateContent(
    `What are the current approximate or latest closing prices for these Nigerian Exchange (NGX) stocks: ${symbols.join(', ')}? Return ONLY a JSON object where the key is the symbol and the value is the numeric price.`
  );
  
  const text = response.response.text();
  const jsonMatch = text.match(/\{.*\}/s);
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  
  if (Object.keys(data).length > 0) {
    cache[cacheKey] = { data, timestamp: Date.now() };
  }
  return data;
}

export { generativeModel };
