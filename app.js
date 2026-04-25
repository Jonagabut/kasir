// ===== UTILS & DB =====
const DB_KEY_PROD = 'kw_v2_products';
const DB_KEY_TRX  = 'kw_v2_transactions';

const DB = {
    get: (key, defaultVal) => {
        try { return JSON.parse(localStorage.getItem(key)) || defaultVal; }
        catch (e) { return defaultVal; }
    },
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

let products     = DB.get(DB_KEY_PROD, []);
let transactions = DB.get(DB_KEY_TRX,  []);
let cart         = [];

const $         = sel => document.querySelector(sel);
const $$        = sel => document.querySelectorAll(sel);
const formatRp  = num => 'Rp ' + Number(num).toLocaleString('id-ID');
const genId     = () => Math.random().toString(36).substr(2, 9).toUpperCase();
const getISODate = () => new Date().toISOString();
const getTodayStr = () => new Date().toISOString().split('T')[0];

const toast = (msg, type = 'success') => {
    const cont = $('#toast-container');
    if (!cont) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    cont.appendChild(el);
    setTimeout(() => {
        el.style.opacity    = '0';
        el.style.transform  = 'translateX(100%)';
        el.style.transition = '0.3s';
        setTimeout(() => el.remove(), 300);
    }, 3000);
};

// ===== CATEGORY ICONS =====
const catIcons = {
    'Ice Cream'  : '🍦',
    'Es Stick'   : '🍡',
    'Es Krim Bar': '🍫',
    'Es Pop'     : '🧊',
    'Cone'       : '🍧',
    'Minuman'    : '🥤',
    'Snack'      : '🍪',
    'Lainnya'    : '📦'
};
const getIcon = cat => catIcons[cat] || '🍦';

// ===== AICE PRODUCT DATA =====
// Selalu reset produk ke katalog AICE resmi
function initData() {
    products = [
        // --- ICE CREAM CUP ---
        { id: genId(), name: 'AICE Mochi Vanilla',           price: 5000, cost: 3500, stock: 50, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Mochi Strawberry',        price: 5000, cost: 3500, stock: 50, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Mochi Taro',              price: 5000, cost: 3500, stock: 40, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Mochi Pandan',            price: 5000, cost: 3500, stock: 40, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Mochi Choco',             price: 5000, cost: 3500, stock: 35, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Big Mochi Matcha',        price: 8000, cost: 6000, stock: 30, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Big Mochi Red Bean',      price: 8000, cost: 6000, stock: 30, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Ice Cream Cup Vanilla',   price: 5000, cost: 3800, stock: 40, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Ice Cream Cup Chocolate', price: 5000, cost: 3800, stock: 40, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Ice Cream Cup Strawberry',price: 5000, cost: 3800, stock: 35, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Milk Cup Original',       price: 6000, cost: 4500, stock: 30, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Avocado Ice Cream',       price: 6000, cost: 4500, stock: 25, category: 'Ice Cream' },
        { id: genId(), name: 'AICE Durian Ice Cream',        price: 7000, cost: 5000, stock: 20, category: 'Ice Cream' },

        // --- ES STICK ---
        { id: genId(), name: 'AICE Popsicle Orange',         price: 3000, cost: 2000, stock: 60, category: 'Es Stick' },
        { id: genId(), name: 'AICE Popsicle Strawberry',     price: 3000, cost: 2000, stock: 60, category: 'Es Stick' },
        { id: genId(), name: 'AICE Popsicle Grape',          price: 3000, cost: 2000, stock: 50, category: 'Es Stick' },
        { id: genId(), name: 'AICE Popsicle Watermelon',     price: 3000, cost: 2000, stock: 50, category: 'Es Stick' },
        { id: genId(), name: 'AICE Popsicle Lychee',         price: 3000, cost: 2000, stock: 45, category: 'Es Stick' },
        { id: genId(), name: 'AICE Popsicle Melon',          price: 3000, cost: 2000, stock: 45, category: 'Es Stick' },
        { id: genId(), name: 'AICE Coconut Stick',           price: 4000, cost: 2800, stock: 40, category: 'Es Stick' },
        { id: genId(), name: 'AICE Coco Pandan Stick',       price: 4000, cost: 2800, stock: 35, category: 'Es Stick' },
        { id: genId(), name: 'AICE Milk Tea Stick',          price: 5000, cost: 3500, stock: 30, category: 'Es Stick' },

        // --- ES KRIM BAR ---
        { id: genId(), name: 'AICE Choco Bar Classic',       price: 7000, cost: 5000, stock: 35, category: 'Es Krim Bar' },
        { id: genId(), name: 'AICE Choco Bar Almond',        price: 8000, cost: 6000, stock: 25, category: 'Es Krim Bar' },
        { id: genId(), name: 'AICE Choco Bar Cookies',       price: 8000, cost: 6000, stock: 25, category: 'Es Krim Bar' },
        { id: genId(), name: 'AICE Choco Bar Matcha',        price: 8000, cost: 6000, stock: 20, category: 'Es Krim Bar' },
        { id: genId(), name: 'AICE Choco Crunch Bar',        price: 9000, cost: 7000, stock: 20, category: 'Es Krim Bar' },

        // --- CONE ---
        { id: genId(), name: 'AICE Cone Vanilla',            price: 6000, cost: 4500, stock: 30, category: 'Cone' },
        { id: genId(), name: 'AICE Cone Chocolate',          price: 6000, cost: 4500, stock: 30, category: 'Cone' },
        { id: genId(), name: 'AICE Cone Strawberry',         price: 6000, cost: 4500, stock: 25, category: 'Cone' },
        { id: genId(), name: 'AICE Big Cone Matcha',         price: 9000, cost: 7000, stock: 20, category: 'Cone' },
        { id: genId(), name: 'AICE Big Cone Choco',          price: 9000, cost: 7000, stock: 20, category: 'Cone' },

        // --- ES POP ---
        { id: genId(), name: 'AICE Pop Ice Mangga',          price: 3000, cost: 2000, stock: 60, category: 'Es Pop' },
        { id: genId(), name: 'AICE Pop Ice Jeruk',           price: 3000, cost: 2000, stock: 60, category: 'Es Pop' },
        { id: genId(), name: 'AICE Pop Ice Cocopandan',      price: 3000, cost: 2000, stock: 55, category: 'Es Pop' },
        { id: genId(), name: 'AICE Pop Ice Sirsak',          price: 3000, cost: 2000, stock: 50, category: 'Es Pop' },
        { id: genId(), name: 'AICE Pop Ice Nanas',           price: 3000, cost: 2000, stock: 45, category: 'Es Pop' },
    ];
    DB.set(DB_KEY_PROD, products);
}

// ===== CLOCK =====
function startClock() {
    const tick = () => {
        const now  = new Date();
        const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const cd = $('#clock-desktop'), cm = $('#clock-mobile'), dd = $('#date-desktop');
        if (cd) cd.textContent = time;
        if (cm) cm.textContent = time;
        if (dd) dd.textContent = date;
    };
    tick();
    setInterval(tick, 1000);
}

// ===== NAVIGATION =====
function setupNavigation() {
    const switchPage = (pageId) => {
        $$('.page').forEach(p => p.classList.remove('active'));
        $$('.nav-btn, .tab-btn').forEach(btn => btn.classList.remove('active'));
        const targetPage = $(`#page-${pageId}`);
        if (targetPage) targetPage.classList.add('active');
        $$(`[data-page="${pageId}"]`).forEach(btn => btn.classList.add('active'));
        if (pageId === 'kasir')     renderKasir();
        if (pageId === 'produk')    renderManageProducts();
        if (pageId === 'riwayat')   renderHistory();
        if (pageId === 'dashboard') renderDashboard();
    };
    $$('.nav-btn, .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });
}

// ==========================================
// KASIR MODULE
// ==========================================
let activeCategory   = '';
let searchKasirQuery = '';

function renderKasirCategories() {
    const cont = $('#category-chips');
    if (!cont) return;
    const cats = [...new Set(products.map(p => p.category))].filter(Boolean).sort();
    let html = `<button class="cat-chip ${activeCategory === '' ? 'active' : ''}" data-cat="">Semua</button>`;
    cats.forEach(c => {
        html += `<button class="cat-chip ${activeCategory === c ? 'active' : ''}" data-cat="${c}">${getIcon(c)} ${c}</button>`;
    });
    cont.innerHTML = html;
    cont.querySelectorAll('.cat-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategory = btn.dataset.cat;
            renderKasirCategories();
            renderKasirGrid();
        });
    });
}

