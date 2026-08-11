import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const numId = Number(id);
  const body = await req.json();
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === numId);
  if (idx === -1) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  products[idx] = { id: numId, ...body };
  await saveProducts(products);
  return NextResponse.json(products[idx]);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const numId = Number(id);
  const products = await getProducts();
  const next = products.filter((p) => p.id !== numId);
  if (next.length === products.length) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  await saveProducts(next);
  return NextResponse.json({ ok: true });
}
