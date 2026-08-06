import { auth } from "./firebase";

/**
 * Authenticated fetch helper.
 * Attaches Firebase ID token when the user is signed in.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const user = auth?.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(/* forceRefresh */ false);
      headers.set("Authorization", `Bearer ${token}`);
    } catch (err) {
      console.error("Failed to get ID token:", err);
    }
  }

  const res = await fetch(input, { ...init, headers });

  // Helpful debug in browser console for API failures
  if (!res.ok) {
    console.warn(`[apiFetch] ${init.method || "GET"} ${input} → ${res.status}`);
  }

  return res;
}
