/**
 * APLIKASI KASIR WARUNG DENOK v3.0
 * Fitur: Hybrid Cloud Sync (LocalStorage + Supabase)
 */

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://lvyspldnoqqkeirshkzd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eXNwbGRub3Fxa2VpcnNoa3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjkyODgsImV4cCI6MjA5MjYwNTI4OH0.cZKIGNPXk1CPU6eKLq6H5anxG3jEPcOwSt7cnZaceGA';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL.includes('supabase.co')) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ===== STATE & CONSTANTS =====
const DB_KEY_PROD = 'kw_v3_products';
const DB_KEY_TRX  = 'kw_v3_transactions';

let products     = JSON.parse(localStorage.getItem(DB_KEY_PROD)) || [];
let transactions = JSON.parse(localStorage.getItem(DB_KEY_TRX))  || [];
let cart         = [];
let currentCategory = 'Semua';
let currentPayMethod = 'tunai';

// ===== SELECTOR HELPER =====
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ===== UTILS =====
const genId = () => Math.random().toString(36).substr(2, 9).toUpperCase();
const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

// ===== DATABASE LAYER (LocalStorage + Cloud) =====
const DB = {
    set: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // Cloud Sync: Download data from Supabase
    syncDown: async () => {
        if (!supabaseClient) return false;
        try {
            console.log("Memulai sinkronisasi cloud...");
            // Pull Products
            const { data: cloudProds, error: pErr } = await supabaseClient.from('kw_products').select('*');
            if (pErr) {
                console.warn("Gagal ambil produk dari cloud (401?), menggunakan data lokal.");
            } else if (cloudProds) {
                products = cloudProds;
                DB.set(DB_KEY_PROD, products);
            }

            // Pull Transactions
            const { data: cloudTrx, error: tErr } = await supabaseClient.from('kw_transactions').select('*').order('created_at', { ascending: false }).limit(50);
            if (!tErr && cloudTrx) {
                transactions = cloudTrx;
                DB.set(DB_KEY_TRX, transactions);
            }
            
            renderKasir(); // Paksa render ulang setelah dapat data
            renderManageProducts();
            return true;
        } catch (e) { 
            console.error("Critical Sync Error:", e); 
            return false; 
        }
    },

    // Cloud Sync: Upload single product
    pushProduct: async (p) => {
        if (!supabaseClient) return;
        try {
            await supabaseClient.from('kw_products').upsert({
                id: p.id,
                name: p.name,
                price: p.price,
                cost: p.cost,
                stock: p.stock,
                category: p.category,
                updated_at: new Date()
            });
        } catch (e) { console.error("Sync failed:", e); }
    },

    // Cloud Sync: Delete product
    deleteProduct: async (id) => {
        if (!supabaseClient) return;
        try {
            await supabaseClient.from('kw_products').delete().eq('id', id);
        } catch (e) { console.error("Sync delete failed:", e); }
    },

    // Cloud Sync: Upload transaction
    pushTransaction: async (trx) => {
        if (!supabaseClient) return;
        try {
            const { error } = await supabaseClient.from('kw_transactions').insert({
                id: trx.id,
                total: trx.total,
                profit: trx.profit,
                method: trx.method,
                pay: trx.pay,
                change: trx.change,
                note: trx.note,
                items: trx.items, // JSONB column
                created_at: trx.date
            });
            if (error) throw error;
        } catch (e) { console.error("Trx sync failed:", e); }
    }
};

