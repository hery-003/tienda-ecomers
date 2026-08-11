import { promises as fs } from "node:fs";
import path from "node:path";
import type { Product } from "./productImage";

export type Config = {
  brand: string;
  whatsapp: string;
  currency: string;
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

export type Order = {
  id: string;
  date: string;
  items: OrderItem[];
  coupon: { code: string; type: string; value: number } | null;
  subtotal: number;
  discount: number;
  total: number;
  customer: { nombre: string; telefono: string; ciudad: string };
};

export type AdminConfig = {
  passwordHash: string;
  salt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");

function file(name: string): string {
  return path.join(DATA_DIR, name);
}

export const DEFAULT_CONFIG: Config = {
  brand: "MiTienda",
  whatsapp: "59171234567",
  currency: "Bs"
};

export const DEFAULT_COUPONS: Record<string, Coupon> = {
  STREET10: { type: "percent", value: 10 },
  DROP20: { type: "percent", value: 20 }
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Jersey Premium Oversize",
    brand: "AuraFit",
    category: "Jerseys",
    image: "https://loremflickr.com/400/500/jersey,sport?lock=11",
    price: 79.9,
    oldPrice: 99.0,
    desc: "Tela dry-fit premium, corte oversize y estampado a todo color.",
    badge: "nuevo",
    sizes: ["S", "M", "L", "XL"],
    stock: 12,
    colors: [
      { name: "Azul Marino", hex: "#3b4d61" },
      { name: "Negro", hex: "#16161a" }
    ]
  },
  {
    id: 2,
    name: "Hoodie Pesada Oversize",
    brand: "AuraFit",
    category: "Hoodies",
    image: "https://loremflickr.com/400/500/hoodie,streetwear?lock=12",
    price: 129.9,
    oldPrice: null,
    desc: "Algodón pesado 400gsm, capucha doble y bolsillo canguro.",
    badge: "nuevo",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    stock: 8,
    colors: [
      { name: "Café", hex: "#6b5b3e" },
      { name: "Grafito", hex: "#1f1f24" }
    ]
  },
  {
    id: 3,
    name: "Boxi Estampado Frontal",
    brand: "YoungLA",
    category: "Boxis",
    image: "https://loremflickr.com/400/500/t-shirt,streetwear?lock=13",
    price: 79.9,
    oldPrice: 89.9,
    desc: "Estampado serigrafía frontal, tacto suave y cómodo.",
    badge: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: 15,
    colors: [
      { name: "Bordó", hex: "#5a2d2d" },
      { name: "Negro", hex: "#16161a" }
    ]
  },
  {
    id: 4,
    name: "Baggi 3 Hilos Pesado",
    brand: "YoungLA",
    category: "Baggis",
    image: "https://loremflickr.com/400/500/joggers,pants?lock=14",
    price: 179.9,
    oldPrice: null,
    desc: "Tres hilos pesados con logo metálico y bolsillos amplios.",
    badge: null,
    sizes: ["S", "M", "L", "XL"],
    stock: 6,
    colors: [
      { name: "Azul", hex: "#2d3e5a" },
      { name: "Negro", hex: "#16161a" }
    ]
  },
  {
    id: 5,
    name: "Tank Top Gym",
    brand: "AuraFit",
    category: "Tank tops",
    image: "https://loremflickr.com/400/500/tank-top,gym?lock=15",
    price: 79.9,
    oldPrice: 89.9,
    desc: "Sin mangas, ligero y transpirable para tus entrenamientos.",
    badge: null,
    sizes: ["S", "M", "L"],
    stock: 20,
    colors: [
      { name: "Oliva", hex: "#4d5a2d" },
      { name: "Negro", hex: "#16161a" }
    ]
  },
  {
    id: 6,
    name: "Short Deportivo",
    brand: "Breathe Divinity",
    category: "Shorts",
    image: "https://loremflickr.com/400/500/shorts,sport?lock=16",
    price: 69.9,
    oldPrice: 79.9,
    desc: "Short con malla interior, bolsillos con cierre y tela elástica.",
    badge: null,
    sizes: ["S", "M", "L", "XL"],
    stock: 10,
    colors: [
      { name: "Violeta", hex: "#3e2d5a" },
      { name: "Grafito", hex: "#1f1f24" }
    ]
  },
  {
    id: 7,
    name: "Casaca Trucker",
    brand: "AuraFit",
    category: "Casacas",
    image: "https://loremflickr.com/400/500/jacket,streetwear?lock=17",
    price: 169.9,
    oldPrice: null,
    desc: "Casaca cortaviento resistente con acabado premium.",
    badge: "nuevo",
    sizes: ["S", "M", "L", "XL"],
    stock: 4,
    colors: [
      { name: "Café", hex: "#5a3d2d" },
      { name: "Negro", hex: "#16161a" }
    ]
  },
  {
    id: 8,
    name: "Compresor Seamless",
    brand: "Breathe Divinity",
    category: "Compresores",
    image: "https://loremflickr.com/400/500/leggings,sport?lock=18",
    price: 99.9,
    oldPrice: 129.9,
    desc: "Compresión media sin costuras, ideal para entrenar.",
    badge: null,
    sizes: ["S", "M", "L", "XL"],
    stock: 18,
    colors: [
      { name: "Verde", hex: "#2d5a45" },
      { name: "Grafito", hex: "#1f1f24" }
    ]
  },
  {
    id: 9,
    name: "Jersey Calavera",
    brand: "YoungLA",
    category: "Jerseys",
    image: "https://loremflickr.com/400/500/jersey,black?lock=19",
    price: 79.9,
    oldPrice: null,
    desc: "Diseño calavera premium, cuello redondo y mangas cortas.",
    badge: "agotado",
    sizes: ["S", "M", "L", "XL"],
    stock: 0,
    colors: [
      { name: "Púrpura", hex: "#5a2d4d" },
      { name: "Negro", hex: "#16161a" }
    ]
  },
  {
    id: 10,
    name: "Hoodie Crop Batik",
    brand: "AuraFit",
    category: "Hoodies",
    image: "https://loremflickr.com/400/500/hoodie,fashion?lock=20",
    price: 149.9,
    oldPrice: 179.9,
    desc: "Corte crop con estampado batik exclusivo de la colección.",
    badge: "nuevo",
    sizes: ["S", "M", "L"],
    stock: 7,
    colors: [
      { name: "Arena", hex: "#5a4d2d" },
      { name: "Grafito", hex: "#2d2d33" }
    ]
  }
];

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJSON<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file(name), "utf-8");
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

