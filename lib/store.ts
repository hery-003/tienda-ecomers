import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import type { Color, Product } from "./productImage";

export type Config = {
  brand: string;
  whatsapp: string;
  currency: string;
  shipping: { ciudad: string; precio: number }[];
};

export type Coupon = {
  type: "percent" | "fixed";
  value: number;
};

export type OrderItem = {
  key: string;
  id: number;
  name: string;
  size: string;
  color: string;
  qty: number;
  price: number;
};

export type Customer = {
  nombre: string;
  telefono: string;
  ciudad: string;
};

export type Order = {
  id: string;
  date: string;
  items: OrderItem[];
  coupon: { code: string; type: string; value: number } | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  customer: Customer;
};

export type OrderStatus = "pendiente" | "confirmado" | "enviado" | "entregado" | "cancelado";

export const ORDER_STATUSES: OrderStatus[] = ["pendiente", "confirmado", "enviado", "entregado", "cancelado"];

export type AdminConfig = {
  passwordHash: string;
  salt: string;
};

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export class InvalidOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOrderError";
  }
}

type ProductRow = Prisma.ProductGetPayload<true>;

type OrderRow = Prisma.OrderGetPayload<true>;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    image: row.image,
    price: row.price,
    oldPrice: row.oldPrice,
    badge: row.badge,
    desc: row.desc,
    sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
    colors: Array.isArray(row.colors) ? (row.colors as Color[]) : [],
    stock: row.stock
  };
}

function toProductData(p: Product): Prisma.ProductUncheckedCreateInput {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    image: p.image ?? "",
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    badge: p.badge ?? null,
    desc: p.desc ?? "",
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
    stock: p.stock ?? 0
  };
}

export async function getProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return rows.map(toProduct);
}

export async function saveProducts(products: Product[]): Promise<void> {
  await prisma.$transaction([
    prisma.product.deleteMany(),
    ...products.map((p) =>
      prisma.product.upsert({
        where: { id: p.id },
        update: toProductData(p),
        create: toProductData(p)
      })
    )
  ]);
}

export async function getConfig(): Promise<Config> {
  const row = await prisma.storeConfig.findUnique({ where: { id: 1 } });
  if (!row) {
    return { brand: "MiTienda", whatsapp: "59171234567", currency: "Bs", shipping: [] };
  }
  const shipping = Array.isArray(row.shipping) ? (row.shipping as Config["shipping"]) : [];
  return { brand: row.brand, whatsapp: row.whatsapp, currency: row.currency, shipping };
}

export async function saveConfig(config: Config): Promise<void> {
  await prisma.storeConfig.upsert({
    where: { id: 1 },
    update: {
      brand: config.brand,
      whatsapp: config.whatsapp,
      currency: config.currency,
      shipping: config.shipping ?? []
    },
    create: { id: 1, brand: config.brand, whatsapp: config.whatsapp, currency: config.currency, shipping: config.shipping ?? [] }
  });
}

export async function getCoupons(): Promise<Record<string, Coupon>> {
  const rows = await prisma.coupon.findMany({ orderBy: { code: "asc" } });
  const map: Record<string, Coupon> = {};
  for (const c of rows) map[c.code] = { type: (c.type as Coupon["type"]) || "percent", value: c.value };
  return map;
}

export async function saveCoupons(coupons: Record<string, Coupon>): Promise<void> {
  await prisma.$transaction([
    prisma.coupon.deleteMany(),
    ...Object.entries(coupons).map(([code, c]) =>
      prisma.coupon.create({ data: { code, type: c.type, value: c.value } })
    )
  ]);
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    date: row.date.toISOString(),
    items: Array.isArray(row.items) ? (row.items as OrderItem[]) : [],
    coupon: row.coupon as Order["coupon"],
    subtotal: row.subtotal,
    discount: row.discount,
    shipping: row.shipping,
    total: row.total,
    status: (row.status as OrderStatus) || "pendiente",
    customer: row.customer as Customer
  };
}

function orderData(o: Order): Prisma.OrderUncheckedCreateInput {
  return {
    id: o.id,
    date: new Date(o.date),
    items: o.items as Prisma.InputJsonValue,
    coupon: o.coupon ? (o.coupon as Prisma.InputJsonValue) : Prisma.JsonNull,
    subtotal: o.subtotal,
    discount: o.discount,
    shipping: o.shipping,
    total: o.total,
    status: o.status,
    customer: o.customer as Prisma.InputJsonValue
  };
}

export async function getOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({ orderBy: { date: "desc" } });
  return rows.map(toOrder);
}

