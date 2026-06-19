/**
 * Google Identity Services (GIS) helpers.
 *
 * Uses Google's own GSI library to obtain an ID-token credential, then hands
 * it to Firebase via signInWithCredential – which has NO client-side
 * authorized-domain check. This removes the need to add the Replit dev or
 * deployed domain to Firebase Console for Google Sign-In to work.
 *
 * The Google OAuth Web Client ID is auto-discovered from Firebase's own
 * public config endpoint (/__/firebase/init.json) so no extra env variable
 * is required.
 */

/* ── Type shim for the GSI global ─────────────────────────────────────── */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(cfg: {
            client_id: string;
            callback: (r: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
          }): void;
          renderButton(
            el: HTMLElement,
            opts: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number;
              logo_alignment?: "left" | "center";
            }
          ): void;
          prompt(
            fn?: (n: {
              isNotDisplayed(): boolean;
              isSkippedMoment(): boolean;
              getNotDisplayedReason(): string;
            }) => void
          ): void;
          cancel(): void;
        };
      };
    };
  }
}

/* ── Client-ID discovery ───────────────────────────────────────────────── */

let _cachedClientId: string | null = null;

/**
 * Fetches the Google OAuth Web Client ID via our API server proxy.
 * The API server fetches Firebase's public init.json server-side (no CORS),
 * so this works on any origin — dev, staging, or production.
 * Returns null if unavailable.
 */
export async function fetchGoogleClientId(_authDomain: string): Promise<string | null> {
  if (_cachedClientId) return _cachedClientId;
  try {
    // Resolve the API base: in Vite dev the proxy forwards /api → api-server;
    // in production the same path prefix works via the platform router.
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    const res = await fetch(`${base}/api/config/google`, { cache: "default" });
    if (!res.ok) return null;
    const data: { clientId?: string } = (await res.json()) as { clientId?: string };
    _cachedClientId = data.clientId ?? null;
    return _cachedClientId;
  } catch {
    return null;
  }
}

/* ── Script loader ─────────────────────────────────────────────────────── */

let _scriptPromise: Promise<void> | null = null;

export function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (_scriptPromise) return _scriptPromise;

  _scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Sign-In script"));
    document.head.appendChild(s);
  });

  return _scriptPromise;
}

/* ── Button renderer ───────────────────────────────────────────────────── */

/**
 * Initialises the GSI library and renders the official Google button inside
 * `container`. Returns a promise that resolves with the Google ID-token JWT
 * when the user completes sign-in, or rejects on error / cancellation.
 *
 * Uses `signInWithCredential` downstream (no Firebase domain check).
 */
export function renderGoogleButton(container: HTMLElement, clientId: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error("GSI not loaded"));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error("google/no-credential"));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    });

    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: container.offsetWidth || 200,
      logo_alignment: "center",
    });
  });
}
