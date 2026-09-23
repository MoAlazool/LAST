/**
 * Where the backend lives.
 *
 * - Same origin (local dev, Docker/Railway serving the built client): leave
 *   VITE_API_BASE_URL unset — "/api/…" requests stay relative.
 * - Static hosting on another domain (Netlify): set VITE_API_BASE_URL to the backend's
 *   origin (e.g. https://lecturemate.up.railway.app). Every "/api/…" and "/uploads/…"
 *   request made with fetch() is then sent there directly — long AI requests must not go
 *   through Netlify's proxy, which cuts requests off after ~26 seconds.
 */
export const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

const BACKEND_PATH = /^\/(api|uploads)(\/|$)/;

/** Absolute backend URL for a backend path ("/api/…", "/uploads/…"); other URLs are returned unchanged. */
export function apiUrl(path: string): string {
  return API_BASE && BACKEND_PATH.test(path) ? API_BASE + path : path;
}

/**
 * Routes the app's relative backend requests to API_BASE without touching every call
 * site. A no-op when API_BASE is unset.
 */
export function installApiBase(): void {
  if (!API_BASE || typeof window === "undefined" || (window as any).__apiBaseInstalled) return;
  (window as any).__apiBaseInstalled = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string") return nativeFetch(apiUrl(input), init);
    if (input instanceof URL) {
      return nativeFetch(input.origin === window.location.origin ? apiUrl(input.pathname + input.search) : input, init);
    }
    if (input instanceof Request) {
      const u = new URL(input.url);
      if (u.origin === window.location.origin && BACKEND_PATH.test(u.pathname)) {
        return nativeFetch(new Request(apiUrl(u.pathname + u.search), input), init);
      }
    }
    return nativeFetch(input as any, init);
  };
}
