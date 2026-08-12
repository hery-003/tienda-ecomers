"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productImg, productImage, luminance, CATEGORY_EMOJI } from "@/lib/productImage";
import type { Product } from "@/lib/productImage";
import type { Config, Coupon } from "@/lib/store";

type CartItem = {
  key: string;
  id: number;
  size: string;
  color: string;
  qty: number;
};

type Customer = { nombre: string; telefono: string; ciudad: string };

const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string));

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function Storefront({
  products: initialProducts,
  config,
  coupons: initialCoupons
}: {
  products: Product[];
  config: Config;
  coupons: Record<string, Coupon>;
}) {
  const [products] = useState<Product[]>(initialProducts);
  const [coupons] = useState<Record<string, Coupon>>(initialCoupons);

  const money = useCallback((n: number) => `${config.currency} ${n.toFixed(2)}`, [config.currency]);
  const productById = useCallback((id: number) => products.find((p) => p.id === id), [products]);

  const STORAGE = useMemo(
    () => ({
      cart: `${config.brand}_cart`.toLowerCase(),
      customer: `${config.brand}_customer`.toLowerCase(),
      coupon: `${config.brand}_coupon`.toLowerCase()
    }),
    [config.brand]
  );

  // Estado
  const [category, setCategory] = useState("todas");
  const [order, setOrder] = useState("destacados");
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<Record<number, { size: string; color: string }>>({});

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCoupon, setCartCoupon] = useState<{ code: string; type: string; value: number } | null>(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quickviewId, setQuickviewId] = useState<number | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [bump, setBump] = useState(0);

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [formError, setFormError] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Customer>({ nombre: "", telefono: "", ciudad: "" });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar carrito del localStorage
  useEffect(() => {
    const load = () => {
      setCartItems(
        loadJSON<CartItem[]>(STORAGE.cart, [])
          .map((i) => ({
            ...i,
            key: i.key || `${i.id}|${i.size || "M"}|${i.color || ""}`
          }))
          .filter((i: CartItem) => productById(i.id))
      );
      setCartCoupon(loadJSON(STORAGE.coupon, null));
    };
    load();
    window.addEventListener("mitienda-cart-updated", load);
    return () => window.removeEventListener("mitienda-cart-updated", load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveJSON(STORAGE.cart, cartItems);
  }, [cartItems, STORAGE.cart]);

  useEffect(() => {
    saveJSON(STORAGE.coupon, cartCoupon);
  }, [cartCoupon, STORAGE.coupon]);

  // Efectos globales (preloader, cursor glow, back-top, reveal)
  useEffect(() => {
    const pre = document.getElementById("preloader");
    const bar = document.getElementById("preloader-bar");
    let p = 0;
    let stepTimer: ReturnType<typeof setTimeout> | null = null;
    const step = () => {
      p = Math.min(100, p + Math.random() * 30);
      if (bar) bar.style.width = `${p}%`;
      if (p < 100) stepTimer = setTimeout(step, 120);
      else setTimeout(() => pre?.classList.add("hidden"), 200);
    };
    const onLoad = () => {
      p = 100;
      if (bar) bar.style.width = "100%";
      setTimeout(() => pre?.classList.add("hidden"), 250);
    };
    window.addEventListener("load", onLoad);
    stepTimer = setTimeout(step, 60);
    const hideTimer = setTimeout(() => pre?.classList.add("hidden"), 2200);

    // Cursor glow
    let glow: HTMLDivElement | null = null;
    let glowCleanup: (() => void) | null = null;
    const finePointer = !window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (finePointer) {
      glow = document.createElement("div");
      glow.className = "cursor-glow";
      document.body.appendChild(glow);
      const move = (e: PointerEvent) => {
        if (glow) {
          glow.style.left = `${e.clientX}px`;
          glow.style.top = `${e.clientY}px`;
        }
      };
      window.addEventListener("pointermove", move, { passive: true });
      glowCleanup = () => {
        window.removeEventListener("pointermove", move);
        glow?.remove();
      };
    }

    // Back-top
    const back = document.getElementById("back-top");
    const onScroll = () => back?.classList.toggle("show", window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    back?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // Scroll progress
    const progress = document.getElementById("scroll-progress");
    const onScrollProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (progress) progress.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", onScrollProgress, { passive: true });
    onScrollProgress();

    return () => {
      window.removeEventListener("load", onLoad);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScrollProgress);
      if (stepTimer) clearTimeout(stepTimer);
      clearTimeout(hideTimer);
      glowCleanup?.();
    };
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [category, search, order]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const bumpCart = () => setBump((b) => b + 1);

  // Overlay / scroll lock
  const anyOpen = cartOpen || checkoutOpen || quickviewId !== null || menuOpen;
  useEffect(() => {
    document.body.style.overflow = anyOpen || successOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [anyOpen, successOpen]);

  const getSelection = (id: number) => {
    const p = productById(id);
    if (!p) return { size: "", color: "" };
    return selection[id] || { size: p.sizes[0] || "", color: p.colors[0]?.hex || "" };
  };

  const setSelectionField = (id: number, field: "size" | "color", value: string) => {
    setSelection((s) => ({ ...s, [id]: { ...getSelection(id), [field]: value } }));
  };

  const visibleProducts = useMemo(() => {
    let list = category === "todas" ? [...products] : products.filter((p) => p.category === category);
    if (search) {
      list = list.filter((p) =>
        [p.name, p.brand, p.category, p.desc].some((t) => String(t).toLowerCase().includes(search.toLowerCase()))
      );
    }
    switch (order) {
      case "precio-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "precio-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "nombre":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [products, category, search, order]);

  const categories = useMemo(() => ["todas", ...new Set(products.map((p) => p.category))], [products]);

  // ---------- Carrito ----------
  const addToCart = (id: number, size: string, color: string, qty = 1) => {
    const key = `${id}|${size}|${color}`;
    setCartItems((items) => {
      const existing = items.find((i) => i.key === key);
      if (existing) {
        return items.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      }
      return [...items, { key, id, size, color, qty }];
    });
    bumpCart();
    toast("Producto agregado al carrito");
  };

  const changeQty = (key: string, delta: number) => {
    setCartItems((items) =>
      items
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (key: string) => setCartItems((items) => items.filter((i) => i.key !== key));

  const count = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => {
    const p = productById(i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  const discount = useMemo(() => {
    if (!cartCoupon) return 0;
    if (cartCoupon.type === "fixed") return Math.min(cartCoupon.value, subtotal);
    return Math.min(subtotal, (subtotal * cartCoupon.value) / 100);
  }, [cartCoupon, subtotal]);

  const shippingFor = useCallback(
    (ciudad: string) => {
      const rules = config.shipping || [];
      const city = ciudad.trim().toLowerCase();
      const match =
        rules.find((r) => r.ciudad.trim().toLowerCase() === city) ||
        rules.find((r) => r.ciudad.trim().toLowerCase() === "default");
      return match ? match.precio : 0;
    },
    [config.shipping]
  );

  const shipping = shippingFor(formData.ciudad);
  const total = Math.max(0, subtotal - discount + shipping);

  const colorName = (item: CartItem) => {
    const p = productById(item.id);
    const c = p && p.colors ? p.colors.find((cn) => cn.hex === item.color) : null;
    return c ? c.name : item.color || "";
  };

  const checkoutEnabled = count > 0;

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (code && coupons[code]) {
      setCartCoupon({ code, ...coupons[code] });
      const label =
        coupons[code].type === "fixed"
          ? `${coupons[code].value} de descuento`
          : `${coupons[code].value}% de descuento`;
      setCouponMsg({ text: `✓ Cupón ${code} aplicado (${label}).`, ok: true });
    } else if (!code) {
      setCartCoupon(null);
      setCouponMsg({ text: "Ingresa un código de cupón.", ok: false });
    } else {
      setCartCoupon(null);
      setCouponMsg({ text: "✗ Cupón no válido.", ok: false });
    }
  };

  type OrderTotals = {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    coupon: { code: string; type: string; value: number } | null;
  };

  const buildMessage = (nombre: string, telefono: string, ciudad: string, server?: OrderTotals | null) => {
    const t = server ?? { subtotal, discount, shipping, total, coupon: cartCoupon };
    const lines: string[] = [];
    lines.push(`🛒 *NUEVO PEDIDO · ${config.brand}*`);
    lines.push("");
    lines.push(`Hola ${config.brand}! Quiero hacer este pedido:`);
    lines.push("");
    cartItems.forEach((i, idx) => {
      const p = productById(i.id);
      if (!p) return;
      const emoji = CATEGORY_EMOJI[p.category] || "🛍️";
      const color = colorName(i);
      lines.push(`${idx + 1}. ${emoji} *${p.name}*`);
      lines.push(`    📐 Talla: ${i.size || "—"}  ·  🎨 Color: ${color || "—"}`);
      lines.push(`    🔢 Cantidad: ${i.qty} × ${money(p.price)} = ${money(p.price * i.qty)}`);
    });
    lines.push("");
    lines.push(`💵 *Subtotal:* ${money(t.subtotal)}`);
    if (t.coupon) {
      lines.push(`🏷️ *Descuento (${t.coupon.code}):* -${money(t.discount)}`);
    }
    if (t.shipping > 0) {
      lines.push(`🚚 *Envío:* ${money(t.shipping)}`);
    } else {
      lines.push(`🚚 *Envío:* Gratis`);
    }
    lines.push(`🧾 *TOTAL:* ${money(t.total)}`);
    lines.push("");
    lines.push(`🚚 *Datos de envío*`);
    lines.push(`🧍 Nombre: ${nombre}`);
    lines.push(`📱 WhatsApp: ${telefono}`);
    if (ciudad) lines.push(`📍 Ciudad: ${ciudad}`);
    return lines.join("\n");
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const nombre = formData.nombre.trim();
    const telefono = formData.telefono.trim();
    const ciudad = formData.ciudad.trim();
    let valid = true;
    if (nombre.length < 2) {
      errs.nombre = "Ingresa tu nombre completo.";
      valid = false;
    }
    const digits = telefono.replace(/[\s\-().]/g, "");
    if (!/^\+?\d{8,15}$/.test(digits)) {
      errs.telefono = "Ingresa un teléfono válido con prefijo del país (ej. +591 71234567).";
      valid = false;
    }
    if (ciudad && ciudad.length < 2) {
      errs.ciudad = "Ingresa tu ciudad (opcional).";
      valid = false;
    }
    setFieldErrors(errs);
    return valid;
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(false);
    setOrderError(null);
    if (!validate()) {
      setFormError(true);
      setSubmitting(false);
      return;
    }
    const nombre = formData.nombre.trim();
    const telefono = formData.telefono.trim();
    const ciudad = formData.ciudad.trim();
    saveJSON(STORAGE.customer, { nombre, telefono, ciudad });

    const items = cartItems
      .map((i) => {
        const p = productById(i.id);
        return p ? { key: i.key, id: i.id, name: p.name, size: i.size, color: colorName(i), qty: i.qty, price: p.price } : null;
      })
      .filter(Boolean);

    let serverOrder: OrderTotals | null = null;
    let failed = "";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          coupon: cartCoupon,
          customer: { nombre, telefono, ciudad }
        })
      });
      if (res.ok) {
        serverOrder = (await res.json().catch(() => null)) as OrderTotals | null;
      } else {
        const data = await res.json().catch(() => ({}));
        failed = (data && data.error) || "No se pudo registrar el pedido.";
      }
    } catch {
      // Fallo de red: igual se envía por WhatsApp y el vendedor captura el pedido manualmente
    }

    if (failed) {
      setOrderError(failed);
      setSubmitting(false);
      return;
    }

    const msg = buildMessage(nombre, telefono, ciudad, serverOrder);
    window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

    setCartItems([]);
    setCartCoupon(null);
    setFormData({ nombre: "", telefono: "", ciudad: "" });
    setCouponInput("");
    setCouponMsg(null);
    setCheckoutOpen(false);
    setSuccessOpen(true);
    setSubmitting(false);
  };

  const wa = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Hola ${config.brand}, quisiera más información.`)}`;

  const quickviewProduct = quickviewId !== null ? productById(quickviewId) : null;

  return (
    <>
      <div className="scroll-progress" id="scroll-progress"></div>

      <div className="preloader" id="preloader">
        <div className="preloader__ring"></div>
        <div className="preloader__bar">
          <span className="preloader__bar-fill" id="preloader-bar"></span>
        </div>
      </div>

      <header className="header">
        <div className="container header__inner">
          <a href="#" className="brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            {config.brand}
          </a>
          <nav className={`nav${menuOpen ? " open" : ""}`} id="nav">
            <a href="#inicio" className="nav__link" onClick={() => setMenuOpen(false)}>Inicio</a>
            <a href="#catalogo" className="nav__link" onClick={() => setMenuOpen(false)}>Catálogo</a>
            <a href="#contacto" className="nav__link" onClick={() => setMenuOpen(false)}>Contacto</a>
          </nav>
          <div className="header__actions">
            <div className="socials socials--header">
              <a href={wa} className="social" aria-label="WhatsApp" title="WhatsApp" target="_blank" rel="noopener">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.9-1.4A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1.1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .6-.2 1.2z"/></svg>
              </a>
              <a href="#" className="social" aria-label="Instagram" title="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="#" className="social" aria-label="TikTok" title="TikTok">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.8A4.8 4.8 0 0 1 15 3h-3v13.2a2.6 2.6 0 1 1-2.2-2.6V10.5a5.6 5.6 0 1 0 4.9 5.5V9.4a7.8 7.8 0 0 0 4.5 1.4V7.9a4.8 4.8 0 0 1-2.6-2.1z"/></svg>
              </a>
            </div>
            <button
              className={`nav-toggle${menuOpen ? " open" : ""}`}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((m) => !m)}
            >
              <span></span><span></span><span></span>
            </button>
            <button className={`cart-btn${bump ? " bump" : ""}`} aria-label="Abrir carrito" onClick={() => { setCartOpen(true); setMenuOpen(false); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className={`cart-badge${count === 0 ? " hidden" : ""}`}>{count}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="hero__blob hero__blob--1" aria-hidden="true"></div>
        <div className="hero__blob hero__blob--2" aria-hidden="true"></div>
        <div className="hero__blob hero__blob--3" aria-hidden="true"></div>
        <div className="container hero__inner">
          <p className="hero__tagline">Colección 2026</p>
          <h1>Streetwear premium</h1>
          <p className="hero__sub">Diseñado para quienes desafían los límites. Cada pieza es una declaración de estilo y resistencia.</p>
          <div className="hero__cta">
            <a href="#catalogo" className="btn btn--primary">Ver catálogo</a>
            <a href="#contacto" className="btn btn--ghost">Contáctanos</a>
          </div>
        </div>
        <div className="hero-scroll__hint">
          <span>Scroll</span>
          <span className="hero-scroll__line"></span>
        </div>
      </section>

      <div className="promo-banner" id="promo-banner">
        <span className="promo-banner__icon">✦</span>
        <p className="promo-banner__text">Envío gratis en compras mayores a <strong>Bs 300</strong> · Usa el cupón <strong>STREET10</strong></p>
        <a href="#catalogo" className="promo-banner__cta">Ver ofertas</a>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          <div className="marquee__group">
            <span className="marquee__item">Nueva colección 2026 <em>✦</em></span>
            <span className="marquee__item">Envíos a todo el país <em>✦</em></span>
            <span className="marquee__item">Cupón STREET10 <em>✦</em></span>
            <span className="marquee__item">Drops exclusivos <em>✦</em></span>
            <span className="marquee__item">Streetwear premium <em>✦</em></span>
          </div>
          <div className="marquee__group" aria-hidden="true">
            <span className="marquee__item">Nueva colección 2026 <em>✦</em></span>
            <span className="marquee__item">Envíos a todo el país <em>✦</em></span>
            <span className="marquee__item">Cupón STREET10 <em>✦</em></span>
            <span className="marquee__item">Drops exclusivos <em>✦</em></span>
            <span className="marquee__item">Streetwear premium <em>✦</em></span>
          </div>
        </div>
      </div>

      <main className="container">
        <section id="categorias" className="section">
          <h2 className="section__title">Categorías</h2>
          <div className="categories" id="categories">
            {categories.map((c, i) => (
              <button
                key={c}
                className={`category-chip reveal reveal-d${Math.min(i, 4)}${c === category ? " active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c === "todas" ? "Todas" : c}
              </button>
            ))}
          </div>
        </section>

        <div className="section-divider" aria-hidden="true"></div>

        <section id="catalogo" className="section">
          <div className="catalogo__head">
            <h2 className="section__title">Catálogo</h2>
            <div className="filters">
              <input
                type="search"
                className="search"
                placeholder="Buscar producto, marca o categoría…"
                aria-label="Buscar en el catálogo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="select" aria-label="Ordenar productos" value={order} onChange={(e) => setOrder(e.target.value)}>
                <option value="destacados">Destacados</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="nombre">Nombre A-Z</option>
              </select>
            </div>
          </div>
          <div className="grid" id="product-grid">
            {visibleProducts.length === 0 ? (
              <p className="cart-empty">No encontramos productos para tu búsqueda.</p>
            ) : (
              visibleProducts.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  delay={i % 4}
                  money={money}
                  getSelection={getSelection}
                  onColor={(id, hex) => setSelectionField(id, "color", hex)}
                  onSize={(id, size) => setSelectionField(id, "size", size)}
                  onAdd={(id, size, color) => addToCart(id, size, color)}
                  onQuickView={() => setQuickviewId(p.id)}
                />
              ))
            )}
          </div>
        </section>

        <div className="section-divider" aria-hidden="true"></div>

        <section id="contacto" className="section">
          <h2 className="section__title">Contacto</h2>
          <div className="contact__box">
            <p>¿Dudas sobre tallas, envíos o pedidos? Escríbenos por WhatsApp y te respondemos al instante.</p>
            <a href={wa} className="btn btn--primary" target="_blank" rel="noopener">Chatear por WhatsApp</a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__col">
            <h4>{config.brand}</h4>
            <div className="socials">
              <a href={wa} className="social" aria-label="WhatsApp" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.9-1.4A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1.1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .6-.2 1.2z"/></svg></a>
              <a href="#" className="social" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
              <a href="#" className="social" aria-label="TikTok"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.8 4.8 0 0 1 15 3h-3v13.2a2.6 2.6 0 1 1-2.2-2.6V10.5a5.6 5.6 0 1 0 4.9 5.5V9.4a7.8 7.8 0 0 0 4.5 1.4V7.9a4.8 4.8 0 0 1-2.6-2.1z"/></svg></a>
            </div>
          </div>
          <div className="footer__col">
            <h4>Tienda</h4>
            <ul className="footer__links">
              <li><a href="#catalogo">Novedades</a></li>
              <li><a href="#catalogo">Hoodies</a></li>
              <li><a href="#catalogo">Baggis</a></li>
              <li><a href="#catalogo">Accesorios</a></li>
              <li><a href="#catalogo">Sale</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Soporte</h4>
            <ul className="footer__links">
              <li><a href="#contacto">Guía de tallas</a></li>
              <li><a href="#contacto">Envíos</a></li>
              <li><a href="#contacto">Devoluciones</a></li>
              <li><a href="#contacto">FAQ</a></li>
              <li><a href="#contacto">Contacto</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Newsletter</h4>
            <p className="footer__news">Suscríbete para recibir acceso anticipado a drops exclusivos y un 10% de descuento en tu primera compra.</p>
            <form className="newsletter" id="newsletter-form" onSubmit={(e) => { e.preventDefault(); (e.currentTarget as HTMLFormElement).reset(); toast("¡Suscripción exitosa!"); }}>
              <input type="email" placeholder="tu@email.com" required aria-label="Email para newsletter" />
              <button type="submit" className="btn btn--primary">Unirme</button>
            </form>
          </div>
        </div>
        <div className="container footer__legal">
          <p>© {new Date().getFullYear()} {config.brand}. Todos los derechos reservados.</p>
          <div className="footer__legal-links">
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
            <a href="#">Cookies</a>
            <Link href="/admin">Admin</Link>
          </div>
        </div>
      </footer>

      {anyOpen && <div className="overlay" onClick={() => { setCartOpen(false); setCheckoutOpen(false); setQuickviewId(null); setMenuOpen(false); }}></div>}

      {cartOpen && (
        <aside className="cart-drawer" aria-label="Carrito de compras">
          <div className="cart-drawer__head">
            <h3>Tu carrito</h3>
            <button className="icon-btn" aria-label="Cerrar carrito" onClick={() => setCartOpen(false)}>&times;</button>
          </div>
          <div className="cart-drawer__items" id="cart-items">
            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <p>Tu carrito está vacío.</p>
              </div>
            ) : (
              cartItems.map((i) => {
                const p = productById(i.id);
                if (!p) return null;
                const meta = [];
                if (i.size) meta.push(`<b>Talla:</b> ${esc(i.size)}`);
                if (i.color) meta.push(`<b>Color:</b> ${esc(colorName(i))}`);
                return (
                  <div className="cart-item" key={i.key}>
                    <div className="cart-item__img"><Image unoptimized src={productImg(p)} alt={p.name} width={64} height={64} /></div>
                    <div className="cart-item__info">
                      <div className="cart-item__name">{p.name}</div>
                      {meta.length > 0 && <div className="cart-item__meta" dangerouslySetInnerHTML={{ __html: meta.join(" · ") }} />}
                      <div className="cart-item__price">{money(p.price)} c/u</div>
                      <div className="qty">
                        <button onClick={() => changeQty(i.key, -1)} aria-label="Quitar uno">−</button>
                        <span>{i.qty}</span>
                        <button onClick={() => changeQty(i.key, 1)} aria-label="Agregar uno">+</button>
                      </div>
                    </div>
                    <div className="cart-item__side">
                      <strong>{money(p.price * i.qty)}</strong>
                      <button className="cart-item__remove" onClick={() => removeItem(i.key)}>Eliminar</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="cart-drawer__footer">
            <div className="cart-drawer__total">
              <span>Total</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <button
              className="btn btn--primary btn--block"
              disabled={!checkoutEnabled}
              onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
            >
              Finalizar por WhatsApp
            </button>
          </div>
        </aside>
      )}

      {checkoutOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <div className="modal__content">
            <div className="modal__head">
              <h3 id="checkout-title">Tu pedido</h3>
              <button className="icon-btn" aria-label="Cerrar" onClick={() => setCheckoutOpen(false)}>&times;</button>
            </div>
            <div className="modal__summary" id="checkout-summary">
              {cartItems.map((i) => {
                const p = productById(i.id);
                if (!p) return null;
                const parts = [esc(p.name)];
                if (i.size) parts.push(`<b>${esc(i.size)}</b>`);
                const cn = colorName(i);
                if (cn) parts.push(esc(cn));
                return (
                  <div className="modal__summary-row" key={i.key}>
                    <span dangerouslySetInnerHTML={{ __html: `${parts.join(" · ")} <em>x${i.qty}</em>` }} />
                    <strong>{money(p.price * i.qty)}</strong>
                  </div>
                );
              })}
              <div className="modal__summary-row modal__summary-sub"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              {cartCoupon && <div className="modal__summary-row modal__summary-discount"><span>Descuento ({cartCoupon.code})</span><strong>-{money(discount)}</strong></div>}
              <div className="modal__summary-row modal__summary-ship"><span>Envío</span><strong>{shipping > 0 ? money(shipping) : "Gratis"}</strong></div>
              <div className="modal__summary-row modal__summary-total"><span>Total</span><strong>{money(total)}</strong></div>
            </div>
            <div className="coupon">
              <input
                type="text"
                className="coupon__input"
                placeholder="Cupón (ej. STREET10)"
                aria-label="Cupón de descuento"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
              />
              <button type="button" className="btn btn--ghost coupon__apply" onClick={applyCoupon}>Aplicar</button>
            </div>
            {couponMsg && (
              <p className={`coupon__msg ${couponMsg.ok ? "coupon__msg--ok" : "coupon__msg--err"}`}>{couponMsg.text}</p>
            )}
            <form id="checkout-form" noValidate onSubmit={submitOrder}>
              <label className="field">
                <span>Nombre completo</span>
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Juan Pérez"
                  className={fieldErrors.nombre ? "invalid" : ""}
                  value={formData.nombre}
                  onChange={(e) => setFormData((d) => ({ ...d, nombre: e.target.value }))}
                />
                {fieldErrors.nombre && <small className="field-hint">{fieldErrors.nombre}</small>}
              </label>
              <label className="field">
                <span>Teléfono / WhatsApp</span>
                <input
                  type="tel"
                  name="telefono"
                  required
                  placeholder="+591 71234567"
                  className={fieldErrors.telefono ? "invalid" : ""}
                  value={formData.telefono}
                  onChange={(e) => setFormData((d) => ({ ...d, telefono: e.target.value }))}
                />
                {fieldErrors.telefono && <small className="field-hint">{fieldErrors.telefono}</small>}
              </label>
              <label className="field">
                <span>Ciudad (opcional)</span>
                <input
                  type="text"
                  name="ciudad"
                  placeholder="La Paz, Cochabamba, Santa Cruz..."
                  className={fieldErrors.ciudad ? "invalid" : ""}
                  value={formData.ciudad}
                  onChange={(e) => setFormData((d) => ({ ...d, ciudad: e.target.value }))}
                />
                {fieldErrors.ciudad && <small className="field-hint">{fieldErrors.ciudad}</small>}
              </label>
              {formError && <p className="modal__error">Revisa los campos marcados en rojo.</p>}
              {orderError && <p className="modal__error">{orderError}</p>}
              <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                {submitting ? "Enviando pedido…" : "Confirmar por WhatsApp"}
              </button>
            </form>
          </div>
        </div>
      )}

      {quickviewProduct && (
        <QuickView
          key={quickviewProduct.id}
          product={quickviewProduct}
          money={money}
          getSelection={getSelection}
          onAdd={addToCart}
          onClose={() => setQuickviewId(null)}
          toast={toast}
        />
      )}

      {successOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div className="modal__content modal__content--center">
            <div className="success-icon" aria-hidden="true">&#10003;</div>
            <h3 id="success-title">¡Pedido listo!</h3>
            <p>Te abrimos WhatsApp con tu pedido. Envía el mensaje y coordinamos la entrega.</p>
            <button className="btn btn--primary" onClick={() => setSuccessOpen(false)}>Seguir comprando</button>
          </div>
        </div>
      )}

      <button className="back-top" id="back-top" aria-label="Volver arriba">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
      </button>

      {toastMsg && <div className="toast show">{toastMsg}</div>}
    </>
  );
}

function ProductCard({
  product: p,
  delay,
  money,
  getSelection,
  onColor,
  onSize,
  onAdd,
  onQuickView
}: {
  product: Product;
  delay: number;
  money: (n: number) => string;
  getSelection: (id: number) => { size: string; color: string };
  onColor: (id: number, hex: string) => void;
  onSize: (id: number, size: string) => void;
  onAdd: (id: number, size: string, color: string) => void;
  onQuickView: () => void;
}) {
  const soldOut = p.badge === "agotado" || (p.stock ?? Infinity) <= 0;
  const lowStock = !soldOut && (p.stock ?? Infinity) <= 5;
  const sel = getSelection(p.id);

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${py * -10}deg)`;
  };
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "";
  };

  return (
    <article
      className={`card card--tilt reveal reveal-d${delay}`}
      data-id={p.id}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="card__media" onClick={onQuickView}>
        <Image unoptimized src={productImg(p)} alt={p.name} width={200} height={200} loading="lazy" />
        {p.badge === "nuevo" && <span className="badge badge--nuevo">Nuevo</span>}
        {soldOut && <span className="badge badge--agotado">Agotado</span>}
        {lowStock && <span className="badge badge--stock">¡Últimas {p.stock}!</span>}
        <span className="card__quick">Vista rápida</span>
      </div>
      <div className="card__body">
        <span className="card__category">{p.category}</span>
        <span className="card__brand">{p.brand}</span>
        <h3 className="card__title">{p.name}</h3>
        <div className="card__price-row">
          <span className="card__price">{money(p.price)}</span>
          {p.oldPrice ? <span className="card__old">{money(p.oldPrice)}</span> : null}
        </div>
        <div className="card__options">
          <div className="card__opt-row">
            <span className="card__opt-label">Color</span>
            <div className="color-selector">
              {p.colors.map((cn) => (
                <button
                  key={cn.hex}
                  className={`color-swatch${cn.hex === sel.color ? " active" : ""}`}
                  type="button"
                  title={cn.name}
                  style={{ background: cn.hex }}
                  onClick={() => onColor(p.id, cn.hex)}
                >
                  <span style={{ color: luminance(cn.hex) > 0.55 ? "#0b0b0d" : "#fff" }}>✓</span>
                </button>
              ))}
            </div>
          </div>
          <div className="card__opt-row">
            <span className="card__opt-label">Talla</span>
            <div className="size-selector">
              {p.sizes.map((sz) => (
                <button
                  key={sz}
                  className={`size-btn${sz === sel.size ? " active" : ""}`}
                  type="button"
                  onClick={() => onSize(p.id, sz)}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="btn btn--add btn-add" disabled={soldOut} onClick={() => onAdd(p.id, sel.size, sel.color)}>
          {soldOut ? "Agotado" : "Agregar al carrito"}
        </button>
      </div>
    </article>
  );
}

function QuickView({
  product: p,
  money,
  getSelection,
  onAdd,
  onClose,
  toast
}: {
  product: Product;
  money: (n: number) => string;
  getSelection: (id: number) => { size: string; color: string };
  onAdd: (id: number, size: string, color: string, qty?: number) => void;
  onClose: () => void;
  toast: (msg: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selColor, setSelColor] = useState(getSelection(p.id).color);
  const [selSize, setSelSize] = useState(getSelection(p.id).size);
  const soldOut = p.badge === "agotado" || (p.stock ?? Infinity) <= 0;
  const lowStock = !soldOut && (p.stock ?? Infinity) <= 5;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="quickview-title">
      <div className="modal__content modal__content--quickview">
        <div className="modal__head">
          <h3 id="quickview-title">Detalle de producto</h3>
          <button className="icon-btn" aria-label="Cerrar" onClick={onClose}>&times;</button>
        </div>
        <div className="quickview">
          <div className="quickview__media">
            <Image unoptimized src={p.image ? p.image : productImage(p.category, selColor)} alt={p.name} width={400} height={300} />
            {p.badge === "nuevo" && <span className="badge badge--nuevo">Nuevo</span>}
            {soldOut && <span className="badge badge--agotado">Agotado</span>}
            {lowStock && <span className="badge badge--stock">¡Últimas {p.stock}!</span>}
          </div>
          <div className="quickview__body">
            <span className="card__category">{p.category}</span>
            <span className="card__brand">{p.brand}</span>
        <h3 className="card__title">
          <Link href={`/producto/${p.id}`} onClick={(e) => e.stopPropagation()}>{p.name}</Link>
        </h3>
            <div className="card__price-row">
              <span className="card__price">{money(p.price)}</span>
              {p.oldPrice ? <span className="card__old">{money(p.oldPrice)}</span> : null}
            </div>
            <p className="quickview__desc">{p.desc}</p>
            <div className="quickview__field">
              <span className="quickview__label">Color</span>
              <div className="color-selector">
                {p.colors.map((cn) => (
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
                {p.sizes.map((sz) => (
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
            <button
              className="btn btn--primary btn--block qv-add"
              disabled={soldOut}
              onClick={() => {
                if (soldOut) return;
                onAdd(p.id, selSize, selColor, qty);
                toast("Producto agregado al carrito");
                onClose();
              }}
            >
              {soldOut ? "Agotado" : "Agregar al carrito"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
