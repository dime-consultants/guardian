/**
 * API Client utility for making authenticated requests to the backend
 */

export interface ApiRequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include", // Include cookies for refresh token
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Build a backend API URL with trailing slash
 */
export function buildApiUrl(baseUrl: string, path: string): string {
  const url = new URL(baseUrl);
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  if (!path.endsWith("/")) {
    path = path + "/";
  }
  return url.origin + path;
}