// ===== UI COMPONENTS =====
function toast(msg, type = 'success') {
    const cont = $('#toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = msg;
    cont.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

async function showModal(opts) {
    const overlay = $('#modal-overlay');
    const inputWrap = $('#modal-input-wrap');
    $('#modal-icon').textContent = opts.icon || '⚠️';
    $('#modal-title').textContent = opts.title || 'Konfirmasi';
    $('#modal-body').textContent = opts.body || '';
    
    inputWrap.style.display = opts.hasInput ? 'block' : 'none';
    if (opts.hasInput) $('#modal-input').placeholder = opts.inputPlaceholder || '0';

    overlay.classList.add('show');

    return new Promise((resolve) => {
        const handleConfirm = () => {
            overlay.classList.remove('show');
            $('#modal-overlay').style.display = 'none'; // Paksa tutup
            cleanup();
            if (opts.hasInput) resolve($('#modal-input').value);
            else resolve(true);
        };
        const handleCancel = () => {
            overlay.classList.remove('show');
            $('#modal-overlay').style.display = 'none'; // Paksa tutup
            cleanup();
            resolve(null);
        };
        const cleanup = () => {
            $('#btn-modal-confirm').removeEventListener('click', handleConfirm);
            $('#btn-modal-cancel').removeEventListener('click', handleCancel);
        };
        $('#btn-modal-confirm').addEventListener('click', handleConfirm);
        $('#btn-modal-cancel').addEventListener('click', handleCancel);
    });
}

// ===== NAVIGATION =====
function setupNavigation() {
    const btns = $$('.nav-btn, .tab-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;
            $$('.page').forEach(p => p.classList.remove('active'));
            $$('.nav-btn, .tab-btn').forEach(b => b.classList.remove('active'));
            
            $(`#page-${pageId}`).classList.add('active');
            $$(`[data-page="${pageId}"]`).forEach(b => b.classList.add('active'));
            
            if (pageId === 'kasir') renderKasir();
            if (pageId === 'produk') renderManageProducts();
            if (pageId === 'riwayat') renderHistory();
            if (pageId === 'dashboard') renderDashboard();
            
            if (window.innerWidth <= 768) closeCartDrawer();
        });
    });
}

// ===== KASIR MODULE =====
function renderKasir() {
    const grid = $('#product-grid');
    const search = $('#search-product').value.toLowerCase();
    
    // Get unique categories
    const categories = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
    const chipCont = $('#category-chips');
    chipCont.innerHTML = categories.map(c => `
        <div class="cat-chip ${currentCategory === c ? 'active' : ''}" onclick="filterCategory('${c}')">${c}</div>
    `).join('');

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search);
        const matchesCat = currentCategory === 'Semua' || p.category === currentCategory;
        return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
        grid.style.display = 'none';
        $('#empty-products-msg').style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    $('#empty-products-msg').style.display = 'none';
    
    grid.innerHTML = filtered.map((p, idx) => {
        const inCart = cart.find(c => c.id === p.id);
        return `
            <div class="p-card ${p.stock <= 0 ? 'out' : ''} ${inCart ? 'in-cart' : ''}" 
                 onclick="addToCart('${p.id}', this)"
                 style="animation: slideUp 0.3s ease forwards ${idx * 0.05}s; opacity: 0;">
                ${inCart ? `<span class="p-qty-badge">${inCart.qty}</span>` : ''}
                <span class="p-emoji">${getIcon(p.category)}</span>
                <div class="p-name">${p.name}</div>
                <div class="p-price">${formatRp(p.price)}</div>
                <div class="p-stock ${p.stock <= 5 ? 'danger' : ''}">Stok: ${p.stock}</div>
            </div>
        `;
    }).join('');
}

function getIcon(cat) {
    const icons = { 
        'Ice Cream': '🍦', 
        'Es Stick': '🍡', 
        'Es Krim Bar': '🍫', 
        'Es Pop': '🧊', 
        'Cone': '🍧', 
        'Minuman': '🥤', 
        'Makanan': '🍜', 
        'Snack': '🍪', 
        'Rokok': '🚬', 
        'Sembako': '🌾',
        'Kebutuhan': '🧴',
        'Lainnya': '📦'
    };
    return icons[cat] || '📦';
}

window.filterCategory = (cat) => {
    currentCategory = cat;
    renderKasir();
};

function addToCart(id, el) {
    const p = products.find(x => x.id === id);
    if (!p || p.stock <= 0) return;

    const existing = cart.find(x => x.id === id);
    if (existing) {
        if (existing.qty >= p.stock) { toast('Stok tidak mencukupi!', 'error'); return; }
        existing.qty++;
    } else {
        cart.push({ ...p, qty: 1 });
    }

    // Animation
    const anim = document.createElement('div');
    anim.className = 'anim-add';
    anim.innerHTML = '+1';
    el.appendChild(anim);
    setTimeout(() => anim.remove(), 400);

    updateCartUI();
    renderKasir();
}

