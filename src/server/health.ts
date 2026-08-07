import admin from "firebase-admin";

/**
 * Public health payload. Reports only whether each integration is *configured*,
 * never key material, cached values, or upstream logs — so it is safe to expose
 * unauthenticated. Use it to confirm which environment variables actually
 * reached the deployment; use GET /api/market-status (authenticated) for live
 * probes with real error detail.
 */
export function healthPayload(platform?: string) {
  const configured = {
    ngnmarket: !!(process.env.NGNMARKET_API_KEY || process.env.NGX_API_KEY),
    gemini: !!process.env.GEMINI_API_KEY,
    firebase_admin: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY && admin.apps.length > 0,
    firebase_client: !!(
      process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID
    ),
  };

  const missing: string[] = [];
  if (!configured.ngnmarket) missing.push("NGNMARKET_API_KEY — ticker tape, search and live prices will be empty");
  if (!configured.gemini) missing.push("GEMINI_API_KEY — Market Intel news feed will be empty");
  if (!configured.firebase_admin) missing.push("FIREBASE_SERVICE_ACCOUNT_KEY — auth and all writes will fail");

  return {
    status: "ok",
    ...(platform ? { platform } : {}),
    configured,
    missing,
  };
}
