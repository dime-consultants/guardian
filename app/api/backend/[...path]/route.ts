import { NextRequest } from "next/server";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://invoicing.dimeconsultants.africa";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${backendUrl.replace(/\/$/, "")}/api/${path.join("/")}/`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("content-length");

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

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
