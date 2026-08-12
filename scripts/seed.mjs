import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(HERE, "..", "data");
const prisma = new PrismaClient();
function readDefaults() {
  try {
    return JSON.parse(fs.readFileSync(path.join(HERE, "defaults.json"), "utf-8"));
  } catch {
    return {
      products: [],
      config: { brand: "MiTienda", whatsapp: "59171234567", currency: "Bs", shipping: [] },
      coupons: {}
    };
  }
}
const defaults = readDefaults();

function read(name, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf-8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log("La base de datos ya tiene productos; se omite la migración para no pisar cambios.");
    return;
  }

  const products = read("products.json", null) ?? defaults.products;
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        image: p.image ?? "",
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        badge: p.badge ?? null,
        desc: p.desc ?? "",
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        colors: Array.isArray(p.colors) ? p.colors : [],
        stock: p.stock ?? 0
      }
    });
  }

  const cfg = read("config.json", null) ?? defaults.config;
  await prisma.storeConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      brand: String(cfg.brand ?? "MiTienda"),
      whatsapp: String(cfg.whatsapp ?? "59171234567"),
      currency: String(cfg.currency ?? "Bs"),
      shipping: Array.isArray(cfg.shipping) ? cfg.shipping : []
    }
  });

  const coupons = read("coupons.json", null) ?? defaults.coupons;
  for (const [code, c] of Object.entries(coupons)) {
    await prisma.coupon.create({
      data: { code, type: String(c.type === "fixed" ? "fixed" : "percent"), value: Number(c.value) }
    });
  }

  const orders = read("orders.json", []);
  for (const o of orders) {
    await prisma.order.create({
      data: {
        id: o.id,
        date: new Date(o.date),
        items: Array.isArray(o.items) ? o.items : [],
        coupon: o.coupon ?? null,
        subtotal: Number(o.subtotal) || 0,
        discount: Number(o.discount) || 0,
        total: Number(o.total) || 0,
        customer: o.customer ?? { nombre: "", telefono: "", ciudad: "" }
      }
    });
  }

  const admin = read("admin.json", null);
  if (admin && admin.passwordHash) {
    await prisma.admin.upsert({
      where: { id: 1 },
      update: { passwordHash: admin.passwordHash, salt: admin.salt || "" },
      create: { id: 1, passwordHash: admin.passwordHash, salt: admin.salt || "" }
    });
  }

  console.log(
    `Migración completa: ${products.length} productos, ${orders.length} pedidos, ${Object.keys(coupons).length} cupones.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());