function updateCartUI() {
    const cont = $('#cart-items');
    const totalEl = $('#cart-total-price');
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    
    totalEl.textContent = formatRp(total);
    $('#fc-total').textContent = formatRp(total);

    const badgeCount = cart.reduce((s, i) => s + i.qty, 0);
    const badges = $$('#badge-cart-mobile, #badge-cart-float');
    badges.forEach(b => {
        b.textContent = badgeCount;
        b.style.display = badgeCount > 0 ? 'block' : 'none';
    });
    $('#floating-cart-btn').style.display = badgeCount > 0 ? 'flex' : 'none';

    cont.innerHTML = cart.map(i => `
        <div class="c-item">
            <div class="c-info">
                <div class="c-name">${i.name}</div>
                <div class="c-price">${formatRp(i.price)}</div>
            </div>
            <div class="c-qty-ctrl">
                <button class="c-qty-btn" onclick="updateQty('${i.id}', -1)">-</button>
                <div class="c-qty">${i.qty}</div>
                <button class="c-qty-btn" onclick="updateQty('${i.id}', 1)">+</button>
            </div>
            <div class="c-sub">${formatRp(i.price * i.qty)}</div>
            <button class="icon-btn c-del" onclick="updateQty('${i.id}', -999)">🗑️</button>
        </div>
    `).join('');

    const btnPay = $('#btn-process-pay');
    btnPay.disabled = cart.length === 0;
    
    handlePaymentInput();
}

window.updateQty = (id, delta) => {
    const i = cart.find(x => x.id === id);
    if (!i) return;
    const p = products.find(x => x.id === id);
    
    if (delta === -999) {
        cart = cart.filter(x => x.id !== id);
    } else {
        i.qty += delta;
        if (i.qty > p.stock) { i.qty = p.stock; toast('Stok maksimal!', 'warning'); }
        if (i.qty <= 0) cart = cart.filter(x => x.id !== id);
    }
    updateCartUI();
    renderKasir();
};

function handlePaymentInput() {
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const pay = parseInt($('#payment-amount').value) || 0;
    const box = $('#change-box');
    const changeVal = $('#change-amount');
    
    if (currentPayMethod !== 'tunai' || total === 0) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'flex';
    const change = pay - total;
    if (change >= 0) {
        box.classList.remove('error');
        changeVal.textContent = formatRp(change);
    } else {
        box.classList.add('error');
        changeVal.textContent = 'Kurang ' + formatRp(Math.abs(change));
    }
}

async function processPayment() {
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const profit = cart.reduce((s, i) => s + ((i.price - (i.cost || 0)) * i.qty), 0);
    const pay = parseInt($('#payment-amount').value) || 0;
    const note = $('#trx-note').value.trim();

    if (currentPayMethod === 'tunai' && pay < total) {
        toast('Uang bayar kurang!', 'error');
        return;
    }

    const trx = {
        id: 'TRX-' + genId(),
        date: new Date().toISOString(),
        items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, cost: i.cost })),
        total,
        profit,
        method: currentPayMethod,
        pay: currentPayMethod === 'tunai' ? pay : total,
        change: currentPayMethod === 'tunai' ? (pay - total) : 0,
        note
    };

    // Update stocks
    cart.forEach(ci => {
        const p = products.find(px => px.id === ci.id);
        if (p) {
            p.stock -= ci.qty;
            DB.pushProduct(p); // Background sync
        }
    });

    transactions.unshift(trx);
    DB.set(DB_KEY_PROD, products);
    DB.set(DB_KEY_TRX, transactions);
    DB.pushTransaction(trx); // Background sync

    // Show success
    const overlay = $('#success-overlay');
    $('#succ-method').textContent = trx.method.toUpperCase();
    $('#succ-total').textContent = formatRp(total);
    $('#succ-pay').textContent = formatRp(trx.pay);
    $('#succ-change').textContent = formatRp(trx.change);
    if (note) { $('#succ-note-row').style.display = 'flex'; $('#succ-note').textContent = note; }
    else { $('#succ-note-row').style.display = 'none'; }
    
    overlay.dataset.lastTrxId = trx.id;
    overlay.classList.add('show');

    // Reset
    cart = [];
    $('#payment-amount').value = '';
    $('#trx-note').value = '';
    updateCartUI();
    renderKasir();
}