function renderKasirGrid() {
    const grid  = $('#product-grid');
    const empty = $('#empty-products-msg');
    if (!grid || !empty) return;

    const filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchKasirQuery.toLowerCase());
        const matchCat    = activeCategory === '' || p.category === activeCategory;
        return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
        grid.style.display  = 'none';
        empty.style.display = 'block';
    } else {
        grid.style.display  = 'grid';
        empty.style.display = 'none';
        grid.innerHTML = filtered.map(p => {
            const isOut = p.stock <= 0;
            const isLow = p.stock > 0 && p.stock <= 5;
            return `
                <div class="p-card ${isOut ? 'out' : ''}" data-id="${p.id}">
                    <div class="p-emoji">${getIcon(p.category)}</div>
                    <div class="p-name">${p.name}</div>
                    <div class="p-price">${formatRp(p.price)}</div>
                    <div class="p-stock ${isLow ? 'danger' : ''}">${isOut ? 'Habis' : 'Sisa: ' + p.stock}</div>
                </div>`;
        }).join('');

        grid.querySelectorAll('.p-card:not(.out)').forEach(card => {
            card.addEventListener('click', () => {
                addToCart(card.dataset.id);
                const anim = document.createElement('div');
                anim.className   = 'anim-add';
                anim.textContent = '+1';
                card.appendChild(anim);
                setTimeout(() => anim.remove(), 400);
            });
        });
    }
}

