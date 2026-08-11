import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts, nextProductId } from "@/lib/store";
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
  const body = await req.json();
  const products = await getProducts();
  const id = nextProductId(products);
  const product = { id, ...body };
  products.push(product);
  await saveProducts(products);
  return NextResponse.json(product, { status: 201 });
}
