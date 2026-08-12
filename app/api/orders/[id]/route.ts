import { NextRequest, NextResponse } from "next/server";
import { ORDER_STATUSES, updateOrderStatus, type OrderStatus } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Params) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "") as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  try {
    await updateOrderStatus(id, status);
  } catch (err) {
    if (err instanceof Error && err.message === "Pedido no encontrado") {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al actualizar el pedido" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}