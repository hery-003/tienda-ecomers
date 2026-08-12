import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts, nextProductId, sanitizeProductInput } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const products = await getProducts();
  const id = nextProductId(products);
  const result = sanitizeProductInput(body, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const product = result.product;
  products.push(product);
  await saveProducts(products);
  return NextResponse.json(product, { status: 201 });
}
