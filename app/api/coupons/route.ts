import { NextRequest, NextResponse } from "next/server";
import { getCoupons, saveCoupons } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const coupons = await getCoupons();
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json();
  const code = String(body.code || "").trim().toUpperCase();
  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Number(body.value);
  if (!code || !Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Código y valor válidos requeridos" }, { status: 400 });
  }
  const coupons = await getCoupons();
  coupons[code] = { type, value };
  await saveCoupons(coupons);
  return NextResponse.json({ code, ...coupons[code] }, { status: 201 });
}
