/**
 * Shared API base URL for backend requests.
 *
 * In local development, set NEXT_PUBLIC_API_URL to your backend URL:
 *   NEXT_PUBLIC_API_URL=http://localhost:50001
 *
 * In production, set it to the deployed backend URL.
 *
 * When this value is not set, requests will be made relative to the current origin.
 * In a deployed frontend-only build, this will fail unless you proxy these routes.
 */

export const API_BASE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!envUrl && typeof window !== "undefined") {
    console.warn(
      "NEXT_PUBLIC_API_URL is not set. API requests will be sent to the same origin.\n" +
        "Set NEXT_PUBLIC_API_URL to your backend URL for deployed builds."
    );
  }

  return envUrl ?? "";
})();
