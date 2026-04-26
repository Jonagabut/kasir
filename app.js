// ==================== KONFIGURASI ====================
const SUPABASE_URL = 'https://kvoglhqtwtyhmhpqkyqf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2b2dsaHF0d3R5aG1ocHFreXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjY5NTIsImV4cCI6MjA5Mjc0Mjk1Mn0.VY4OMFGahKXd5Q9LpJTQLvJI3DfrYf_rG_CCKxvcOHA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Fungsi utility
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const DEFAULT_CATEGORIES = ['Makanan', 'Minuman', 'Snack', 'Bumbu', 'Perawatan', 'Ice Cream AICE', 'Lainnya'];

// STATE
let state = {
    products: [],
    categories: [],
    cart: [],
    transactions: [],
    currentTransaction: null,
    isConnected: false,
    paymentMethod: 'cash'
};

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Aplikasi dimulai...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Update time
    updateTime();
    setInterval(updateTime, 1000);
    
    // Test connection
    await testConnection();
    
    // Load initial data
    await loadProducts();
    await loadCategories();
});

// ==================== CONNECTION ====================
async function testConnection() {
    return new Promise(async (resolve) => {
        // Set timeout for connection test
        const timeout = setTimeout(() => {
            console.log('⏰ Connection timeout - falling back to offline mode');
            updateConnectionStatus(false);
            resolve();
        }, 5000);
        
        try {
            const { error } = await supabaseClient.from('kw_products').select('count', { count: 'exact', head: true });
            
            clearTimeout(timeout);
            
            if (error) {
                console.error('❌ Connection Error:', error);
                updateConnectionStatus(false);
            } else {
                console.log('✅ Terhubung ke Supabase');
                updateConnectionStatus(true);
            }
        } catch (e) {
            clearTimeout(timeout);
            console.error('❌ Exception:', e);
            updateConnectionStatus(false);
        }
        
        resolve();
    });
}

function updateConnectionStatus(isConnected) {
    state.isConnected = isConnected;
    const statusDot = $('#connection-status');
    const statusText = $('#connection-text');
    
    if (isConnected) {
        statusDot.classList.add('online');
        statusText.textContent = 'Online';
    } else {
        statusDot.classList.remove('online');
        statusText.textContent = 'Offline';
    }
}

// ==================== SETUP EVENT LISTENERS ====================
function setupEventListeners() {
    // Navigation
    $$('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => navigatePage(btn.dataset.page));
    });

    // Kasir page
    $('#search-product').addEventListener('input', renderKasirProducts);
    $('#sort-by').addEventListener('change', renderKasirProducts);
    $('#discount').addEventListener('input', updateCartTotal);
    $('#btn-process-pay').addEventListener('click', openPaymentModal);
    $('#btn-clear-cart').addEventListener('click', clearCart);
    
    // Category chips event delegation
    $('#category-chips').addEventListener('click', (e) => {
        if(e.target.classList.contains('chip')) {
            $$('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            renderKasirProducts();
        }
    });

    // Product page
    $('#product-search').addEventListener('input', renderProductTable);
    $('#product-category-filter').addEventListener('change', renderProductTable);
    $('#product-form').addEventListener('submit', handleProductSubmit);

    // Produk page
    $('#form-price').addEventListener('input', calculateMargin);
    $('#form-cost').addEventListener('input', calculateMargin);

    // Payment modal
    $$('.method-btn').forEach(btn => {
        btn.addEventListener('click', () => selectPaymentMethod(btn.dataset.method));
    });
    
    $('#cash-amount').addEventListener('input', calculateChange);

    // Preset money buttons
    $$('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => selectPresetAmount(btn.dataset.amount));
    });

    // Laporan page
    $('#date-from').addEventListener('change', filterTransactions);
    $('#date-to').addEventListener('change', filterTransactions);
}

// ==================== NAVIGATION ====================
function navigatePage(pageName) {
    console.log('📄 Navigasi ke:', pageName);
    
    // Update active page
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`#page-${pageName}`).classList.add('active');
    
    // Update active nav button
    $$('.nav-item').forEach(b => b.classList.remove('active'));
    $(`.nav-item[data-page="${pageName}"]`).classList.add('active');
    
    // Update page title
    const titles = {
        kasir: 'Kasir',
        produk: 'Manajemen Produk',
        laporan: 'Laporan Transaksi',
        dashboard: 'Dashboard'
    };
    $('#page-title').textContent = titles[pageName];
    
    // Load page-specific data
    if (pageName === 'laporan') {
        loadReports();
    } else if (pageName === 'dashboard') {
        loadDashboard();
    }
}

