/**
 * EJEMPLOS DE USO DEL MÓDULO DE INVENTARIOS
 * Casos prácticos y escenarios comunes
 */

// ==================== INICIALIZACIÓN ====================

// El módulo se inicializa automáticamente cuando se cargan los scripts
// const inventory = new InventoryManager();

// ==================== CASO 1: CONFIGURACIÓN INICIAL ====================

function setupInitialInventory() {
    console.log('🔧 Configurando inventario inicial...');
    
    // Configurar ajustes
    inventory.updateSettings({
        minStockAlert: 10,
        maxStockLevel: 1000,
        currencySymbol: '$',
        enableNotifications: true
    });
    
    // Agregar categorías personalizadas
    inventory.addCategory('Electrónica', '#FF6B6B');
    inventory.addCategory('Ropa y Accesorios', '#4ECDC4');
    inventory.addCategory('Alimentos', '#FFE66D');
    inventory.addCategory('Libros', '#95E1D3');
    
    console.log('✅ Configuración completada');
}

// setupInitialInventory();

// ==================== CASO 2: AGREGAR PRODUCTOS INICIALES ====================

function addInitialProducts() {
    console.log('📦 Agregando productos iniciales...');
    
    const products = [
        {
            name: 'Laptop HP Pavilion 15',
            sku: 'HP-PAV15-001',
            category: 'electronica',
            cost: 450,
            price: 650,
            quantity: 15,
            minStock: 5,
            maxStock: 50,
            supplier: 'HP Inc.',
            location: 'Pasillo A, Estante 1'
        },
        {
            name: 'Monitor Samsung 27"',
            sku: 'SAM-MON27-002',
            category: 'electronica',
            cost: 200,
            price: 320,
            quantity: 8,
            minStock: 3,
            maxStock: 30,
            supplier: 'Samsung',
            location: 'Pasillo A, Estante 2'
        },
        {
            name: 'Teclado Mecánico Corsair',
            sku: 'COR-KB-003',
            category: 'electronica',
            cost: 120,
            price: 180,
            quantity: 20,
            minStock: 10,
            maxStock: 100,
            supplier: 'Corsair Gaming',
            location: 'Pasillo B, Estante 1'
        },
        {
            name: 'Ratón Inalámbrico Logitech',
            sku: 'LOG-MS-004',
            category: 'electronica',
            cost: 25,
            price: 45,
            quantity: 50,
            minStock: 20,
            maxStock: 200,
            supplier: 'Logitech',
            location: 'Pasillo B, Estante 2'
        },
        {
            name: 'Jeans Premium',
            sku: 'LV-JNS-001',
            category: 'ropa',
            cost: 30,
            price: 70,
            quantity: 40,
            minStock: 15,
            maxStock: 150,
            supplier: 'Levi\'s',
            location: 'Pasillo C, Estante 1'
        },
        {
            name: 'Camisa de Algodón',
            sku: 'COL-SHT-001',
            category: 'ropa',
            cost: 15,
            price: 35,
            quantity: 60,
            minStock: 20,
            maxStock: 300,
            supplier: 'Columbia',
            location: 'Pasillo C, Estante 2'
        }
    ];
    
    products.forEach((productData, index) => {
        try {
            const product = inventory.addProduct(productData);
            console.log(`✅ ${index + 1}. ${product.name} agregado`);
        } catch (error) {
            console.error(`❌ Error agregando producto:`, error);
        }
    });
    
    console.log('✅ Productos iniciales completados');
}

// addInitialProducts();

// ==================== CASO 3: REGISTRAR COMPRA A PROVEEDOR ====================

function registerSupplierPurchase(orderId, supplierName, items) {
    console.log(`📥 Registrando compra del proveedor: ${supplierName}`);
    
    // items = [
    //     { productId: 'PRD-xxx', quantity: 10 },
    //     { productId: 'PRD-yyy', quantity: 5 }
    // ]
    
    items.forEach(item => {
        const result = inventory.increaseStock(
            item.productId,
            item.quantity,
            `Compra a ${supplierName}`,
            orderId
        );
        
        const product = inventory.getProductById(item.productId);
        console.log(`✅ ${product.name}: +${item.quantity} unidades`);
    });
    
    console.log(`✅ Compra ${orderId} registrada completamente`);
}

// Ejemplo de uso:
// registerSupplierPurchase('ORD-2024-001', 'HP Inc.', [
//     { productId: 'PRD-xxx', quantity: 10 },
//     { productId: 'PRD-yyy', quantity: 5 }
// ]);

