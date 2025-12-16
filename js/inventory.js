/**
 * Módulo de Gestión de Inventarios
 * Gestiona stock, productos, movimientos y alertas de inventario
 */

class InventoryManager {
    constructor() {
        this.products = this.loadFromLocalStorage('inventory_products') || [];
        this.movements = this.loadFromLocalStorage('inventory_movements') || [];
        this.categories = this.loadFromLocalStorage('inventory_categories') || [
            { id: 'electronica', name: 'Electrónica', color: '#007bff' },
            { id: 'ropa', name: 'Ropa', color: '#28a745' },
            { id: 'accesorios', name: 'Accesorios', color: '#ffc107' },
            { id: 'hogar', name: 'Hogar', color: '#dc3545' },
            { id: 'otros', name: 'Otros', color: '#6f42c1' }
        ];
        this.settings = this.loadFromLocalStorage('inventory_settings') || {
            minStockAlert: 5,
            maxStockLevel: 1000,
            currencySymbol: '$',
            enableNotifications: true
        };
        this.initEventListeners();
    }

    /**
     * ==================== GESTIÓN DE PRODUCTOS ====================
     */

    /**
     * Añadir un nuevo producto al inventario
     */
    addProduct(productData) {
        const product = {
            id: this.generateId('PRD'),
            name: productData.name,
            sku: productData.sku || this.generateSKU(),
            category: productData.category,
            description: productData.description || '',
            cost: parseFloat(productData.cost) || 0,
            price: parseFloat(productData.price) || 0,
            quantity: parseInt(productData.quantity) || 0,
            minStock: parseInt(productData.minStock) || 5,
            maxStock: parseInt(productData.maxStock) || 500,
            unit: productData.unit || 'Unidad',
            supplier: productData.supplier || '',
            location: productData.location || '',
            barcode: productData.barcode || '',
            status: 'activo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastRestockDate: null,
            totalSold: 0,
            totalCost: 0
        };

        this.products.push(product);
        this.saveToLocalStorage('inventory_products', this.products);
        this.logMovement('crear_producto', product.id, product.quantity, 'Producto creado');
        return product;
    }

    /**
     * Actualizar información de un producto
     */
    updateProduct(productId, updateData) {
        const product = this.getProductById(productId);
        if (!product) return null;

        const oldQuantity = product.quantity;
        Object.assign(product, updateData, { updatedAt: new Date().toISOString() });

        if (updateData.quantity && updateData.quantity !== oldQuantity) {
            this.logMovement('actualizar_producto', productId, 
                updateData.quantity - oldQuantity, 'Ajuste de stock manual');
        }

        this.saveToLocalStorage('inventory_products', this.products);
        return product;
    }

    /**
     * Eliminar un producto del inventario
     */
    deleteProduct(productId) {
        this.products = this.products.filter(p => p.id !== productId);
        this.saveToLocalStorage('inventory_products', this.products);
        this.logMovement('eliminar_producto', productId, 0, 'Producto eliminado del sistema');
    }

    /**
     * Obtener un producto por ID
     */
    getProductById(productId) {
        return this.products.find(p => p.id === productId);
    }

    /**
     * Obtener todos los productos
     */
    getAllProducts() {
        return this.products;
    }

    /**
     * Obtener productos por categoría
     */
    getProductsByCategory(category) {
        return this.products.filter(p => p.category === category);
    }

    /**
     * Buscar productos por nombre o SKU
     */
    searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.sku.toLowerCase().includes(lowerQuery) ||
            p.barcode.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * ==================== GESTIÓN DE STOCK ====================
     */

    /**
     * Aumentar stock (entrada de productos)
     */
    increaseStock(productId, quantity, reason = 'Entrada de stock', supplier = '') {
        const product = this.getProductById(productId);
        if (!product) return null;

        const oldQuantity = product.quantity;
        product.quantity += quantity;
        product.updatedAt = new Date().toISOString();
        
        if (!product.lastRestockDate) {
            product.lastRestockDate = new Date().toISOString();
        }

        this.saveToLocalStorage('inventory_products', this.products);
        this.logMovement('aumento', productId, quantity, reason, supplier);
        
        return { oldQuantity, newQuantity: product.quantity, product };
    }

    /**
     * Disminuir stock (salida de productos)
     */
    decreaseStock(productId, quantity, reason = 'Venta', orderId = '') {
        const product = this.getProductById(productId);
        if (!product) return null;

        if (product.quantity < quantity) {
            return { error: 'Stock insuficiente', available: product.quantity };
        }

        const oldQuantity = product.quantity;
        product.quantity -= quantity;
        product.totalSold += quantity;
        product.updatedAt = new Date().toISOString();

        this.saveToLocalStorage('inventory_products', this.products);
        this.logMovement('disminucion', productId, -quantity, reason, orderId);
        
        return { oldQuantity, newQuantity: product.quantity, product };
    }

