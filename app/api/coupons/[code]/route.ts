import { NextRequest, NextResponse } from "next/server";
import { getCoupons, saveCoupons } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/coupons/[code]">) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { code } = await ctx.params;
  const coupons = await getCoupons();
  if (!coupons[code]) {
    return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
  }
  delete coupons[code];
  await saveCoupons(coupons);
  return NextResponse.json({ ok: true });
}