function renderKasir() {
    renderKasirCategories();
    renderKasirGrid();
}

// ==========================================
// CART MODULE
// ==========================================
function addToCart(id) {
    const p = products.find(x => x.id === id);
    if (!p || p.stock <= 0) return;
    const existing = cart.find(c => c.id === id);
    if (existing) {
        if (existing.qty >= p.stock) { toast('Stok tidak mencukupi!', 'error'); return; }
        existing.qty++;
    } else {
        cart.push({ id: p.id, name: p.name, price: p.price, cost: p.cost || 0, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const cCont = $('#cart-items');
    if (!cCont) return;

    if (cart.length === 0) {
        cCont.innerHTML = `
            <div class="empty-state small" id="empty-cart-msg">
                <div class="empty-emoji">🛒</div><p>Keranjang kosong</p>
            </div>`;
    } else {
        cCont.innerHTML = cart.map(c => {
            const sub = c.price * c.qty;
            return `
                <div class="c-item" data-id="${c.id}">
                    <div class="c-info">
                        <div class="c-name">${c.name}</div>
                        <div class="c-price">${formatRp(c.price)}</div>
                    </div>
                    <div class="c-qty-ctrl">
                        <button class="c-qty-btn" data-action="dec" data-id="${c.id}">-</button>
                        <div class="c-qty">${c.qty}</div>
                        <button class="c-qty-btn" data-action="inc" data-id="${c.id}">+</button>
                    </div>
                    <div class="c-sub">${formatRp(sub)}</div>
                    <button class="icon-btn c-del" data-action="del" data-id="${c.id}">🗑️</button>
                </div>`;
        }).join('');

        cCont.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id     = btn.dataset.id;
                const action = btn.dataset.action;
                if (action === 'inc') updateQty(id, 1);
                if (action === 'dec') updateQty(id, -1);
                if (action === 'del') removeFromCart(id);
            });
        });
    }

    const totalItems = cart.reduce((s, c) => s + c.qty, 0);
    const totalPrice = cart.reduce((s, c) => s + c.price * c.qty, 0);

    const cTotalItems = $('#cart-total-items');
    const cTotalPrice = $('#cart-total-price');
    const fcTotal     = $('#fc-total');
    if (cTotalItems) cTotalItems.textContent = totalItems;
    if (cTotalPrice) cTotalPrice.textContent = formatRp(totalPrice);
    if (fcTotal)     fcTotal.textContent     = formatRp(totalPrice);

    ['#badge-cart-mobile', '#badge-cart-desktop', '#badge-cart-float'].forEach(sel => {
        const badge = $(sel);
        if (badge) {
            badge.textContent   = totalItems;
            badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    });

    const floatBtn = $('#floating-cart-btn');
    if (floatBtn) floatBtn.style.display = cart.length > 0 ? 'flex' : 'none';

    generateQuickPay(totalPrice);
    handlePaymentInput();
}

function updateQty(id, delta) {
    const item = cart.find(c => c.id === id);
    const p    = products.find(x => x.id === id);
    if (!item || !p) return;
    if (delta > 0 && item.qty >= p.stock) { toast('Stok maksimal!', 'error'); return; }
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    updateCartUI();
}