export async function createOrder(order: Order): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.id } });
      if (!product) continue;
      const next = product.stock - item.qty;
      if (next < 0) {
        throw new StockError(`Stock insuficiente para "${product.name}"`);
      }
      await tx.product.update({ where: { id: item.id }, data: { stock: next } });
    }
    await tx.order.create({ data: orderData(order) });
  });
}

type RawOrderItem = {
  key?: unknown;
  id?: unknown;
  size?: unknown;
  color?: unknown;
  qty?: unknown;
};

type RawOrderBody = {
  items?: unknown;
  coupon?: { code?: unknown } | null;
  customer?: Partial<Customer> | null;
};

// Recalcula precios, cupón, envío y total en el servidor con datos de la BD.
// No confía en los montos enviados por el cliente.
export async function computeOrder(body: RawOrderBody): Promise<Order> {
  const customer = body?.customer ?? {};
  const nombre = String(customer.nombre ?? "").trim();
  const telefono = String(customer.telefono ?? "").trim();
  const ciudad = String(customer.ciudad ?? "").trim();
  if (nombre.length < 2 || nombre.length > 120) {
    throw new InvalidOrderError("Nombre inválido");
  }
  const digits = telefono.replace(/[\s\-().]/g, "");
  if (!/^\+?\d{8,15}$/.test(digits)) {
    throw new InvalidOrderError("Teléfono inválido");
  }
  if (ciudad && ciudad.length > 60) {
    throw new InvalidOrderError("Ciudad inválida");
  }
  if (!Array.isArray(body?.items) || body.items.length === 0) {
    throw new InvalidOrderError("Pedido vacío");
  }
  if (body.items.length > 50) {
    throw new InvalidOrderError("Demasiados ítems en el pedido");
  }

  const products = new Map<number, Product>();
  for (const p of await getProducts()) products.set(p.id, p);

  const items: OrderItem[] = [];
  for (const raw of body.items as RawOrderItem[]) {
    const id = Math.trunc(Number(raw?.id));
    if (!Number.isFinite(id)) throw new InvalidOrderError("Ítem inválido");
    const product = products.get(id);
    if (!product) throw new InvalidOrderError("Producto no encontrado");
    const qty = Math.trunc(Number(raw?.qty));
    if (!Number.isFinite(qty) || qty < 1) throw new InvalidOrderError("Cantidad inválida");
    if (qty > 99) throw new InvalidOrderError("Cantidad fuera de rango");
    const size = String(raw?.size ?? "").trim();
    const color = String(raw?.color ?? "").trim();
    items.push({
      key: String(raw?.key ?? `${id}|${size}|${color}`),
      id,
      name: product.name,
      size,
      color,
      qty,
      price: product.price
    });
  }

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);

  let coupon: Order["coupon"] | null = null;
  let discount = 0;
  const code = String(body?.coupon?.code ?? "").trim().toUpperCase();
  if (code) {
    const c = (await getCoupons())[code];
    if (c && (c.type === "percent" || c.type === "fixed") && c.value >= 0) {
      coupon = { code, type: c.type, value: c.value };
      discount = c.type === "fixed" ? Math.min(c.value, subtotal) : (subtotal * c.value) / 100;
    }
  }

  const config = await getConfig();
  const ciudadLower = ciudad.toLowerCase();
  const match =
    config.shipping.find((r) => r.ciudad.trim().toLowerCase() === ciudadLower) ||
    config.shipping.find((r) => r.ciudad.trim().toLowerCase() === "default");
  const shipping = Math.max(0, Number(match?.precio) || 0);

  const total = Math.max(0, subtotal - discount + shipping);

  return {
    id: `PED-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`,
    date: new Date().toISOString(),
    items,
    coupon,
    subtotal,
    discount,
    shipping,
    total,
    status: "pendiente",
    customer: { nombre, telefono, ciudad }
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error("Pedido no encontrado");

  const restoring = status === "cancelado" && order.status !== "cancelado" && !order.stockRestored;

  await prisma.$transaction(async (tx) => {
    if (restoring) {
      for (const item of order.items as OrderItem[]) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (product) {
          await tx.product.update({
            where: { id: item.id },
            data: { stock: product.stock + item.qty }
          });
        }
      }
    }
    await tx.order.update({
      where: { id },
      data: { status, ...(restoring ? { stockRestored: true } : {}) }
    });
  });
}

export async function getAdmin(): Promise<AdminConfig> {
  const row = await prisma.admin.findUnique({ where: { id: 1 } });
  return row ? { passwordHash: row.passwordHash, salt: row.salt } : { passwordHash: "", salt: "" };
}

export async function saveAdmin(admin: AdminConfig): Promise<void> {
  await prisma.admin.upsert({ where: { id: 1 }, update: admin, create: { id: 1, ...admin } });
}

export function nextProductId(products: Product[]): number {
  return products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
}