/**
 * Gestor de Interfaz de Usuario para Inventarios
 * Maneja eventos, modales y actualización de vistas
 */

// Variables globales de UI
let currentProductId = null;
let filteredProducts = [];

/**
 * Función helper para formatear valores en pesos colombianos (COP)
 * @param {number} value - Valor numérico a formatear
 * @returns {string} Valor formateado como COP
 */
function formatCOP(value) {
    const numericValue = Math.round(parseFloat(value) || 0);
    return numericValue.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * ==================== INICIALIZACIÓN ====================
 */

document.addEventListener('DOMContentLoaded', function() {
    initInventoryUI();
});

function initInventoryUI() {
    loadInventoryDashboard();
    loadProductsTable();
    loadMovementsTable();
    loadAlertsUI();
    loadSettingsUI();
    initFormHandlers();
    loadCategoryFilter();
}

/**
 * ==================== HANDLERS DE FORMULARIOS ====================
 */

function initFormHandlers() {
    // Form de Agregar/Editar Producto
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductFormSubmit);
    }

    // Form de Ajustar Stock
    const adjustStockForm = document.getElementById('adjustStockForm');
    if (adjustStockForm) {
        adjustStockForm.addEventListener('submit', handleAdjustStockSubmit);
    }

    // Select de producto en modal de ajuste
    const adjustProductSelect = document.getElementById('adjustProductSelect');
    if (adjustProductSelect) {
        adjustProductSelect.addEventListener('change', updateProductInfoDisplay);
    }
}

function handleProductFormSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSKU').value,
        category: document.getElementById('productCategory').value,
        cost: document.getElementById('productCost').value,
        price: document.getElementById('productPrice').value,
        quantity: document.getElementById('productQuantity').value,
        minStock: document.getElementById('productMinStock').value,
        maxStock: document.getElementById('productMaxStock').value,
        unit: document.getElementById('productUnit').value,
        supplier: document.getElementById('productSupplier').value,
        location: document.getElementById('productLocation').value,
        barcode: document.getElementById('productBarcode').value,
        description: document.getElementById('productDescription').value
    };

    if (currentProductId) {
        inventory.updateProduct(currentProductId, formData);
        showNotification('Producto actualizado correctamente', 'success');
    } else {
        const newProduct = inventory.addProduct(formData);
        showNotification(`Producto "${newProduct.name}" agregado al inventario`, 'success');
    }

    closeInventoryModal('addProduct');
    loadProductsTable();
    loadInventoryDashboard();
}

function handleAdjustStockSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('adjustProductSelect').value;
    const adjustType = document.getElementById('adjustType').value;
    const quantity = parseInt(document.getElementById('adjustQuantity').value);
    const reason = document.getElementById('adjustReason').value;
    const supplier = document.getElementById('adjustSupplier').value;

    let result;
    const product = inventory.getProductById(productId);

    if (adjustType === 'aumento') {
        result = inventory.increaseStock(productId, quantity, reason, supplier);
        showNotification(`Stock aumentado: ${product.name} (+${quantity})`, 'success');
    } else if (adjustType === 'disminucion') {
        result = inventory.decreaseStock(productId, quantity, reason);
        if (result.error) {
            showNotification(result.error, 'error');
            return;
        }
        showNotification(`Stock disminuido: ${product.name} (-${quantity})`, 'success');
    } else if (adjustType === 'ajuste') {
        result = inventory.adjustStock(productId, quantity, reason);
        showNotification(`Stock ajustado: ${product.name} = ${quantity}`, 'success');
    }

    closeInventoryModal('adjustStock');
    loadProductsTable();
    loadInventoryDashboard();
    loadMovementsTable();
}

/**
 * ==================== GESTIÓN DE MODALES ====================
 */

function openInventoryModal(modalType) {
    const modals = {
        'addProduct': 'addProductModal',
        'adjustStock': 'adjustStockModal',
        'report': 'reportModal'
    };

    const modalId = modals[modalType];
    if (!modalId) return;

    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Limpiar estado previo
    currentProductId = null;
    document.getElementById('productForm')?.reset();

    // Cargar datos para el modal
    if (modalType === 'addProduct') {
        loadProductCategories();
        document.getElementById('modalTitle').textContent = 'Agregar Nuevo Producto';
    } else if (modalType === 'adjustStock') {
        loadAdjustStockProducts();
    }

    modal.style.display = 'block';
}

