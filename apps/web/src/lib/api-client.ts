const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

let refreshPromise: Promise<void> | null = null;

async function refreshToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).then((res) => {
      if (!res.ok) throw new ApiError(res.status, "Token refresh failed");
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(endpoint: string, options: FetchOptions = {}, isRetry = false): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (!res.ok) {
    if (res.status === 401 && !isRetry && !endpoint.startsWith("/auth/")) {
      try {
        await refreshToken();
        return request<T>(endpoint, options, true);
      } catch {
        throw new ApiError(401, "Session expired");
      }
    }
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(res.status, error.message);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string | string[],
  ) {
    super(Array.isArray(message) ? message[0] : message);
  }
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    request<T>(endpoint, { method: "GET", params }),

  post: <T>(endpoint: string, body?: unknown, params?: Record<string, string>) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      params,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};