// ==================== CASO 4: PROCESAR VENTA ====================

function processSale(orderId, customer, saleItems) {
    console.log(`🛒 Procesando venta: ${orderId} para ${customer}`);
    
    // saleItems = [
    //     { productId: 'PRD-xxx', quantity: 2 },
    //     { productId: 'PRD-yyy', quantity: 1 }
    // ]
    
    let totalSale = 0;
    const saleDetails = [];
    
    for (const item of saleItems) {
        const product = inventory.getProductById(item.productId);
        
        if (!product) {
            console.error(`❌ Producto no encontrado: ${item.productId}`);
            continue;
        }
        
        // Verificar stock
        if (product.quantity < item.quantity) {
            console.warn(`⚠️ Stock insuficiente de ${product.name}`);
            console.warn(`   Disponible: ${product.quantity}, Solicitado: ${item.quantity}`);
            continue;
        }
        
        // Disminuir stock
        const result = inventory.decreaseStock(
            item.productId,
            item.quantity,
            'Venta',
            orderId
        );
        
        const itemTotal = item.quantity * product.price;
        totalSale += itemTotal;
        
        saleDetails.push({
            product: product.name,
            quantity: item.quantity,
            unitPrice: product.price,
            subtotal: itemTotal
        });
        
        console.log(`✅ ${product.name}: ${item.quantity}x$${product.price} = $${itemTotal}`);
    }
    
    console.log(`\n💰 Total de venta: $${totalSale.toFixed(2)}`);
    console.log(`✅ Venta ${orderId} completada\n`);
    
    return { orderId, customer, totalSale, details: saleDetails };
}

// Ejemplo de uso:
// processSale('ORD-2024-100', 'Juan García', [
//     { productId: 'PRD-xxx', quantity: 2 },
//     { productId: 'PRD-yyy', quantity: 1 }
// ]);

// ==================== CASO 5: AJUSTE DE INVENTARIO (CORRECCIÓN) ====================

function physicalInventoryCount(countResults) {
    console.log('📋 Realizando ajuste por conteo físico...');
    
    // countResults = [
    //     { productId: 'PRD-xxx', physicalCount: 10 },
    //     { productId: 'PRD-yyy', physicalCount: 5 }
    // ]
    
    countResults.forEach(result => {
        const product = inventory.getProductById(result.productId);
        const systemCount = product.quantity;
        const physicalCount = result.physicalCount;
        const difference = physicalCount - systemCount;
        
        if (difference !== 0) {
            inventory.adjustStock(
                result.productId,
                physicalCount,
                `Corrección por conteo físico. Sistema: ${systemCount}, Físico: ${physicalCount}`
            );
            
            const status = difference > 0 ? 'excedente' : 'faltante';
            console.log(`⚠️ ${product.name}: ${status} de ${Math.abs(difference)} unidades`);
        } else {
            console.log(`✅ ${product.name}: OK (${systemCount} unidades)`);
        }
    });
    
    console.log('✅ Ajuste de inventario completado');
}

// Ejemplo:
// physicalInventoryCount([
//     { productId: 'PRD-xxx', physicalCount: 10 },
//     { productId: 'PRD-yyy', physicalCount: 5 }
// ]);

// ==================== CASO 6: ALERTAS DE STOCK BAJO ====================

function checkLowStockAndGenerateOrders() {
    console.log('🔍 Verificando stock bajo...');
    
    const lowStockProducts = inventory.getLowStockProducts();
    const criticalProducts = inventory.getCriticalStockProducts();
    
    if (lowStockProducts.length === 0 && criticalProducts.length === 0) {
        console.log('✅ Todos los productos tienen stock adecuado');
        return;
    }
    
    console.log('\n⚠️ ALERTAS DE STOCK BAJO:');
    lowStockProducts.forEach(product => {
        const needed = product.maxStock - product.quantity;
        console.log(`  • ${product.name}`);
        console.log(`    Stock: ${product.quantity}/${product.minStock}-${product.maxStock}`);
        console.log(`    Reorden sugerido: ${needed} unidades`);
        console.log(`    Proveedor: ${product.supplier}`);
    });
    
    console.log('\n🔴 ALERTAS CRÍTICAS (AGOTADO):');
    criticalProducts.forEach(product => {
        console.log(`  • ${product.name} - STOCK AGOTADO`);
        console.log(`    Proveedor: ${product.supplier}`);
    });
    
    // Aquí podrías generar órdenes de compra automáticas
}

