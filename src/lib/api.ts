import { auth } from "./firebase";

/**
 * Authenticated fetch helper.
 * Attaches Firebase ID token when the user is signed in.
 * Never sends a client-chosen user_id — the server derives identity from the token.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    } catch (err) {
      console.error("Failed to get ID token:", err);
    }
  }

  return fetch(input, { ...init, headers });
}
