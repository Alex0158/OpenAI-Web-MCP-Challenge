import type { IncomingMessage, ServerResponse } from "node:http";

import type { RuntimeHealthSnapshot } from "./runtime";

function pathnameOf(url: string | undefined): string {
  if (!url) {
    return "/";
  }
  try {
    return new URL(url, "http://sleepless-kingdom.local").pathname;
  } catch {
    return url.split("?", 1)[0] ?? "/";
  }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown, extraHeaders: Record<string, string> = {}): void {
  const payload = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [name, value] of Object.entries(extraHeaders)) {
    res.setHeader(name, value);
  }
  res.end(payload);
}

export function handleHealthRequest(
  req: IncomingMessage,
  res: ServerResponse,
  snapshot: () => RuntimeHealthSnapshot,
): boolean {
  if (pathnameOf(req.url) !== "/api/health") {
    return false;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "METHOD_NOT_ALLOWED", allowed_methods: ["GET"] }, { Allow: "GET" });
    return true;
  }

  const current = snapshot();
  sendJson(res, current.ready ? 200 : 503, current);
  return true;
}
