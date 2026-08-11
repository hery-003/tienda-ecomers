import { NextRequest, NextResponse } from "next/server";
import { login, isAuthed } from "@/lib/auth";
import { saveAdmin } from "@/lib/store";
import { createHash, randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const current = String(body.current || "");
  const next = String(body.next || "");

  const loginCheck = await login(current);
  if (!loginCheck.ok) {
    return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const salt = randomBytes(16).toString("hex");
  await saveAdmin({ passwordHash: hashPassword(next, salt), salt });
  return NextResponse.json({ ok: true, message: "Contraseña actualizada" });
}
