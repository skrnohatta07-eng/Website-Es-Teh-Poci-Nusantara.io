/* =====================================================
   script.js  ->  INTERAKSI website Es Teh Poci
   Isi file ini (cari judul bagian dengan Ctrl+F):
    1. Kunci penyimpanan browser
    2. Data
    3. Pengaturan bawaan (ubah di sini, atau lewat halaman Admin)
    4. Util
    5. Gelas (SVG)
    6. State peracik
    7. Toast
    8. Resep cepat & acak racikan
    9. Pesanan
   10. Favorit & menu
   11. Status buka
   12. Gambar gelas untuk galeri (SVG)
   13. Data toko: dibaca dari browser, dicek, lalu dipasang
   14. Galeri & lightbox
   15. Lokasi
   16. Admin
   17. Perpindahan halaman (situs / admin)
   18. Mulai
   ===================================================== */

(function () {
  "use strict";

  /* ---------- Kunci penyimpanan browser ---------- */
  var CART_KEY = "esteh-poci-cart";
  var FAV_KEY = "esteh-poci-fav";
  // Diisi dari DEFAULTS atau dari halaman Admin (lihat applyData)
  var WA_NUMBER = "", DELIVERY_FEE = 0, OPEN_HOUR = 10, CLOSE_HOUR = 22, PROMOS = {};

  /* ---------- Data ---------- */
  // Daftar rasa sesuai papan menu Es Teh Poci. "sizes" berisi ukuran yang dijual untuk
  // rasa itu dan harganya: hanya Original yang punya Kecil dan Besar, rasa lain satu ukuran.
  // "milky" menandai rasa yang dituang dengan susu (tampil creamy dan ada butiran boba di gelas).
  var FLAVORS = [
    { id: "original",     label: "Original",     cat: "klasik", color: "#B3540F", sizes: { kecil: 3000, besar: 4000 } },
    { id: "lemonhoney",   label: "Lemon Honey",  cat: "klasik", color: "#F2C230", sizes: { besar: 5000 } },
    { id: "lychee",       label: "Lychee",       cat: "klasik", color: "#EA7F9B", sizes: { besar: 5000 } },
    { id: "blackcurrant", label: "Blackcurrant", cat: "klasik", color: "#5B3A8E", sizes: { besar: 5000 } },
    { id: "mango",        label: "Mango",        cat: "buah",   color: "#F2A93C", sizes: { besar: 5000 } },
    { id: "orange",       label: "Orange",       cat: "buah",   color: "#F2841D", sizes: { besar: 5000 } },
    { id: "guava",        label: "Guava",        cat: "buah",   color: "#E1637A", sizes: { besar: 5000 } },
    { id: "apple",        label: "Apple",        cat: "buah",   color: "#C6303B", sizes: { besar: 5000 } },
    { id: "chocolate",    label: "Chocolate",    cat: "creamy", color: "#5A3825", sizes: { besar: 6000 }, milky: true },
    { id: "milktea",      label: "Milk Tea",     cat: "creamy", color: "#C9A66B", sizes: { besar: 6000 }, milky: true },
    { id: "cappuccino",   label: "Cappuccino",   cat: "creamy", color: "#8B5A2B", sizes: { besar: 6000 }, milky: true },
    { id: "thaitea",      label: "Thai Tea",     cat: "creamy", color: "#E2711D", sizes: { besar: 7000 }, milky: true }
  ];
  var FLAVOR_BY_ID = {};
  FLAVORS.forEach(function (f) { FLAVOR_BY_ID[f.id] = f; });
  var CATS = [
    { id: "klasik", label: "Rasa klasik" },
    { id: "buah", label: "Rasa buah" },
    { id: "creamy", label: "Rasa creamy" }
  ];
  function sizesOf(flavor) { return Object.keys(flavor.sizes); }
  function multiSize(flavor) { return sizesOf(flavor).length > 1; }
  function sizeLabel(k) { return k === "kecil" ? "Kecil" : "Besar"; }

  var SUGAR = ["Tanpa gula", "Kurang manis", "Manis normal", "Manis", "Manis banget"];
  var ICE = ["Tanpa es", "Es sedikit", "Es normal", "Es banyak"];
  var ICE_COUNT = [0, 2, 4, 6];
  var LEVEL_TOP = [128, 118, 108, 98];   // tinggi permukaan teh di gelas

  var MENU_DESC = {
    original_kecil: "Teh hitam klasik, pas untuk isi ulang cepat.",
    original_besar: "Teh hitam klasik dengan takaran lebih besar.",
    lemonhoney: "Teh hitam dengan madu dan lemon yang segar.",
    lychee: "Manis lembut rasa leci, menyegarkan.",
    blackcurrant: "Rasa blackcurrant yang manis asam dan pekat warnanya.",
    mango: "Manisnya buah mangga yang tropis.",
    orange: "Segarnya rasa jeruk, cocok untuk cuaca panas.",
    guava: "Rasa jambu biji yang manis dan sedikit asam.",
    apple: "Segar rasa apel merah, ringan diminum.",
    chocolate: "Cokelat lembut dipadu es teh yang creamy.",
    milktea: "Teh susu lembut, favorit banyak orang.",
    cappuccino: "Aroma kopi cappuccino yang creamy dan pekat.",
    thaitea: "Teh Thailand yang creamy dengan warna oranye khasnya."
  };

  // Menu ditata otomatis dari FLAVORS: Original menjadi dua baris (Kecil, Besar),
  // rasa lain masing-masing satu baris ukuran Besar.
  var MENU = [];
  FLAVORS.forEach(function (f) {
    sizesOf(f).forEach(function (sz) {
      var key = f.id + (multiSize(f) ? "_" + sz : "");
      MENU.push({
        name: "Es Teh " + f.label + (multiSize(f) ? " " + sizeLabel(sz) : ""),
        cat: f.cat,
        desc: MENU_DESC[key],
        priceKey: key,
        cfg: { flavor: f.id, size: sz, sugar: 2, ice: 2 }
      });
    });
  });

  /* ---------- Pengaturan bawaan (ubah di sini, atau lewat halaman Admin) ---------- */
  // Ilustrasi untuk galeri. Ganti dengan fotomu sendiri lewat Admin > Galeri.
  var ART = [
    { caption: "Es Teh Original, resep klasik",   flavor: "original", ice: 2 },
    { caption: "Es Teh Lemon Honey yang segar",   flavor: "lemonhoney", ice: 2 },
    { caption: "Es Teh Lychee, manis lembut",     flavor: "lychee", ice: 2 },
    { caption: "Es Teh Blackcurrant",             flavor: "blackcurrant", ice: 2 },
    { caption: "Es Teh Mango, segar tropis",      flavor: "mango", ice: 3 },
    { caption: "Es Teh Guava",                    flavor: "guava", ice: 2 },
    { caption: "Es Teh Milk Tea yang lembut",     flavor: "milktea", ice: 2 },
    { caption: "Es Teh Thai Tea, creamy dan khas", flavor: "thaitea", ice: 2 }
  ];
  // Harga awal, mengikuti kunci di MENU (priceKey): satu per baris menu.
  var DEFAULT_PRICES = {};
  MENU.forEach(function (m) { DEFAULT_PRICES[m.priceKey] = FLAVOR_BY_ID[m.cfg.flavor].sizes[m.cfg.size]; });

  var DEFAULTS = {
    shop: {
      name: "Es Teh Poci Nusantara",
      wa: "6281234567890",                       // format internasional tanpa +
      address: "Jl. Teh Dingin No. 7",
      landmark: "Depan taman, sebelah warung fotokopi",
      open: 10, close: 22,                       // jam buka dan tutup
      fee: 5000                                  // ongkos antar
    },
    prices: DEFAULT_PRICES,
    soldOut: [],
    promos: [
      { code: "SORE10",    type: "persen", value: 10,   min: 0 },
      { code: "HEMAT2000", type: "tetap",  value: 2000, min: 10000 }
    ],
    // Foto milikmu sendiri: taruh file di folder foto/ lalu tambahkan baris seperti contoh ini
    //   { id: "f1", caption: "Es teh andalan kami", src: "foto/es-teh-1.jpg" }
    gallery: ART.map(function (a, i) { return { id: "a" + i, caption: a.caption, art: i }; })  // "art" menunjuk indeks di ART
  };

  /* ---------- Util ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function rupiah(n) { return "Rp " + n.toLocaleString("id-ID"); }
  function lc(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function svgEl(name, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function priceOf(cfg) {
    return FLAVOR_BY_ID[cfg.flavor].sizes[cfg.size];
  }
  function detailOf(cfg) {
    return sizeLabel(cfg.size) + ", " + lc(SUGAR[cfg.sugar]) + ", " + lc(ICE[cfg.ice]);
  }
  function nameOf(cfg) {
    var f = FLAVOR_BY_ID[cfg.flavor];
    return "Es Teh " + f.label + (multiSize(f) ? " " + sizeLabel(cfg.size) : "");
  }

  /* ---------- Gelas (SVG) ---------- */
  var stage = $("#stage");
  var teaRect = $("#tea");
  var milk = $("#milk");
  var level = $("#level");
  var boba = $("#boba");
  var lemon = $("#lemon");
  var mint = $("#mint");

  var ICE_POS = [
    { x: 118, y: 152, r: -14 }, { x: 188, y: 140, r: 10 }, { x: 150, y: 232, r: -8 },
    { x: 196, y: 268, r: 16 },  { x: 122, y: 306, r: -18 }, { x: 172, y: 356, r: 12 }
  ];
  var cubes = ICE_POS.map(function (p, i) {
    var outer = svgEl("g", { transform: "translate(" + p.x + " " + p.y + ") rotate(" + p.r + ")" });
    var inner = svgEl("g", { "class": "ice" });
    inner.style.setProperty("--i", i);
    inner.appendChild(svgEl("rect", { x: -22, y: -22, width: 44, height: 44, rx: 8 }));
    inner.appendChild(svgEl("path", { d: "M-12 -9 L-5 -15" }));
    outer.appendChild(inner);
    $("#ices").appendChild(outer);
    return inner;
  });

  for (var row = 0; row < 2; row++) {
    var count = row === 0 ? 9 : 8;
    for (var c = 0; c < count; c++) {
      var cx = (row === 0 ? 112 : 118) + c * 12;
      var cy = row === 0 ? 414 : 400;
      var b = svgEl("g", {});
      b.appendChild(svgEl("circle", { cx: cx, cy: cy, r: 7.5, fill: "#241208" }));
      b.appendChild(svgEl("circle", { cx: cx - 2.5, cy: cy - 2.5, r: 1.8, fill: "#fff", "fill-opacity": ".35" }));
      boba.appendChild(b);
    }
  }

  [[88, 190, 3], [92, 250, 2.2], [86, 300, 3.4], [96, 352, 2.4], [234, 150, 2.6], [231, 214, 3.6], [226, 286, 2.4], [223, 340, 3]]
    .forEach(function (d) {
      $("#drops").appendChild(svgEl("ellipse", { "class": "drop", cx: d[0], cy: d[1], rx: d[2], ry: d[2] * 1.4 }));
    });

  /* ---------- State peracik ---------- */
  var state = { flavor: "original", size: "besar", sugar: 2, ice: 2 };
  var pourTimer = null, wobbleTimer = null;

  // Efek gerak: teko poci menuang teh, gelas bergoyang, label harga membesar
  function restartClass(node, name, ms) {
    node.classList.remove(name);
    void node.getBoundingClientRect();      // memaksa browser mengulang animasi dari awal
    node.classList.add(name);
    return setTimeout(function () { node.classList.remove(name); }, ms);
  }
  function pour() {
    clearTimeout(pourTimer);
    pourTimer = restartClass(stage, "pouring", 2300);
  }
  function wobble() {
    clearTimeout(wobbleTimer);
    wobbleTimer = restartClass(stage, "wobble", 600);
  }

  // Kartu pilihan rasa dan ukuran dibuat lewat kode (bukan ditulis tangan di HTML) supaya
  // selalu cocok dengan daftar FLAVORS, termasuk saat harga diubah lewat halaman Admin.
  var flavorGroups = $("#flavorGroups");
  var sizeStep = $("#sizeStep"), sizePicks = $("#sizePicks");

  function renderFlavorGroups() {
    flavorGroups.replaceChildren();
    CATS.forEach(function (cat) {
      var items = FLAVORS.filter(function (f) { return f.cat === cat.id; });
      if (!items.length) return;
      flavorGroups.appendChild(el("p", "group-label", cat.label));
      var grid = el("div", "picks picks-flavor");
      items.forEach(function (f) {
        var label = el("label", "pick");
        var input = document.createElement("input");
        input.type = "radio"; input.name = "flavor"; input.value = f.id;
        input.checked = f.id === state.flavor;
        var body = el("span", "pick-body");
        var dot = el("i", "dot"); dot.style.setProperty("--c", f.color);
        body.appendChild(dot);
        body.appendChild(el("b", null, f.label));
        var priceText = multiSize(f) ? "mulai " + rupiah(Math.min.apply(null, Object.values(f.sizes))) : rupiah(f.sizes.besar);
        body.appendChild(el("em", null, priceText));
        label.appendChild(input);
        label.appendChild(body);
        grid.appendChild(label);
      });
      flavorGroups.appendChild(grid);
    });
  }
  // Delegasi peristiwa: tetap berfungsi walau kartunya dibuat ulang setiap renderFlavorGroups()
  flavorGroups.addEventListener("input", function (e) {
    if (e.target.name !== "flavor") return;
    var before = state.flavor;
    state.flavor = e.target.value;
    var sizes = sizesOf(FLAVOR_BY_ID[state.flavor]);
    if (sizes.indexOf(state.size) === -1) state.size = sizes[sizes.length - 1];
    renderSizeStep();
    update();
    if (before !== state.flavor) pour();
  });

  function renderSizeStep() {
    var f = FLAVOR_BY_ID[state.flavor];
    var multi = multiSize(f);
    sizeStep.hidden = !multi;
    if (!multi) return;
    sizePicks.replaceChildren();
    sizesOf(f).forEach(function (sz) {
      var label = el("label", "pick");
      var input = document.createElement("input");
      input.type = "radio"; input.name = "size"; input.value = sz;
      input.checked = sz === state.size;
      var body = el("span", "pick-body");
      body.appendChild(el("b", null, sizeLabel(sz)));
      body.appendChild(el("em", null, rupiah(f.sizes[sz])));
      label.appendChild(input);
      label.appendChild(body);
      sizePicks.appendChild(label);
    });
  }
  sizePicks.addEventListener("input", function (e) {
    if (e.target.name !== "size") return;
    state.size = e.target.value;
    update();
    wobble();
  });

  function readSliders() {
    state.ice = +$("#ice").value;
    update();
    wobble();
  }
  function writeControls() {
    renderFlavorGroups();
    renderSizeStep();
    $("#ice").value = state.ice;
    update();
    pour();
  }

  // Rasa racikan (0 sampai 100) untuk grafik batang
  function tasteOf(s) {
    var f = FLAVOR_BY_ID[s.flavor];
    var v = {
      manis: s.sugar * 22 + (f.milky ? 12 : 0),
      segar: 6 + s.ice * 16 + (f.cat === "buah" ? 34 : 0) + (s.flavor === "lemonhoney" ? 22 : 0),
      creamy: f.milky ? 70 + (s.flavor === "thaitea" ? 12 : 0) : 0,
      pekat: f.cat === "klasik" ? 74 - s.ice * 5 : f.cat === "buah" ? 30 : 22
    };
    for (var k in v) v[k] = Math.max(0, Math.min(100, v[k]));
    return v;
  }

  function update() {
    var f = FLAVOR_BY_ID[state.flavor];
    var color = f.color;

    // gelas
    stage.setAttribute("data-size", state.size === "kecil" ? "reguler" : "jumbo");
    stage.style.setProperty("--tea", color);
    teaRect.style.fill = color;
    level.style.transform = "translateY(" + (LEVEL_TOP[state.ice] - 98) + "px)";
    cubes.forEach(function (cube, i) { cube.classList.toggle("off", i >= ICE_COUNT[state.ice]); });
    milk.setAttribute("opacity", f.milky ? ".45" : "0");
    boba.classList.toggle("off", !f.milky);

    // penggeser dan label
    var iceInput = $("#ice");
    iceInput.style.setProperty("--p", (iceInput.value / iceInput.max * 100) + "%");
    $$("#iceTicks span").forEach(function (t, i) { t.classList.toggle("on", i === state.ice); });
    $("#iceOut").textContent = ICE[state.ice];
    $("#ice").setAttribute("aria-valuetext", ICE[state.ice]);

    // rasa
    var taste = tasteOf(state);
    $$("[data-meter]").forEach(function (bar) {
      var v = taste[bar.dataset.meter];
      bar.style.setProperty("--v", v);
      bar.setAttribute("aria-valuenow", v);
    });

    // nama dan harga
    var price = rupiah(priceOf(state));
    $("#sumName").textContent = nameOf(state);
    $("#sumDetail").textContent = detailOf(state);
    $("#sumPrice").textContent = price;
    var sticker = $("#stickerPrice");
    if (sticker.textContent !== price) {
      sticker.textContent = price;
      restartClass($("#priceSticker"), "pop", 500);
    }
  }

  $$("#ice").forEach(function (i) { i.addEventListener("input", readSliders); });

  /* ---------- Toast ---------- */
  var toast = $("#toast"), toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 1800);
  }

  /* ---------- Resep cepat & acak racikan ---------- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function setState(cfg) {
    state = { flavor: cfg.flavor, size: cfg.size, sugar: cfg.sugar, ice: cfg.ice };
    writeControls();
  }
  function loadIntoBuilder(cfg) {
    setState(cfg);
    $("#racik").scrollIntoView();
  }
  $$("[data-flavor]").forEach(function (b) {
    b.addEventListener("click", function () {
      setState({ flavor: b.dataset.flavor, size: b.dataset.size, sugar: 2, ice: 2 });
    });
  });
  $("#randomBtn").addEventListener("click", function () {
    var f = pick(FLAVORS);
    setState({
      flavor: f.id,
      size: pick(sizesOf(f)),
      sugar: 1 + Math.floor(Math.random() * 3),
      ice: 1 + Math.floor(Math.random() * 3)
    });
    showToast("Racikan baru: " + nameOf(state));
  });

  /* ---------- Pesanan ---------- */
  var cart = loadCart();
  var promo = null;

  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY));
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (i) {
        return i && typeof i.name === "string" && typeof i.detail === "string" &&
          isFinite(i.unit) && Number.isInteger(i.qty) && i.qty > 0 && i.qty < 100;
      }).map(function (i) {
        return { key: i.name + "|" + i.detail, name: i.name.slice(0, 80), detail: i.detail.slice(0, 120), unit: +i.unit, qty: i.qty };
      });
    } catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* abaikan */ }
  }

  function subtotal() { return cart.reduce(function (s, i) { return s + i.unit * i.qty; }, 0); }
  function discount(sub) {
    if (!promo) return 0;
    var p = PROMOS[promo];
    return sub >= p.min ? Math.min(p.calc(sub), sub) : 0;
  }
  function method() { return $('input[name="method"]:checked').value; }
  function fee(sub) { return method() === "antar" && sub > 0 ? DELIVERY_FEE : 0; }

  function addToCart(name, detail, unit) {
    var key = name + "|" + detail;
    var found = cart.filter(function (i) { return i.key === key; })[0];
    if (found) { found.qty = Math.min(found.qty + 1, 99); }
    else { cart.push({ key: key, name: name, detail: detail, unit: unit, qty: 1 }); }
    saveCart();
    renderCart();
    showToast("Ditambahkan: " + name);
  }
  function changeQty(index, delta) {
    cart[index].qty = Math.min(cart[index].qty + delta, 99);
    if (cart[index].qty <= 0) cart.splice(index, 1);
    saveCart();
    renderCart();
  }

  function setMsg(node, text, cls) {
    node.textContent = text;
    node.className = "msg" + (cls ? " " + cls : "");
  }

  function renderCart() {
    var list = $("#cartList");
    list.replaceChildren();
    var count = 0;

    cart.forEach(function (it, idx) {
      count += it.qty;
      var li = el("li", "cart-item");
      var info = el("div");
      info.appendChild(el("p", "cart-name", it.name));
      info.appendChild(el("p", "cart-detail", it.detail));

      var qty = el("div", "qty");
      var minus = el("button", null, "−");
      minus.type = "button";
      minus.setAttribute("aria-label", "Kurangi " + it.name);
      minus.addEventListener("click", function () { changeQty(idx, -1); });
      var plus = el("button", null, "+");
      plus.type = "button";
      plus.setAttribute("aria-label", "Tambah " + it.name);
      plus.addEventListener("click", function () { changeQty(idx, 1); });
      qty.appendChild(minus);
      qty.appendChild(el("span", null, String(it.qty)));
      qty.appendChild(plus);

      li.appendChild(info);
      li.appendChild(qty);
      li.appendChild(el("p", "line-total", rupiah(it.unit * it.qty)));
      list.appendChild(li);
    });

    var sub = subtotal(), disc = discount(sub), f = fee(sub), total = sub - disc + f;
    $("#cartEmpty").hidden = cart.length > 0;
    $("#clearCart").hidden = cart.length === 0;
    $("#subTotal").textContent = rupiah(sub);
    $("#discRow").hidden = disc <= 0;
    if (disc > 0) {
      $("#discLabel").textContent = "Diskon (" + promo + ")";
      $("#discAmt").textContent = "-" + rupiah(disc);
    }
    $("#feeRow").hidden = f <= 0;
    $("#feeAmt").textContent = rupiah(f);
    $("#cartTotal").textContent = rupiah(total);
    $("#cartCount").textContent = count;
    updatePromoMsg(sub);
    updateWhatsApp({ sub: sub, disc: disc, fee: f, total: total });
  }

  /* promo */
  function updatePromoMsg(sub) {
    if (!promo) return;
    var p = PROMOS[promo], msg = $("#promoMsg");
    if (sub < p.min) setMsg(msg, "Kode " + promo + " tersimpan. Belanja minimal " + rupiah(p.min) + " agar berlaku.", "");
    else setMsg(msg, "Kode " + promo + " dipakai: " + p.label + ".", "ok");
  }
  function applyPromo() {
    var code = $("#promoInput").value.trim().toUpperCase();
    var msg = $("#promoMsg");
    if (!code) { promo = null; setMsg(msg, "", ""); }
    else if (!PROMOS[code]) { promo = null; setMsg(msg, "Kode tidak dikenal. Periksa lagi penulisannya.", "err"); }
    else { promo = code; }
    renderCart();
  }
  $("#promoBtn").addEventListener("click", applyPromo);
  $("#promoInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); applyPromo(); }
  });

  /* pengambilan */
  $("#feeHint").textContent = "+" + DELIVERY_FEE.toLocaleString("id-ID");
  $$('input[name="method"]').forEach(function (i) {
    i.addEventListener("input", function () {
      $("#addrLabel").hidden = method() !== "antar";
      renderCart();
    });
  });

  /* WhatsApp */
  function updateWhatsApp(t) {
    var link = $("#waLink"), msg = $("#orderMsg");
    function off(text) {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("href", "#pesanan");
      setMsg(msg, text || "", text ? "err" : "");
    }
    if (!cart.length) { off(""); return; }
    var antar = method() === "antar";
    var addr = $("#custAddr").value.trim();
    if (antar && !addr) { off("Isi alamat pengantaran dulu."); return; }

    var lines = ["Halo " + data.shop.name + ", saya mau pesan:"];
    cart.forEach(function (i) {
      lines.push("- " + i.qty + "x " + i.name + " (" + i.detail + ") = " + rupiah(i.unit * i.qty));
    });
    lines.push("Subtotal: " + rupiah(t.sub));
    if (t.disc > 0) lines.push("Diskon (" + promo + "): -" + rupiah(t.disc));
    if (t.fee > 0) lines.push("Ongkos antar: " + rupiah(t.fee));
    lines.push("Total: " + rupiah(t.total));
    lines.push(antar ? "Diantar ke: " + addr : "Diambil di tempat");
    var name = $("#custName").value.trim();
    var note = $("#custNote").value.trim();
    if (name) lines.push("Nama: " + name);
    if (note) lines.push("Catatan: " + note);

    link.setAttribute("aria-disabled", "false");
    link.setAttribute("href", "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n")));
    setMsg(msg, "", "");
  }
  ["#custName", "#custAddr", "#custNote"].forEach(function (sel) {
    $(sel).addEventListener("input", renderCart);
  });
  $("#waLink").addEventListener("click", function (e) {
    if (this.getAttribute("aria-disabled") === "true") e.preventDefault();
  });
  $("#clearCart").addEventListener("click", function () {
    cart = [];
    saveCart();
    renderCart();
  });
  $("#addBuilder").addEventListener("click", function () {
    addToCart(nameOf(state), detailOf(state), priceOf(state));
  });

  /* ---------- Favorit & menu ---------- */
  var favs = loadFavs();
  function loadFavs() {
    try {
      var raw = JSON.parse(localStorage.getItem(FAV_KEY));
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (n) { return MENU.some(function (m) { return m.name === n; }); });
    } catch (e) { return []; }
  }
  function saveFavs() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) { /* abaikan */ }
  }
  function setFavUI(btn, name) {
    var on = favs.indexOf(name) > -1;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Hapus " + name + " dari favorit" : "Simpan " + name + " ke favorit");
  }

  var menuList = $("#menuList");
  var activeFilter = "semua";

  function renderMenu() {
    menuList.replaceChildren();
    MENU.forEach(function (item) {
      var soldOut = data.soldOut.indexOf(item.name) > -1;
      var li = el("li", "row");
      li.dataset.cat = item.cat;
      li.dataset.name = item.name;

      var main = el("div");
      var head = el("div", "row-head");
      head.appendChild(el("h3", null, item.name));
      if (soldOut) head.appendChild(el("span", "badge", "Habis"));
      head.appendChild(el("span", "leader"));
      head.appendChild(el("span", "price", rupiah(priceOf(item.cfg))));
      main.appendChild(head);
      main.appendChild(el("p", null, item.desc + " " + detailOf(item.cfg) + "."));

      var actions = el("div", "row-actions");
      var fav = el("button", "fav");
      fav.type = "button";
      fav.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>';
      setFavUI(fav, item.name);
      fav.addEventListener("click", function () {
        var i = favs.indexOf(item.name);
        if (i > -1) favs.splice(i, 1); else favs.push(item.name);
        saveFavs();
        setFavUI(fav, item.name);
        applyFilter();
      });
      var add = el("button", "btn small", soldOut ? "Habis" : "Tambah");
      add.type = "button";
      add.disabled = soldOut;
      add.setAttribute("aria-label", soldOut ? item.name + " sedang habis" : "Tambah " + item.name + " ke pesanan");
      add.addEventListener("click", function () { addToCart(item.name, detailOf(item.cfg), priceOf(item.cfg)); });
      var edit = el("button", "btn small ghost", "Ubah");
      edit.type = "button";
      edit.setAttribute("aria-label", "Ubah " + item.name + " di peracik");
      edit.addEventListener("click", function () { loadIntoBuilder(item.cfg); });
      actions.appendChild(fav);
      actions.appendChild(add);
      actions.appendChild(edit);

      li.appendChild(main);
      li.appendChild(actions);
      menuList.appendChild(li);
    });
  }

  function applyFilter() {
    var shown = 0;
    $$(".row", menuList).forEach(function (r) {
      var ok = activeFilter === "semua" ||
        (activeFilter === "favorit" ? favs.indexOf(r.dataset.name) > -1 : r.dataset.cat === activeFilter);
      r.hidden = !ok;
      if (ok) shown++;
    });
    $("#menuEmpty").hidden = shown > 0;
    $("#favCount").textContent = favs.length;
  }
  $$(".filters button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeFilter = btn.dataset.filter;
      $$(".filters button").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      applyFilter();
    });
  });

  /* ---------- Status buka ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function updateStatus() {
    var d = new Date();
    var h = d.getHours() + d.getMinutes() / 60;
    var open = h >= OPEN_HOUR && h < CLOSE_HOUR;
    var text = open ? "Buka sekarang sampai " + pad(CLOSE_HOUR) + ".00."
                    : "Sedang tutup, buka lagi pukul " + pad(OPEN_HOUR) + ".00.";
    $$("[data-status]").forEach(function (n) { n.textContent = text; });
  }

  /* ---------- Gambar gelas untuk galeri (SVG) ---------- */
  // cfg di sini berbentuk { flavor, ice }, dipakai untuk ilustrasi ART di galeri.
  function cupSVG(cfg, uid) {
    var f = FLAVOR_BY_ID[cfg.flavor];
    var id = "cc" + uid, top = LEVEL_TOP[cfg.ice];
    var h = '<svg viewBox="30 0 260 470" aria-hidden="true" focusable="false">';
    h += '<defs><clipPath id="' + id + '"><path d="M73 72 L247 72 L220 426 Q219 430 214 430 L106 430 Q101 430 100 426 Z"/></clipPath></defs>';
    h += '<ellipse cx="160" cy="450" rx="86" ry="10" fill="currentColor" opacity=".16"/>';
    h += '<g clip-path="url(#' + id + ')">';
    h += '<rect x="0" y="' + top + '" width="320" height="400" fill="' + f.color + '"/>';
    if (f.milky) h += '<rect x="0" y="' + top + '" width="320" height="400" fill="#FFF3DC" opacity=".45"/>';
    h += '<ellipse cx="160" cy="' + top + '" rx="110" ry="6" fill="#fff" opacity=".28"/>';
    for (var i = 0; i < ICE_COUNT[cfg.ice]; i++) {
      var p = ICE_POS[i];
      h += '<g transform="translate(' + p.x + " " + p.y + ") rotate(" + p.r + ')"><rect x="-22" y="-22" width="44" height="44" rx="8" fill="#fff" fill-opacity=".36" stroke="#fff" stroke-opacity=".75" stroke-width="1.5"/></g>';
    }
    if (f.milky) {
      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < (r === 0 ? 9 : 8); c++) {
          h += '<circle cx="' + ((r === 0 ? 112 : 118) + c * 12) + '" cy="' + (r === 0 ? 414 : 400) + '" r="7.5" fill="#241208"/>';
        }
      }
    }
    h += "</g>";
    h += '<path d="M70 70 L250 70 L222 426 Q221 432 214 432 L106 432 Q99 432 98 426 Z" fill="#fff" fill-opacity=".12" stroke="var(--glass)" stroke-width="3" stroke-linejoin="round"/>';
    h += '<path d="M84 98 L99 402" stroke="#fff" stroke-opacity=".5" stroke-width="6" stroke-linecap="round" fill="none"/>';
    h += '<line x1="160" y1="384" x2="190" y2="14" stroke="#fff" stroke-width="10" stroke-linecap="round"/>' +
      '<line x1="160" y1="384" x2="190" y2="14" stroke="#E23B2B" stroke-width="10" stroke-dasharray="8 12"/>';
    return h + "</svg>";
  }

  /* ---------- Data toko: dibaca dari browser, dicek, lalu dipasang ---------- */
  var DATA_KEY = "esteh-poci-data";
  var PIN_KEY = "esteh-poci-pin";
  var PRICE_KEYS = MENU.map(function (m) { return m.priceKey; });
  var PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/;
  var FILE_RE = /^foto\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,79}\.(jpe?g|png|webp|gif)$/i;   // foto dari folder foto/
  var data = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function num(v, min, max, def) { v = Number(v); return isFinite(v) && v >= min && v <= max ? Math.round(v) : def; }
  function txt(v, max, def, allowEmpty) {
    if (typeof v !== "string") return def;
    v = v.trim().slice(0, max);
    return v || (allowEmpty ? "" : def);
  }
  function normPhone(v) {
    if (typeof v !== "string") return "";
    var d = v.replace(/\D/g, "");
    if (d.charAt(0) === "0") d = "62" + d.slice(1);
    return d.length >= 9 && d.length <= 15 ? d : "";
  }
  function fmtPhone(d) {
    var n = d.indexOf("62") === 0 ? "0" + d.slice(2) : "+" + d;
    return n.replace(/(\d{4})(?=\d)/g, "$1-");
  }
  function uid() { return "p" + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36); }

  function sanitizeData(raw) {
    var d = clone(DEFAULTS);
    if (!raw || typeof raw !== "object") return d;

    var s = raw.shop || {};
    d.shop.name = txt(s.name, 40, d.shop.name);
    d.shop.wa = normPhone(s.wa) || d.shop.wa;
    d.shop.address = txt(s.address, 120, d.shop.address);
    d.shop.landmark = txt(s.landmark, 120, d.shop.landmark, true);
    var o = num(s.open, 0, 23, d.shop.open), c = num(s.close, 1, 24, d.shop.close);
    if (c > o) { d.shop.open = o; d.shop.close = c; }
    d.shop.fee = num(s.fee, 0, 100000, d.shop.fee);

    var p = raw.prices || {};
    PRICE_KEYS.forEach(function (k) { d.prices[k] = num(p[k], 500, 200000, d.prices[k]); });

    if (Array.isArray(raw.soldOut)) {
      d.soldOut = raw.soldOut.filter(function (n) { return MENU.some(function (m) { return m.name === n; }); });
    }
    if (Array.isArray(raw.promos)) {
      var seen = {};
      d.promos = [];
      raw.promos.slice(0, 10).forEach(function (r) {
        if (!r || typeof r !== "object") return;
        var code = typeof r.code === "string" ? r.code.trim().toUpperCase() : "";
        if (!/^[A-Z0-9]{3,16}$/.test(code) || seen[code]) return;
        var type = r.type === "persen" ? "persen" : "tetap";
        seen[code] = true;
        d.promos.push({
          code: code, type: type,
          value: num(r.value, 1, type === "persen" ? 100 : 1000000, type === "persen" ? 10 : 1000),
          min: num(r.min, 0, 10000000, 0)
        });
      });
    }
    if (Array.isArray(raw.gallery)) {
      d.gallery = [];
      raw.gallery.slice(0, 30).forEach(function (it) {
        if (!it || typeof it !== "object") return;
        var item = { id: txt(it.id, 24, "") || uid(), caption: txt(it.caption, 80, "Foto") };
        if (Number.isInteger(it.art) && it.art >= 0 && it.art < ART.length) { item.art = it.art; d.gallery.push(item); }
        else if (typeof it.src === "string" && it.src.length < 1500000 && PHOTO_RE.test(it.src)) { item.src = it.src; d.gallery.push(item); }
        else if (typeof it.src === "string" && FILE_RE.test(it.src)) { item.src = it.src; d.gallery.push(item); }
      });
    }
    return d;
  }

  function loadData() {
    var fallback;
    try { fallback = sanitizeData(JSON.parse(localStorage.getItem(DATA_KEY))); }
    catch (e) { fallback = sanitizeData(null); }

    // MySQL menjadi sumber data utama. Jika Apache/MySQL belum aktif,
    // website tetap dapat dibuka menggunakan data browser sebagai fallback.
    try {
      if (window.jQuery) {
        var response = null;
        window.jQuery.ajax({
          url: "api.php", method: "GET", data: { action: "config" },
          dataType: "json", cache: false, async: false
        }).done(function (r) { response = r; });
        if (response && response.success && response.data) {
          var serverData = sanitizeData(response.data);
          localStorage.setItem(DATA_KEY, JSON.stringify(serverData));
          return serverData;
        }
      }
    } catch (e) {
      console.warn("MySQL belum tersedia, memakai data browser.");
    }
    return fallback;
  }
  function saveData() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      if (window.jQuery) {
        var response = null;
        window.jQuery.ajax({
          url: "api.php?action=save_config", method: "POST",
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(data), dataType: "json", cache: false, async: false
        }).done(function (r) { response = r; });
        if (!response || !response.success) {
          console.warn("Konfigurasi tersimpan di browser tetapi gagal ke MySQL.", response);
          return false;
        }
      }
      return true;
    } catch (e) { return false; }
  }

  function buildPromos(list) {
    var out = {};
    list.forEach(function (p) {
      out[p.code] = {
        label: p.type === "persen" ? "diskon " + p.value + "%" : "potongan " + rupiah(p.value),
        min: p.min,
        calc: p.type === "persen" ? function (sub) { return Math.round(sub * p.value / 100); } : function () { return p.value; }
      };
    });
    return out;
  }

  function applyData() {
    var d = data;
    WA_NUMBER = d.shop.wa; DELIVERY_FEE = d.shop.fee; OPEN_HOUR = d.shop.open; CLOSE_HOUR = d.shop.close;
    MENU.forEach(function (m) { FLAVOR_BY_ID[m.cfg.flavor].sizes[m.cfg.size] = d.prices[m.priceKey]; });
    PROMOS = buildPromos(d.promos);
    if (promo && !PROMOS[promo]) { promo = null; setMsg($("#promoMsg"), "", ""); }

    document.title = d.shop.name;
    $$("[data-shop-name]").forEach(function (n) { n.textContent = d.shop.name; });
    $("#feeHint").textContent = "+" + DELIVERY_FEE.toLocaleString("id-ID");
    renderLocation();
  }

  function renderAll() {
    applyData();
    renderMenu();
    applyFilter();
    renderGallery();
    renderFlavorGroups();
    renderSizeStep();
    update();
    renderCart();
    updateStatus();
  }

  /* ---------- Galeri & lightbox ---------- */
  function fillMedia(node, g, id) {
    node.replaceChildren();
    if (typeof g.art === "number") {
      var a = ART[g.art];
      node.classList.add("art");
      node.style.setProperty("--accent-art", a.accent);
      node.innerHTML = cupSVG({ flavor: a.flavor, ice: a.ice }, id);   // markup statis dari kode, bukan dari input pengguna
    } else {
      node.classList.remove("art");
      var img = document.createElement("img");
      img.src = g.src;
      img.alt = g.caption;
      img.loading = "lazy";
      img.decoding = "async";
      node.appendChild(img);
    }
  }

  function renderGallery() {
    var box = $("#gallery");
    box.replaceChildren();
    data.gallery.forEach(function (g, i) {
      var tile = el("button", "tile" + (i === 0 ? " feature" : ""));
      tile.type = "button";
      tile.setAttribute("aria-label", "Perbesar foto: " + g.caption);
      var media = el("div", "tile-media");
      fillMedia(media, g, "g" + i);
      tile.appendChild(media);
      tile.appendChild(el("span", "tile-cap", g.caption));
      tile.addEventListener("click", function () { openLightbox(i); });
      box.appendChild(tile);
    });
    $("#galleryEmpty").hidden = data.gallery.length > 0;
  }

  var lb = $("#lightbox"), lbIndex = 0;
  function showLightbox() {
    var g = data.gallery[lbIndex];
    if (!g) return;
    var media = $("#lbMedia");
    media.className = "lb-media";
    fillMedia(media, g, "lb");
    $("#lbCap").textContent = g.caption;
    var single = data.gallery.length < 2;
    $("#lbPrev").disabled = single;
    $("#lbNext").disabled = single;
  }
  function openLightbox(i) {
    lbIndex = i;
    showLightbox();
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
  }
  function stepLightbox(delta) {
    var n = data.gallery.length;
    if (n < 2) return;
    lbIndex = (lbIndex + delta + n) % n;
    showLightbox();
  }
  $("#lbPrev").addEventListener("click", function () { stepLightbox(-1); });
  $("#lbNext").addEventListener("click", function () { stepLightbox(1); });
  $("#lbClose").addEventListener("click", function () { if (lb.close) lb.close(); else lb.removeAttribute("open"); });
  lb.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); stepLightbox(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); stepLightbox(1); }
  });
  lb.addEventListener("click", function (e) { if (e.target === lb && lb.close) lb.close(); });

  /* ---------- Lokasi ---------- */
  function renderLocation() {
    var s = data.shop, q = encodeURIComponent(s.name + ", " + s.address);
    var hours = "Setiap hari, " + pad(s.open) + ".00 sampai " + pad(s.close) + ".00";
    $("#locAddr").textContent = s.address;
    $("#locLandmark").textContent = s.landmark;
    $("#locLandmarkRow").hidden = !s.landmark;
    $("#locHours").textContent = hours;
    var wa = $("#locWa");
    wa.textContent = fmtPhone(s.wa);
    wa.href = "https://wa.me/" + s.wa;
    $("#mapLink").href = "https://www.google.com/maps/search/?api=1&query=" + q;
    $("#dirLink").href = "https://www.google.com/maps/dir/?api=1&destination=" + q;
    $("#ftHours").textContent = "Buka setiap hari, " + pad(s.open) + ".00 sampai " + pad(s.close) + ".00";
    $("#ftAddr").textContent = s.address;
    $("#ftWa").textContent = fmtPhone(s.wa);
  }
  $("#copyAddr").addEventListener("click", function () {
    var t = data.shop.address;
    try {
      navigator.clipboard.writeText(t).then(
        function () { showToast("Alamat disalin"); },
        function () { showToast("Tidak bisa menyalin. Salin manual ya."); }
      );
    } catch (e) { showToast("Tidak bisa menyalin. Salin manual ya."); }
  });

  /* ---------- Admin ---------- */
  var authed = false, failCount = 0, lockUntil = 0;
  try { authed = sessionStorage.getItem("esteh-poci-admin") === "1"; } catch (e) { /* abaikan */ }

  function getPin() {
    try { var p = localStorage.getItem(PIN_KEY); if (p && /^\d{4,8}$/.test(p)) return p; } catch (e) { /* abaikan */ }
    return "1234";
  }
  function persist(msgNode, okText) {
    if (saveData()) { setMsg(msgNode, okText || "Tersimpan.", "ok"); return true; }
    setMsg(msgNode, "Penyimpanan browser penuh. Hapus beberapa foto lalu coba lagi.", "err");
    return false;
  }
  function mkInput(type, value, onInput, attrs) {
    var i = el("input", "ctl");
    i.type = type;
    i.value = value;
    for (var k in (attrs || {})) i.setAttribute(k, attrs[k]);
    i.addEventListener("input", function () { onInput(i.value); });
    return i;
  }
  function labeled(text, control) {
    var l = el("label", "lbl");
    l.appendChild(document.createTextNode(text));
    l.appendChild(control);
    return l;
  }

  /* masuk & keluar */
  function tryLogin() {
    var msg = $("#pinMsg"), now = Date.now();
    if (now < lockUntil) { setMsg(msg, "Terlalu banyak percobaan. Tunggu sekitar 30 detik.", "err"); return; }
    if ($("#pinInput").value === getPin()) {
      authed = true;
      failCount = 0;
      try { sessionStorage.setItem("esteh-poci-admin", "1"); } catch (e) { /* abaikan */ }
      $("#pinInput").value = "";
      setMsg(msg, "", "");
      showAdmin();
    } else {
      failCount++;
      if (failCount >= 5) { lockUntil = now + 30000; failCount = 0; }
      setMsg(msg, "PIN salah.", "err");
    }
  }
  $("#pinBtn").addEventListener("click", tryLogin);
  $("#pinInput").addEventListener("keydown", function (e) { if (e.key === "Enter") tryLogin(); });
  $("#logoutBtn").addEventListener("click", function () {
    authed = false;
    try { sessionStorage.removeItem("esteh-poci-admin"); } catch (e) { /* abaikan */ }
    showAdmin();
  });

  /* tab */
  var TABS = ["toko", "menu", "promo", "galeri", "data"];
  function showTab(name) {
    TABS.forEach(function (t) {
      var on = t === name, b = $("#tabbtn-" + t);
      $("#tab-" + t).hidden = !on;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    if (name === "galeri") renderAdminGallery();
    if (name === "data") refreshExport();
  }
  $$(".tabs button").forEach(function (b) {
    b.addEventListener("click", function () { showTab(b.dataset.tab); });
    b.addEventListener("keydown", function (e) {
      var i = TABS.indexOf(b.dataset.tab), n = null;
      if (e.key === "ArrowRight") n = TABS[(i + 1) % TABS.length];
      if (e.key === "ArrowLeft") n = TABS[(i - 1 + TABS.length) % TABS.length];
      if (n) { e.preventDefault(); showTab(n); $("#tabbtn-" + n).focus(); }
    });
  });

  function showAdmin() {
    $("#adminGate").hidden = authed;
    $("#adminApp").hidden = !authed;
    $("#pinHint").hidden = getPin() !== "1234";
    if (authed) { renderAdmin(); showTab("toko"); }
    else { $("#pinInput").focus({ preventScroll: true }); }
  }

  function renderAdmin() {
    var s = data.shop;
    $("#fName").value = s.name;
    $("#fWa").value = fmtPhone(s.wa).replace(/-/g, "");
    $("#fAddr").value = s.address;
    $("#fLandmark").value = s.landmark;
    $("#fOpen").value = s.open;
    $("#fClose").value = s.close;
    $("#fFee").value = s.fee;
    var priceGrid = $("#priceGrid");
    priceGrid.replaceChildren();
    MENU.forEach(function (m) {
      var lbl = el("label", "lbl", m.name + " (Rp)");
      var input = document.createElement("input");
      input.className = "ctl"; input.type = "number"; input.min = "500"; input.max = "200000"; input.step = "500";
      input.id = "p-" + m.priceKey;
      input.value = data.prices[m.priceKey];
      lbl.appendChild(input);
      priceGrid.appendChild(lbl);
    });

    var list = $("#availList");
    list.replaceChildren();
    MENU.forEach(function (m) {
      var li = el("li");
      var lab = el("label", "check");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = m.name;
      cb.checked = data.soldOut.indexOf(m.name) === -1;
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(m.name + " "));
      lab.appendChild(el("small", null, rupiah(priceOf(m.cfg))));
      li.appendChild(lab);
      list.appendChild(li);
    });

    promoDraft = data.promos.map(function (p) { return { code: p.code, type: p.type, value: p.value, min: p.min }; });
    renderPromoRows();
    ["msgShop", "msgMenu", "msgPromo", "msgGallery", "msgExport", "msgImport", "msgPin", "msgReset"].forEach(function (id) { setMsg($("#" + id), "", ""); });
  }

  /* tab Toko */
  $("#saveShop").addEventListener("click", function () {
    var msg = $("#msgShop");
    var name = $("#fName").value.trim();
    var wa = normPhone($("#fWa").value);
    var addr = $("#fAddr").value.trim();
    var open = Number($("#fOpen").value), close = Number($("#fClose").value), fee = Number($("#fFee").value);
    if (!name) { setMsg(msg, "Nama toko tidak boleh kosong.", "err"); return; }
    if (!wa) { setMsg(msg, "Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890.", "err"); return; }
    if (!addr) { setMsg(msg, "Alamat tidak boleh kosong.", "err"); return; }
    if (!Number.isInteger(open) || !Number.isInteger(close) || open < 0 || close > 24 || close <= open) {
      setMsg(msg, "Jam tutup harus lebih besar dari jam buka.", "err"); return;
    }
    if (!isFinite(fee) || fee < 0 || fee > 100000) { setMsg(msg, "Ongkos antar harus antara 0 dan 100.000.", "err"); return; }
    data.shop = { name: name.slice(0, 40), wa: wa, address: addr.slice(0, 120), landmark: $("#fLandmark").value.trim().slice(0, 120), open: open, close: close, fee: Math.round(fee) };
    if (persist(msg, "Data toko tersimpan.")) renderAll();
  });

  /* tab Menu dan harga */
  $("#saveMenu").addEventListener("click", function () {
    var msg = $("#msgMenu"), prices = {};
    for (var i = 0; i < PRICE_KEYS.length; i++) {
      var k = PRICE_KEYS[i], v = Number($("#p-" + k).value);
      if (!isFinite(v) || v < 500 || v > 200000) { setMsg(msg, "Periksa harga: isi angka antara 500 dan 200.000.", "err"); return; }
      prices[k] = Math.round(v);
    }
    data.prices = prices;
    data.soldOut = $$("#availList input").filter(function (c) { return !c.checked; }).map(function (c) { return c.value; });
    if (persist(msg, "Harga dan ketersediaan tersimpan.")) { renderAll(); renderAdminAvailPrices(); }
  });
  function renderAdminAvailPrices() {
    $$("#availList li").forEach(function (li, i) { li.querySelector("small").textContent = rupiah(priceOf(MENU[i].cfg)); });
  }

  /* tab Promo */
  var promoDraft = [];
  function renderPromoRows() {
    var box = $("#promoRows");
    box.replaceChildren();
    if (!promoDraft.length) box.appendChild(el("p", "hint", "Belum ada kode promo."));
    promoDraft.forEach(function (r, i) {
      var row = el("div", "prow");
      row.appendChild(labeled("Kode", mkInput("text", r.code, function (v) { r.code = v.toUpperCase(); }, { maxlength: 16, autocapitalize: "characters" })));
      var sel = el("select", "ctl");
      [["persen", "Persen (%)"], ["tetap", "Potongan (Rp)"]].forEach(function (o) {
        var opt = el("option", null, o[1]);
        opt.value = o[0];
        sel.appendChild(opt);
      });
      sel.value = r.type;
      sel.addEventListener("change", function () { r.type = sel.value; });
      row.appendChild(labeled("Jenis", sel));
      row.appendChild(labeled("Nilai", mkInput("number", r.value, function (v) { r.value = v; }, { min: 1, step: 1 })));
      row.appendChild(labeled("Minimal belanja (Rp)", mkInput("number", r.min, function (v) { r.min = v; }, { min: 0, step: 500 })));
      var del = el("button", "btn ghost small", "Hapus");
      del.type = "button";
      del.setAttribute("aria-label", "Hapus kode " + (r.code || "baru"));
      del.addEventListener("click", function () { promoDraft.splice(i, 1); renderPromoRows(); });
      row.appendChild(del);
      box.appendChild(row);
    });
  }
  $("#addPromoRow").addEventListener("click", function () {
    if (promoDraft.length >= 10) { setMsg($("#msgPromo"), "Maksimal 10 kode promo.", "err"); return; }
    promoDraft.push({ code: "", type: "persen", value: 10, min: 0 });
    renderPromoRows();
  });
  $("#savePromo").addEventListener("click", function () {
    var msg = $("#msgPromo"), seen = {}, out = [];
    for (var i = 0; i < promoDraft.length; i++) {
      var r = promoDraft[i], code = String(r.code).trim().toUpperCase(), val = Number(r.value), min = Number(r.min);
      if (!/^[A-Z0-9]{3,16}$/.test(code)) { setMsg(msg, "Kode ke-" + (i + 1) + " harus 3 sampai 16 huruf atau angka, tanpa spasi.", "err"); return; }
      if (seen[code]) { setMsg(msg, "Kode " + code + " muncul dua kali.", "err"); return; }
      if (!isFinite(val) || val < 1 || (r.type === "persen" && val > 100)) { setMsg(msg, "Nilai kode " + code + " tidak valid.", "err"); return; }
      if (!isFinite(min) || min < 0) { setMsg(msg, "Minimal belanja kode " + code + " tidak valid.", "err"); return; }
      seen[code] = true;
      out.push({ code: code, type: r.type === "persen" ? "persen" : "tetap", value: Math.round(val), min: Math.round(min) });
    }
    data.promos = out;
    if (persist(msg, "Kode promo tersimpan.")) { renderAll(); renderAdmin(); setMsg(msg, "Kode promo tersimpan.", "ok"); }
  });

  /* tab Galeri */
  function renderAdminGallery() {
    var ul = $("#adminGallery");
    ul.replaceChildren();
    data.gallery.forEach(function (g, i) {
      var li = el("li", "g-item");
      var thumb = el("div", "g-thumb");
      fillMedia(thumb, g, "ad" + i);
      var cap = mkInput("text", g.caption, function () { /* disimpan saat selesai mengetik */ }, { maxlength: 80, "aria-label": "Keterangan foto " + (i + 1) });
      cap.addEventListener("change", function () {
        g.caption = cap.value.trim().slice(0, 80) || "Foto";
        cap.value = g.caption;
        if (persist($("#msgGallery"), "Keterangan tersimpan.")) renderGallery();
      });
      var acts = el("div", "g-actions");
      function act(label, aria, fn, disabled) {
        var b = el("button", "btn ghost small", label);
        b.type = "button";
        b.disabled = !!disabled;
        b.setAttribute("aria-label", aria);
        b.addEventListener("click", fn);
        acts.appendChild(b);
      }
      function move(d) {
        var j = i + d, t = data.gallery[j];
        data.gallery[j] = data.gallery[i];
        data.gallery[i] = t;
        if (persist($("#msgGallery"), "Urutan tersimpan.")) { renderGallery(); renderAdminGallery(); }
      }
      act("Naik", "Naikkan foto " + (i + 1), function () { move(-1); }, i === 0);
      act("Turun", "Turunkan foto " + (i + 1), function () { move(1); }, i === data.gallery.length - 1);
      act("Hapus", "Hapus foto " + (i + 1), function () {
        data.gallery.splice(i, 1);
        if (persist($("#msgGallery"), "Foto dihapus.")) { renderGallery(); renderAdminGallery(); }
      });
      li.appendChild(thumb);
      li.appendChild(cap);
      li.appendChild(acts);
      ul.appendChild(li);
    });
    if (!data.gallery.length) ul.appendChild(el("li", "hint", "Galeri kosong. Tambahkan foto pertamamu."));
    var kb = Math.round(JSON.stringify(data).length / 1024);
    $("#storageInfo").textContent = "Penyimpanan terpakai sekitar " + kb.toLocaleString("id-ID") + " KB dari batas browser yang biasanya sekitar 5.000 KB.";
  }

  function resizeImage(file, max) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("read")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("decode")); };
        img.onload = function () {
          var k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.naturalWidth * k));
          c.height = Math.max(1, Math.round(img.naturalHeight * k));
          var ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.8));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  $("#fileInput").addEventListener("change", function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = "";
    var msg = $("#msgGallery"), added = 0, problems = [];
    setMsg(msg, "Memproses foto…", "");
    files.reduce(function (chain, file) {
      return chain.then(function () {
        if (!/^image\//.test(file.type)) { problems.push(file.name + " bukan gambar"); return; }
        if (file.size > 15 * 1024 * 1024) { problems.push(file.name + " terlalu besar"); return; }
        if (data.gallery.length >= 30) { problems.push("galeri penuh (maksimal 30 foto)"); return; }
        return resizeImage(file, 900).then(function (src) {
          var name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim().slice(0, 80) || "Foto";
          data.gallery.push({ id: uid(), caption: name, src: src });
          if (saveData()) { added++; }
          else { data.gallery.pop(); problems.push("penyimpanan browser penuh"); }
        }, function () { problems.push(file.name + " tidak bisa dibaca"); });
      });
    }, Promise.resolve()).then(function () {
      renderGallery();
      renderAdminGallery();
      var text = added ? added + " foto ditambahkan." : "";
      if (problems.length) text += (text ? " " : "") + "Tidak berhasil: " + problems.join(", ") + ".";
      setMsg(msg, text || "Tidak ada foto yang ditambahkan.", problems.length ? "err" : "ok");
    });
  });

  /* tab Data */
  function refreshExport() {
    var withPhotos = $("#exportPhotos").checked;
    var out = clone(data);
    if (!withPhotos) out.gallery = out.gallery.filter(function (g) { return typeof g.art === "number" || (g.src && g.src.indexOf("data:") !== 0); });
    $("#exportBox").value = JSON.stringify(out, null, 2);
  }
  $("#exportPhotos").addEventListener("change", refreshExport);
  $("#copyExport").addEventListener("click", function () {
    var msg = $("#msgExport"), box = $("#exportBox");
    box.select();
    try {
      navigator.clipboard.writeText(box.value).then(
        function () { setMsg(msg, "Teks disalin.", "ok"); },
        function () { setMsg(msg, "Tidak bisa menyalin otomatis. Teks sudah terpilih, tekan Ctrl+C.", ""); }
      );
    } catch (e) { setMsg(msg, "Tidak bisa menyalin otomatis. Teks sudah terpilih, tekan Ctrl+C.", ""); }
  });
  $("#doImport").addEventListener("click", function () {
    var msg = $("#msgImport"), parsed;
    try { parsed = JSON.parse($("#importBox").value); }
    catch (e) { setMsg(msg, "Teks bukan JSON yang valid. Tempel data hasil ekspor apa adanya.", "err"); return; }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) { setMsg(msg, "Format data tidak dikenali.", "err"); return; }
    var previous = data;
    data = sanitizeData(parsed);
    if (!saveData()) { data = previous; setMsg(msg, "Penyimpanan browser penuh. Data tidak diterapkan.", "err"); return; }
    renderAll();
    renderAdmin();
    refreshExport();
    $("#importBox").value = "";
    setMsg($("#msgImport"), "Data diterapkan.", "ok");
  });
  $("#savePin").addEventListener("click", function () {
    var msg = $("#msgPin"), a = $("#newPin").value, b = $("#newPin2").value;
    if (!/^\d{4,8}$/.test(a)) { setMsg(msg, "PIN harus 4 sampai 8 angka.", "err"); return; }
    if (a !== b) { setMsg(msg, "Kedua PIN tidak sama.", "err"); return; }
    try { localStorage.setItem(PIN_KEY, a); } catch (e) { setMsg(msg, "PIN tidak bisa disimpan di browser ini.", "err"); return; }
    $("#newPin").value = ""; $("#newPin2").value = "";
    setMsg(msg, "PIN diganti.", "ok");
  });
  var resetTimer = null;
  $("#resetAll").addEventListener("click", function () {
    var btn = this, msg = $("#msgReset");
    if (!btn.dataset.armed) {
      btn.dataset.armed = "1";
      btn.textContent = "Klik sekali lagi untuk memastikan";
      resetTimer = setTimeout(function () { delete btn.dataset.armed; btn.textContent = "Kembalikan pengaturan awal"; }, 4000);
      return;
    }
    clearTimeout(resetTimer);
    delete btn.dataset.armed;
    btn.textContent = "Kembalikan pengaturan awal";
    try { localStorage.removeItem(DATA_KEY); } catch (e) { /* abaikan */ }
    data = sanitizeData(null);
    renderAll();
    renderAdmin();
    refreshExport();
    setMsg(msg, "Pengaturan dikembalikan ke awal.", "ok");
  });

  /* ---------- Perpindahan halaman (situs / admin) ---------- */
  var wasAdmin = false;
  function route() {
    var isAdmin = location.hash === "#admin";
    document.body.classList.toggle("admin-mode", isAdmin);
    if (isAdmin) {
      showAdmin();
      window.scrollTo(0, 0);
    } else if (wasAdmin) {
      var target = document.getElementById(location.hash.slice(1));
      requestAnimationFrame(function () { if (target) target.scrollIntoView(); else window.scrollTo(0, 0); });
    }
    wasAdmin = isAdmin;
  }
  window.addEventListener("hashchange", route);

  /* ---------- Mulai ---------- */
  data = loadData();
  renderAll();
  route();
  setTimeout(pour, 300);   // teko menuang saat halaman dibuka
  setInterval(updateStatus, 60000);
})();