    /**
     * Ajuste de stock (corrección de inventario)
     */
    adjustStock(productId, newQuantity, reason = 'Ajuste manual') {
        const product = this.getProductById(productId);
        if (!product) return null;

        const oldQuantity = product.quantity;
        const difference = newQuantity - oldQuantity;
        product.quantity = newQuantity;
        product.updatedAt = new Date().toISOString();

        this.saveToLocalStorage('inventory_products', this.products);
        this.logMovement('ajuste', productId, difference, reason);
        
        return { oldQuantity, newQuantity, difference, product };
    }

    /**
     * Transferir stock entre productos
     */
    transferStock(fromProductId, toProductId, quantity, reason = 'Transferencia') {
        const fromProduct = this.getProductById(fromProductId);
        const toProduct = this.getProductById(toProductId);

        if (!fromProduct || !toProduct) return { error: 'Producto no encontrado' };
        if (fromProduct.quantity < quantity) return { error: 'Stock insuficiente en origen' };

        fromProduct.quantity -= quantity;
        toProduct.quantity += quantity;

        this.saveToLocalStorage('inventory_products', this.products);
        this.logMovement('transferencia', fromProductId, -quantity, reason, toProductId);
        this.logMovement('transferencia_entrada', toProductId, quantity, reason, fromProductId);

        return { success: true, from: fromProduct, to: toProduct };
    }

    /**
     * ==================== ALERTAS DE STOCK ====================
     */

    /**
     * Obtener productos con stock bajo
     */
    getLowStockProducts() {
        return this.products.filter(p => p.quantity <= p.minStock && p.status === 'activo');
    }

    /**
     * Obtener productos con stock crítico
     */
    getCriticalStockProducts() {
        return this.products.filter(p => p.quantity === 0 && p.status === 'activo');
    }

    /**
     * Obtener productos con exceso de stock
     */
    getOverstockedProducts() {
        return this.products.filter(p => p.quantity > p.maxStock);
    }

    /**
     * Obtener estado de stock general
     */
    getStockStatus() {
        return {
            totalProducts: this.products.length,
            activeProducts: this.products.filter(p => p.status === 'activo').length,
            lowStock: this.getLowStockProducts().length,
            criticalStock: this.getCriticalStockProducts().length,
            overstocked: this.getOverstockedProducts().length,
            totalValue: this.calculateTotalInventoryValue()
        };
    }

    /**
     * ==================== REGISTRO DE MOVIMIENTOS ====================
     */

    /**
     * Registrar movimiento de inventario
     */
    logMovement(type, productId, quantity, reason, relatedId = '') {
        const movement = {
            id: this.generateId('MOV'),
            type, // aumento, disminucion, ajuste, transferencia, crear_producto, eliminar_producto
            productId,
            quantity,
            reason,
            relatedId,
            user: this.getCurrentUser(),
            timestamp: new Date().toISOString(),
            notes: ''
        };

        this.movements.push(movement);
        this.saveToLocalStorage('inventory_movements', this.movements);
        return movement;
    }