// ==========================================
// PAYMENT LOGIC
// ==========================================
function generateQuickPay(total) {
    const qpCont = $('#quick-pay-chips');
    if (!qpCont) return;
    if (total <= 0) { qpCont.innerHTML = ''; return; }

    const bases = [total];
    [1000, 2000, 5000, 10000, 20000, 50000, 100000].forEach(note => {
        const rounded = Math.ceil(total / note) * note;
        if (rounded > total && !bases.includes(rounded)) bases.push(rounded);
    });
    bases.sort((a, b) => a - b);

    qpCont.innerHTML = bases.slice(0, 4).map(val => `
        <button class="qp-btn" data-val="${val}">
            ${val === total ? 'Uang Pas' : formatRp(val)}
        </button>`).join('');

    qpCont.querySelectorAll('.qp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const payInput = $('#payment-amount');
            if (payInput) { payInput.value = btn.dataset.val; handlePaymentInput(); }
        });
    });
}

function handlePaymentInput() {
    const total    = cart.reduce((s, c) => s + (c.price * c.qty), 0);
    const payInput = $('#payment-amount');
    if (!payInput) return;
    const payRaw  = payInput.value;
    const pay     = parseInt(payRaw) || 0;
    const btnPay  = $('#btn-process-pay');
    const cBox    = $('#change-box');
    const cAmount = $('#change-amount');
    if (!btnPay || !cBox || !cAmount) return;

    if (total === 0) { cBox.style.display = 'none'; btnPay.disabled = true; return; }

    if (payRaw !== '') {
        cBox.style.display = 'flex';
        const change = pay - total;
        if (change < 0) {
            cBox.classList.add('error');
            cAmount.textContent = 'Kurang ' + formatRp(Math.abs(change));
            btnPay.disabled = true;
        } else {
            cBox.classList.remove('error');
            cAmount.textContent = formatRp(change);
            btnPay.disabled = false;
        }
    } else {
        cBox.style.display = 'none';
        btnPay.disabled = true;
    }
}

// ==========================================
// MOBILE CART DRAWER
// ==========================================
const openCartDrawer = () => {
    const overlay = $('#cart-overlay'), panel = $('#cart-panel');
    if (overlay) overlay.classList.add('show');
    if (panel)   panel.classList.add('open');
};
const closeCartDrawer = () => {
    const panel = $('#cart-panel'), overlay = $('#cart-overlay');
    if (panel) panel.classList.remove('open');
    setTimeout(() => { if (overlay) overlay.classList.remove('show'); }, 300);
};

// ==========================================
// CETAK STRUK (FITUR BARU)
// ==========================================
function printReceipt(trx) {
    const d       = new Date(trx.date);
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const itemRows = trx.items.map(i => `
        <tr>
            <td>${i.name}</td>
            <td style="text-align:center">${i.qty}</td>
            <td style="text-align:right">${formatRp(i.price * i.qty)}</td>
        </tr>`).join('');

    const win = window.open('', '_blank', 'width=340,height=620');
    win.document.write(`<!DOCTYPE html><html><head>
        <meta charset="UTF-8"><title>Struk ${trx.id}</title>
        <style>
            body  { font-family: monospace; font-size:12px; padding:16px; max-width:300px; margin:0 auto; }
            h2    { text-align:center; font-size:16px; margin:0 0 4px; }
            p     { text-align:center; margin:2px 0; color:#555; }
            hr    { border:none; border-top:1px dashed #aaa; margin:10px 0; }
            table { width:100%; border-collapse:collapse; }
            th    { text-align:left; border-bottom:1px solid #ccc; padding:4px 0; font-size:11px; }
            td    { padding:3px 0; vertical-align:top; }
            .total-row td { font-weight:bold; font-size:13px; border-top:1px dashed #aaa; padding-top:6px; }
            .footer { text-align:center; margin-top:12px; font-size:11px; color:#888; }
        </style></head><body>
        <h2>🍦 Kasir AICE</h2>
        <p>Struk Pembelian</p>
        <p style="font-size:10px">${dateStr}</p>
        <p style="font-size:10px">No: ${trx.id}</p>
        <hr>
        <table>
            <thead><tr><th>Produk</th><th style="text-align:center">Qty</th><th style="text-align:right">Subtotal</th></tr></thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
                <tr class="total-row"><td colspan="2">TOTAL</td><td style="text-align:right">${formatRp(trx.total)}</td></tr>
                <tr><td colspan="2">Bayar</td><td style="text-align:right">${formatRp(trx.pay)}</td></tr>
                <tr><td colspan="2">Kembalian</td><td style="text-align:right">${formatRp(trx.change)}</td></tr>
            </tfoot>
        </table>
        <div class="footer">Terima kasih sudah berbelanja! 🙏<br>— AICE —</div>
        <script>window.onload = () => window.print();<\/script>
    </body></html>`);
    win.document.close();
}

