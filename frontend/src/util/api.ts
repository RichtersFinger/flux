import type { APIResponseMD } from "../types";

export const BASE_URL = import.meta.env.VITE_DEV_API_BASE_URL ?? "";
export const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: import.meta.env.VITE_DEV_API_BASE_URL
    ? "include"
    : "same-origin",
};

/**
 * Patched global.fetch which pre-applies the base-url and options
 */
export function pFetch(
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) {
  return fetch(`${BASE_URL}${input}`, {
    ...DEFAULT_FETCH_OPTIONS,
    ...init,
  });
}

/**
 * Returns formatted message using the provided meta.error-object (or a
 * generic default).
 * @param meta APIResponseMD.meta
 * @returns Formatted message as string.
 */
export function formatAPIErrorMessage(meta?: Partial<APIResponseMD>) {
  const error = {
    ...{ code: 0, short: "Unknown error", long: "An unknown error occurred" },
    ...meta?.error,
  };
  return `${error.short}: ${error.long} (${error.code}).`;
}
