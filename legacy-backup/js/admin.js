(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const toast = (msg) => {
    let t = $(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2200);
  };

  let products = [];
  let nextId = 1;

  function loadProducts() {
    products = JSON.parse(JSON.stringify(loadJSON("products", DEFAULT_PRODUCTS)));
    nextId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
  }

  function saveProducts() {
    saveJSON("products", products);
  }

  // ---------- Tabs ----------
  $$(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".admin-tab").forEach((t) => t.classList.toggle("active", t === tab));
      $$(".admin-panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + tab.dataset.tab));
    });
  });

  // ---------- Productos ----------
  const catList = $("#cat-list");
  const catListCache = () => {
    const cats = [...new Set(products.map((p) => p.category))];
    catList.innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join("");
  };

  function renderProducts() {
    $("#product-count").textContent = products.length;
    const empty = $("#product-empty");
    empty.classList.toggle("hidden", products.length > 0);
    $("#product-list").innerHTML = products
      .map(
        (p) => `
        <div class="admin-item" data-id="${p.id}">
          <img class="admin-item__img" src="${productImg(p)}" alt="">
          <div class="admin-item__info">
            <strong>${esc(p.name)}</strong>
            <span>${esc(p.brand)} · ${esc(p.category)} · ${esc(p.colors[0]?.name || "—")}</span>
            ${p.badge ? `<em class="admin-badge badge badge--${p.badge}">${p.badge === "nuevo" ? "Nuevo" : "Agotado"}</em>` : ""}
          </div>
          <div class="admin-item__actions">
            <button class="btn btn--ghost" data-edit="${p.id}" type="button">Editar</button>
            <button class="btn btn--ghost btn--danger" data-del="${p.id}" type="button">Eliminar</button>
          </div>
        </div>`
      )
      .join("");
  }

  $("#product-list").addEventListener("click", (e) => {
    const edit = e.target.closest("[data-edit]");
    if (edit) return openProductForm(Number(edit.dataset.edit));
    const del = e.target.closest("[data-del]");
    if (del) {
      const id = Number(del.dataset.del);
      const p = products.find((x) => x.id === id);
      if (confirm(`¿Eliminar "${p ? p.name : ""}"? Esta acción no se puede deshacer.`)) {
        products = products.filter((x) => x.id !== id);
        saveProducts();
        renderProducts();
        toast("Producto eliminado");
      }
    }
  });

  // ---------- Formulario de producto ----------
  const modal = $("#product-modal");
  const form = $("#product-form");
  const colorRows = $("#color-rows");
  let editingId = null;

  function openProductForm(id) {
    editingId = id;
    form.reset();
    colorRows.innerHTML = "";
    $("#product-modal-title").textContent = id ? "Editar producto" : "Nuevo producto";
    if (id != null) {
      const p = products.find((x) => x.id === id);
      if (!p) return;
      form.elements["id"].value = p.id;
      form.elements["name"].value = p.name;
      form.elements["brand"].value = p.brand;
      form.elements["category"].value = p.category;
      form.elements["price"].value = p.price;
      form.elements["oldPrice"].value = p.oldPrice ?? "";
      form.elements["badge"].value = p.badge || "";
      form.elements["image"].value = p.image || "";
      form.elements["desc"].value = p.desc || "";
      form.elements["sizes"].value = (p.sizes || []).join(", ");
      (p.colors || []).forEach((c) => addColorRow(c.name, c.hex));
    } else {
      form.elements["sizes"].value = "S, M, L, XL";
      addColorRow("Negro", "#16161a");
    }
    if (!colorRows.children.length) addColorRow("Negro", "#16161a");
    updatePreview();
    modal.classList.remove("hidden");
    form.elements["name"].focus();
  }

  function closeProductForm() {
    modal.classList.add("hidden");
  }

  function addColorRow(name = "", hex = "#16161a") {
    const row = document.createElement("div");
    row.className = "color-row";
    row.innerHTML = `
      <input type="text" class="color-name" value="${esc(name)}" placeholder="Nombre" aria-label="Nombre del color">
      <input type="color" class="color-hex" value="${hex}" aria-label="Código del color">
      <button type="button" class="btn btn--ghost color-del" aria-label="Quitar color">&times;</button>`;
    row.querySelector(".color-del").addEventListener("click", () => row.remove());
    row.querySelector(".color-hex").addEventListener("input", updatePreview);
    colorRows.appendChild(row);
  }

  function getColors() {
    return [...colorRows.querySelectorAll(".color-row")]
      .map((r) => ({ name: r.querySelector(".color-name").value.trim() || "Color", hex: r.querySelector(".color-hex").value }))
      .filter((c) => c.hex);
  }

  function updatePreview() {
    const img = form.elements["image"].value.trim();
    if (img) {
      $("#product-preview").src = img;
      return;
    }
    const colors = getColors();
    const hex = colors.length ? colors[0].hex : "#16161a";
    const cat = form.elements["category"].value || "Jerseys";
    $("#product-preview").src = productImage(cat, hex);
  }

  $("#add-color-btn").addEventListener("click", () => addColorRow());
  $("#product-close").addEventListener("click", closeProductForm);
  $("#product-cancel").addEventListener("click", closeProductForm);
  form.elements["category"].addEventListener("input", updatePreview);
  form.elements["image"].addEventListener("input", updatePreview);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements["name"].value.trim();
    const brand = form.elements["brand"].value.trim();
    const category = form.elements["category"].value.trim();
    const price = parseFloat(form.elements["price"].value);
    const oldPrice = form.elements["oldPrice"].value ? parseFloat(form.elements["oldPrice"].value) : null;
    const badge = form.elements["badge"].value || null;
    const image = form.elements["image"].value.trim();
    const desc = form.elements["desc"].value.trim();
    const sizes = form.elements["sizes"].value.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = getColors();

    if (!name || !brand || !category || isNaN(price) || price < 0) {
      toast("Completa nombre, marca, categoría y precio");
      return;
    }
    if (!sizes.length || !colors.length) {
      toast("Agrega al menos una talla y un color");
      return;
    }

    const product = { name, brand, category, image, price, oldPrice, badge, desc, sizes, colors };

    if (editingId != null) {
      const idx = products.findIndex((x) => x.id === editingId);
      products[idx] = { id: editingId, ...product };
      toast("Producto actualizado");
    } else {
      products.push({ id: nextId++, ...product });
      toast("Producto creado");
    }
    saveProducts();
    renderProducts();
    closeProductForm();
  });

  $("#add-product-btn").addEventListener("click", () => openProductForm(null));

  // ---------- Configuración ----------
  const configForm = $("#config-form");
  configForm.elements["brand"].value = CONFIG.brand;
  configForm.elements["whatsapp"].value = CONFIG.whatsapp;
  configForm.elements["currency"].value = CONFIG.currency;

  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cfg = {
      brand: configForm.elements["brand"].value.trim(),
      whatsapp: configForm.elements["whatsapp"].value.trim().replace(/\D/g, ""),
      currency: configForm.elements["currency"].value.trim() || "Bs"
    };
    saveJSON("config", cfg);
    Object.assign(CONFIG, cfg);
    const msg = $("#config-saved");
    msg.classList.remove("hidden");
    setTimeout(() => msg.classList.add("hidden"), 2000);
    toast("Configuración guardada");
  });

  // ---------- Cupones ----------
  function renderCoupons() {
    const list = $("#coupon-list");
    const entries = Object.entries(COUPONS);
    list.innerHTML = entries.length
      ? entries
          .map(
            ([code, c]) => `
        <div class="admin-item">
          <div class="admin-item__info">
            <strong>${esc(code)}</strong>
            <span>${c.type === "percent" ? `${c.value}% de descuento` : `${CONFIG.currency} ${c.value} de descuento`}</span>
          </div>
          <div class="admin-item__actions">
            <button class="btn btn--ghost btn--danger" data-cp="${esc(code)}" type="button">Eliminar</button>
          </div>
        </div>`
          )
          .join("")
      : '<p class="admin-empty">No hay cupones. Agrega el primero.</p>';
  }

  $("#coupon-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cp]");
    if (!btn) return;
    if (confirm(`¿Eliminar el cupón ${btn.dataset.cp}?`)) {
      delete COUPONS[btn.dataset.cp];
      saveJSON("coupons", COUPONS);
      renderCoupons();
      toast("Cupón eliminado");
    }
  });

  $("#coupon-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const code = f.elements["code"].value.trim().toUpperCase();
    const type = f.elements["type"].value;
    const value = parseFloat(f.elements["value"].value);
    if (!code || isNaN(value) || value <= 0) return toast("Código y valor válidos requeridos");
    if (type === "fixed" && value < 0) return toast("El valor debe ser positivo");
    COUPONS[code] = { type, value };
    saveJSON("coupons", COUPONS);
    renderCoupons();
    f.reset();
    toast(`Cupón ${code} agregado`);
  });

  // ---------- Salir ----------
  $("#logout-btn").addEventListener("click", () => {
    location.href = "index.html";
  });

  // ---------- Init ----------
  loadProducts();
  renderProducts();
  catListCache();
  renderCoupons();
})();