// ==========================================
// MANAGE PRODUCTS MODULE
// ==========================================
function renderManageProducts() {
    const list  = $('#manage-product-list');
    const empty = $('#manage-empty-msg');
    if (!list || !empty) return;

    const searchEl = $('#search-manage-product');
    const query    = searchEl ? searchEl.value.toLowerCase() : '';
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));

    const totalProds = $('#manage-total-products');
    const totalStock = $('#manage-total-stock');
    if (totalProds) totalProds.textContent = products.length;
    if (totalStock) totalStock.textContent = products.reduce((s, p) => s + parseInt(p.stock || 0), 0);

    if (filtered.length === 0) {
        list.style.display  = 'none';
        empty.style.display = 'block';
    } else {
        list.style.display  = 'flex';
        empty.style.display = 'none';
        list.innerHTML = filtered.map(p => `
            <div class="list-card">
                <div class="lc-icon">${getIcon(p.category)}</div>
                <div class="lc-info">
                    <div class="lc-title">${p.name}</div>
                    <div class="lc-meta">
                        <span>🏷️ ${p.category || 'Tanpa Kategori'}</span>
                        <span>📦 Stok: <b style="color:${p.stock <= 5 ? 'var(--danger)' : 'inherit'}">${p.stock}</b></span>
                        ${p.cost ? `<span>💰 Modal: ${formatRp(p.cost)}</span>` : ''}
                    </div>
                </div>
                <div class="lc-price">
                    <small>Harga Jual</small>
                    <b>${formatRp(p.price)}</b>
                </div>
                <div class="lc-actions">
                    <button class="btn btn-ghost btn-sm" data-action="restock" data-id="${p.id}">➕ Stok</button>
                    <button class="btn btn-ghost btn-sm" data-action="edit"    data-id="${p.id}">✏️ Edit</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger);border-color:var(--danger)" data-action="delete" data-id="${p.id}">🗑️</button>
                </div>
            </div>`).join('');

        list.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (btn.dataset.action === 'edit')    editProduct(id);
                if (btn.dataset.action === 'delete')  deleteProduct(id);
                if (btn.dataset.action === 'restock') restockProduct(id);
            });
        });
    }
}

// --- TAMBAH STOK CEPAT (FITUR BARU) ---
function restockProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const jumlah = prompt(`Tambah stok untuk:\n"${p.name}"\n\nStok saat ini: ${p.stock}\nMasukkan jumlah yang ditambah:`);
    if (jumlah === null) return;
    const n = parseInt(jumlah);
    if (isNaN(n) || n <= 0) { toast('Jumlah tidak valid!', 'error'); return; }
    p.stock += n;
    DB.set(DB_KEY_PROD, products);
    renderManageProducts();
    toast(`✅ Stok bertambah ${n} → total ${p.stock} pcs`);
}

function editProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const formCard = $('#product-form-card');
    if (!formCard) return;
    $('#form-id').value       = p.id;
    $('#form-name').value     = p.name;
    $('#form-price').value    = p.price;
    $('#form-cost').value     = p.cost || '';
    $('#form-stock').value    = p.stock;
    $('#form-category').value = p.category || '';
    $('#form-title').textContent = 'Edit Produk';
    formCard.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        products = products.filter(x => x.id !== id);
        DB.set(DB_KEY_PROD, products);
        renderManageProducts();
        toast('Produk dihapus', 'error');
    }
}

// ==========================================
// HISTORY MODULE
// ==========================================
function renderHistory() {
    const list  = $('#history-list');
    const empty = $('#history-empty-msg');
    if (!list || !empty) return;

    const filterDateEl = $('#filter-date');
    const filterDate   = filterDateEl ? filterDateEl.value : '';
    let filtered = [...transactions];
    if (filterDate) filtered = filtered.filter(t => t.date.startsWith(filterDate));

    const totalRev  = filtered.reduce((s, t) => s + t.total, 0);
    const totalProf = filtered.reduce((s, t) => s + (t.profit || 0), 0);
    const hCount = $('#history-count'), hRev = $('#history-revenue'), hProf = $('#history-profit');
    if (hCount) hCount.textContent = filtered.length;
    if (hRev)   hRev.textContent   = formatRp(totalRev);
    if (hProf)  hProf.textContent  = formatRp(totalProf);

    if (filtered.length === 0) {
        list.style.display  = 'none';
        empty.style.display = 'block';
    } else {
        list.style.display  = 'flex';
        empty.style.display = 'none';
        list.innerHTML = filtered.map(t => {
            const d       = new Date(t.date);
            const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const itemStrs = t.items.map(i => `${i.name} (x${i.qty})`).join(', ');
            return `
                <div class="list-card">
                    <div class="lc-icon" style="font-size:1.5rem">🧾</div>
                    <div class="lc-info">
                        <div class="lc-title">${t.id}</div>
                        <div class="lc-meta" style="margin-bottom:8px;"><span>🕒 ${dateStr}</span></div>
                        <p style="font-size:0.85rem;color:var(--text-main)">${itemStrs}</p>
                    </div>
                    <div class="lc-price">
                        <small>Total Belanja</small>
                        <b>${formatRp(t.total)}</b>
                        <small style="display:block;margin-top:4px;color:var(--success)">Laba: ${formatRp(t.profit || 0)}</small>
                    </div>
                    <div class="lc-actions">
                        <button class="btn btn-ghost btn-sm" data-action="print" data-id="${t.id}">🖨️ Struk</button>
                    </div>
                </div>`;
        }).join('');

        // Cetak struk dari riwayat (FITUR BARU)
        list.querySelectorAll('[data-action="print"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const trx = transactions.find(t => t.id === btn.dataset.id);
                if (trx) printReceipt(trx);
            });
        });
    }
}

