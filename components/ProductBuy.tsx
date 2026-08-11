"use client";

import { useState } from "react";
import { luminance } from "@/lib/productImage";
import type { Product } from "@/lib/productImage";
import type { Config } from "@/lib/store";

type CartItem = {
  key: string;
  id: number;
  size: string;
  color: string;
  qty: number;
};

function loadCart(key: string): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]").map((i: CartItem) => ({
      ...i,
      key: i.key || `${i.id}|${i.size || "M"}|${i.color || ""}`
    }));
  } catch {
    return [];
  }
}

export default function ProductBuy({ product, config }: { product: Product; config: Config }) {
  const [selColor, setSelColor] = useState(product.colors[0]?.hex || "");
  const [selSize, setSelSize] = useState(product.sizes[0] || "");
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const soldOut = product.badge === "agotado" || (product.stock ?? Infinity) <= 0;
  const cartKey = `${config.brand}_cart`.toLowerCase();

  const addToCart = () => {
    if (soldOut) return;
    const key = `${product.id}|${selSize}|${selColor}`;
    const items = loadCart(cartKey);
    const existing = items.find((i) => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ key, id: product.id, size: selSize, color: selColor, qty });
    }
    localStorage.setItem(cartKey, JSON.stringify(items));
    setToast("Producto agregado al carrito");
    window.dispatchEvent(new Event("mitienda-cart-updated"));
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div>
      <div className="quickview__field">
        <span className="quickview__label">Color</span>
        <div className="color-selector">
          {product.colors.map((cn) => (
            <button
              key={cn.hex}
              className={`color-swatch${cn.hex === selColor ? " active" : ""}`}
              type="button"
              title={cn.name}
              style={{ background: cn.hex }}
              onClick={() => setSelColor(cn.hex)}
            >
              <span style={{ color: luminance(cn.hex) > 0.55 ? "#0b0b0d" : "#fff" }}>✓</span>
            </button>
          ))}
        </div>
      </div>
      <div className="quickview__field">
        <span className="quickview__label">Talla</span>
        <div className="size-selector">
          {product.sizes.map((sz) => (
            <button
              key={sz}
              className={`size-btn${sz === selSize ? " active" : ""}`}
              type="button"
              onClick={() => setSelSize(sz)}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>
      <div className="quickview__field">
        <span className="quickview__label">Cantidad</span>
        <div className="qty">
          <button type="button" aria-label="Quitar uno" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="qv-qty-num">{qty}</span>
          <button type="button" aria-label="Agregar uno" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      <button className="btn btn--primary btn--add" disabled={soldOut} onClick={addToCart}>
        {soldOut ? "Agotado" : "Agregar al carrito"}
      </button>
      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
