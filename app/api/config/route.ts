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
  const body = await req.json().catch(() => ({}));
  const shipping = Array.isArray(body.shipping)
    ? body.shipping
        .map((r: unknown) => {
          const row = (r ?? {}) as { ciudad?: unknown; precio?: unknown };
          const ciudad = String(row.ciudad || "").trim();
          const precio = Number(row.precio);
          if (!ciudad) return null;
          return { ciudad, precio: Number.isFinite(precio) ? Math.max(0, precio) : 0 };
        })
        .filter((r: unknown): r is { ciudad: string; precio: number } => r !== null)
    : [];
  const config = {
    brand: String(body.brand || "").trim() || "MiTienda",
    whatsapp: String(body.whatsapp || "").trim().replace(/\D/g, ""),
    currency: String(body.currency || "").trim() || "Bs",
    shipping
  };
  await saveConfig(config);
  return NextResponse.json(config);
}
