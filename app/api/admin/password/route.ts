import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { login, isAuthed } from "@/lib/auth";
import { saveAdmin } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const current = String(body.current || "");
  const next = String(body.next || "");

  const loginCheck = await login(current);
  if (!loginCheck.ok) {
    return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(next, 10);
  await saveAdmin({ passwordHash, salt: "" });
  return NextResponse.json({ ok: true, message: "Contraseña actualizada" });
}
