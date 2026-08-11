import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const config = {
    brand: String(body.brand || "").trim() || "MiTienda",
    whatsapp: String(body.whatsapp || "").trim().replace(/\D/g, ""),
    currency: String(body.currency || "").trim() || "Bs"
  };
  await saveConfig(config);
  return NextResponse.json(config);
}
