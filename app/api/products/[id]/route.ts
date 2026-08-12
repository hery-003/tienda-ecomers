import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts, sanitizeProductInput } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === numId);
  if (idx === -1) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  const result = sanitizeProductInput(body, numId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  products[idx] = result.product;
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