// checkLowStockAndGenerateOrders();

// ==================== CASO 7: REPORTE DE VENTAS DIARIAS ====================

function generateDailySalesReport(date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`📊 REPORTE DE VENTAS: ${date}`);
    console.log('='.repeat(60));
    
    const movements = inventory.getMovementsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
    );
    
    const sales = movements.filter(m => m.type === 'disminucion');
    
    let totalRevenue = 0;
    let totalUnits = 0;
    
    sales.forEach(sale => {
        const product = inventory.getProductById(sale.productId);
        const revenue = Math.abs(sale.quantity) * product.price;
        totalRevenue += revenue;
        totalUnits += Math.abs(sale.quantity);
        
        console.log(`${product.name}: ${Math.abs(sale.quantity)} x $${product.price} = $${revenue.toFixed(2)}`);
    });
    
    console.log('='.repeat(60));
    console.log(`Total: ${totalUnits} unidades vendidas`);
    console.log(`Ingresos: $${totalRevenue.toFixed(2)}`);
    
    return { date, totalUnits, totalRevenue, sales };
}

// generateDailySalesReport('2024-01-15');

// ==================== CASO 8: ANÁLISIS DE ROTACIÓN ====================

function analyzeInventoryRotation() {
    console.log('📈 ANÁLISIS DE ROTACIÓN DE INVENTARIO');
    console.log('='.repeat(60));
    
    const products = inventory.getAllProducts();
    const rotationData = products.map(product => {
        const costInvested = product.quantity * product.cost;
        const costSold = product.totalSold * product.cost;
        const rotation = costInvested > 0 ? (costSold / costInvested) : 0;
        
        return {
            name: product.name,
            stock: product.quantity,
            sold: product.totalSold,
            rotation: rotation.toFixed(2),
            status: rotation > 1 ? 'Buena' : rotation > 0.5 ? 'Media' : 'Baja'
        };
    });
    
    // Ordenar por rotación descendente
    rotationData.sort((a, b) => b.rotation - a.rotation);
    
    console.table(rotationData);
    
    return rotationData;
}

// analyzeInventoryRotation();

// ==================== CASO 9: ESTADÍSTICAS POR CATEGORÍA ====================

function generateCategoryReport() {
    console.log('📂 REPORTE POR CATEGORÍA');
    console.log('='.repeat(80));
    
    const analysis = inventory.getCategoryAnalysis();
    
    Object.entries(analysis).forEach(([key, category]) => {
        console.log(`\n${category.name}`);
        console.log('-'.repeat(40));
        console.log(`  Productos: ${category.totalProducts}`);
        console.log(`  Stock Total: ${category.totalQuantity} unidades`);
        console.log(`  Valor en Inventario: $${category.totalValue.toFixed(2)}`);
        console.log(`  Ingresos Generados: $${category.totalRevenue.toFixed(2)}`);
        console.log(`  Precio Promedio: $${category.averagePrice.toFixed(2)}`);
    });
}

// generateCategoryReport();

// ==================== CASO 10: EXPORTAR Y RESPALDAR ====================

function backupAndExport() {
    console.log('💾 Realizando respaldo y exportación...');
    
    // 1. Crear copia de seguridad
    const backup = inventory.createBackup();
    const backupJson = JSON.stringify(backup, null, 2);
    
    // Guardar backup con timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    localStorage.setItem(`inventory-backup-${timestamp}`, backupJson);
    console.log(`✅ Copia de seguridad creada: backup-${timestamp}`);
    
    // 2. Exportar a CSV
    const csv = inventory.convertToCSV(inventory.getAllProducts());
    console.log('✅ CSV generado');
    
    // 3. Exportar reporte completo
    const report = inventory.generateInventoryReport();
    const reportJson = JSON.stringify(report, null, 2);
    console.log('✅ Reporte JSON generado');
    
    // 4. En una aplicación real, aquí descargabas los archivos
    // downloadFile(backupJson, `inventory-backup-${timestamp}.json`, 'application/json');
    // downloadFile(csv, `inventory-${timestamp}.csv`, 'text/csv');
    
    return { backup, csv, report };
}

// backupAndExport();

// ==================== CASO 11: TRANSFERENCIA ENTRE ALMACENES ====================