function closeInventoryModal(modalType) {
    const modals = {
        'addProduct': 'addProductModal',
        'adjustStock': 'adjustStockModal',
        'report': 'reportModal'
    };

    const modalId = modals[modalType];
    if (modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
}

/**
 * ==================== DASHBOARD ====================
 */

function loadInventoryDashboard() {
    const status = inventory.getStockStatus();

    // Actualizar estadísticas (con verificación de existencia)
    const totalProducts = document.getElementById('totalProducts');
    if (totalProducts) totalProducts.textContent = status.totalProducts;
    
    const totalValue = document.getElementById('totalValue');
    if (totalValue) totalValue.textContent = formatCOP(status.totalValue);
    
    const lowStockCount = document.getElementById('lowStockCount');
    if (lowStockCount) lowStockCount.textContent = status.lowStock;
    
    const criticalStockCount = document.getElementById('criticalStockCount');
    if (criticalStockCount) criticalStockCount.textContent = status.criticalStock;
    
    const overstockedCount = document.getElementById('overstockedCount');
    if (overstockedCount) overstockedCount.textContent = status.overstocked;
    
    const activeProductsCount = document.getElementById('activeProductsCount');
    if (activeProductsCount) activeProductsCount.textContent = status.activeProducts;

    // Cargar productos más vendidos
    loadTopSellingProducts();

    // Cargar análisis por categoría
    loadCategoryAnalysis();
}

function loadTopSellingProducts() {
    const topProducts = inventory.getTopSellingProducts(5);
    const tbody = document.getElementById('topSellingProductsTable');
    
    // Protección: si el elemento no existe, salir
    if (!tbody) return;

    if (topProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay datos de ventas</td></tr>';
        return;
    }

    tbody.innerHTML = topProducts.map(product => `
        <tr>
            <td><strong>${product.name}</strong></td>
            <td>${product.sku}</td>
            <td>${product.quantity}</td>
            <td>${product.totalSold}</td>
            <td>${formatCOP(product.totalSold * product.price)}</td>
        </tr>
    `).join('');
}

function loadCategoryAnalysis() {
    const analysis = inventory.getCategoryAnalysis();
    const container = document.getElementById('categoryAnalysisContainer');
    
    // Protección: si el elemento no existe, salir
    if (!container) return;

    const html = Object.entries(analysis).map(([key, cat]) => `
        <div class="category-card">
            <h4>${cat.name}</h4>
            <div class="category-stats">
                <div class="stat">
                    <span class="stat-label">Productos:</span>
                    <span class="stat-number">${cat.totalProducts}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Stock Total:</span>
                    <span class="stat-number">${cat.totalQuantity}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Valor:</span>
                    <span class="stat-number">${formatCOP(cat.totalValue)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Ingresos:</span>
                    <span class="stat-number">${formatCOP(cat.totalRevenue)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Precio Promedio:</span>
                    <span class="stat-number">${formatCOP(cat.averagePrice)}</span>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html || '<p>No hay categorías</p>';
}

/**
 * ==================== GESTIÓN DE PRODUCTOS ====================
 */

function loadProductsTable() {
    const products = inventory.getAllProducts();
    const tbody = document.getElementById('productsTableBody');
    
    // Protección: si el elemento no existe, salir
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No hay productos registrados</td></tr>';
        return;
    }

    filteredProducts = [...products];
    renderProductsTable(filteredProducts);
}

function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    
    // Protección: si el elemento no existe, salir
    if (!tbody) return;

    tbody.innerHTML = products.map(product => {
        const totalValue = product.quantity * product.cost;
        const stockStatus = product.quantity === 0 ? 'critical' :
                          product.quantity <= product.minStock ? 'warning' :
                          product.quantity > product.maxStock ? 'overflow' : 'normal';

        return `
            <tr class="product-row status-${stockStatus}">
                <td><strong>${product.name}</strong></td>
                <td>${product.sku}</td>
                <td><span class="category-badge">${product.category}</span></td>
                <td class="stock-cell">
                    <strong>${product.quantity}</strong>
                    <span class="unit">${product.unit}</span>
                </td>
                <td>${product.minStock} / ${product.maxStock}</td>
                <td>${formatCOP(product.price)}</td>
                <td>${formatCOP(totalValue)}</td>
                <td>${product.supplier || '-'}</td>
                <td><span class="status-badge status-${product.status}">${product.status}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-info" onclick="editProduct('${product.id}')" title="Editar">✏️</button>
                    <button class="btn btn-sm btn-warning" onclick="quickAdjustStock('${product.id}')" title="Ajustar stock">📊</button>
                    <button class="btn btn-sm btn-info" onclick="viewProductHistory('${product.id}')" title="Historial">📜</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')" title="Eliminar">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterInventoryProducts() {
    const searchQuery = document.getElementById('productSearch')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    filteredProducts = inventory.getAllProducts().filter(product => {
        const matchesSearch = searchQuery === '' || 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.barcode.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = categoryFilter === '' || product.category === categoryFilter;
        const matchesStatus = statusFilter === '' || product.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderProductsTable(filteredProducts);
}

function editProduct(productId) {
    currentProductId = productId;
    const product = inventory.getProductById(productId);

    if (!product) return;

    // Cargar datos en el formulario
    document.getElementById('productName').value = product.name;
    document.getElementById('productSKU').value = product.sku;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productCost').value = product.cost;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productMinStock').value = product.minStock;
    document.getElementById('productMaxStock').value = product.maxStock;
    document.getElementById('productUnit').value = product.unit;
    document.getElementById('productSupplier').value = product.supplier;
    document.getElementById('productLocation').value = product.location;
    document.getElementById('productBarcode').value = product.barcode;
    document.getElementById('productDescription').value = product.description;

    document.getElementById('modalTitle').textContent = `Editar Producto: ${product.name}`;
    loadProductCategories();
    openInventoryModal('addProduct');
}

function deleteProduct(productId) {
    const product = inventory.getProductById(productId);
    if (!product) return;

    if (confirm(`¿Estás seguro de que deseas eliminar "${product.name}"?`)) {
        inventory.deleteProduct(productId);
        showNotification(`Producto eliminado: ${product.name}`, 'success');
        loadProductsTable();
        loadInventoryDashboard();
    }
}

function quickAdjustStock(productId) {
    const select = document.getElementById('adjustProductSelect');
    select.value = productId;
    updateProductInfoDisplay();
    openInventoryModal('adjustStock');
}

/**
 * ==================== MOVIMIENTOS ====================
 */

function loadMovementsTable() {
    const movements = inventory.getMovementHistory();
    const tbody = document.getElementById('movementsTableBody');
    
    // Protección: si el elemento no existe, salir
    if (!tbody) return;

    if (movements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay movimientos registrados</td></tr>';
        return;
    }

    renderMovementsTable(movements);
}

function renderMovementsTable(movements) {
    const tbody = document.getElementById('movementsTableBody');
    
    // Protección: si el elemento no existe, salir
    if (!tbody) return;
        const product = inventory.getProductById(movement.productId);
        const movementIcon = {
            'aumento': '📈',
            'disminucion': '📉',
            'ajuste': '🔧',
            'transferencia': '↔️',
            'crear_producto': '✨',
            'eliminar_producto': '🗑️'
        }[movement.type] || '•';

        const date = new Date(movement.timestamp);
        const formattedDate = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');

        return `
            <tr>
                <td>${formattedDate}</td>
                <td><span class="movement-badge type-${movement.type}">${movementIcon} ${movement.type}</span></td>
                <td>${product?.name || 'Producto no encontrado'}</td>
                <td class="quantity-cell">
                    <span class="${movement.quantity > 0 ? 'positive' : movement.quantity < 0 ? 'negative' : ''}">
                        ${movement.quantity > 0 ? '+' : ''}${movement.quantity}
                    </span>
                </td>
                <td>${movement.reason}</td>
                <td>${movement.user}</td>
                <td><small>${movement.id}</small></td>
            </tr>
        `;
    }).join('');
}

function filterMovements() {
    const typeFilter = document.getElementById('movementTypeFilter')?.value || '';
    const productFilter = document.getElementById('movementProductFilter')?.value || '';
    const dateFrom = document.getElementById('movementDateFrom')?.value || '';
    const dateTo = document.getElementById('movementDateTo')?.value || '';

    let movements = inventory.getMovementHistory();

    if (typeFilter) {
        movements = movements.filter(m => m.type === typeFilter);
    }

    if (productFilter) {
        movements = movements.filter(m => m.productId === productFilter);
    }

    if (dateFrom && dateTo) {
        const start = new Date(dateFrom).getTime();
        const end = new Date(dateTo).getTime();
        movements = movements.filter(m => {
            const movTime = new Date(m.timestamp).getTime();
            return movTime >= start && movTime <= end;
        });
    }

    renderMovementsTable(movements);
}

/**
 * ==================== ALERTAS ====================
 */

function loadAlertsUI() {
    const lowStock = inventory.getLowStockProducts();
    const critical = inventory.getCriticalStockProducts();
    const overstocked = inventory.getOverstockedProducts();
    const slowMoving = inventory.getSlowMovingProducts();

    // Alertas de stock bajo
    renderAlerts('lowStockAlerts', lowStock, 'bajo', '⚠️');

    // Alertas de stock crítico
    renderAlerts('criticalStockAlerts', critical, 'crítico', '🔴');

    // Alertas de sobrestocaje
    renderAlerts('overstockedAlerts', overstocked, 'sobrestocaje', '📈');

    // Productos sin movimiento
    renderAlerts('slowMovingAlerts', slowMoving, 'sin_movimiento', '❌');
}

function renderAlerts(containerId, products, type, icon) {
    const container = document.getElementById(containerId);
    
    // Protección: si el elemento no existe, salir
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `<p class="no-alerts">✅ No hay alertas de este tipo</p>`;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="alert-item alert-${type}">
            <div class="alert-header">
                <h4>${icon} ${product.name}</h4>
                <span class="sku">${product.sku}</span>
            </div>
            <div class="alert-body">
                <p><strong>Stock Actual:</strong> ${product.quantity} ${product.unit}</p>
                <p><strong>Mínimo Recomendado:</strong> ${product.minStock}</p>
                <p><strong>Máximo Permitido:</strong> ${product.maxStock}</p>
                ${type === 'sin_movimiento' ? `<p><strong>Días sin venta:</strong> N/A</p>` : ''}
            </div>
            <div class="alert-actions">
                <button class="btn btn-sm btn-primary" onclick="quickAdjustStock('${product.id}')">
                    Ajustar Stock
                </button>
                <button class="btn btn-sm btn-info" onclick="editProduct('${product.id}')">
                    Ver Detalles
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * ==================== CONFIGURACIÓN ====================
 */

function loadSettingsUI() {
    const settings = inventory.getSettings();

    const minStockAlert = document.getElementById('minStockAlert');
    if (minStockAlert) minStockAlert.value = settings.minStockAlert;
    
    const maxStockLevel = document.getElementById('maxStockLevel');
    if (maxStockLevel) maxStockLevel.value = settings.maxStockLevel;
    
    const currencySymbol = document.getElementById('currencySymbol');
    if (currencySymbol) currencySymbol.value = settings.currencySymbol;
    
    const enableNotifications = document.getElementById('enableNotifications');
    if (enableNotifications) enableNotifications.checked = settings.enableNotifications;

    loadCategories();
}

function loadCategories() {
    const categories = inventory.getCategories();
    const container = document.getElementById('categoriesContainer');
    
    // Protección: si el elemento no existe, salir
    if (!container) return;
        <div class="category-item">
            <div class="category-color" style="background-color: ${cat.color}"></div>
            <span class="category-name">${cat.name}</span>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat.id}')">🗑️</button>
        </div>
    `).join('');
}

function saveInventorySettings() {
    const settings = {
        minStockAlert: parseInt(document.getElementById('minStockAlert').value),
        maxStockLevel: parseInt(document.getElementById('maxStockLevel').value),
        currencySymbol: document.getElementById('currencySymbol').value,
        enableNotifications: document.getElementById('enableNotifications').checked
    };

    inventory.updateSettings(settings);
    showNotification('Configuración guardada correctamente', 'success');
    loadSettingsUI();
}

function resetInventorySettings() {
    if (confirm('¿Estás seguro? Se restaurarán los valores por defecto.')) {
        localStorage.removeItem('inventory_settings');
        location.reload();
    }
}

function addNewCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const color = document.getElementById('newCategoryColor').value;

    if (!name) {
        showNotification('Por favor ingresa un nombre para la categoría', 'error');
        return;
    }

    inventory.addCategory(name, color);
    document.getElementById('newCategoryName').value = '';
    loadCategories();
    loadProductCategories();
    loadCategoryFilter();
    showNotification(`Categoría "${name}" añadida correctamente`, 'success');
}

function deleteCategory(categoryId) {
    if (confirm('¿Eliminar esta categoría?')) {
        inventory.categories = inventory.categories.filter(c => c.id !== categoryId);
        inventory.saveToLocalStorage('inventory_categories', inventory.categories);
        loadCategories();
        showNotification('Categoría eliminada', 'success');
    }
}

/**
 * ==================== UTILIDADES DE CARGA DE DATOS ====================
 */

function loadProductCategories() {
    const categories = inventory.getCategories();
    const select = document.getElementById('productCategory');
    
    // Protección: si el elemento no existe, salir
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar categoría</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function loadCategoryFilter() {
    const categories = inventory.getCategories();
    const select = document.getElementById('categoryFilter');

    if (select) {
        select.innerHTML = '<option value="">Todas las categorías</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
}

function loadAdjustStockProducts() {
    const products = inventory.getAllProducts();
    const select = document.getElementById('adjustProductSelect');
    
    // Protección: si el elemento no existe, salir
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar producto</option>' +
        products.map(p => `<option value="${p.id}">${p.name} (${p.sku})</option>`).join('');

    // Cargar opciones de movimientos
    const movementFilter = document.getElementById('movementProductFilter');
    if (movementFilter) {
        movementFilter.innerHTML = '<option value="">Todos los productos</option>' +
            products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
}

function updateProductInfoDisplay() {
    const select = document.getElementById('adjustProductSelect');
    const infoDiv = document.getElementById('productInfo');
    
    // Protección: si los elementos no existen, salir
    if (!select || !infoDiv) return;

    const productId = select.value;

    if (!productId) {
        infoDiv.style.display = 'none';
        return;
    }

    const product = inventory.getProductById(productId);
    if (product) {
        const currentStockDisplay = document.getElementById('currentStockDisplay');
        const minStockDisplay = document.getElementById('minStockDisplay');
        const maxStockDisplay = document.getElementById('maxStockDisplay');
        
        if (currentStockDisplay) currentStockDisplay.textContent = product.quantity;
        if (minStockDisplay) minStockDisplay.textContent = product.minStock;
        if (maxStockDisplay) maxStockDisplay.textContent = product.maxStock;
        infoDiv.style.display = 'block';
    }
}

/**
 * ==================== REPORTES ====================
 */

function showInventoryReport() {
    const content = document.getElementById('reportContent');
    
    // Protección: si el elemento no existe, salir
    if (!content) return;

    const report = inventory.generateInventoryReport();
        <div class="report-section">
            <h3>📊 Resumen General</h3>
            <table class="report-table">
                <tr>
                    <td>Total de Productos:</td>
                    <td><strong>${report.summary.totalProducts}</strong></td>
                </tr>
                <tr>
                    <td>Productos Activos:</td>
                    <td><strong>${report.summary.activeProducts}</strong></td>
                </tr>
                <tr>
                    <td>Valor Total del Inventario:</td>
                    <td><strong>${formatCOP(report.summary.totalValue)}</strong></td>
                </tr>
                <tr>
                    <td>Productos con Stock Bajo:</td>
                    <td><strong class="warning">${report.summary.lowStock}</strong></td>
                </tr>
                <tr>
                    <td>Productos Agotados:</td>
                    <td><strong class="critical">${report.summary.criticalStock}</strong></td>
                </tr>
                <tr>
                    <td>Productos Sobrestocados:</td>
                    <td><strong class="overflow">${report.summary.overstocked}</strong></td>
                </tr>
            </table>
        </div>

        <div class="report-section">
            <h3>🏆 Top 10 Productos Más Vendidos</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Vendidos</th>
                        <th>Ingresos</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.topSellingProducts.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.totalSold}</td>
                            <td>${formatCOP(p.totalSold * p.price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="report-section">
            <h3>📂 Análisis por Categoría</h3>
            ${Object.entries(report.categoryAnalysis).map(([key, cat]) => `
                <div class="category-report">
                    <h4>${cat.name}</h4>
                    <p>Productos: ${cat.totalProducts} | Stock: ${cat.totalQuantity} | Valor: ${formatCOP(cat.totalValue)}</p>
                </div>
            `).join('')}
        </div>
    `;

    content.innerHTML = html;
    openInventoryModal('report');
}

function printInventoryReport() {
    window.print();
}

function downloadInventoryReport() {
    const report = inventory.generateInventoryReport();
    const dataStr = JSON.stringify(report, null, 2);
    downloadFile(dataStr, 'reporte-inventario.json', 'application/json');
}

function exportInventoryToCSV() {
    const csv = inventory.convertToCSV(inventory.getAllProducts());
    downloadFile(csv, 'inventario.csv', 'text/csv');
}

function exportInventoryToJSON() {
    const json = inventory.exportToJSON();
    downloadFile(json, 'inventario.json', 'application/json');
}

function exportInventoryToExcel() {
    // Requiere librería externa (xlsx)
    showNotification('Esta función requiere la librería xlsx instalada', 'info');
}

function exportMovements() {
    const movements = inventory.getMovementHistory();
    const csv = 'Fecha,Tipo,ProductoID,Cantidad,Razón,Usuario\n' +
        movements.map(m => `"${new Date(m.timestamp).toLocaleString()}","${m.type}","${m.productId}","${m.quantity}","${m.reason}","${m.user}"`).join('\n');

    downloadFile(csv, 'movimientos-inventario.csv', 'text/csv');
}

function downloadInventoryBackup() {
    const backup = inventory.createBackup();
    const dataStr = JSON.stringify(backup, null, 2);
    downloadFile(dataStr, `backup-inventario-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

function restoreInventoryBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            inventory.restoreFromBackup(backup);
            showNotification('Copia de seguridad restaurada correctamente', 'success');
            location.reload();
        } catch (error) {
            showNotification('Error al restaurar la copia de seguridad', 'error');
        }
    };
    reader.readAsText(file);
}

/**
 * ==================== TABS ====================
 */

function switchInventoryTab(tabName) {
    // Ocultar todos los tabs
    const tabs = document.querySelectorAll('.inventory-tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Desactivar todos los botones
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Mostrar el tab seleccionado
    const activeTab = document.getElementById(`inventoryTab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Activar el botón
    event.target.classList.add('active');

    // Recargar datos según el tab
    if (tabName === 'products') {
        loadProductsTable();
    } else if (tabName === 'movements') {
        loadMovementsTable();
    } else if (tabName === 'alerts') {
        loadAlertsUI();
    }
}

/**
 * ==================== FUNCIONES DE UTILIDAD ====================
 */

function viewProductHistory(productId) {
    const movements = inventory.getMovementHistory(productId);
    const product = inventory.getProductById(productId);

    if (movements.length === 0) {
        showNotification('Este producto no tiene historial de movimientos', 'info');
        return;
    }

    console.log(`Historial de ${product.name}:`, movements);
    alert(`Historial de ${product.name}\n\n${movements.map(m => 
        `${new Date(m.timestamp).toLocaleString()}: ${m.type} (${m.quantity}) - ${m.reason}`
    ).join('\n')}`);
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info') {
    // Crear notificación simple (puedes mejorar esto con Toastr o similar)
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

// Evento global para cambios en inventario
window.addEventListener('inventoryChanged', (event) => {
    loadInventoryDashboard();
    loadProductsTable();
});