async function writeJSON(name: string, value: unknown): Promise<void> {
  await ensureDataDir();
  const target = file(name);
  const temp = `${target}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2), "utf-8");
  await fs.rename(temp, target);
}

export async function getProducts(): Promise<Product[]> {
  return readJSON("products.json", DEFAULT_PRODUCTS);
}

export async function saveProducts(products: Product[]): Promise<void> {
  await writeJSON("products.json", products);
}

export async function getConfig(): Promise<Config> {
  return readJSON("config.json", DEFAULT_CONFIG);
}

export async function saveConfig(config: Config): Promise<void> {
  await writeJSON("config.json", config);
}

export async function getCoupons(): Promise<Record<string, Coupon>> {
  return readJSON("coupons.json", DEFAULT_COUPONS);
}

export async function saveCoupons(coupons: Record<string, Coupon>): Promise<void> {
  await writeJSON("coupons.json", coupons);
}

export async function getOrders(): Promise<Order[]> {
  return readJSON("orders.json", [] as Order[]);
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await writeJSON("orders.json", orders);
}

export async function appendOrder(order: Order): Promise<void> {
  const orders = await getOrders();
  orders.unshift(order);
  await saveOrders(orders);
}

export async function getAdmin(): Promise<AdminConfig> {
  return readJSON("admin.json", { passwordHash: "", salt: "" });
}

export async function saveAdmin(admin: AdminConfig): Promise<void> {
  await writeJSON("admin.json", admin);
}

export function nextProductId(products: Product[]): number {
  return products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
}
