export type Color = { name: string; hex: string };

export type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  oldPrice: number | null;
  badge: string | null;
  desc: string;
  sizes: string[];
  colors: Color[];
  stock?: number;
};

export const CATEGORY_EMOJI: Record<string, string> = {
  Hoodies: "🧥",
  Jerseys: "👕",
  Boxis: "👕",
  Baggis: "👖",
  "Tank tops": "🎽",
  Shorts: "🩳",
  Casacas: "🧥",
  Compresores: "🦵"
};

export function shade(hex: string, percent: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = n >> 16;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const tshirt = (c: string, d: string) => `
  <path d="M78 64 L34 48 L26 98 L72 92 Z" fill="${d}"/>
  <path d="M122 64 L166 48 L174 98 L128 92 Z" fill="${d}"/>
  <path d="M78 64 L122 64 L116 158 L84 158 Z" fill="${c}"/>
  <path d="M86 64 Q100 82 114 64 L114 54 Q100 74 86 54 Z" fill="${d}"/>
  <path d="M84 148 L116 148 L116 158 L84 158 Z" fill="${d}"/>`;

const boxy = (c: string, d: string) => `
  <path d="M76 62 L26 46 L18 96 L70 90 Z" fill="${d}"/>
  <path d="M124 62 L174 46 L182 96 L130 90 Z" fill="${d}"/>
  <path d="M76 62 L124 62 L132 156 L68 156 Z" fill="${c}"/>
  <path d="M84 62 Q100 80 116 62 L116 52 Q100 72 84 52 Z" fill="${d}"/>
  <path d="M68 146 L132 146 L132 156 L68 156 Z" fill="${d}"/>`;

const hoodie = (c: string, d: string, k: string) => `
  <path d="M80 64 L30 84 L30 138 L80 118 Z" fill="${d}"/>
  <path d="M120 64 L170 84 L170 138 L120 118 Z" fill="${d}"/>
  <path d="M30 124 L80 106 L80 118 L30 138 Z" fill="${k}"/>
  <path d="M170 124 L120 106 L120 118 L170 138 Z" fill="${k}"/>
  <path d="M80 64 L120 64 L120 150 L80 150 Z" fill="${c}"/>
  <path d="M84 64 C84 26 116 26 116 64 L108 64 C108 44 92 44 92 64 Z" fill="${d}"/>
  <path d="M93 46 L90 74" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
  <path d="M107 46 L110 74" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
  <path d="M90 116 Q100 124 110 116 L110 142 L90 142 Z" fill="${k}"/>`;

const pants = (c: string, d: string, k: string) => `
  <rect x="58" y="48" width="84" height="18" rx="5" fill="${d}"/>
  <rect x="58" y="62" width="84" height="6" rx="3" fill="${k}"/>
  <path d="M60 68 L56 152 L98 152 L98 68 Z" fill="${c}"/>
  <path d="M140 68 L144 152 L102 152 L102 68 Z" fill="${c}"/>
  <path d="M56 142 L98 142 L98 152 L56 152 Z" fill="${d}"/>
  <path d="M144 142 L102 142 L102 152 L144 152 Z" fill="${d}"/>
  <line x1="100" y1="72" x2="100" y2="150" stroke="${k}" stroke-width="2"/>
  <path d="M78 48 L80 66" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
  <path d="M122 48 L120 66" stroke="${k}" stroke-width="4" stroke-linecap="round"/>`;

const tank = (c: string, d: string, k: string) => `
  <path d="M72 64 L70 36 L88 40 L90 64 Z" fill="${d}"/>
  <path d="M128 64 L130 36 L112 40 L110 64 Z" fill="${d}"/>
  <path d="M74 64 L126 64 L120 158 L80 158 Z" fill="${c}"/>
  <path d="M82 64 Q100 78 118 64 L118 54 Q100 72 82 54 Z" fill="${k}"/>
  <path d="M80 148 L120 148 L120 158 L80 158 Z" fill="${d}"/>`;

const shorts = (c: string, d: string, k: string) => `
  <rect x="54" y="48" width="92" height="18" rx="5" fill="${d}"/>
  <rect x="54" y="62" width="92" height="6" rx="3" fill="${k}"/>
  <path d="M56 68 L52 106 L96 106 L96 68 Z" fill="${c}"/>
  <path d="M144 68 L148 106 L104 106 L104 68 Z" fill="${c}"/>
  <path d="M52 96 L96 96 L96 106 L52 106 Z" fill="${d}"/>
  <path d="M148 96 L104 96 L104 106 L148 106 Z" fill="${d}"/>
  <path d="M76 48 L78 64" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
  <path d="M124 48 L122 64" stroke="${k}" stroke-width="4" stroke-linecap="round"/>`;

const jacket = (c: string, d: string, k: string) => `
  <path d="M78 66 L30 82 L24 136 L78 120 Z" fill="${d}"/>
  <path d="M122 66 L170 82 L176 136 L122 120 Z" fill="${d}"/>
  <path d="M30 124 L78 108 L78 120 L30 136 Z" fill="${k}"/>
  <path d="M170 124 L122 108 L122 120 L170 136 Z" fill="${k}"/>
  <path d="M78 66 L122 66 L128 150 L72 150 Z" fill="${c}"/>
  <path d="M82 66 L94 82 L100 74 L106 82 L118 66 Z" fill="${d}"/>
  <line x1="100" y1="78" x2="100" y2="150" stroke="${k}" stroke-width="3"/>
  <path d="M74 120 L96 120 L96 138 L74 138 Z" fill="none" stroke="${k}" stroke-width="3"/>
  <path d="M104 120 L126 120 L126 138 L104 138 Z" fill="none" stroke="${k}" stroke-width="3"/>`;

const leggings = (c: string, d: string, k: string) => `
  <rect x="60" y="46" width="80" height="18" rx="5" fill="${d}"/>
  <rect x="60" y="60" width="80" height="6" rx="3" fill="${k}"/>
  <path d="M62 68 L62 154 L92 154 L92 68 Z" fill="${c}"/>
  <path d="M138 68 L138 154 L108 154 L108 68 Z" fill="${c}"/>
  <path d="M62 144 L92 144 L92 154 L62 154 Z" fill="${k}"/>
  <path d="M138 144 L108 144 L108 154 L138 154 Z" fill="${k}"/>
  <line x1="100" y1="68" x2="100" y2="154" stroke="${k}" stroke-width="2"/>`;

const GARMENTS: Record<string, (c: string, d: string, k: string) => string> = {
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

export function productImage(category = "", color = "#3b4d61"): string {
  const render = GARMENTS[category] || GARMENTS.default;
  const dark = shade(color, -16);
  const darker = shade(color, -34);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#faf2ec"/><stop offset="1" stop-color="#fdf9f7"/>` +
    `</linearGradient></defs>` +
    `<rect width="200" height="200" fill="url(#g)"/>` +
    `<ellipse cx="100" cy="162" rx="52" ry="7" fill="rgba(190,150,140,0.18)"/>` +
    render(color, dark, darker) +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function productImg(product: Product | null | undefined): string {
  if (product?.image) return product.image;
  return productImage(
    product?.category || "",
    product?.colors && product.colors[0] ? product.colors[0].hex : "#3b4d61"
  );
}
