import { NextRequest, NextResponse } from "next/server";
import { computeOrder, createOrder, getOrders, InvalidOrderError, StockError, type Order } from "@/lib/store";
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
  const body = await req.json().catch(() => ({}));

  let order: Order;
  try {
    order = await computeOrder(body);
  } catch (err) {
    if (err instanceof InvalidOrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al procesar el pedido" }, { status: 500 });
  }

  try {
    await createOrder(order);
  } catch (err) {
    if (err instanceof StockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al registrar el pedido" }, { status: 500 });
  }
  return NextResponse.json(order, { status: 201 });
}