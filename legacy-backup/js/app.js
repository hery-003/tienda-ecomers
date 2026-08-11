(() => {
  const $ = (sel) => document.querySelector(sel);
  const money = (n) => `${CONFIG.currency} ${n.toFixed(2)}`;
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const productById = (id) => PRODUCTS.find((p) => p.id === id);

  const STORAGE = {
    cart: `${CONFIG.brand}_cart`.toLowerCase(),
    customer: `${CONFIG.brand}_customer`.toLowerCase(),
    coupon: `${CONFIG.brand}_coupon`.toLowerCase()
  };

  class UI {
    constructor() {
      this.el = {
        grid: $("#product-grid"),
        categories: $("#categories"),
        search: $("#search-input"),
        filterOrder: $("#filter-order"),
        cartBtn: $("#cart-btn"),
        cartBadge: $("#cart-badge"),
        cartDrawer: $("#cart-drawer"),
        cartItems: $("#cart-items"),
        cartTotal: $("#cart-total"),
        cartClose: $("#cart-close"),
        checkoutBtn: $("#checkout-btn"),
        overlay: $("#overlay"),
        checkoutModal: $("#checkout-modal"),
        checkoutClose: $("#checkout-close"),
        checkoutForm: $("#checkout-form"),
        checkoutSummary: $("#checkout-summary"),
        couponInput: $("#coupon-input"),
        couponApply: $("#coupon-apply"),
        couponMsg: $("#coupon-msg"),
        successModal: $("#success-modal"),
        successClose: $("#success-close"),
        formError: $("#form-error"),
        quickViewModal: $("#quickview-modal"),
        quickViewClose: $("#quickview-close"),
        quickViewBody: $("#quickview-body"),
        newsletter: $("#newsletter-form")
      };
      this.toastTimer = null;
    }

    applyConfig() {
      document.title = `${CONFIG.brand} | Streetwear Premium`;
      document.querySelectorAll("#brand, #footer-brand, #legal-brand").forEach((el) => {
        el.textContent = CONFIG.brand;
      });
      const wa = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(`Hola ${CONFIG.brand}, quisiera más información.`)}`;
      document.querySelectorAll('a[aria-label="WhatsApp"], #contact-wa').forEach((a) => {
        a.href = wa;
      });
      $("#year").textContent = new Date().getFullYear();
    }

    toast(msg) {
      let toast = $(".toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.classList.add("show");
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
    }

    bumpCart() {
      const b = this.el.cartBtn;
      b.classList.remove("bump");
      void b.offsetWidth;
      b.classList.add("bump");
    }

    syncOverlay() {
      const anyOpen = ["cartDrawer", "checkoutModal", "quickViewModal"].some(
        (k) => !this.el[k].classList.contains("hidden")
      );
      const scrollLocked = anyOpen || !this.el.successModal.classList.contains("hidden");
      this.el.overlay.classList.toggle("hidden", !anyOpen);
      document.body.style.overflow = scrollLocked ? "hidden" : "";
    }

    openCart() {
      this.el.cartDrawer.classList.remove("hidden");
      this.syncOverlay();
    }

    closeCart() {
      this.el.cartDrawer.classList.add("hidden");
      this.syncOverlay();
    }

    openCheckoutModal() {
      this.el.checkoutModal.classList.remove("hidden");
      this.syncOverlay();
    }

    closeCheckoutModal() {
      this.el.checkoutModal.classList.add("hidden");
      this.syncOverlay();
    }

    openQuickView() {
      this.el.quickViewModal.classList.remove("hidden");
      this.syncOverlay();
    }

    closeQuickView() {
      this.el.quickViewModal.classList.add("hidden");
      this.syncOverlay();
    }

    openSuccess() {
      this.el.successModal.classList.remove("hidden");
      this.syncOverlay();
    }

    closeSuccess() {
      this.el.successModal.classList.add("hidden");
      this.syncOverlay();
    }
  }

  class Catalog {
    constructor(ui, cart) {
      this.ui = ui;
      this.cart = cart;
      this.currentCategory = "todas";
      this.currentOrder = "destacados";
      this.search = "";
      this.selection = {};
      this.bind();
    }

    bind() {
      const el = this.ui.el;
      el.search.addEventListener("input", (e) => {
        this.search = e.target.value.trim().toLowerCase();
        this.renderGrid();
      });
      el.filterOrder.addEventListener("change", () => {
        this.currentOrder = el.filterOrder.value;
        this.renderGrid();
      });
      el.quickViewClose.addEventListener("click", () => this.ui.closeQuickView());
      el.grid.addEventListener("click", (e) => this.onGridClick(e));
    }

    getSelection(id) {
      const p = productById(id);
      if (!p) return { size: "", color: "" };
      return this.selection[id] || { size: p.sizes[0], color: p.colors[0].hex };
    }

    getVisibleProducts() {
      let list = this.currentCategory === "todas" ? [...PRODUCTS] : PRODUCTS.filter((p) => p.category === this.currentCategory);
      if (this.search) {
        list = list.filter((p) =>
          [p.name, p.brand, p.category, p.desc].some((t) => String(t).toLowerCase().includes(this.search))
        );
      }
      switch (this.currentOrder) {
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
    }

    badgeHtml(p) {
      if (p.badge === "nuevo") return '<span class="badge badge--nuevo">Nuevo</span>';
      if (p.badge === "agotado") return '<span class="badge badge--agotado">Agotado</span>';
      return "";
    }

    swatchesHtml(p, activeHex) {
      return p.colors
        .map(
          (cn) =>
            `<button class="color-swatch${cn.hex === activeHex ? " active" : ""}" data-hex="${cn.hex}" type="button" title="${esc(cn.name)}" style="background:${cn.hex}"><span style="color:${luminance(cn.hex) > 0.55 ? "#0b0b0d" : "#fff"}">✓</span></button>`
        )
        .join("");
    }

    sizeBtnsHtml(p, activeSize) {
      return p.sizes
        .map((sz) => `<button class="size-btn${sz === activeSize ? " active" : ""}" data-size="${sz}" type="button">${sz}</button>`)
        .join("");
    }

    optionsHtml(p) {
      const sel = this.getSelection(p.id);
      return `<div class="card__options">
        <div class="card__opt-row">
          <span class="card__opt-label">Color</span>
          <div class="color-selector" data-id="${p.id}">${this.swatchesHtml(p, sel.color)}</div>
        </div>
        <div class="card__opt-row">
          <span class="card__opt-label">Talla</span>
          <div class="size-selector" data-id="${p.id}">${this.sizeBtnsHtml(p, sel.size)}</div>
        </div>
      </div>`;
    }

    renderCategories() {
      const cats = ["todas", ...new Set(PRODUCTS.map((p) => p.category))];
      this.ui.el.categories.innerHTML = cats
        .map(
          (c, i) =>
            `<button class="category-chip reveal reveal-d${Math.min(i, 4)}${c === this.currentCategory ? " active" : ""}" data-cat="${c}">${c === "todas" ? "Todas" : c}</button>`
        )
        .join("");
      this.ui.el.categories.querySelectorAll(".category-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          this.currentCategory = chip.dataset.cat;
          this.renderChips();
          this.renderGrid();
        });
      });
    }

    renderChips() {
      this.ui.el.categories.querySelectorAll(".category-chip").forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.cat === this.currentCategory);
      });
    }

    renderGrid() {
      const grid = this.ui.el.grid;
      const list = this.getVisibleProducts();
      if (!list.length) {
        grid.innerHTML = '<p class="cart-empty">No encontramos productos para tu búsqueda.</p>';
        return;
      }
      grid.innerHTML = list
        .map((p, i) => {
          const soldOut = p.badge === "agotado";
          const sel = this.getSelection(p.id);
          const delay = i % 4;
          return `
          <article class="card reveal reveal-d${delay}" data-id="${p.id}">
            <div class="card__media">
              <img src="${productImg(p)}" alt="${esc(p.name)}" loading="lazy">
              ${this.badgeHtml(p)}
              <span class="card__quick">Vista rápida</span>
            </div>
            <div class="card__body">
              <span class="card__category">${esc(p.category)}</span>
              <span class="card__brand">${esc(p.brand)}</span>
              <h3 class="card__title">${esc(p.name)}</h3>
              <div class="card__price-row">
                <span class="card__price">${money(p.price)}</span>
                ${p.oldPrice ? `<span class="card__old">${money(p.oldPrice)}</span>` : ""}
              </div>
              ${this.optionsHtml(p)}
              <button class="btn btn--add btn-add" data-id="${p.id}" ${soldOut ? "disabled" : ""}>
                ${soldOut ? "Agotado" : "Agregar al carrito"}
              </button>
            </div>
          </article>`;
        })
        .join("");
      effects.refresh();
    }

    onGridClick(e) {
      const swatch = e.target.closest(".color-swatch");
      if (swatch) {
        const id = Number(swatch.closest(".color-selector").dataset.id);
        this.selection[id] = { ...this.getSelection(id), color: swatch.dataset.hex };
        swatch.closest(".color-selector").querySelectorAll(".color-swatch").forEach((x) => {
          x.classList.toggle("active", x === swatch);
        });
        const img = swatch.closest(".card").querySelector(".card__media img");
        const p = productById(id);
        if (img && p && !p.image) img.src = productImage(p.category, swatch.dataset.hex);
        return;
      }

      const sizeBtn = e.target.closest(".size-btn");
      if (sizeBtn) {
        const id = Number(sizeBtn.closest(".size-selector").dataset.id);
        this.selection[id] = { ...this.getSelection(id), size: sizeBtn.dataset.size };
        sizeBtn.closest(".size-selector").querySelectorAll(".size-btn").forEach((x) => {
          x.classList.toggle("active", x === sizeBtn);
        });
        return;
      }

      const addBtn = e.target.closest(".btn-add");
      if (addBtn) {
        const id = Number(addBtn.dataset.id);
        const sel = this.getSelection(id);
        this.cart.add(id, sel.size, sel.color);
        this.ui.bumpCart();
        this.ui.toast("Producto agregado al carrito");
        return;
      }

      const card = e.target.closest(".card");
      if (card) this.openQuickView(Number(card.dataset.id));
    }

    openQuickView(id) {
      const p = productById(id);
      if (!p) return;
      const body = this.ui.el.quickViewBody;
      const sel = this.getSelection(id);
      const soldOut = p.badge === "agotado";
      let selColor = sel.color;
      let selSize = sel.size;
      let qty = 1;

      body.innerHTML = `
        <div class="quickview">
          <div class="quickview__media">
            <img src="${productImg(p)}" alt="${esc(p.name)}">
            ${this.badgeHtml(p)}
          </div>
          <div class="quickview__body">
            <span class="card__category">${esc(p.category)}</span>
            <span class="card__brand">${esc(p.brand)}</span>
            <h3 class="card__title">${esc(p.name)}</h3>
            <div class="card__price-row">
              <span class="card__price">${money(p.price)}</span>
              ${p.oldPrice ? `<span class="card__old">${money(p.oldPrice)}</span>` : ""}
            </div>
            <p class="quickview__desc">${esc(p.desc)}</p>
            <div class="quickview__field">
              <span class="quickview__label">Color</span>
              <div class="color-selector">${this.swatchesHtml(p, selColor)}</div>
            </div>
            <div class="quickview__field">
              <span class="quickview__label">Talla</span>
              <div class="size-selector">${this.sizeBtnsHtml(p, selSize)}</div>
            </div>
            <div class="quickview__field">
              <span class="quickview__label">Cantidad</span>
              <div class="qty">
                <button class="qv-qty" data-delta="-1" type="button" aria-label="Quitar uno">−</button>
                <span class="qv-qty-num">1</span>
                <button class="qv-qty" data-delta="1" type="button" aria-label="Agregar uno">+</button>
              </div>
            </div>
            <button class="btn btn--primary btn--block qv-add" ${soldOut ? "disabled" : ""}>
              ${soldOut ? "Agotado" : "Agregar al carrito"}
            </button>
          </div>
        </div>`;

      body.querySelectorAll(".color-swatch").forEach((b) =>
        b.addEventListener("click", () => {
          selColor = b.dataset.hex;
          body.querySelectorAll(".color-swatch").forEach((x) => x.classList.toggle("active", x === b));
          if (!p.image) body.querySelector(".quickview__media img").src = productImage(p.category, selColor);
        })
      );
      body.querySelectorAll(".size-btn").forEach((b) =>
        b.addEventListener("click", () => {
          selSize = b.dataset.size;
          body.querySelectorAll(".size-btn").forEach((x) => x.classList.toggle("active", x === b));
        })
      );
      body.querySelectorAll(".qv-qty").forEach((b) =>
        b.addEventListener("click", () => {
          qty = Math.max(1, qty + Number(b.dataset.delta));
          body.querySelector(".qv-qty-num").textContent = qty;
        })
      );
      body.querySelector(".qv-add").addEventListener("click", () => {
        if (soldOut) return;
        this.selection[id] = { size: selSize, color: selColor };
        this.cart.add(id, selSize, selColor, qty);
        this.ui.bumpCart();
        this.ui.toast("Producto agregado al carrito");
        this.ui.closeQuickView();
      });

      this.ui.openQuickView();
    }
  }

  class Cart {
    constructor(ui) {
      this.ui = ui;
      this.items = [];
      this.coupon = null;
      this.load();
      this.bind();
    }

    load() {
      try {
        this.items = JSON.parse(localStorage.getItem(STORAGE.cart)) || [];
      } catch {
        this.items = [];
      }
      this.items.forEach((i) => {
        if (!i.key) i.key = `${i.id}|${i.size || "M"}|${i.color || ""}`;
      });
      try {
        this.coupon = JSON.parse(localStorage.getItem(STORAGE.coupon)) || null;
      } catch {
        this.coupon = null;
      }
    }

    save() {
      localStorage.setItem(STORAGE.cart, JSON.stringify(this.items));
      localStorage.setItem(STORAGE.coupon, JSON.stringify(this.coupon));
    }

    bind() {
      const el = this.ui.el;
      el.cartBtn.addEventListener("click", () => {
        this.render();
        this.ui.openCart();
      });
      el.cartClose.addEventListener("click", () => this.ui.closeCart());
      el.cartItems.addEventListener("click", (e) => {
        const qtyBtn = e.target.closest(".qty button");
        if (qtyBtn) {
          this.changeQty(qtyBtn.dataset.key, Number(qtyBtn.dataset.delta));
          return;
        }
        const rm = e.target.closest(".cart-item__remove");
        if (rm) this.remove(rm.dataset.key);
      });
    }

    add(id, size, color, qty = 1) {
      const key = `${id}|${size}|${color}`;
      const existing = this.items.find((i) => i.key === key);
      if (existing) {
        existing.qty += qty;
      } else {
        this.items.push({ key, id, size, color, qty });
      }
      this.save();
      this.render();
    }

    changeQty(key, delta) {
      const item = this.items.find((i) => i.key === key);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) {
        this.items = this.items.filter((i) => i.key !== key);
      }
      this.save();
      this.render();
    }

    remove(key) {
      this.items = this.items.filter((i) => i.key !== key);
      this.save();
      this.render();
    }

    count() {
      return this.items.reduce((s, i) => s + i.qty, 0);
    }

    subtotal() {
      return this.items.reduce((s, i) => {
        const p = productById(i.id);
        return s + (p ? p.price * i.qty : 0);
      }, 0);
    }

    discount() {
      if (!this.coupon) return 0;
      const sub = this.subtotal();
      if (this.coupon.type === "fixed") return Math.min(this.coupon.value, sub);
      return (sub * this.coupon.value) / 100;
    }

    total() {
      return Math.max(0, this.subtotal() - this.discount());
    }

    colorName(item) {
      const p = productById(item.id);
      const c = p && p.colors ? p.colors.find((cn) => cn.hex === item.color) : null;
      return c ? c.name : item.color || "";
    }

    render() {
      const el = this.ui.el;
      const count = this.count();
      el.cartBadge.classList.toggle("hidden", count === 0);
      el.cartBadge.textContent = count;
      el.checkoutBtn.disabled = count === 0;

      if (!this.items.length) {
        el.cartItems.innerHTML =
          '<div class="cart-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><p>Tu carrito está vacío.</p></div>';
        el.cartTotal.textContent = money(0);
        return;
      }

      el.cartItems.innerHTML = this.items
        .map((i) => {
          const p = productById(i.id);
          if (!p) return "";
          const meta = [];
          if (i.size) meta.push(`<b>Talla:</b> ${esc(i.size)}`);
          if (i.color) meta.push(`<b>Color:</b> ${esc(this.colorName(i))}`);
          return `
            <div class="cart-item">
              <div class="cart-item__img"><img src="${productImg(p)}" alt="${esc(p.name)}"></div>
              <div class="cart-item__info">
                <div class="cart-item__name">${esc(p.name)}</div>
                ${meta.length ? `<div class="cart-item__meta">${meta.join(" · ")}</div>` : ""}
                <div class="cart-item__price">${money(p.price)} c/u</div>
                <div class="qty">
                  <button data-key="${i.key}" data-delta="-1" aria-label="Quitar uno">−</button>
                  <span>${i.qty}</span>
                  <button data-key="${i.key}" data-delta="1" aria-label="Agregar uno">+</button>
                </div>
              </div>
              <div class="cart-item__side">
                <strong>${money(p.price * i.qty)}</strong>
                <button class="cart-item__remove" data-key="${i.key}">Eliminar</button>
              </div>
            </div>`;
        })
        .join("");

      el.cartTotal.textContent = money(this.subtotal());
    }

    buildMessage(nombre, telefono, ciudad) {
      const lines = [];
      lines.push(`🛒 *NUEVO PEDIDO · ${CONFIG.brand}*`);
      lines.push("");
      lines.push(`Hola ${CONFIG.brand}! Quiero hacer este pedido:`);
      lines.push("");
      this.items.forEach((i, idx) => {
        const p = productById(i.id);
        if (!p) return;
        const emoji = CATEGORY_EMOJI[p.category] || "🛍️";
        const color = this.colorName(i);
        lines.push(`${idx + 1}. ${emoji} *${p.name}*`);
        lines.push(`    📐 Talla: ${i.size || "—"}  ·  🎨 Color: ${color || "—"}`);
        lines.push(`    🔢 Cantidad: ${i.qty} × ${money(p.price)} = ${money(p.price * i.qty)}`);
      });
      lines.push("");
      lines.push(`💵 *Subtotal:* ${money(this.subtotal())}`);
      if (this.coupon) {
        lines.push(`🏷️ *Descuento (${this.coupon.code}):* -${money(this.discount())}`);
      }
      lines.push(`🧾 *TOTAL:* ${money(this.total())}`);
      lines.push("");
      lines.push(`🚚 *Datos de envío*`);
      lines.push(`🧍 Nombre: ${nombre}`);
      lines.push(`📱 WhatsApp: ${telefono}`);
      if (ciudad) lines.push(`📍 Ciudad: ${ciudad}`);
      return lines.join("\n");
    }
  }

  class Checkout {
    constructor(ui, cart) {
      this.ui = ui;
      this.cart = cart;
      this.customer = null;
      this.loadCustomer();
      this.bind();
    }

    loadCustomer() {
      try {
        this.customer = JSON.parse(localStorage.getItem(STORAGE.customer)) || null;
      } catch {
        this.customer = null;
      }
    }

    saveCustomer() {
      if (this.customer) localStorage.setItem(STORAGE.customer, JSON.stringify(this.customer));
    }

    bind() {
      const el = this.ui.el;
      el.checkoutClose.addEventListener("click", () => this.close());
      el.couponApply.addEventListener("click", () => this.applyCoupon());
      el.couponInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.applyCoupon();
        }
      });
      el.checkoutForm.addEventListener("submit", (e) => this.submit(e));
      el.checkoutForm.addEventListener("input", () => {
        if (!el.formError.classList.contains("hidden")) el.formError.classList.add("hidden");
      });
    }

    open() {
      const el = this.ui.el;
      const c = this.customer || {};
      if (c.nombre && !el.checkoutForm.elements["nombre"].value) el.checkoutForm.elements["nombre"].value = c.nombre;
      if (c.telefono && !el.checkoutForm.elements["telefono"].value) el.checkoutForm.elements["telefono"].value = c.telefono;
      if (c.ciudad && !el.checkoutForm.elements["ciudad"].value) el.checkoutForm.elements["ciudad"].value = c.ciudad;
      this.renderSummary();
      this.renderCouponState();
      this.ui.openCheckoutModal();
    }

    close() {
      this.ui.closeCheckoutModal();
    }

    applyCoupon() {
      const el = this.ui.el;
      const code = el.couponInput.value.trim().toUpperCase();
      const msg = el.couponMsg;
      msg.classList.remove("hidden");
      if (code && COUPONS[code]) {
        this.cart.coupon = { code, ...COUPONS[code] };
        msg.textContent = `✓ Cupón ${code} aplicado (${COUPONS[code].value}% de descuento).`;
        msg.className = "coupon__msg coupon__msg--ok";
      } else if (!code) {
        this.cart.coupon = null;
        msg.textContent = "Ingresa un código de cupón.";
        msg.className = "coupon__msg coupon__msg--err";
      } else {
        this.cart.coupon = null;
        msg.textContent = "✗ Cupón no válido.";
        msg.className = "coupon__msg coupon__msg--err";
      }
      this.cart.save();
      this.renderSummary();
    }

    renderCouponState() {
      const el = this.ui.el;
      if (this.cart.coupon) {
        el.couponInput.value = this.cart.coupon.code;
        el.couponMsg.textContent = `✓ Cupón ${this.cart.coupon.code} aplicado.`;
        el.couponMsg.className = "coupon__msg coupon__msg--ok";
      } else {
        el.couponInput.value = "";
        el.couponMsg.classList.add("hidden");
      }
    }

    renderSummary() {
      const el = this.ui.el;
      const rows = this.cart.items
        .map((i) => {
          const p = productById(i.id);
          if (!p) return "";
          const parts = [esc(p.name)];
          if (i.size) parts.push(`<b>${esc(i.size)}</b>`);
          const cn = this.cart.colorName(i);
          if (cn) parts.push(esc(cn));
          return `<div class="modal__summary-row"><span>${parts.join(" · ")} <em>x${i.qty}</em></span><strong>${money(p.price * i.qty)}</strong></div>`;
        })
        .join("");
      let html = rows;
      html += `<div class="modal__summary-row modal__summary-sub"><span>Subtotal</span><strong>${money(this.cart.subtotal())}</strong></div>`;
      if (this.cart.coupon) {
        html += `<div class="modal__summary-row modal__summary-discount"><span>Descuento (${esc(this.cart.coupon.code)})</span><strong>-${money(this.cart.discount())}</strong></div>`;
      }
      html += `<div class="modal__summary-row modal__summary-total"><span>Total</span><strong>${money(this.cart.total())}</strong></div>`;
      el.checkoutSummary.innerHTML = html;
    }

    setFieldError(name, msg) {
      const el = this.ui.el;
      const input = el.checkoutForm.elements[name];
      const hint = el.checkoutForm.querySelector(`[data-hint="${name}"]`);
      if (!input) return;
      if (msg) {
        input.classList.add("invalid");
        if (hint) {
          hint.textContent = msg;
          hint.classList.remove("hidden");
        }
      } else {
        input.classList.remove("invalid");
        if (hint) hint.classList.add("hidden");
      }
    }

    validate() {
      const el = this.ui.el;
      const nombre = el.checkoutForm.elements["nombre"].value.trim();
      const telefono = el.checkoutForm.elements["telefono"].value.trim();
      const ciudad = el.checkoutForm.elements["ciudad"].value.trim();

      let valid = true;
      if (nombre.length < 2) {
        this.setFieldError("nombre", "Ingresa tu nombre completo.");
        valid = false;
      } else {
        this.setFieldError("nombre", "");
      }

      const digits = telefono.replace(/[\s\-().]/g, "");
      if (!/^\+?\d{8,15}$/.test(digits)) {
        this.setFieldError("telefono", "Ingresa un teléfono válido con prefijo del país (ej. +591 71234567).");
        valid = false;
      } else {
        this.setFieldError("telefono", "");
      }

      if (ciudad && ciudad.length < 2) {
        this.setFieldError("ciudad", "Ingresa tu ciudad (opcional).");
        valid = false;
      } else {
        this.setFieldError("ciudad", "");
      }

      return valid;
    }

    submit(e) {
      e.preventDefault();
      const el = this.ui.el;
      if (!this.validate()) {
        el.formError.classList.remove("hidden");
        return;
      }
      el.formError.classList.add("hidden");

      const nombre = el.checkoutForm.elements["nombre"].value.trim();
      const telefono = el.checkoutForm.elements["telefono"].value.trim();
      const ciudad = el.checkoutForm.elements["ciudad"].value.trim();

      this.customer = { nombre, telefono, ciudad };
      this.saveCustomer();

      const msg = this.cart.buildMessage(nombre, telefono, ciudad);
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");

      this.cart.items = [];
      this.cart.coupon = null;
      this.cart.save();
      el.checkoutForm.reset();
      el.couponInput.value = "";
      el.couponMsg.classList.add("hidden");
      this.ui.closeCheckoutModal();
      this.cart.render();
      this.ui.openSuccess();
    }
  }

  const ui = new UI();
  const cart = new Cart(ui);
  const catalog = new Catalog(ui, cart);
  const checkout = new Checkout(ui, cart);

  // ---------- Efectos modernos ----------
  const effects = {
    glow: null,
    init() {
      if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
      this.glow = document.createElement("div");
      this.glow.className = "cursor-glow";
      document.body.appendChild(this.glow);
      window.addEventListener("pointermove", (e) => this.moveGlow(e.clientX, e.clientY), { passive: true });
    },
    moveGlow(x, y) {
      if (!this.glow) return;
      this.glow.style.left = `${x}px`;
      this.glow.style.top = `${y}px`;
    },
    observe() {
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
      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
      this.io = io;
    },
    refresh() {
      if (!this.io) return;
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => this.io.observe(el));
    },
    backTop() {
      const btn = $("#back-top");
      if (!btn) return;
      const toggle = () => btn.classList.toggle("show", window.scrollY > 400);
      window.addEventListener("scroll", toggle, { passive: true });
      toggle();
      btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    },
    preloader() {
      const pre = $("#preloader");
      if (!pre) return;
      const bar = $("#preloader-bar");
      let p = 0;
      const step = () => {
        p = Math.min(100, p + Math.random() * 30);
        if (bar) bar.style.width = `${p}%`;
        if (p < 100) {
          setTimeout(step, 120);
        } else {
          setTimeout(() => pre.classList.add("hidden"), 200);
        }
      };
      window.addEventListener("load", () => {
        p = 100;
        if (bar) bar.style.width = "100%";
        setTimeout(() => pre.classList.add("hidden"), 250);
      });
      setTimeout(step, 60);
      setTimeout(() => pre.classList.add("hidden"), 2200);
    }
  };

  ui.el.overlay.addEventListener("click", () => {
    ui.closeCart();
    checkout.close();
    ui.closeQuickView();
  });

  ui.el.checkoutBtn.addEventListener("click", () => {
    ui.closeCart();
    checkout.open();
  });

  ui.el.successClose.addEventListener("click", () => {
    ui.closeSuccess();
    cart.render();
  });

  ui.el.newsletter.addEventListener("submit", (e) => {
    e.preventDefault();
    ui.el.newsletter.reset();
    ui.toast("¡Suscripción exitosa!");
  });

  ui.applyConfig();
  catalog.renderCategories();
  catalog.renderGrid();
  cart.render();
  effects.init();
  effects.observe();
  effects.refresh();
  effects.backTop();
  effects.preloader();
})();
