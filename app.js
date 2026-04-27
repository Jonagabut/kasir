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
        <div class="product-card ${p.stock <= 0 ? 'disabled' : ''} ${p.stock <= 2 ? 'low-stock' : ''}" 
             onclick="addToCart('${p.id}')" 
             title="${p.name}${p.stock <= 2 ? ' - Stok rendah!' : ''}">
            <div class="product-emoji">📦</div>
            <div class="product-name">${p.name}</div>
            <div class="product-category">${p.category || 'Umum'}</div>
            <div class="product-price">${formatRp(p.price)}</div>
            <div class="product-stock ${p.stock <= 5 ? 'low' : ''} ${p.stock <= 0 ? 'out' : ''}">
                Stok: ${p.stock}
                ${p.stock <= 2 ? ' ⚠️' : ''}
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
            return;
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
    const total = parseInt($('#pay-total').textContent.replace(/\D/g, '')) || 0;
    const paid = parseInt($('#cash-amount').value) || 0;
    const changeInfo = $('#change-info');
    const changeAmount = $('#change-amount');
    
    if (paid >= total && total > 0) {
        const change = paid - total;
        changeInfo.style.display = 'block';
        changeAmount.textContent = formatRp(change);
        changeAmount.style.color = change > 0 ? 'var(--success)' : 'var(--text)';
    } else {
        changeInfo.style.display = 'none';
    }
    
    // Clear preset button active state when user types manually
    if (paid !== total) {
        $$('.preset-btn').forEach(btn => btn.classList.remove('active'));
    }
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
    const productId = e.target.dataset.productId;

    if (!name || !category) {
        alert('❌ Nama dan kategori harus diisi!');
        return;
    }

    // Check for duplicate product names (case insensitive)
    const existingProduct = state.products.find(p => 
        p.name.toLowerCase() === name.toLowerCase() && p.id !== productId
    );
    if (existingProduct) {
        alert('❌ Produk dengan nama yang sama sudah ada!');
        return;
    }
    
    if (stock < 0) {
        alert('❌ Stok tidak boleh negatif!');
        return;
    }

    try {
        const productData = {
            name: name,
            category: category,
            price: price,
            cost: cost,
            stock: stock,
            updated_at: new Date().toISOString()
        };

        let result;
        if (productId) {
            // Update existing product
            result = await supabaseClient
                .from('kw_products')
                .update(productData)
                .eq('id', productId);
        } else {
            // Add new product
            productData.id = 'PRD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            productData.created_at = new Date().toISOString();
            result = await supabaseClient
                .from('kw_products')
                .insert([productData]);
        }

        if (result.error) throw result.error;

        const successMessage = productId ? '✅ Produk berhasil diperbarui!' : '✅ Produk berhasil ditambahkan!';
        console.log(productId ? '✅ Produk diperbarui' : '✅ Produk ditambahkan');
        alert(successMessage);

        closeProductModal();
        document.getElementById('product-form').reset();
        delete e.target.dataset.productId;
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

    // Clear any stored product ID
    delete document.getElementById('product-form').dataset.productId;

    $('#product-modal').classList.add('active');
}

function closeProductModal() {
    $('#product-modal').classList.remove('active');
}

