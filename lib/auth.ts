import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAdmin, saveAdmin } from "./store";

export const AUTH_COOKIE = "mitienda_admin";
const SESSION_TTL = 60 * 60 * 24 * 7;

// Rate limiting simple en memoria (5 intentos fallidos por IP en 15 min)
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (rec.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((rec.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.count += 1;
  }
}

export function clearRateLimit(ip: string): void {
  attempts.delete(ip);
}

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function ensureAdmin(): Promise<{ ok: boolean; message: string }> {
  const admin = await getAdmin();
  if (admin.passwordHash) return { ok: true, message: "" };
  const salt = randomBytes(16).toString("hex");
  await saveAdmin({ passwordHash: hashPassword("admin123", salt), salt });
  return { ok: true, message: "Contraseña inicial creada: admin123. Cámbiala después de entrar." };
}

export async function login(password: string): Promise<{ ok: boolean; message: string }> {
  await ensureAdmin();
  const admin = await getAdmin();
  if (safeEqual(hashPassword(password, admin.salt), admin.passwordHash)) {
    return { ok: true, message: "" };
  }
  return { ok: false, message: "Contraseña incorrecta" };
}

export function createSessionToken(): string {
  const token = randomBytes(32).toString("hex");
  const exp = Date.now() + SESSION_TTL * 1000;
  const sig = sha256(`${token}.${exp}.${process.env.AUTH_SECRET || "mitienda-local-secret"}`);
  return `${token}.${exp}.${sig}`;
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(AUTH_COOKIE)?.value;
  if (!raw) return false;
  const [token, expStr, sig] = raw.split(".");
  if (!token || !expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sha256(`${token}.${exp}.${process.env.AUTH_SECRET || "mitienda-local-secret"}`);
  if (!safeEqual(sig, expected)) return false;
  return true;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}
