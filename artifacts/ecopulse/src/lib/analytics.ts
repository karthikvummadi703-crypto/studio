declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

/**
 * Initialises Google Analytics 4 by injecting the gtag script and configuring
 * the measurement ID. Does nothing when VITE_GA4_MEASUREMENT_ID is not set.
 */
export function initGA4(): void {
  if (!GA4_ID) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA4_ID, { anonymize_ip: true });
}

/**
 * Sends a `page_view` event to GA4 for the given path.
 * @param path - The URL path to record (e.g. "/dashboard").
 */
export function trackPageView(path: string): void {
  if (!GA4_ID || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", { page_path: path });
}

/**
 * Sends a custom event to GA4.
 * @param name   - The event name (snake_case recommended by Google).
 * @param params - Optional key/value payload attached to the event.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!GA4_ID || typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
}
