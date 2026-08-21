
import { NextRequest } from "next/server";

const backendUrl = "https://stage-invoicing.dimeconsultants.africa/api";
const getBackendApiBaseUrl = (url: string) => {
  const trimmedUrl = url.replace(/\/$/, "");
  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
};

const HOP_BY_HOP_HEADERS = [
  "host",
  "origin",
  "content-length",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
];

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${getBackendApiBaseUrl(backendUrl)}/${path.join("/")}/`;
  const headers = new Headers(request.headers);
  for (const h of HOP_BY_HOP_HEADERS) headers.delete(h);

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return Response.json(
      {
        detail: "Backend request timed out or the backend is unreachable.",
        backend: backendUrl,
      },
      { status: 504 },
    );
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  const responseContentType = response.headers.get("content-type") ?? "";
  if (response.status >= 500 && responseContentType.includes("text/html")) {
    return Response.json(
      {
        detail: "The backend returned a server error.",
        status: response.status,
      },
      { status: response.status },
    );
  }

  // The backend may set a cookie for its own hostname. Because this request is
  // proxied through the app, rewrite it as a host-only cookie so the browser
  // stores the refresh token on the preview/production app origin.
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    responseHeaders.delete("set-cookie");
    for (const cookie of setCookies) {
      responseHeaders.append(
        "set-cookie",
        cookie
          .replace(/;\\s*Domain=[^;]+/gi, "")
          .replace(/;\\s*Path=[^;]+/gi, "; Path=/"),
      );
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