function transferBetweenWarehouses(fromProductId, toProductId, quantity, reason) {
    console.log(`↔️ Transferencia de inventario`);
    
    const fromProduct = inventory.getProductById(fromProductId);
    const toProduct = inventory.getProductById(toProductId);
    
    if (!fromProduct || !toProduct) {
        console.error('❌ Producto no encontrado');
        return;
    }
    
    console.log(`De: ${fromProduct.name} (${fromProduct.quantity} disponibles)`);
    console.log(`Para: ${toProduct.name}`);
    console.log(`Cantidad: ${quantity} unidades`);
    
    const result = inventory.transferStock(fromProductId, toProductId, quantity, reason);
    
    if (result.error) {
        console.error(`❌ ${result.error}`);
    } else {
        console.log(`\n✅ Transferencia completada:`);
        console.log(`  ${fromProduct.name}: ${result.from.quantity}`);
        console.log(`  ${toProduct.name}: ${result.to.quantity}`);
    }
}

// transferBetweenWarehouses('PRD-xxx', 'PRD-yyy', 5, 'Rebalanceo de almacenes');

// ==================== CASO 12: AUDITORÍA DE CAMBIOS ====================

function generateAuditTrail(userId, startDate, endDate) {
    console.log(`📋 AUDITORÍA: Cambios de ${userId}`);
    console.log(`Período: ${startDate} a ${endDate}`);
    console.log('='.repeat(80));
    
    const movements = inventory.getMovementsByDateRange(startDate, endDate);
    const userMovements = movements.filter(m => m.user === userId);
    
    const summary = {
        totalMovements: userMovements.length,
        byType: {},
        affectedProducts: new Set(),
        timestamp: new Date().toISOString()
    };
    
    userMovements.forEach(movement => {
        summary.byType[movement.type] = (summary.byType[movement.type] || 0) + 1;
        summary.affectedProducts.add(movement.productId);
        
        const product = inventory.getProductById(movement.productId);
        console.log(`${new Date(movement.timestamp).toLocaleString()}`);
        console.log(`  Tipo: ${movement.type}`);
        console.log(`  Producto: ${product?.name || 'Desconocido'}`);
        console.log(`  Cantidad: ${movement.quantity}`);
        console.log(`  Razón: ${movement.reason}\n`);
    });
    
    console.log('='.repeat(80));
    console.log(`Total de movimientos: ${summary.totalMovements}`);
    console.log(`Productos afectados: ${summary.affectedProducts.size}`);
    console.table(summary.byType);
    
    return summary;
}

// generateAuditTrail('Admin', '2024-01-01', '2024-01-31');

// ==================== CASOS DE USO ADICIONALES ====================

/**
 * Sincronizar inventario con un servidor
 */
async function syncInventoryWithServer(apiUrl) {
    try {
        const data = {
            products: inventory.getAllProducts(),
            movements: inventory.getMovementHistory(),
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch(`${apiUrl}/api/inventory/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            console.log('✅ Sincronización completada con servidor');
        }
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
    }
}

/**
 * Validar código de barras y procesar venta rápida
 */
function quickSaleByBarcode(barcode) {
    const product = inventory.searchProducts(barcode)[0];
    
    if (!product) {
        console.warn(`❌ Código de barras no encontrado: ${barcode}`);
        return null;
    }
    
    if (product.quantity === 0) {
        console.warn(`❌ ${product.name} agotado`);
        return null;
    }
    
    inventory.decreaseStock(product.id, 1, 'Venta rápida');
    console.log(`✅ ${product.name} vendido - Nuevo stock: ${product.quantity}`);
    
    return product;
}

/**
 * Listar productos próximos a vencer (requiere campo expiryDate)
 */
function listExpiringProducts(daysToExpire = 30) {
    const products = inventory.getAllProducts();
    const today = new Date();
    
    const expiringProducts = products.filter(product => {
        if (!product.expiryDate) return false;
        const expiryDate = new Date(product.expiryDate);
        const daysUntilExpiry = (expiryDate - today) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= daysToExpire && daysUntilExpiry > 0;
    });
    
    console.log(`⏰ Productos próximos a vencer (en ${daysToExpire} días):`);
    console.table(expiringProducts);
    
    return expiringProducts;
}

// ==================== EXPORTAR FUNCIONES PARA USO ====================

// Aquí iría la exportación en una versión modular
// export { checkLowStockAndGenerateOrders, processSale, physicalInventoryCount, ... };
