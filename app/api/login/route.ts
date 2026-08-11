import { NextRequest, NextResponse } from "next/server";
import { login, createSessionToken, AUTH_COOKIE, checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/auth";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Demasiados intentos. Espera ${rl.retryAfterSec}s e inténtalo de nuevo.` },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) }
      }
    );
  }

  const body = await req.json().catch(() => ({}));
  const result = await login(String(body.password || ""));
  if (!result.ok) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  clearRateLimit(ip);
  const res = NextResponse.json({ ok: true, message: result.message || undefined });
  res.cookies.set(AUTH_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
  return res;
}