// ==================== PRODUK ====================
async function loadProducts() {
    try {
        console.log('📥 Loading produk...');
        const { data, error } = await supabaseClient
            .from('kw_products')
            .select('*')
            .order('name');
        
        if (error) {
            console.error('❌ Error:', error);
            return;
        }
        
        state.products = data || [];
        console.log(`✅ ${state.products.length} produk dimuat`);
        
        renderKasirProducts();
        renderProductTable();
    } catch (e) {
        console.error('❌ Exception:', e);
    }
}

function populateCategorySelects(categories) {
    const optionItems = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    const chipItems = categories.map(cat => `<button class="chip" data-category="${cat}">${cat}</button>`).join('');

    // Update chips for Kasir page
    const chipsContainer = $('#category-chips');
    if (chipsContainer) {
        chipsContainer.innerHTML = '<button class="chip active" data-category="">Semua</button>' + chipItems;
    }

    [
        { select: '#product-category-filter', addDefault: true },
        { select: '#form-category', addDefault: false }
    ].forEach(({ select, addDefault }) => {
        const el = $(select);
        if (!el) return;

        const currentValue = el.value;
        el.innerHTML = '';

        if (addDefault) {
            el.innerHTML += '<option value="">Semua Kategori</option>';
        } else {
            el.innerHTML += '<option value="">Pilih Kategori</option>';
        }

        el.innerHTML += optionItems;
        if (currentValue && categories.includes(currentValue)) {
            el.value = currentValue;
        }
    });
}

async function loadCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('kw_products')
            .select('category')
            .not('category', 'is', null);
        
        if (error) throw error;
        
        const fetchedCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
        const categories = [...new Set([...DEFAULT_CATEGORIES, ...fetchedCategories])];
        state.categories = categories;
        populateCategorySelects(categories);
    } catch (e) {
        console.error('❌ Error loading categories:', e);
        state.categories = DEFAULT_CATEGORIES;
        populateCategorySelects(DEFAULT_CATEGORIES);
    }
}

// ==================== KASIR ====================
function renderKasirProducts() {
    const search = $('#search-product').value.toLowerCase();
    const activeChip = document.querySelector('.chip.active');
    const category = activeChip ? activeChip.dataset.category : '';
    const sortBy = $('#sort-by').value;
    
    let filtered = state.products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search);
        const matchCategory = !category || p.category === category;
        return matchSearch && matchCategory;
    });
    
    // Sorting
    switch (sortBy) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'stock':
            filtered.sort((a, b) => b.stock - a.stock);
            break;
        default:
            filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    const grid = $('#product-grid');
    grid.innerHTML = filtered.map(p => `
        <div class="product-card ${p.stock <= 0 ? 'disabled' : ''}" 
             onclick="addToCart('${p.id}')" 
             title="${p.name}">
            <div class="product-emoji">📦</div>
            <div class="product-name">${p.name}</div>
            <div class="product-category">${p.category || 'Umum'}</div>
            <div class="product-price">${formatRp(p.price)}</div>
            <div class="product-stock ${p.stock <= 5 ? 'low' : ''}">
                Stok: ${p.stock}
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    
    if (!product || product.stock <= 0) {
        alert('❌ Produk tidak tersedia!');
        return;
    }
    
    const existingItem = state.cart.find(i => i.id === productId);
    
    if (existingItem) {
        if (existingItem.qty < product.stock) {
            existingItem.qty++;
        } else {
            alert('❌ Stok tidak cukup!');
        }
    } else {
        state.cart.push({
            ...product,
            qty: 1
        });
    }
    
    console.log(`✅ ${product.name} ditambahkan ke keranjang`);
    renderCart();
}

function renderCart() {
    const container = $('#cart-items');
    const countBadge = $('#cart-count');
    
    countBadge.textContent = state.cart.length;
    
    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>Keranjang kosong</p>
            </div>
        `;
    } else {
        container.innerHTML = state.cart.map((item, idx) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatRp(item.price)}</div>
                </div>
                <div class="cart-item-qty">
                    <button onclick="changeQty(${idx}, -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${idx}, 1)">+</button>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${idx})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    updateCartTotal();
}

