"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { productImg, productImage } from "@/lib/productImage";
import type { Product, Color } from "@/lib/productImage";
import type { Config, Coupon, Order } from "@/lib/store";
import { ORDER_STATUSES } from "@/lib/store";

const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string));

type ToastState = { msg: string; id: number } | null;

export default function AdminPanel({ initialAuthed }: { initialAuthed: boolean }) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [toast, setToast] = useState<ToastState>(null);
  const [tab, setTab] = useState<"productos" | "config" | "cupones" | "pedidos">("productos");

  const notify = useCallback((msg: string) => {
    setToast({ msg, id: Date.now() });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const doLogout = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" });
    setAuthed(false);
  }, []);

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} notify={notify} />;
  }

  return (
    <>
      <AdminHeader onLogout={doLogout} />
      <main className="container admin-wrap">
        <div className="admin-tabs" id="admin-tabs">
          <button className={`admin-tab${tab === "productos" ? " active" : ""}`} onClick={() => setTab("productos")}>Productos</button>
          <button className={`admin-tab${tab === "config" ? " active" : ""}`} onClick={() => setTab("config")}>Configuración</button>
          <button className={`admin-tab${tab === "cupones" ? " active" : ""}`} onClick={() => setTab("cupones")}>Cupones</button>
          <button className={`admin-tab${tab === "pedidos" ? " active" : ""}`} onClick={() => setTab("pedidos")}>Pedidos</button>
        </div>

        {tab === "productos" && <ProductsPanel notify={notify} />}
        {tab === "config" && <ConfigPanel notify={notify} />}
        {tab === "cupones" && <CouponsPanel notify={notify} />}
        {tab === "pedidos" && <OrdersPanel notify={notify} />}
      </main>

      {toast && <div className="toast show" key={toast.id}>{toast.msg}</div>}
    </>
  );
}

function AdminHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="admin-header">
      <div className="container admin-header__inner">
        <strong className="admin-brand">Panel de Administración</strong>
        <nav className="admin-nav">
          <Link href="/" className="btn btn--ghost">← Ver tienda</Link>
          <button className="btn btn--ghost" type="button" onClick={onLogout}>Salir</button>
        </nav>
      </div>
    </header>
  );
}

function Login({ onLogin, notify }: { onLogin: () => void; notify: (m: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/login", { method: "POST", body: JSON.stringify({ password: "" }) })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.message) setInfo(data.message);
      })
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        notify("Sesión iniciada");
        onLogin();
      } else {
        setError(data.error || "Error al iniciar sesión");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form onSubmit={submit} className="admin-form" autoComplete="off" style={{ margin: 0 }}>
        <h2 style={{ marginBottom: 4 }}>Iniciar sesión</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 8 }}>
          Ingresa la contraseña del administrador.
        </p>
        {info && <p className="admin-save-msg">{info}</p>}
        <label className="field">
          <span>Contraseña</span>
          <input type="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="modal__error">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