// ==========================================
// DASHBOARD MODULE
// ==========================================
function renderDashboard() {
    const today    = getTodayStr();
    const todayTrx = transactions.filter(t => t.date.startsWith(today));

    const todaySales  = todayTrx.reduce((s, t) => s + t.total, 0);
    const todayProfit = todayTrx.reduce((s, t) => s + (t.profit || 0), 0);

    const dSales = $('#dash-sales'), dProfit = $('#dash-profit'), dTrx = $('#dash-trx');
    const dAsset = $('#dash-asset-value'), dTypes = $('#dash-product-types');
    if (dSales)  dSales.textContent  = formatRp(todaySales);
    if (dProfit) dProfit.textContent = formatRp(todayProfit);
    if (dTrx)    dTrx.textContent    = todayTrx.length;

    const assetVal = products.reduce((s, p) => s + ((p.cost || p.price) * p.stock), 0);
    if (dAsset) dAsset.textContent = formatRp(assetVal);
    if (dTypes) dTypes.textContent = products.length;

    // Stok menipis / habis
    const lowStock = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);
    const lowCont  = $('#dash-low-stock');
    if (lowCont) {
        lowCont.innerHTML = lowStock.length > 0
            ? lowStock.slice(0, 5).map(p => `
                <div class="list-item">
                    <span>${getIcon(p.category)} ${p.name}</span>
                    <b style="color:${p.stock === 0 ? 'var(--danger)' : 'orange'}">${p.stock === 0 ? 'HABIS ⚠️' : 'Sisa ' + p.stock}</b>
                </div>`).join('')
            : `<div class="list-item" style="justify-content:center"><span>Semua stok aman 👍</span></div>`;
    }

    // Top produk terlaris (semua waktu)
    const salesCount = {};
    transactions.forEach(t => t.items.forEach(i => {
        salesCount[i.name] = (salesCount[i.name] || 0) + i.qty;
    }));
    const top     = Object.entries(salesCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCont = $('#dash-top-products');
    if (topCont) {
        topCont.innerHTML = top.length > 0
            ? top.map(([name, qty], idx) => `
                <div class="list-item">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <b style="color:var(--primary)">#${idx + 1}</b>
                        <span style="color:var(--text-main)">${name}</span>
                    </div>
                    <b>${qty} terjual</b>
                </div>`).join('')
            : `<div class="list-item" style="justify-content:center"><span>Belum ada penjualan</span></div>`;
    }

    // Ringkasan shift hari ini (FITUR BARU)
    renderShiftSummary(todayTrx);
}