function changeQty(idx, delta) {
    const item = state.cart[idx];
    const newQty = item.qty + delta;
    
    if (newQty > item.stock) {
        alert('❌ Stok tidak cukup!');
        return;
    }
    
    if (newQty > 0) {
        item.qty = newQty;
    }
    
    renderCart();
}

function removeFromCart(idx) {
    state.cart.splice(idx, 1);
    renderCart();
}

function clearCart() {
    if (confirm('❌ Bersihkan keranjang?')) {
        state.cart = [];
        renderCart();
    }
}

function updateCartTotal() {
    const subtotal = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const discount = parseInt($('#discount').value) || 0;
    const total = Math.max(0, subtotal - discount);
    
    $('#subtotal').textContent = formatRp(subtotal);
    $('#total-price').textContent = formatRp(total);
}

// ==================== PAYMENT ====================
function openPaymentModal() {
    if (state.cart.length === 0) {
        alert('❌ Keranjang masih kosong!');
        return;
    }
    
    const subtotal = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const discount = parseInt($('#discount').value) || 0;
    const total = Math.max(0, subtotal - discount);
    
    $('#pay-subtotal').textContent = formatRp(subtotal);
    $('#pay-discount').textContent = formatRp(discount);
    $('#pay-total').textContent = formatRp(total);
    
    $('#cash-amount').value = '';
    $('#change-info').style.display = 'none';
    
    // Reset preset button states
    const presetBtns = $$('.preset-btn');
    presetBtns.forEach(btn => btn.classList.remove('active'));

    // Re-attach event listeners to preset buttons (in case they weren't attached properly)
    presetBtns.forEach((btn, index) => {
        // Remove existing listeners first to avoid duplicates
        if (btn._presetClickHandler) {
            btn.removeEventListener('click', btn._presetClickHandler);
        }
        // Create new handler
        btn._presetClickHandler = () => {
            selectPresetAmount(btn.dataset.amount);
        };
        btn.addEventListener('click', btn._presetClickHandler);
    });

    $('#payment-modal').classList.add('active');
}

function closePaymentModal() {
    $('#payment-modal').classList.remove('active');
}

function selectPaymentMethod(method) {
    state.paymentMethod = method;
    
    $$('.method-btn').forEach(b => b.classList.remove('active'));
    $(`.method-btn[data-method="${method}"]`).classList.add('active');
}

function calculateChange() {
    const total = parseInt($('#pay-total').textContent.replace(/\D/g, ''));
    const paid = parseInt($('#cash-amount').value) || 0;
    const changeInfo = $('#change-info');
    
    if (paid >= total) {
        changeInfo.style.display = 'block';
        $('#change-amount').textContent = formatRp(paid - total);
    } else {
        changeInfo.style.display = 'none';
    }
    
    // Clear preset button active state when user types manually
    $$('.preset-btn').forEach(btn => btn.classList.remove('active'));
}

function selectPresetAmount(amount) {
    const total = parseInt($('#pay-total').textContent.replace(/\D/g, ''));
    let presetValue;

    if (amount === 'exact') {
        presetValue = total;
    } else {
        presetValue = parseInt(amount);
    }

    $('#cash-amount').value = presetValue;

    // Update button states FIRST
    $$('.preset-btn').forEach(btn => btn.classList.remove('active'));
    $(`.preset-btn[data-amount="${amount}"]`).classList.add('active');

    // Then calculate change
    calculateChange();
}

async function confirmPayment() {
    const total = parseInt($('#pay-total').textContent.replace(/\D/g, ''));
    const paid = parseInt($('#cash-amount').value) || 0;
    
    if (state.paymentMethod === 'cash' && paid < total) {
        alert('❌ Pembayaran tidak cukup!');
        return;
    }
    
    const change = state.paymentMethod === 'cash' ? paid - total : 0;
    
    try {
        // Generate Transaction ID
        const trxId = 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Calculate profit
        let totalProfit = 0;
        state.cart.forEach(item => {
            const profit = (item.price - (item.cost || 0)) * item.qty;
            totalProfit += profit;
        });
        
        const discount = parseInt($('#discount').value) || 0;
        
        const { error: transactionError } = await supabaseClient
            .from('kw_transactions')
            .insert({
                id: trxId,
                total: total,
                pay: paid,
                change: change,
                profit: totalProfit - discount,
                method: state.paymentMethod,
                discount: discount,
                items: state.cart,
                note: ''
            });
        
        if (transactionError) throw transactionError;
        
        // Update stock
        for (let item of state.cart) {
            const { error: updateError } = await supabaseClient
                .from('kw_products')
                .update({ stock: item.stock - item.qty })
                .eq('id', item.id);
            
            if (updateError) throw updateError;
        }
        
        console.log('✅ Transaksi berhasil disimpan:', trxId);
        
        // Show receipt
        showReceipt(trxId, state.cart, total, paid, change);
        
        // Clear cart
        state.cart = [];
        $('#discount').value = '0';
        
        // Reload data
        await loadProducts();
        renderCart();
        
        closePaymentModal();
    } catch (e) {
        console.error('❌ Error:', e);
        alert('❌ Gagal menyimpan transaksi:\n' + e.message);
    }
}