function calculateMargin() {
    const price = parseInt($('#form-price').value) || 0;
    const cost = parseInt($('#form-cost').value) || 0;
    
    if (price > 0 && cost >= 0) {
        const margin = Math.round(((price - cost) / price) * 100);
        $('#form-margin').value = Math.max(0, Math.min(100, margin));
    } else if (price > 0) {
        $('#form-margin').value = '100';
    } else {
        $('#form-margin').value = '0';
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
    const product = state.products.find(p => p.id === productId);
    if (!product) {
        alert('❌ Produk tidak ditemukan!');
        return;
    }

    // Populate form with existing data
    $('#modal-title').textContent = 'Edit Produk';
    $('#form-name').value = product.name;
    $('#form-category').value = product.category || '';
    $('#form-price').value = product.price;
    $('#form-cost').value = product.cost || 0;
    $('#form-stock').value = product.stock;

    // Calculate margin
    calculateMargin();

    // Store product ID for update
    $('#product-form').dataset.productId = productId;

    $('#product-modal').classList.add('active');
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
    const dateFrom = $('#date-from').value;
    const dateTo = $('#date-to').value;

    try {
        let query = supabaseClient
            .from('kw_transactions')
            .select('*')
            .order('date', { ascending: false });

        if (dateFrom) {
            query = query.gte('date', dateFrom + 'T00:00:00.000Z');
        }

        if (dateTo) {
            // Add one day to include the end date fully
            const endDate = new Date(dateTo);
            endDate.setDate(endDate.getDate() + 1);
            query = query.lt('date', endDate.toISOString());
        }

        const { data: transactions, error } = await query;

        if (error) throw error;

        state.transactions = transactions || [];
        renderTransactionTable();
        updateReportStats();
    } catch (e) {
        console.error('❌ Error filtering transactions:', e);
        alert('❌ Gagal memfilter transaksi: ' + e.message);
    }
}

function renderTransactionTable() {
    const tbody = $('#transaction-table-body');
    
    if (state.transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Tidak ada transaksi</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.transactions.map(t => {
        const itemsList = Array.isArray(t.items)
            ? t.items.map(item => `${item.name} (x${item.qty})`).join('<br>')
            : '-';

        return `
        <tr>
            <td><code>${t.id}</code></td>
            <td>${new Date(t.date).toLocaleString('id-ID')}</td>
            <td style="font-size: 11px; max-width: 150px; white-space: normal;">${itemsList}</td>
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
    const transaction = state.transactions.find(t => t.id === transactionId);
    if (!transaction) {
        alert('❌ Transaksi tidak ditemukan!');
        return;
    }

    let detailsHtml = `
        <div style="padding: 20px; max-width: 500px; margin: 0 auto;">
            <h3 style="margin-bottom: 20px; color: var(--primary);">Detail Transaksi</h3>
            <div style="background: var(--dark-2); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>ID Transaksi:</span>
                    <code>${transaction.id}</code>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Waktu:</span>
                    <span>${new Date(transaction.date).toLocaleString('id-ID')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Metode Pembayaran:</span>
                    <span>${transaction.method === 'cash' ? 'Tunai' : 'Transfer'}</span>
                </div>
            </div>

            <h4 style="margin-bottom: 15px;">Daftar Item:</h4>
            <div style="background: var(--dark-2); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
    `;

    if (Array.isArray(transaction.items) && transaction.items.length > 0) {
        transaction.items.forEach(item => {
            const subtotal = item.price * item.qty;
            detailsHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
                    <div>
                        <div style="font-weight: 500;">${item.name}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${formatRp(item.price)} x ${item.qty}</div>
                    </div>
                    <div style="font-weight: 600;">${formatRp(subtotal)}</div>
                </div>
            `;
        });
    } else {
        detailsHtml += '<p style="text-align: center; color: var(--text-muted);">Tidak ada data item</p>';
    }

    detailsHtml += `
            </div>

            <div style="background: var(--dark-2); padding: 15px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Subtotal:</span>
                    <span>${formatRp(transaction.total + (transaction.discount || 0))}</span>
                </div>
                ${transaction.discount ? `<div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Diskon:</span>
                    <span>-${formatRp(transaction.discount)}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: 600; border-top: 1px solid var(--border); padding-top: 10px;">
                    <span>Total:</span>
                    <span>${formatRp(transaction.total)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Bayar:</span>
                    <span>${formatRp(transaction.pay || 0)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 600; color: var(--success);">
                    <span>Kembalian:</span>
                    <span>${formatRp(transaction.change || 0)}</span>
                </div>
                ${transaction.profit !== undefined ? `<div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); color: var(--warning);">
                    <span>Profit:</span>
                    <span>${formatRp(transaction.profit)}</span>
                </div>` : ''}
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <button onclick="closeTransactionDetail()" class="btn btn-primary">Tutup</button>
            </div>
        </div>
    `;

    // Create modal for transaction detail
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'transaction-detail-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Detail Transaksi</h2>
                <button class="modal-close" onclick="closeTransactionDetail()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <div id="transaction-detail-content">${detailsHtml}</div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');
}

function closeTransactionDetail() {
    const modal = $('#transaction-detail-modal');
    if (modal) {
        modal.remove();
    }
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
        
        // Load charts
        await loadSalesChart();
        await loadTopProductsChart();
        
    } catch (e) {
        console.error('❌ Error:', e);
    }
}

async function loadSalesChart() {
    try {
        // Get last 7 days data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);
        
        const { data: transactions } = await supabaseClient
            .from('kw_transactions')
            .select('date, total')
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());
        
        // Prepare data for chart
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
            
            const dayTransactions = transactions?.filter(t => 
                new Date(t.date).toISOString().split('T')[0] === dateStr
            ) || [];
            
            const dayTotal = dayTransactions.reduce((sum, t) => sum + t.total, 0);
            data.push(dayTotal);
        }
        
        // Create chart
        const ctx = document.getElementById('chart-sales').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Penjualan (Rp)',
                    data: data,
                    borderColor: 'var(--primary)',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatRp(value);
                            }
                        }
                    }
                }
            }
        });
        
    } catch (e) {
        console.error('❌ Error loading sales chart:', e);
        $('#chart-sales').innerHTML = '<p style="color: var(--danger);">Gagal memuat chart</p>';
    }
}

async function loadTopProductsChart() {
    try {
        // Get recent transactions to calculate top products
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: transactions } = await supabaseClient
            .from('kw_transactions')
            .select('items')
            .gte('date', thirtyDaysAgo.toISOString());
        
        // Count product sales
        const productCounts = {};
        transactions?.forEach(t => {
            if (Array.isArray(t.items)) {
                t.items.forEach(item => {
                    if (productCounts[item.name]) {
                        productCounts[item.name] += item.qty;
                    } else {
                        productCounts[item.name] = item.qty;
                    }
                });
            }
        });
        
        // Sort and get top 5
        const sortedProducts = Object.entries(productCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        if (sortedProducts.length === 0) {
            $('#top-products').innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada data penjualan</p>';
            return;
        }
        
        // Create chart
        const ctx = document.getElementById('top-products').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedProducts.map(([name]) => name.length > 15 ? name.substring(0, 15) + '...' : name),
                datasets: [{
                    label: 'Terjual',
                    data: sortedProducts.map(([, count]) => count),
                    backgroundColor: 'var(--primary)',
                    borderColor: 'var(--primary-dark)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
    } catch (e) {
        console.error('❌ Error loading top products chart:', e);
        $('#top-products').innerHTML = '<p style="color: var(--danger);">Gagal memuat chart</p>';
    }
}

// ==================== UTILITIES ====================
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    $('#time').textContent = timeStr;
}
