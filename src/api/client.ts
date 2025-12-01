// src/api/client.ts
export type ProviderId = "melolo" | "netshort" | "reelshort" | "other";

const PROVIDERS: Record<ProviderId, string> = {
  melolo: "https://melolo-api-one.vercel.app",
  netshort: "http://localhost:3000", // ← ganti dengan URL Express kamu
  reelshort: "https://example-reelshort-api.com", // nanti
  other: "https://example-other-api.com",
};

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Helper: build querystring dari object `{a:1, b:'x'} -> ?a=1&b=x`
 */
function buildQuery(params?: RequestOptions["query"]): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Core request ke provider tertentu
 */
export async function apiRequest<T>(
  provider: ProviderId,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const base = PROVIDERS[provider];
  if (!base) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const { method = "GET", query, body, headers = {} } = options;

  const url = `${base}${path}${buildQuery(query)}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body:
      method === "GET" ? undefined : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Di sini bisa kamu custom log / error handling global
    throw new Error(`HTTP ${res.status} – ${res.statusText}`);
  }

  // asumsi semua API json
  return (await res.json()) as T;
}