function showReceipt(trxId, items, total, paid, change) {
    const receiptContent = $('#receipt-content');
    const now = new Date().toLocaleString('id-ID');
    
    let itemsHtml = '';
    items.forEach(item => {
        const subtotal = item.price * item.qty;
        itemsHtml += `
            <div class="receipt-line">
                <span>${item.name} x${item.qty}</span>
                <span>${formatRp(subtotal)}</span>
            </div>
        `;
    });
    
    receiptContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>WARUNG DENOK</h3>
            <p style="font-size: 11px; color: var(--text-muted);">Sistem POS</p>
        </div>
        
        <div style="border-bottom: 1px dotted var(--border); padding-bottom: 10px; margin-bottom: 10px; font-size: 12px;">
            <div style="margin-bottom: 5px;">No Transaksi: <strong>${trxId}</strong></div>
            <div>Waktu: ${now}</div>
        </div>
        
        <div style="margin-bottom: 15px;">
            ${itemsHtml}
        </div>
        
        <div class="receipt-line total">
            <span>TOTAL</span>
            <span>${formatRp(total)}</span>
        </div>
        
        <div class="receipt-line" style="border: none; padding: 8px 0;">
            <span>Bayar</span>
            <span>${formatRp(paid)}</span>
        </div>
        
        <div class="receipt-line" style="border: none; padding: 8px 0; color: var(--success);">
            <span>Kembalian</span>
            <span><strong>${formatRp(change)}</strong></span>
        </div>
        
        <div style="text-align: center; margin-top: 15px; font-size: 11px; color: var(--text-muted);">
            <p>Terima kasih telah berbelanja!</p>
            <p>www.warungdenok.com</p>
        </div>
    `;
    
    state.currentTransaction = { trxId, items, total, paid, change };
    $('#receipt-modal').classList.add('active');
}

function closeReceiptModal() {
    $('#receipt-modal').classList.remove('active');
}

function printReceipt() {
    window.print();
}

// ==================== PRODUK MANAGEMENT ====================
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const name = $('#form-name').value.trim();
    const category = $('#form-category').value;
    const price = parseInt($('#form-price').value);
    const cost = parseInt($('#form-cost').value) || 0;
    const stock = parseInt($('#form-stock').value);
    
    if (!name || !category) {
        alert('❌ Nama dan kategori harus diisi!');
        return;
    }
    
    if (price <= 0) {
        alert('❌ Harga harus lebih dari 0!');
        return;
    }
    
    if (stock < 0) {
        alert('❌ Stok tidak boleh negatif!');
        return;
    }
    
    try {
        const product = {
            id: 'PRD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            name: name,
            category: category,
            price: price,
            cost: cost,
            stock: stock
        };
        
        const { error } = await supabaseClient
            .from('kw_products')
            .insert([product]);
        
        if (error) throw error;
        
        console.log('✅ Produk berhasil ditambahkan');
        alert('✅ Produk berhasil ditambahkan!');
        
        closeProductModal();
        document.getElementById('product-form').reset();
        await loadProducts();
        await loadCategories();
    } catch (e) {
        console.error('❌ Error:', e);
        alert('❌ Gagal: ' + e.message);
    }
}

function openProductModal() {
    $('#modal-title').textContent = 'Tambah Produk Baru';
    document.getElementById('product-form').reset();
    $('#form-margin').value = '30';

    const categories = state.categories.length ? state.categories : DEFAULT_CATEGORIES;
    populateCategorySelects(categories);

    $('#product-modal').classList.add('active');
}

function closeProductModal() {
    $('#product-modal').classList.remove('active');
}

function calculateMargin() {
    const price = parseInt($('#form-price').value) || 0;
    const cost = parseInt($('#form-cost').value) || 0;
    
    if (price > 0 && cost > 0) {
        const margin = Math.round(((price - cost) / price) * 100);
        $('#form-margin').value = Math.max(0, margin);
    }
}

function renderProductTable() {
    const search = $('#product-search').value.toLowerCase();
    const category = $('#product-category-filter').value;
    
    let filtered = state.products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search) || p.id.toLowerCase().includes(search);
        const matchCategory = !category || p.category === category;
        return matchSearch && matchCategory;
    });
    
    const tbody = $('#product-table-body');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Tidak ada data</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(p => {
        const margin = p.cost > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
        return `
            <tr>
                <td><code>${p.id}</code></td>
                <td>${p.name}</td>
                <td>${p.category || '-'}</td>
                <td>${formatRp(p.price)}</td>
                <td>${formatRp(p.cost || 0)}</td>
                <td>${p.stock}</td>
                <td><span class="margin-chip">${margin}%</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="editProduct('${p.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn danger" onclick="deleteProduct('${p.id}')" title="Hapus">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteProduct(productId) {
    if (!confirm('❌ Hapus produk ini?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('kw_products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        console.log('✅ Produk dihapus');
        await loadProducts();
        alert('✅ Produk berhasil dihapus!');
    } catch (e) {
        console.error('❌ Error:', e);
        alert('❌ Gagal: ' + e.message);
    }
}

function editProduct(productId) {
    alert('📝 Fitur edit akan datang segera!');
}

// ==================== LAPORAN ====================
async function loadReports() {
    try {
        const { data: transactions, error } = await supabaseClient
            .from('kw_transactions')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        state.transactions = transactions || [];
        renderTransactionTable();
        updateReportStats();
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

async function filterTransactions() {
    // TODO: Implement date filtering
    await loadReports();
}

function renderTransactionTable() {
    const tbody = $('#transaction-table-body');
    
    if (state.transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Tidak ada transaksi</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.transactions.map(t => {
        const itemsCount = Array.isArray(t.items)
            ? t.items.reduce((sum, item) => sum + (item.qty || 0), 0)
            : 0;

        return `
        <tr>
            <td><code>${t.id}</code></td>
            <td>${new Date(t.date).toLocaleString('id-ID')}</td>
            <td>${itemsCount}</td>
            <td>${formatRp(t.total)}</td>
            <td>${formatRp(t.profit || 0)}</td>
            <td>${formatRp(t.pay || 0)}</td>
            <td>${formatRp(t.change || 0)}</td>
            <td>
                <button class="action-btn" onclick="viewTransactionDetail('${t.id}')" title="Detail">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

function updateReportStats() {
    const totalTrx = state.transactions.length;
    const totalRevenue = state.transactions.reduce((sum, t) => sum + t.total, 0);
    const totalProfit = state.transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalItems = state.transactions.reduce((sum, t) => {
        const items = Array.isArray(t.items) ? t.items : [];
        return sum + items.reduce((count, item) => count + (item.qty || 0), 0);
    }, 0);
    
    $('#report-transactions').textContent = totalTrx;
    $('#report-revenue').textContent = formatRp(totalRevenue);
    $('#report-profit').textContent = formatRp(totalProfit);
    $('#report-items').textContent = totalItems;
}

function viewTransactionDetail(transactionId) {
    alert('📋 Detail transaksi akan ditampilkan segera!');
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        // Load statistics
        const { data: products } = await supabaseClient
            .from('kw_products')
            .select('*');
        
        const { data: transactions } = await supabaseClient
            .from('kw_transactions')
            .select('*');
        
        // Total products
        const totalProducts = products?.length || 0;
        $('#dash-total-products').textContent = totalProducts;
        
        // Low stock products (< 5)
        const lowStock = products?.filter(p => p.stock < 5).length || 0;
        $('#dash-low-stock').textContent = lowStock;
        
        // Today's revenue and profit
        const today = new Date().toDateString();
        const todayTransactions = transactions?.filter(t => new Date(t.date).toDateString() === today) || [];
        const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
        const todayProfit = todayTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
        
        $('#dash-today-revenue').textContent = formatRp(todayRevenue);
        $('#dash-today-profit').textContent = formatRp(todayProfit);
        
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

// ==================== UTILITIES ====================
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    $('#time').textContent = timeStr;
}