// ---------- Productos ----------
function ProductsPanel({ notify }: { notify: (m: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/products");
    setProducts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const remove = async (id: number) => {
    const p = products.find((x) => x.id === id);
    if (!confirm(`¿Eliminar "${p ? p.name : ""}"? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((list) => list.filter((x) => x.id !== id));
    notify("Producto eliminado");
  };

  return (
    <section>
      <div className="admin-bar">
        <h2>Productos <span className="admin-count">{products.length}</span></h2>
        <button className="btn btn--primary" onClick={() => { setEditing(null); setNewProduct(true); }}>+ Nuevo producto</button>
      </div>

      {newProduct && <ProductForm product={null} onDone={() => { setNewProduct(false); reload(); }} notify={notify} />}
      {editing && <ProductForm product={editing} onDone={() => { setEditing(null); reload(); }} notify={notify} />}

      {loading ? (
        <p className="admin-empty">Cargando productos…</p>
      ) : products.length === 0 ? (
        <p className="admin-empty">Aún no hay productos. Crea el primero.</p>
      ) : (
        <div className="admin-list" id="product-list">
          {products.map((p) => (
            <div className="admin-item" key={p.id}>
              <Image unoptimized className="admin-item__img" src={productImg(p)} alt="" width={56} height={56} />
              <div className="admin-item__info">
                <strong>{p.name}</strong>
                <span>{p.brand} · {p.category} · {p.colors[0]?.name || "—"}</span>
                {p.badge ? (
                  <em className={`admin-badge badge badge--${p.badge}`}>{p.badge === "nuevo" ? "Nuevo" : "Agotado"}</em>
                ) : null}
              </div>
              <div className="admin-item__actions">
                <button className="btn btn--ghost" type="button" onClick={() => { setNewProduct(false); setEditing(p); }}>Editar</button>
                <button className="btn btn--ghost btn--danger" type="button" onClick={() => remove(p.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type ProductFormData = {
  name: string;
  brand: string;
  category: string;
  price: string;
  oldPrice: string;
  badge: string;
  image: string;
  desc: string;
  sizes: string;
  stock: string;
};

function ProductForm({ product, onDone, notify }: { product: Product | null; onDone: () => void; notify: (m: string) => void }) {
  const [form, setForm] = useState<ProductFormData>({
    name: product?.name || "",
    brand: product?.brand || "",
    category: product?.category || "",
    price: product ? String(product.price) : "",
    oldPrice: product?.oldPrice != null ? String(product.oldPrice) : "",
    badge: product?.badge || "",
    image: product?.image || "",
    desc: product?.desc || "",
    sizes: (product?.sizes || ["S", "M", "L", "XL"]).join(", "),
    stock: product?.stock != null ? String(product.stock) : "10"
  });
  const [colors, setColors] = useState<Color[]>(
    product?.colors && product.colors.length
      ? [...product.colors]
      : [{ name: "Negro", hex: "#16161a" }]
  );
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ProductFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const preview = form.image.trim() || productImage(form.category || "Jerseys", colors[0]?.hex || "#16161a");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const brand = form.brand.trim();
    const category = form.category.trim();
    const price = parseFloat(form.price);
    const oldPrice = form.oldPrice ? parseFloat(form.oldPrice) : null;
    const badge = form.badge || null;
    const image = form.image.trim();
    const desc = form.desc.trim();
    const sizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const stock = form.stock !== "" ? Math.max(0, parseInt(form.stock, 10) || 0) : 10;
    const cleanColors = colors.filter((c) => c.hex).map((c) => ({ name: c.name.trim() || "Color", hex: c.hex }));

    if (!name || !brand || !category || isNaN(price) || price < 0) {
      notify("Completa nombre, marca, categoría y precio");
      return;
    }
    if (!sizes.length || !cleanColors.length) {
      notify("Agrega al menos una talla y un color");
      return;
    }

    const payload = { name, brand, category, image, price, oldPrice, badge, desc, sizes, colors: cleanColors, stock };
    setSaving(true);
    try {
      if (product) {
        await fetch(`/api/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        notify("Producto actualizado");
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        notify("Producto creado");
      }
      onDone();
    } catch {
      notify("Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const addColor = () => setColors((c) => [...c, { name: "", hex: "#16161a" }]);
  const setColor = (idx: number, patch: Partial<Color>) =>
    setColors((c) => c.map((col, i) => (i === idx ? { ...col, ...patch } : col)));
  const removeColor = (idx: number) => setColors((c) => c.filter((_, i) => i !== idx));

  return (
    <form className="admin-form" autoComplete="off" onSubmit={submit}>
      <h3>{product ? "Editar producto" : "Nuevo producto"}</h3>
      <div className="admin-grid">
        <label className="field">
          <span>Nombre</span>
          <input type="text" name="name" required value={form.name} onChange={set("name")} />
        </label>
        <label className="field">
          <span>Marca</span>
          <input type="text" name="brand" required value={form.brand} onChange={set("brand")} />
        </label>
        <label className="field">
          <span>Categoría</span>
          <input type="text" name="category" list="cat-list" required value={form.category} onChange={set("category")} />
          <datalist id="cat-list">
            {["Jerseys", "Hoodies", "Boxis", "Baggis", "Tank tops", "Shorts", "Casacas", "Compresores"].map((c) => (
              <option value={c} key={c} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>Precio</span>
          <input type="number" name="price" min="0" step="0.1" required value={form.price} onChange={set("price")} />
        </label>
        <label className="field">
          <span>Precio anterior (opcional)</span>
          <input type="number" name="oldPrice" min="0" step="0.1" value={form.oldPrice} onChange={set("oldPrice")} />
        </label>
        <label className="field">
          <span>Etiqueta</span>
          <select name="badge" value={form.badge} onChange={set("badge")}>
            <option value="">— Ninguna —</option>
            <option value="nuevo">Nuevo</option>
            <option value="agotado">Agotado</option>
          </select>
        </label>
        <label className="field field--full">
          <span>Imagen (URL de internet, opcional)</span>
          <input type="url" name="image" placeholder="https://ejemplo.com/foto.jpg" value={form.image} onChange={set("image")} />
        </label>
        <label className="field field--full">
          <span>Descripción</span>
          <textarea name="desc" rows={2} value={form.desc} onChange={set("desc")} />
        </label>
        <label className="field field--full">
          <span>Tallas (separadas por coma)</span>
          <input type="text" name="sizes" placeholder="S, M, L, XL" value={form.sizes} onChange={set("sizes")} />
        </label>
        <label className="field">
          <span>Stock (unidades)</span>
          <input type="number" name="stock" min="0" step="1" value={form.stock} onChange={set("stock")} />
        </label>
        <div className="field field--full">
          <span>Colores</span>
          <div id="color-rows">
            {colors.map((c, i) => (
              <div className="color-row" key={i}>
                <input
                  type="text"
                  className="color-name"
                  value={c.name}
                  placeholder="Nombre"
                  aria-label="Nombre del color"
                  onChange={(e) => setColor(i, { name: e.target.value })}
                />
                <input
                  type="color"
                  className="color-hex"
                  value={c.hex}
                  aria-label="Código del color"
                  onChange={(e) => setColor(i, { hex: e.target.value })}
                />
                <button type="button" className="btn btn--ghost color-del" aria-label="Quitar color" onClick={() => removeColor(i)}>&times;</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--ghost" onClick={addColor}>+ Agregar color</button>
        </div>
        <div className="field field--full">
          <span>Vista previa</span>
          <Image unoptimized id="product-preview" src={preview} alt="Vista previa" width={120} height={120} />
        </div>
      </div>
      <div className="admin-actions">
        <button type="button" className="btn btn--ghost" onClick={onDone}>Cancelar</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Guardando…" : "Guardar producto"}</button>
      </div>
    </form>
  );
}

// ---------- Configuración ----------
function ConfigPanel({ notify }: { notify: (m: string) => void }) {
  const [form, setForm] = useState<Config | null>(null);
  const [saved, setSaved] = useState(false);
  const [passSaving, setPassSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => setForm(cfg));
  }, []);

  const set = (k: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  const setShippingRow = (idx: number, campo: "ciudad" | "precio", value: string | number) =>
    setForm((f) =>
      f ? { ...f, shipping: (f.shipping || []).map((r, i) => (i === idx ? { ...r, [campo]: value } : r)) } : f
    );

  const addShippingRow = () =>
    setForm((f) => (f ? { ...f, shipping: [...(f.shipping || []), { ciudad: "", precio: 0 }] } : f));

  const removeShippingRow = (idx: number) =>
    setForm((f) => (f ? { ...f, shipping: (f.shipping || []).filter((_, i) => i !== idx) } : f));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    notify("Configuración guardada");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const current = String(data.get("current") || "");
    const next = String(data.get("new") || "");
    const confirm = String(data.get("confirm") || "");
    if (next.length < 6) return notify("La nueva contraseña debe tener al menos 6 caracteres");
    if (next !== confirm) return notify("Las contraseñas no coinciden");
    setPassSaving(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next })
      });
      const data2 = await res.json();
      if (res.ok) notify(data2.message || "Contraseña actualizada");
      else notify(data2.error || "Error al cambiar contraseña");
      (e.target as HTMLFormElement).reset();
    } finally {
      setPassSaving(false);
    }
  };

  if (!form) return <p className="admin-empty">Cargando configuración…</p>;

  return (
    <section>
      <h2>Configuración de la tienda</h2>
      <form className="admin-form" autoComplete="off" onSubmit={submit}>
        <label className="field">
          <span>Nombre de la marca</span>
          <input type="text" name="brand" required value={form.brand} onChange={set("brand")} />
        </label>
        <label className="field">
          <span>WhatsApp (con código de país, sin +)</span>
          <input type="text" name="whatsapp" placeholder="59171234567" required value={form.whatsapp} onChange={set("whatsapp")} />
        </label>
        <label className="field">
          <span>Moneda</span>
          <input type="text" name="currency" placeholder="Bs" required value={form.currency} onChange={set("currency")} />
        </label>
        <div className="field">
          <span>Tarifas de envío (usá default para todo el resto)</span>
          <div className="rate-rows">
            {(form.shipping || []).map((r, i) => (
              <div className="rate-row" key={i}>
                <input
                  type="text"
                  className="rate-row__city"
                  placeholder="Ciudad o default"
                  aria-label="Ciudad de envío"
                  value={r.ciudad}
                  onChange={(e) => setShippingRow(i, "ciudad", e.target.value)}
                />
                <input
                  type="number"
                  className="rate-row__price"
                  placeholder="0"
                  min="0"
                  step="0.5"
                  aria-label="Precio de envío"
                  value={r.precio}
                  onChange={(e) => setShippingRow(i, "precio", Number(e.target.value) || 0)}
                />
                <button type="button" className="btn btn--ghost rate-row__del" aria-label="Eliminar tarifa" onClick={() => removeShippingRow(i)}>&times;</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--ghost" onClick={addShippingRow}>+ Agregar tarifa</button>
        </div>
        <button type="submit" className="btn btn--primary">Guardar configuración</button>
        {saved && <p className="admin-save-msg">✓ Configuración guardada</p>}
      </form>

      <h2 style={{ marginTop: 32 }}>Cambiar contraseña</h2>
      <form className="admin-form" autoComplete="off" onSubmit={changePassword}>
        <label className="field">
          <span>Contraseña actual</span>
          <input type="password" name="current" required />
        </label>
        <label className="field">
          <span>Nueva contraseña</span>
          <input type="password" name="new" required />
        </label>
        <label className="field">
          <span>Confirmar nueva contraseña</span>
          <input type="password" name="confirm" required />
        </label>
        <button type="submit" className="btn btn--ghost" disabled={passSaving}>
          {passSaving ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </form>
    </section>
  );
}

// ---------- Cupones ----------
function CouponsPanel({ notify }: { notify: (m: string) => void }) {
  const [coupons, setCoupons] = useState<Record<string, Coupon>>({});
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch("/api/coupons");
    setCoupons(await res.json());
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/coupons")
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setCoupons(data);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (!code.trim() || isNaN(num) || num <= 0) return notify("Código y valor válidos requeridos");
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type, value: num })
    });
    if (res.ok) {
      notify(`Cupón ${code.toUpperCase()} agregado`);
      setCode("");
      setValue("");
      reload();
    } else {
      const data = await res.json();
      notify(data.error || "Error al agregar cupón");
    }
  };

  const remove = async (c: string) => {
    if (!confirm(`¿Eliminar el cupón ${c}?`)) return;
    await fetch(`/api/coupons/${encodeURIComponent(c)}`, { method: "DELETE" });
    setCoupons((list) => {
      const next = { ...list };
      delete next[c];
      return next;
    });
    notify("Cupón eliminado");
  };

  const entries = useMemo(() => Object.entries(coupons), [coupons]);

  return (
    <section>
      <h2>Cupones de descuento</h2>
      <form className="admin-form" autoComplete="off" onSubmit={add}>
        <div className="admin-form__row">
          <label className="field">
            <span>Código</span>
            <input type="text" name="code" placeholder="STREET10" required value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <label className="field">
            <span>Tipo</span>
            <select name="type" value={type} onChange={(e) => setType(e.target.value as "percent" | "fixed")}>
              <option value="percent">Porcentaje (%)</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </label>
          <label className="field">
            <span>Valor</span>
            <input type="number" name="value" min="0" step="0.1" required value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
        </div>
        <button type="submit" className="btn btn--primary">Agregar cupón</button>
      </form>
      <div className="admin-list" id="coupon-list">
        {entries.length === 0 ? (
          <p className="admin-empty">No hay cupones. Agrega el primero.</p>
        ) : (
          entries.map(([c, cp]) => (
            <div className="admin-item" key={c}>
              <div className="admin-item__info">
                <strong>{esc(c)}</strong>
                <span>{cp.type === "percent" ? `${cp.value}% de descuento` : `${cp.value} de descuento`}</span>
              </div>
              <div className="admin-item__actions">
                <button className="btn btn--ghost btn--danger" type="button" onClick={() => remove(c)}>Eliminar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// ---------- Pedidos ----------
function OrdersPanel({ notify }: { notify: (m: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrency] = useState("Bs");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => {
        if (c && c.currency) setCurrency(c.currency);
      })
      .catch(() => {});
  }, []);

  const reload = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(() => notify("Error al cargar pedidos"))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data.error || "Error al actualizar el estado");
      return;
    }
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status: status as Order["status"] } : o)));
    notify(`Pedido ${id} → ${status}`);
  };

  const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" });

  if (loading) return <p className="admin-empty">Cargando pedidos…</p>;

  return (
    <section>
      <div className="admin-bar">
        <h2>Pedidos <span className="admin-count">{orders.length}</span></h2>
      </div>
      {orders.length === 0 ? (
        <p className="admin-empty">Aún no hay pedidos registrados.</p>
      ) : (
        <div className="admin-list">
          {orders.map((o) => (
            <div className="admin-item" key={o.id} style={{ alignItems: "flex-start", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 8 }}>
                <strong>{o.id}</strong>
                <span>{fmtDate(o.date)}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {o.items.map((i) => (
                  <div key={i.key}>
                    {esc(i.name)} {i.size ? `· ${esc(i.size)}` : ""} {i.color ? `· ${esc(i.color)}` : ""} × {i.qty} = {fmt(i.price * i.qty)}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "0.85rem" }}>
                {o.coupon ? <span style={{ color: "var(--accent)" }}>Cupón {esc(o.coupon.code)}: -{fmt(o.discount)} · </span> : null}
                {o.shipping > 0 ? <span>Envío: {fmt(o.shipping)} · </span> : null}
                <strong>Total: {fmt(o.total)}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                🧍 {esc(o.customer.nombre)} · 📱 {esc(o.customer.telefono)} {o.customer.ciudad ? `· 📍 ${esc(o.customer.ciudad)}` : ""}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  className="admin-select order-status__select"
                  value={o.status}
                  aria-label="Estado del pedido"
                  onChange={(e) => setStatus(o.id, e.target.value)}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {o.status === "cancelado" && <span className="order-status__pill order-status__pill--cancel">Cancelado</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