function renderShiftSummary(todayTrx) {
    const shiftCont = $('#dash-shift-summary');
    if (!shiftCont) return;

    if (todayTrx.length === 0) {
        shiftCont.innerHTML = `<div class="list-item" style="justify-content:center"><span>Belum ada transaksi hari ini</span></div>`;
        return;
    }

    const todayCount = {};
    todayTrx.forEach(t => t.items.forEach(i => {
        todayCount[i.name] = (todayCount[i.name] || 0) + i.qty;
    }));
    const topToday  = Object.entries(todayCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const totalItem = todayTrx.reduce((s, t) => t.items.reduce((ss, i) => ss + i.qty, s), 0);
    const avgTrx    = Math.round(todayTrx.reduce((s, t) => s + t.total, 0) / todayTrx.length);

    shiftCont.innerHTML = `
        <div class="list-item"><span>Total item terjual</span><b>${totalItem} pcs</b></div>
        <div class="list-item"><span>Rata-rata per transaksi</span><b>${formatRp(avgTrx)}</b></div>
        ${topToday.map(([name, qty]) => `
            <div class="list-item">
                <span>🏅 ${name}</span>
                <b style="color:var(--success)">${qty}x</b>
            </div>`).join('')}`;
}

// ==========================================
// BOOTSTRAP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // Inject card Ringkasan Shift ke kolom pertama dashboard
    const dashCols = document.querySelectorAll('.dashboard-col');
    if (dashCols && dashCols.length > 0) {
        const shiftCard = document.createElement('div');
        shiftCard.innerHTML = `
            <h3 class="section-title">📋 Ringkasan Shift Hari Ini</h3>
            <div class="card mb-3">
                <div class="list-group" id="dash-shift-summary"></div>
            </div>`;
        dashCols[0].appendChild(shiftCard);
    }

    // --- Search Kasir ---
    const searchProdEl = $('#search-product');
    if (searchProdEl) {
        searchProdEl.addEventListener('input', (e) => {
            searchKasirQuery = e.target.value;
            const clearBtn = $('#clear-search');
            if (clearBtn) clearBtn.style.display = searchKasirQuery ? 'block' : 'none';
            renderKasirGrid();
        });
    }
    const clearSearchBtn = $('#clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            const sp = $('#search-product');
            if (sp) sp.value = '';
            searchKasirQuery = '';
            clearSearchBtn.style.display = 'none';
            renderKasirGrid();
        });
    }

    // --- Cart Clear ---
    const btnClearCart = $('#btn-clear-cart');
    if (btnClearCart) {
        btnClearCart.addEventListener('click', () => {
            if (cart.length === 0) return;
            if (confirm('Kosongkan keranjang?')) {
                cart = [];
                const payInput = $('#payment-amount');
                if (payInput) payInput.value = '';
                updateCartUI();
            }
        });
    }

    // --- Mobile Cart Drawer ---
    const floatBtn = $('#floating-cart-btn');
    if (floatBtn) floatBtn.addEventListener('click', openCartDrawer);
    const closeCartBtn = $('#btn-close-cart');
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
    const cartOverlay = $('#cart-overlay');
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

    // --- Payment Input ---
    const paymentInput = $('#payment-amount');
    if (paymentInput) paymentInput.addEventListener('input', handlePaymentInput);

    // --- Process Payment ---
    const btnPay = $('#btn-process-pay');
    if (btnPay) {
        btnPay.addEventListener('click', () => {
            const total  = cart.reduce((s, c) => s + (c.price * c.qty), 0);
            const payEl  = $('#payment-amount');
            const pay    = parseInt(payEl ? payEl.value : 0) || 0;
            const change = pay - total;
            if (pay < total || cart.length === 0) return;

            // Kurangi stok
            cart.forEach(c => {
                const p = products.find(x => x.id === c.id);
                if (p) p.stock = Math.max(0, p.stock - c.qty);
            });
            DB.set(DB_KEY_PROD, products);

            // Simpan transaksi
            const profit = cart.reduce((s, c) => s + ((c.price - (c.cost || 0)) * c.qty), 0);
            const trx = {
                id: 'TRX-' + genId(),
                date: getISODate(),
                total, pay, change, profit,
                items: [...cart]
            };
            transactions.unshift(trx);
            DB.set(DB_KEY_TRX, transactions);

            // Tampilkan overlay sukses
            const sTotal = $('#succ-total'), sPay = $('#succ-pay'), sChange = $('#succ-change');
            const overlay = $('#success-overlay');
            if (sTotal)  sTotal.textContent  = formatRp(total);
            if (sPay)    sPay.textContent    = formatRp(pay);
            if (sChange) sChange.textContent = formatRp(change);
            if (overlay) {
                overlay.classList.add('show');
                overlay.dataset.lastTrxId = trx.id; // simpan id untuk cetak struk
            }

            // Reset
            cart = [];
            if (payEl) payEl.value = '';
            updateCartUI();
            renderKasirGrid();
            if (window.innerWidth <= 768) closeCartDrawer();
        });
    }

    // --- Tutup overlay sukses ---
    const btnCloseSuccess = $('#btn-close-success');
    if (btnCloseSuccess) {
        btnCloseSuccess.addEventListener('click', () => {
            const overlay = $('#success-overlay');
            if (overlay) overlay.classList.remove('show');
        });
    }

    // --- Tombol Cetak Struk di overlay sukses (FITUR BARU) ---
    const successOverlay = $('#success-overlay');
    if (successOverlay) {
        const successCard = successOverlay.querySelector('.success-card');
        if (successCard) {
            const printBtn = document.createElement('button');
            printBtn.id          = 'btn-print-receipt';
            printBtn.className   = 'btn btn-ghost btn-block';
            printBtn.style.marginTop = '8px';
            printBtn.textContent = '🖨️ Cetak Struk';
            // Sisipkan sebelum tombol OK
            const btnOK = successCard.querySelector('#btn-close-success');
            if (btnOK) successCard.insertBefore(printBtn, btnOK);
            else successCard.appendChild(printBtn);

            printBtn.addEventListener('click', () => {
                const lastId = successOverlay.dataset.lastTrxId;
                const trx    = transactions.find(t => t.id === lastId);
                if (trx) printReceipt(trx);
            });
        }
    }

    // --- Manage Product Form ---
    const formCard    = $('#product-form-card');
    const btnShowForm = $('#btn-show-form');
    if (btnShowForm) {
        btnShowForm.addEventListener('click', () => {
            if (!formCard) return;
            const form = $('#product-form');
            if (form) form.reset();
            const fId = $('#form-id'), fTitle = $('#form-title');
            if (fId)    fId.value = '';
            if (fTitle) fTitle.textContent = 'Tambah Produk Baru';
            formCard.style.display = 'block';
            const fName = $('#form-name');
            if (fName) fName.focus();
        });
    }

    const hideForm = () => { if (formCard) formCard.style.display = 'none'; };
    const btnCloseForm  = $('#btn-close-form');
    const btnCancelForm = $('#btn-cancel-form');
    if (btnCloseForm)  btnCloseForm.addEventListener('click', hideForm);
    if (btnCancelForm) btnCancelForm.addEventListener('click', hideForm);

    // --- Form Submit ---
    const productForm = $('#product-form');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id       = $('#form-id').value;
            const name     = $('#form-name').value.trim();
            const price    = parseInt($('#form-price').value) || 0;
            const cost     = parseInt($('#form-cost').value)  || 0;
            const stock    = parseInt($('#form-stock').value) || 0;
            const category = $('#form-category').value;
            if (!name || price <= 0) { toast('Nama dan harga wajib diisi!', 'error'); return; }
            if (id) {
                const p = products.find(x => x.id === id);
                if (p) { p.name = name; p.price = price; p.cost = cost; p.stock = stock; p.category = category; }
                toast('Produk berhasil diperbarui');
            } else {
                products.push({ id: genId(), name, price, cost, stock, category });
                toast('Produk baru ditambahkan');
            }
            DB.set(DB_KEY_PROD, products);
            hideForm();
            renderManageProducts();
        });
    }

    // --- Search Manage Product ---
    const searchManage = $('#search-manage-product');
    if (searchManage) searchManage.addEventListener('input', renderManageProducts);

    // --- History Filters ---
    const filterDate = $('#filter-date');
    if (filterDate) filterDate.addEventListener('change', renderHistory);
    const btnClearFilter = $('#btn-clear-filter');
    if (btnClearFilter) {
        btnClearFilter.addEventListener('click', () => {
            const fd = $('#filter-date');
            if (fd) fd.value = '';
            renderHistory();
        });
    }

    const btnClearHistory = $('#btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            if (transactions.length === 0) return;
            if (confirm('Peringatan: Semua riwayat transaksi akan dihapus permanen. Lanjutkan?')) {
                transactions = [];
                DB.set(DB_KEY_TRX, transactions);
                renderHistory();
                toast('Riwayat berhasil dihapus', 'error');
            }
        });
    }

    // --- Backup & Restore ---
    const btnExport = $('#btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const data = JSON.stringify({ products, transactions }, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `Backup_KasirAICE_${getTodayStr()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Data berhasil diexport');
        });
    }

    const btnImport = $('#btn-import');
    if (btnImport) {
        btnImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!confirm('Peringatan: Import akan menimpa semua data saat ini. Lanjutkan?')) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.products)     products     = data.products;
                    if (data.transactions) transactions = data.transactions;
                    DB.set(DB_KEY_PROD, products);
                    DB.set(DB_KEY_TRX, transactions);
                    toast('Data berhasil dipulihkan!');
                    renderDashboard();
                    renderManageProducts();
                } catch (err) {
                    toast('Format file tidak valid!', 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    // ===== INIT =====
    initData();       // reset & isi produk AICE
    startClock();
    setupNavigation();
    updateCartUI();
    renderKasir();
});
