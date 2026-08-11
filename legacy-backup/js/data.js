const STORAGE_PREFIX = "mitienda_";
const storageKey = (name) => STORAGE_PREFIX + name;

function loadJSON(name, fallback) {
  try {
    const raw = localStorage.getItem(storageKey(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function saveJSON(name, value) {
  localStorage.setItem(storageKey(name), JSON.stringify(value));
}

const DEFAULT_CONFIG = {
  brand: "MiTienda",
  whatsapp: "59171234567",
  currency: "Bs"
};
const CONFIG = loadJSON("config", DEFAULT_CONFIG);

const DEFAULT_COUPONS = {
  STREET10: { type: "percent", value: 10 },
  DROP20: { type: "percent", value: 20 }
};
const COUPONS = loadJSON("coupons", DEFAULT_COUPONS);

const CATEGORY_EMOJI = {
  Hoodies: "🧥",
  Jerseys: "👕",
  Boxis: "👕",
  Baggis: "👖",
  "Tank tops": "🎽",
  Shorts: "🩳",
  Casacas: "🧥",
  Compresores: "🦵"
};

const DEFAULT_PRODUCTS = [
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
    colors: [
      { name: "Arena", hex: "#5a4d2d" },
      { name: "Grafito", hex: "#2d2d33" }
    ]
  }
];

const PRODUCTS = loadJSON("products", DEFAULT_PRODUCTS);

function shade(hex, percent) {
  const n = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function luminance(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = n >> 16;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const tshirt = (c, d, k) => `
  <path d="M78 64 L34 48 L26 98 L72 92 Z" fill="${d}"/>
  <path d="M122 64 L166 48 L174 98 L128 92 Z" fill="${d}"/>
  <path d="M78 64 L122 64 L116 158 L84 158 Z" fill="${c}"/>
  <path d="M86 64 Q100 82 114 64 L114 54 Q100 74 86 54 Z" fill="${d}"/>
  <path d="M84 148 L116 148 L116 158 L84 158 Z" fill="${d}"/>`;

const boxy = (c, d, k) => `
  <path d="M76 62 L26 46 L18 96 L70 90 Z" fill="${d}"/>
  <path d="M124 62 L174 46 L182 96 L130 90 Z" fill="${d}"/>
  <path d="M76 62 L124 62 L132 156 L68 156 Z" fill="${c}"/>
  <path d="M84 62 Q100 80 116 62 L116 52 Q100 72 84 52 Z" fill="${d}"/>
  <path d="M68 146 L132 146 L132 156 L68 156 Z" fill="${d}"/>`;

const hoodie = (c, d, k) => `
  <path d="M80 64 L30 84 L30 138 L80 118 Z" fill="${d}"/>
  <path d="M120 64 L170 84 L170 138 L120 118 Z" fill="${d}"/>
  <path d="M30 124 L80 106 L80 118 L30 138 Z" fill="${k}"/>
  <path d="M170 124 L120 106 L120 118 L170 138 Z" fill="${k}"/>
  <path d="M80 64 L120 64 L120 150 L80 150 Z" fill="${c}"/>
  <path d="M84 64 C84 26 116 26 116 64 L108 64 C108 44 92 44 92 64 Z" fill="${d}"/>
  <path d="M93 46 L90 74" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
  <path d="M107 46 L110 74" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
  <path d="M90 116 Q100 124 110 116 L110 142 L90 142 Z" fill="${k}"/>`;

const pants = (c, d, k) => `
  <rect x="58" y="48" width="84" height="18" rx="5" fill="${d}"/>
  <rect x="58" y="62" width="84" height="6" rx="3" fill="${k}"/>
  <path d="M60 68 L56 152 L98 152 L98 68 Z" fill="${c}"/>
  <path d="M140 68 L144 152 L102 152 L102 68 Z" fill="${c}"/>
  <path d="M56 142 L98 142 L98 152 L56 152 Z" fill="${d}"/>
  <path d="M144 142 L102 142 L102 152 L144 152 Z" fill="${d}"/>
  <line x1="100" y1="72" x2="100" y2="150" stroke="${k}" stroke-width="2"/>
  <path d="M78 48 L80 66" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
  <path d="M122 48 L120 66" stroke="${k}" stroke-width="4" stroke-linecap="round"/>`;

const tank = (c, d, k) => `
  <path d="M72 64 L70 36 L88 40 L90 64 Z" fill="${d}"/>
  <path d="M128 64 L130 36 L112 40 L110 64 Z" fill="${d}"/>
  <path d="M74 64 L126 64 L120 158 L80 158 Z" fill="${c}"/>
  <path d="M82 64 Q100 78 118 64 L118 54 Q100 72 82 54 Z" fill="${k}"/>
  <path d="M80 148 L120 148 L120 158 L80 158 Z" fill="${d}"/>`;

const shorts = (c, d, k) => `
  <rect x="54" y="48" width="92" height="18" rx="5" fill="${d}"/>
  <rect x="54" y="62" width="92" height="6" rx="3" fill="${k}"/>
  <path d="M56 68 L52 106 L96 106 L96 68 Z" fill="${c}"/>
  <path d="M144 68 L148 106 L104 106 L104 68 Z" fill="${c}"/>
  <path d="M52 96 L96 96 L96 106 L52 106 Z" fill="${d}"/>
  <path d="M148 96 L104 96 L104 106 L148 106 Z" fill="${d}"/>
  <path d="M76 48 L78 64" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
  <path d="M124 48 L122 64" stroke="${k}" stroke-width="4" stroke-linecap="round"/>`;

const jacket = (c, d, k) => `
  <path d="M78 66 L30 82 L24 136 L78 120 Z" fill="${d}"/>
  <path d="M122 66 L170 82 L176 136 L122 120 Z" fill="${d}"/>
  <path d="M30 124 L78 108 L78 120 L30 136 Z" fill="${k}"/>
  <path d="M170 124 L122 108 L122 120 L170 136 Z" fill="${k}"/>
  <path d="M78 66 L122 66 L128 150 L72 150 Z" fill="${c}"/>
  <path d="M82 66 L94 82 L100 74 L106 82 L118 66 Z" fill="${d}"/>
  <line x1="100" y1="78" x2="100" y2="150" stroke="${k}" stroke-width="3"/>
  <path d="M74 120 L96 120 L96 138 L74 138 Z" fill="none" stroke="${k}" stroke-width="3"/>
  <path d="M104 120 L126 120 L126 138 L104 138 Z" fill="none" stroke="${k}" stroke-width="3"/>`;

const leggings = (c, d, k) => `
  <rect x="60" y="46" width="80" height="18" rx="5" fill="${d}"/>
  <rect x="60" y="60" width="80" height="6" rx="3" fill="${k}"/>
  <path d="M62 68 L62 154 L92 154 L92 68 Z" fill="${c}"/>
  <path d="M138 68 L138 154 L108 154 L108 68 Z" fill="${c}"/>
  <path d="M62 144 L92 144 L92 154 L62 154 Z" fill="${k}"/>
  <path d="M138 144 L108 144 L108 154 L138 154 Z" fill="${k}"/>
  <line x1="100" y1="68" x2="100" y2="154" stroke="${k}" stroke-width="2"/>`;

const GARMENTS = {
  Hoodies: hoodie,
  Jerseys: tshirt,
  Boxis: boxy,
  Baggis: pants,
  "Tank tops": tank,
  Shorts: shorts,
  Casacas: jacket,
  Compresores: leggings,
  default: tshirt
};

function productImage(category = "", color = "#3b4d61") {
  const render = GARMENTS[category] || GARMENTS.default;
  const dark = shade(color, -16);
  const darker = shade(color, -34);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#1d1d22"/><stop offset="1" stop-color="#111114"/>` +
    `</linearGradient></defs>` +
    `<rect width="200" height="200" fill="url(#g)"/>` +
    `<ellipse cx="100" cy="162" rx="52" ry="7" fill="rgba(0,0,0,0.35)"/>` +
    render(color, dark, darker) +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function productImg(product) {
  return (product && product.image) || productImage(product && product.category, product && product.colors && product.colors[0] ? product.colors[0].hex : "#3b4d61");
}