// ===== MANAGE PRODUCTS MODULE =====
function renderManageProducts() {
    const list = $('#manage-product-list');
    const search = $('#search-manage-product').value.toLowerCase();
    
    const filtered = products.filter(p => p.name.toLowerCase().includes(search));
    
    // Stats
    $('#manage-total-products').textContent = products.length;
    $('#manage-total-stock').textContent = products.reduce((s, p) => s + p.stock, 0);
    $('#manage-asset-value').textContent = formatRp(products.reduce((s, p) => s + ((p.cost || 0) * p.stock), 0));

    if (filtered.length === 0) {
        list.style.display = 'none';
        $('#manage-empty-msg').style.display = 'block';
        return;
    }
    list.style.display = 'flex';
    $('#manage-empty-msg').style.display = 'none';

    list.innerHTML = filtered.map(p => `
        <div class="list-card">
            <div class="lc-icon">${getIcon(p.category)}</div>
            <div class="lc-info">
                <div class="lc-title">${p.name}</div>
                <div class="lc-meta">
                    <span>📦 Stok: ${p.stock}</span>
                    <span>💰 Modal: ${formatRp(p.cost || 0)}</span>
                    <span>🏷️ ${p.category}</span>
                </div>
            </div>
            <div class="lc-price">
                <small>Harga Jual</small>
                <b>${formatRp(p.price)}</b>
            </div>
            <div class="lc-actions">
                <button class="btn btn-ghost btn-sm" onclick="editProduct('${p.id}')">✏️ Edit</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteProduct('${p.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.editProduct = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    $('#form-id').value = p.id;
    $('#form-name').value = p.name;
    $('#form-price').value = p.price;
    $('#form-cost').value = p.cost || '';
    $('#form-stock').value = p.stock;
    $('#form-category').value = p.category || 'Ice Cream';
    $('#form-title').textContent = '✏️ Edit Produk';
    $('#product-form-card').style.display = 'block';
    $('#product-form-card').scrollIntoView({ behavior: 'smooth' });
};

window.deleteProduct = async (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const ok = await showModal({ icon: '🗑️', title: 'Hapus Produk?', body: `Hapus "${p.name}" dari sistem?`, confirmText: 'Ya, Hapus' });
    if (!ok) return;
    products = products.filter(x => x.id !== id);
    DB.set(DB_KEY_PROD, products);
    DB.deleteProduct(id);
    renderManageProducts();
    toast('Produk dihapus', 'warning');
};

// ===== HISTORY MODULE =====
function renderHistory() {
    const list = $('#history-list');
    const dateFilter = $('#filter-date').value;
    const methodFilter = $('#filter-method').value;

    const filtered = transactions.filter(t => {
        const matchesDate = !dateFilter || t.date.startsWith(dateFilter);
        const matchesMethod = !methodFilter || t.method === methodFilter;
        return matchesDate && matchesMethod;
    });

    // Stats
    const totalRev = filtered.reduce((s, t) => s + t.total, 0);
    const totalProf = filtered.reduce((s, t) => s + t.profit, 0);
    $('#history-revenue').textContent = formatRp(totalRev);
    $('#history-profit').textContent = formatRp(totalProf);
    $('#history-count').textContent = filtered.length;

    if (filtered.length === 0) {
        list.style.display = 'none';
        $('#history-empty-msg').style.display = 'block';
        return;
    }
    list.style.display = 'flex';
    $('#history-empty-msg').style.display = 'none';

    list.innerHTML = filtered.map(t => `
        <div class="history-card" onclick="this.classList.toggle('expanded')">
            <div class="history-card-header">
                <div class="lc-icon">🧾</div>
                <div class="lc-info">
                    <div class="lc-title">${new Date(t.date).toLocaleString('id-ID')}</div>
                    <div class="lc-meta">
                        <span class="method-badge ${t.method}">${t.method.toUpperCase()}</span>
                        <span>${t.items.length} item</span>
                        ${t.note ? `<span title="${t.note}">📝 ${t.note}</span>` : ''}
                    </div>
                </div>
                <div class="lc-price">
                    <b>${formatRp(t.total)}</b>
                </div>
                <button class="h-expand-btn">▼</button>
            </div>
            <div class="history-card-body">
                <div class="history-items-detail">
                    ${t.items.map(i => `
                        <div class="h-item-row">
                            <span>${i.name} (${i.qty}x)</span>
                            <span>${formatRp(i.price * i.qty)}</span>
                        </div>
                    `).join('')}
                    <div class="h-item-row" style="border-top:1px dashed var(--border);margin-top:5px">
                        <span>Laba Transaksi</span>
                        <span class="highlight-profit">${formatRp(t.profit)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== DASHBOARD MODULE =====
function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrx = transactions.filter(t => t.date.startsWith(today));
    
    const sales = todayTrx.reduce((s, t) => s + t.total, 0);
    const profit = todayTrx.reduce((s, t) => s + t.profit, 0);
    const count = todayTrx.length;
    const avg = count > 0 ? (sales / count) : 0;

    $('#dash-sales').textContent = formatRp(sales);
    $('#dash-profit').textContent = formatRp(profit);
    $('#dash-trx').textContent = count;
    $('#dash-avg').textContent = formatRp(avg);

    // Low stock
    const lowStock = products.filter(p => p.stock <= 5).sort((a,b) => a.stock - b.stock).slice(0, 5);
    const lowCont = $('#dash-low-stock');
    if (lowStock.length === 0) {
        lowCont.innerHTML = '<div class="list-item" style="justify-content:center"><span>Stok aman terjaga</span></div>';
    } else {
        lowCont.innerHTML = lowStock.map(p => `
            <div class="list-item">
                <span>${p.name}</span>
                <b style="color:${p.stock === 0 ? 'var(--danger)' : 'var(--warning)'}">${p.stock} pcs</b>
            </div>
        `).join('');
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    
    // Clock
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        $$('.clock').forEach(el => el.textContent = timeStr);
        $$('.date').forEach(el => el.textContent = dateStr);
    }, 1000);

    // Cloud Sync Startup
    DB.syncDown().then(success => {
        if (success) {
            toast('Awan tersinkronisasi');
            renderKasir();
            renderManageProducts();
            renderDashboard();
        }
    });

    // Form Events
    $('#product-form').addEventListener('submit', e => {
        e.preventDefault();
        const id = $('#form-id').value;
        const p = {
            id: id || genId(),
            name: $('#form-name').value,
            price: parseInt($('#form-price').value),
            cost: parseInt($('#form-cost').value) || 0,
            stock: parseInt($('#form-stock').value),
            category: $('#form-category').value
        };

        if (id) {
            const idx = products.findIndex(x => x.id === id);
            products[idx] = p;
        } else {
            products.push(p);
        }

        DB.set(DB_KEY_PROD, products);
        DB.pushProduct(p);
        $('#product-form-card').style.display = 'none';
        renderManageProducts();
        renderKasir();
        toast('Data disimpan!');
    });

    // Search Events
    $('#search-product').addEventListener('input', renderKasir);
    $('#search-manage-product').addEventListener('input', renderManageProducts);
    
    // Cart Mobile Toggle
    window.openCartDrawer = () => {
        $('#cart-panel').classList.add('open');
        $('#cart-overlay').classList.add('show');
    };
    window.closeCartDrawer = () => {
        $('#cart-panel').classList.remove('open');
        $('#cart-overlay').classList.remove('show');
    };
    $('#floating-cart-btn').addEventListener('click', openCartDrawer);
    $('#cart-overlay').addEventListener('click', closeCartDrawer);
    $('#btn-close-success').addEventListener('click', () => $('#success-overlay').classList.remove('show'));
    
    // Aktifkan Tombol Tambah Produk
    const btnShowForm = $('#btn-show-form');
    if (btnShowForm) {
        btnShowForm.addEventListener('click', () => {
            $('#product-form').reset();
            $('#form-id').value = '';
            $('#form-title').textContent = '➕ Tambah Produk Baru';
            $('#product-form-card').style.display = 'block';
            $('#form-name').focus();
        });
    }

    // Tombol Batal/Tutup Form
    const hideForm = () => { $('#product-form-card').style.display = 'none'; };
    $('#btn-close-form') && $('#btn-close-form').addEventListener('click', hideForm);
    $('#btn-cancel-form') && $('#btn-cancel-form').addEventListener('click', hideForm);
    
    // Initial renders
    renderKasir();
    renderManageProducts();
    renderDashboard();
});