    /**
     * Obtener historial de movimientos
     */
    getMovementHistory(productId = null, limit = 100) {
        let filtered = this.movements;

        if (productId) {
            filtered = filtered.filter(m => m.productId === productId);
        }

        return filtered.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        ).slice(0, limit);
    }

    /**
     * Obtener movimientos por rango de fechas
     */
    getMovementsByDateRange(startDate, endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return this.movements.filter(m => {
            const movementDate = new Date(m.timestamp).getTime();
            return movementDate >= start && movementDate <= end;
        });
    }

    /**
     * ==================== REPORTES Y ANÁLISIS ====================
     */

    /**
     * Calcular valor total del inventario
     */
    calculateTotalInventoryValue() {
        return this.products.reduce((total, product) => {
            return total + (product.quantity * product.cost);
        }, 0);
    }

    /**
     * Obtener productos más vendidos
     */
    getTopSellingProducts(limit = 10) {
        return [...this.products]
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, limit);
    }

    /**
     * Obtener productos menos vendidos
     */
    getSlowMovingProducts() {
        return this.products.filter(p => p.totalSold === 0 || p.totalSold < 5);
    }

    /**
     * Calcular rotación de inventario
     */
    calculateInventoryRotation(productId) {
        const product = this.getProductById(productId);
        if (!product) return 0;

        const totalCost = product.quantity * product.cost;
        return totalCost > 0 ? (product.totalSold * product.cost) / totalCost : 0;
    }

    /**
     * Obtener análisis por categoría
     */
    getCategoryAnalysis() {
        const analysis = {};

        this.categories.forEach(cat => {
            const products = this.getProductsByCategory(cat.id);
            analysis[cat.id] = {
                name: cat.name,
                totalProducts: products.length,
                totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
                totalValue: products.reduce((sum, p) => sum + (p.quantity * p.cost), 0),
                totalRevenue: products.reduce((sum, p) => sum + (p.totalSold * p.price), 0),
                averagePrice: products.length > 0 
                    ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
                    : 0
            };
        });

        return analysis;
    }

    /**
     * Generar reporte de inventario
     */
    generateInventoryReport(format = 'json') {
        const report = {
            generatedAt: new Date().toISOString(),
            summary: this.getStockStatus(),
            categoryAnalysis: this.getCategoryAnalysis(),
            lowStockProducts: this.getLowStockProducts(),
            topSellingProducts: this.getTopSellingProducts(),
            slowMovingProducts: this.getSlowMovingProducts(),
            allProducts: this.products
        };

        if (format === 'csv') {
            return this.convertToCSV(report.allProducts);
        }

        return report;
    }

    /**
     * ==================== CONFIGURACIÓN Y UTILIDADES ====================
     */

    /**
     * Actualizar configuración del inventario
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveToLocalStorage('inventory_settings', this.settings);
        return this.settings;
    }

    /**
     * Obtener configuración actual
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Añadir nueva categoría
     */
    addCategory(name, color = '#007bff') {
        const category = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            color
        };
        this.categories.push(category);
        this.saveToLocalStorage('inventory_categories', this.categories);
        return category;
    }

    /**
     * Obtener todas las categorías
     */
    getCategories() {
        return this.categories;
    }

    /**
     * Exportar inventario a CSV
     */
    convertToCSV(products) {
        const headers = ['ID', 'Nombre', 'SKU', 'Categoría', 'Stock', 'Precio', 'Valor Total', 'Proveedor', 'Estado'];
        const rows = products.map(p => [
            p.id,
            p.name,
            p.sku,
            p.category,
            p.quantity,
            p.price,
            (p.quantity * p.cost).toFixed(2),
            p.supplier,
            p.status
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        return csv;
    }

    /**
     * Exportar a JSON
     */
    exportToJSON() {
        return JSON.stringify(this.generateInventoryReport('json'), null, 2);
    }

    /**
     * Generar copias de seguridad
     */
    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            products: this.products,
            movements: this.movements,
            categories: this.categories,
            settings: this.settings
        };
        return backup;
    }

    /**
     * Restaurar desde copia de seguridad
     */
    restoreFromBackup(backup) {
        if (backup.products) this.products = backup.products;
        if (backup.movements) this.movements = backup.movements;
        if (backup.categories) this.categories = backup.categories;
        if (backup.settings) this.settings = backup.settings;

        this.saveToLocalStorage('inventory_products', this.products);
        this.saveToLocalStorage('inventory_movements', this.movements);
        this.saveToLocalStorage('inventory_categories', this.categories);
        this.saveToLocalStorage('inventory_settings', this.settings);

        return true;
    }

    /**
     * ==================== UTILIDADES PRIVADAS ====================
     */

    /**
     * Generar ID único
     */
    generateId(prefix = 'ID') {
        const timestamp = Date.now().toString(36);
        const randomNum = Math.random().toString(36).substring(2, 8);
        return `${prefix}-${timestamp}-${randomNum}`.toUpperCase();
    }

    /**
     * Generar SKU automático
     */
    generateSKU() {
        const timestamp = Date.now().toString(36).toUpperCase();
        return `SKU-${timestamp}`;
    }

    /**
     * Obtener usuario actual (simulado)
     */
    getCurrentUser() {
        return localStorage.getItem('currentUser') || 'Sistema';
    }

    /**
     * Guardar en localStorage
     */
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }

    /**
     * Cargar desde localStorage
     */
    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error cargando desde localStorage:', error);
            return null;
        }
    }

    /**
     * Inicializar event listeners
     */
    initEventListeners() {
        // Evento personalizado cuando cambia el stock
        window.addEventListener('inventoryChanged', (event) => {
            console.log('Inventario actualizado:', event.detail);
        });
    }

    /**
     * Disparar evento de cambio de inventario
     */
    emitInventoryChange(data) {
        const event = new CustomEvent('inventoryChanged', { detail: data });
        window.dispatchEvent(event);
    }
}

// Crear instancia global
const inventory = new InventoryManager();
