import { NextRequest, NextResponse } from "next/server";
import { getOrders, appendOrder } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const orders = await getOrders();
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Pedido vacío" }, { status: 400 });
  }
  if (!body.customer || !body.customer.nombre || !body.customer.telefono) {
    return NextResponse.json({ error: "Datos de envío incompletos" }, { status: 400 });
  }
  const order = {
    id: `PED-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString(),
    items: body.items,
    coupon: body.coupon || null,
    subtotal: Number(body.subtotal) || 0,
    discount: Number(body.discount) || 0,
    total: Number(body.total) || 0,
    customer: body.customer
  };
  await appendOrder(order);
  return NextResponse.json(order, { status: 201 });
}
