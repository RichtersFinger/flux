export const BASE_URL = import.meta.env.VITE_DEV_API_BASE_URL ?? "";
export const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: import.meta.env.VITE_DEV_API_BASE_URL ? "include" : "same-origin",
};

/**
 * Patched global.fetch which pre-applies the base-url and options
 */
export function pFetch (input: RequestInfo | URL, init?: RequestInit | undefined) {
  return fetch(`${BASE_URL}${input}`, {
    ...DEFAULT_FETCH_OPTIONS,
    ...init,
  });
};
