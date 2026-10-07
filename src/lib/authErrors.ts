/**
 * Turns Firebase Auth errors into something a user can act on.
 *
 * Firebase messages look like "Firebase: Error (auth/invalid-credential)." —
 * stripping the prefix and code leaves just "Error.", which tells nobody
 * anything. Map the code instead, and keep the code + source visible so a
 * screenshot from a user is enough to diagnose the problem.
 */

export type AuthErrorSource = 'Firebase Auth' | 'Network' | 'App configuration' | 'Browser';

export interface FriendlyAuthError {
  message: string;
  source: AuthErrorSource;
  code: string;
}

const MESSAGES: Record<string, { message: string; source: AuthErrorSource }> = {
  // Credentials
  'auth/invalid-credential': {
    message:
      "Email or password is incorrect. If you signed up with Google, use \"Continue with Google\" — or use \"Forgot password?\".",
    source: 'Firebase Auth',
  },
  'auth/invalid-login-credentials': {
    message:
      "Email or password is incorrect. If you signed up with Google, use \"Continue with Google\" — or use \"Forgot password?\".",
    source: 'Firebase Auth',
  },
  'auth/wrong-password': {
    message: 'Incorrect password. Try again or use "Forgot password?".',
    source: 'Firebase Auth',
  },
  'auth/user-not-found': {
    message: 'No account exists with this email. Check the spelling or create an account.',
    source: 'Firebase Auth',
  },
  'auth/invalid-email': {
    message: "That doesn't look like a valid email address.",
    source: 'Firebase Auth',
  },
  'auth/missing-email': {
    message: 'Enter your email address first.',
    source: 'Firebase Auth',
  },
  'auth/missing-password': {
    message: 'Enter your password.',
    source: 'Firebase Auth',
  },
  'auth/user-disabled': {
    message: 'This account has been disabled. Contact support.',
    source: 'Firebase Auth',
  },
  'auth/too-many-requests': {
    message:
      'Too many failed attempts — Firebase has temporarily blocked sign-in for this account. Wait a few minutes or reset your password.',
    source: 'Firebase Auth',
  },

  // Sign-up
  'auth/email-already-in-use': {
    message: 'An account with this email already exists. Sign in instead, or reset your password.',
    source: 'Firebase Auth',
  },
  'auth/weak-password': {
    message: 'Password is too weak — use at least 6 characters.',
    source: 'Firebase Auth',
  },
  'auth/password-does-not-meet-requirements': {
    message: "Password doesn't meet the security requirements. Use a longer, mixed password.",
    source: 'Firebase Auth',
  },
  'auth/account-exists-with-different-credential': {
    message:
      'An account already exists with this email using a different sign-in method. Sign in with email/password instead.',
    source: 'Firebase Auth',
  },

  // Google popup
  'auth/popup-blocked': {
    message: 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.',
    source: 'Browser',
  },
  'auth/unauthorized-domain': {
    message:
      "This website's domain isn't authorised for sign-in. The site owner needs to add it in Firebase Console → Authentication → Settings → Authorized domains.",
    source: 'App configuration',
  },
  'auth/operation-not-allowed': {
    message:
      "This sign-in method isn't enabled. The site owner needs to enable it in Firebase Console → Authentication → Sign-in method.",
    source: 'App configuration',
  },

  // Config / infra
  'auth/invalid-api-key': {
    message: "The app's Firebase API key is invalid. The site owner needs to check the VITE_FIREBASE_* settings.",
    source: 'App configuration',
  },
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': {
    message: "The app's Firebase API key is invalid. The site owner needs to check the VITE_FIREBASE_* settings.",
    source: 'App configuration',
  },
  'auth/app-not-authorized': {
    message: "This app isn't authorised to use Firebase Auth with its API key.",
    source: 'App configuration',
  },
  'auth/configuration-not-found': {
    message: "Firebase Auth isn't set up for this project.",
    source: 'App configuration',
  },
  'auth/network-request-failed': {
    message: "Couldn't reach the sign-in server. Check your internet connection and try again.",
    source: 'Network',
  },
  'auth/internal-error': {
    message: 'Firebase had an internal error. Try again in a moment.',
    source: 'Firebase Auth',
  },
};

/** Popup closures the user caused themselves — not worth showing an error for. */
const SILENT_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

export function isSilentAuthError(err: unknown): boolean {
  return SILENT_CODES.has(getCode(err));
}

function getCode(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : '';
}

export function describeAuthError(err: unknown): FriendlyAuthError {
  const code = getCode(err);
  const known = MESSAGES[code];
  if (known) return { ...known, code };

  // Unknown Firebase code: show the raw message, minus the noise, so it's still informative.
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const cleaned = raw.replace(/^Firebase:\s*/, '').trim();
  return {
    message: cleaned && cleaned !== `Error (${code}).` ? cleaned : 'Sign-in failed for an unknown reason.',
    source: code.startsWith('auth/') ? 'Firebase Auth' : 'Browser',
    code: code || 'unknown',
  };
}
