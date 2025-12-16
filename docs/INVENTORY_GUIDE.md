# 📦 Módulo de Inventarios - Documentación Completa

## Descripción General

El módulo de inventarios es un sistema completo de gestión de stock diseñado para registrar, controlar y analizar productos en almacén. Incluye características avanzadas como:

- ✅ Gestión de productos y categorías
- ✅ Control de stock en tiempo real
- ✅ Registro detallado de movimientos
- ✅ Alertas automáticas de stock bajo
- ✅ Reportes y análisis de inventario
- ✅ Copias de seguridad y exportación
- ✅ Interfaz responsiva y moderna

---

## 📁 Estructura de Archivos

```
proyecto/
├── js/
│   ├── inventory.js          # Lógica principal del inventario (InventoryManager)
│   ├── inventory-ui.js       # Gestor de interfaz de usuario
│
├── css/
│   ├── inventory.css         # Estilos del módulo
│
├── html/
│   └── inventory.html        # Componentes HTML del módulo
│
└── docs/
    └── INVENTORY_GUIDE.md    # Esta documentación
```

---

## 🚀 Instalación

### 1. Incluir los archivos en tu HTML

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Estilos -->
    <link rel="stylesheet" href="css/inventory.css">
</head>
<body>
    <!-- Contenido -->
    <div id="app"></div>
    
    <!-- Scripts -->
    <script src="js/inventory.js"></script>
    <script src="js/inventory-ui.js"></script>
    
    <!-- Incluir el HTML del módulo -->
    <script>
        fetch('html/inventory.html')
            .then(r => r.text())
            .then(html => {
                document.getElementById('app').innerHTML = html;
                initInventoryUI();
            });
    </script>
</body>
</html>
```

### 2. Alternativa: Copiar HTML directamente

```html
<head>
    <link rel="stylesheet" href="css/inventory.css">
</head>
<body>
    <!-- Copiar contenido de inventory.html aquí -->
    
    <script src="js/inventory.js"></script>
    <script src="js/inventory-ui.js"></script>
</body>
</html>
```

---

## 📚 Guía de Uso de la API

### Clase: InventoryManager

La clase principal que maneja toda la lógica del inventario.

#### Inicialización

```javascript
// La instancia se crea automáticamente
const inventory = new InventoryManager();
```

---

### 1. GESTIÓN DE PRODUCTOS

#### Agregar un nuevo producto

```javascript
const newProduct = inventory.addProduct({
    name: 'Laptop Dell XPS 13',
    sku: 'DELL-XPS13-001',
    category: 'electronica',
    description: 'Laptop ultraportátil de 13 pulgadas',
    cost: 800,              // Costo unitario
    price: 1200,            // Precio de venta
    quantity: 10,           // Stock inicial
    minStock: 5,            // Alerta cuando llegue a 5
    maxStock: 50,           // Máximo permitido
    unit: 'Unidad',
    supplier: 'Dell Inc.',
    location: 'Pasillo A, Estante 2',
    barcode: '8801234567890'
});
```

#### Obtener productos

```javascript
// Todos los productos
const allProducts = inventory.getAllProducts();

// Por categoría
const electronics = inventory.getProductsByCategory('electronica');

// Búsqueda por nombre, SKU o código de barras
const results = inventory.searchProducts('Dell XPS');
```

#### Actualizar producto

```javascript
inventory.updateProduct('PRD-xxx', {
    name: 'Nuevo nombre',
    price: 1300,
    supplier: 'Nuevo proveedor'
});
```

#### Eliminar producto

```javascript
inventory.deleteProduct('PRD-xxx');
```

---

### 2. GESTIÓN DE STOCK

#### Aumentar stock (entrada)

```javascript
const result = inventory.increaseStock(
    'PRD-xxx',              // ID del producto
    5,                      // Cantidad
    'Compra a proveedor',   // Razón
    'Dell Inc.'             // Proveedor
);

console.log(result);
// { oldQuantity: 10, newQuantity: 15, product: {...} }
```

#### Disminuir stock (salida/venta)

```javascript
const result = inventory.decreaseStock(
    'PRD-xxx',              // ID del producto
    2,                      // Cantidad
    'Venta a cliente',      // Razón
    'ORD-12345'             // ID de orden
);

if (result.error) {
    console.log('Error:', result.error);
} else {
    console.log('Stock actual:', result.newQuantity);
}
```

#### Ajuste manual de stock

```javascript
const result = inventory.adjustStock(
    'PRD-xxx',              // ID del producto
    25,                     // Nuevo stock (no diferencia)
    'Corrección de inventario'
);

console.log(result);
// { oldQuantity: 15, newQuantity: 25, difference: 10, product: {...} }
```

#### Transferir entre productos

```javascript
const result = inventory.transferStock(
    'PRD-XXX',              // Desde
    'PRD-YYY',              // Hacia
    5,                      // Cantidad
    'Reembalaje'            // Razón
);
```

---

### 3. ALERTAS DE STOCK

#### Productos con stock bajo

```javascript
const lowStockProducts = inventory.getLowStockProducts();
lowStockProducts.forEach(product => {
    console.log(`${product.name}: ${product.quantity}/${product.minStock}`);
});
```

#### Productos agotados

```javascript
const criticalProducts = inventory.getCriticalStockProducts();
```

#### Productos con exceso de stock

```javascript
const overstockedProducts = inventory.getOverstockedProducts();
```

#### Estado general de stock

```javascript
const status = inventory.getStockStatus();
console.log(status);
// {
//   totalProducts: 50,
//   activeProducts: 48,
//   lowStock: 5,
//   criticalStock: 2,
//   overstocked: 1,
//   totalValue: 50000.00
// }
```

---

### 4. MOVIMIENTOS E HISTORIAL

#### Obtener historial de movimientos

```javascript
// Últimos 100 movimientos
const movements = inventory.getMovementHistory();

// De un producto específico
const productMovements = inventory.getMovementHistory('PRD-xxx', 50);

// Formato de movimiento:
// {
//   id: 'MOV-xxx',
//   type: 'aumento|disminucion|ajuste|transferencia|crear_producto|eliminar_producto',
//   productId: 'PRD-xxx',
//   quantity: 5,
//   reason: 'Razón del movimiento',
//   user: 'Usuario',
//   timestamp: 'ISO-8601',
//   relatedId: 'ID relacionado (orden, proveedor, etc)'
// }
```

#### Movimientos por rango de fechas

```javascript
const movements = inventory.getMovementsByDateRange(
    '2024-01-01',
    '2024-12-31'
);
```

---

### 5. REPORTES Y ANÁLISIS

#### Productos más vendidos

```javascript
const topProducts = inventory.getTopSellingProducts(10);
topProducts.forEach(product => {
    console.log(`${product.name}: ${product.totalSold} vendidos`);
});
```

#### Productos sin movimiento

```javascript
const slowMoving = inventory.getSlowMovingProducts();
```

#### Rotación de inventario

```javascript
const rotation = inventory.calculateInventoryRotation('PRD-xxx');
console.log(`Rotación: ${(rotation * 100).toFixed(2)}%`);
```

#### Análisis por categoría

```javascript
const analysis = inventory.getCategoryAnalysis();
Object.entries(analysis).forEach(([key, category]) => {
    console.log(`${category.name}:`);
    console.log(`  Productos: ${category.totalProducts}`);
    console.log(`  Stock Total: ${category.totalQuantity}`);
    console.log(`  Valor: $${category.totalValue.toFixed(2)}`);
    console.log(`  Ingresos: $${category.totalRevenue.toFixed(2)}`);
});
```

#### Reporte completo

```javascript
const report = inventory.generateInventoryReport('json');
// Contiene: resumen, análisis por categoría, productos, movimientos
```

---

### 6. CONFIGURACIÓN

#### Obtener configuración actual

```javascript
const settings = inventory.getSettings();
console.log(settings);
// {
//   minStockAlert: 5,
//   maxStockLevel: 1000,
//   currencySymbol: '$',
//   enableNotifications: true
// }
```

#### Actualizar configuración

```javascript
inventory.updateSettings({
    minStockAlert: 10,
    currencySymbol: '€',
    enableNotifications: false
});
```

#### Gestionar categorías

```javascript
// Obtener todas
const categories = inventory.getCategories();

// Agregar nueva
inventory.addCategory('Servicios', '#FF5733');

// Eliminar
inventory.categories = inventory.categories.filter(c => c.id !== 'id-a-eliminar');
inventory.saveToLocalStorage('inventory_categories', inventory.categories);
```

---

### 7. EXPORTACIÓN Y RESPALDOS

#### Exportar a CSV

```javascript
const csv = inventory.convertToCSV(inventory.getAllProducts());
console.log(csv);
```

#### Exportar a JSON

```javascript
const json = inventory.exportToJSON();
```

#### Crear copia de seguridad

```javascript
const backup = inventory.createBackup();
console.log(JSON.stringify(backup, null, 2));
```

#### Restaurar desde copia de seguridad

```javascript
const backup = {...}; // Datos de copia de seguridad
inventory.restoreFromBackup(backup);
```

---

## 🎨 Interfaz de Usuario

### Tabs Principales

1. **Dashboard**: Estadísticas y resumen de inventario
2. **Productos**: Tabla con todos los productos
3. **Movimientos**: Historial de todas las transacciones
4. **Alertas**: Notificaciones de stock
5. **Configuración**: Ajustes del sistema

### Modales

#### Agregar/Editar Producto
```javascript
openInventoryModal('addProduct');
```

#### Ajustar Stock
```javascript
openInventoryModal('adjustStock');
```

#### Ver Reporte
```javascript
openInventoryModal('report');
showInventoryReport();
```

---

## 📊 Estructura de Datos

### Producto

```javascript
{
    id: 'PRD-xxxxxx',
    name: 'Nombre del Producto',
    sku: 'SKU-12345',
    category: 'electronica',
    description: 'Descripción',
    cost: 100.00,           // Costo de compra
    price: 150.00,          // Precio de venta
    quantity: 50,           // Stock actual
    minStock: 5,            // Mínimo antes de alerta
    maxStock: 500,          // Máximo permitido
    unit: 'Unidad',         // Unidad de medida
    supplier: 'Proveedor',
    location: 'Ubicación',
    barcode: 'código',
    status: 'activo',       // activo|inactivo|descontinuado
    createdAt: 'ISO-8601',
    updatedAt: 'ISO-8601',
    lastRestockDate: 'ISO-8601',
    totalSold: 100,         // Unidades vendidas en total
    totalCost: 10000.00     // Costo total invertido
}
```

### Movimiento

```javascript
{
    id: 'MOV-xxxxxx',
    type: 'aumento',        // Tipo de movimiento
    productId: 'PRD-xxx',
    quantity: 10,           // Cantidad (+/-)
    reason: 'Razón',
    relatedId: 'ID externo',
    user: 'Usuario',
    timestamp: 'ISO-8601',
    notes: 'Notas adicionales'
}
```

---

## 🔧 Ejemplos Prácticos

### Ejemplo 1: Sistema de Reorden Automático

```javascript
function checkAndReorderLowStock() {
    const lowStockProducts = inventory.getLowStockProducts();
    
    lowStockProducts.forEach(product => {
        const reorderQuantity = product.maxStock - product.quantity;
        
        console.log(`Reorden necesario para ${product.name}`);
        console.log(`Cantidad sugerida: ${reorderQuantity}`);
        
        // Aquí podrías generar una orden de compra automática
        // generatePurchaseOrder(product.id, reorderQuantity, product.supplier);
    });
}

checkAndReorderLowStock();
```

### Ejemplo 2: Análisis de Rentabilidad

```javascript
function analyzeProductProfitability() {
    const products = inventory.getAllProducts();
    
    const profitAnalysis = products.map(product => {
        const costInvested = product.quantity * product.cost;
        const revenue = product.totalSold * product.price;
        const profit = revenue - (product.totalSold * product.cost);
        const margin = product.price - product.cost;
        
        return {
            name: product.name,
            unitMargin: margin,
            marginPercent: (margin / product.cost * 100).toFixed(2),
            totalProfit: profit,
            totalRevenue: revenue,
            roi: ((profit / costInvested) * 100).toFixed(2)
        };
    });
    
    return profitAnalysis.sort((a, b) => b.totalProfit - a.totalProfit);
}

console.table(analyzeProductProfitability());
```

### Ejemplo 3: Alertas Personalizadas

```javascript
function setupInventoryAlerts() {
    // Monitorear cambios
    window.addEventListener('inventoryChanged', (event) => {
        const { product, change } = event.detail;
        
        if (product.quantity <= product.minStock) {
            sendAlert(`⚠️ Stock bajo: ${product.name}`);
        }
        
        if (product.quantity === 0) {
            sendAlert(`🔴 AGOTADO: ${product.name}`);
        }
        
        if (product.quantity > product.maxStock) {
            sendAlert(`📈 Sobrestocaje: ${product.name}`);
        }
    });
}

function sendAlert(message) {
    // Implementar tu sistema de alertas (email, SMS, etc)
    console.log(message);
}

setupInventoryAlerts();
```

### Ejemplo 4: Auditoría de Cambios

```javascript
function generateAuditReport(startDate, endDate) {
    const movements = inventory.getMovementsByDateRange(startDate, endDate);
    
    const auditReport = {
        period: { start: startDate, end: endDate },
        totalMovements: movements.length,
        movementsByType: {},
        movementsByUser: {},
        productsChanged: new Set()
    };
    
    movements.forEach(movement => {
        // Por tipo
        auditReport.movementsByType[movement.type] = 
            (auditReport.movementsByType[movement.type] || 0) + 1;
        
        // Por usuario
        auditReport.movementsByUser[movement.user] = 
            (auditReport.movementsByUser[movement.user] || 0) + 1;
        
        // Productos afectados
        auditReport.productsChanged.add(movement.productId);
    });
    
    auditReport.productsChanged = Array.from(auditReport.productsChanged).length;
    
    return auditReport;
}

console.table(generateAuditReport('2024-01-01', '2024-12-31'));
```

---

## 🎯 Mejores Prácticas

### 1. Validación de Datos

```javascript
function validateProduct(productData) {
    if (!productData.name || productData.name.trim() === '') {
        throw new Error('El nombre del producto es requerido');
    }
    
    if (productData.cost < 0 || productData.price < 0) {
        throw new Error('Costo y precio deben ser positivos');
    }
    
    if (productData.minStock > productData.maxStock) {
        throw new Error('Stock mínimo no puede ser mayor que máximo');
    }
    
    if (productData.quantity > productData.maxStock) {
        throw new Error('Stock inicial no puede superar máximo permitido');
    }
    
    return true;
}

try {
    validateProduct(productData);
    inventory.addProduct(productData);
} catch (error) {
    console.error('Validación fallida:', error.message);
}
```

### 2. Mantener Histórico Limpio

```javascript
function archiveOldMovements(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const oldMovements = inventory.movements.filter(m => 
        new Date(m.timestamp) < cutoffDate
    );
    
    // Guardar en archivo antes de eliminar
    downloadFile(JSON.stringify(oldMovements), 'archived-movements.json');
    
    // Limpiar
    inventory.movements = inventory.movements.filter(m => 
        new Date(m.timestamp) >= cutoffDate
    );
    inventory.saveToLocalStorage('inventory_movements', inventory.movements);
}
```

### 3. Validar Integridad de Datos

```javascript
function validateInventoryIntegrity() {
    const issues = [];
    
    inventory.getAllProducts().forEach(product => {
        // Validar campos obligatorios
        if (!product.name || !product.sku) {
            issues.push(`Producto ${product.id}: campos faltantes`);
        }
        
        // Validar limites
        if (product.quantity > product.maxStock) {
            issues.push(`${product.name}: excede máximo`);
        }
        
        // Validar precios
        if (product.price < product.cost) {
            issues.push(`${product.name}: precio menor que costo`);
        }
    });
    
    return issues;
}

const issues = validateInventoryIntegrity();
if (issues.length > 0) {
    console.warn('Problemas encontrados:', issues);
}
```

---

## 🔐 Seguridad y Respaldos

### Realizar Respaldos Automáticos

```javascript
function setupAutoBackup(intervalHours = 24) {
    setInterval(() => {
        const backup = inventory.createBackup();
        const json = JSON.stringify(backup);
        
        // Guardar en localStorage con timestamp
        localStorage.setItem(
            `inventory-backup-${new Date().toISOString()}`,
            json
        );
        
        console.log('✅ Respaldo automático completado');
    }, intervalHours * 60 * 60 * 1000);
}

setupAutoBackup(24); // Cada 24 horas
```

### Sincronizar con Servidor

```javascript
async function syncInventoryToServer() {
    const data = {
        products: inventory.getAllProducts(),
        movements: inventory.getMovementHistory(),
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/inventory/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            console.log('✅ Sincronización completada');
        }
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
    }
}

// Sincronizar cada 30 minutos
setInterval(syncInventoryToServer, 30 * 60 * 1000);
```

---

## 📱 Soporte Responsivo

El módulo incluye estilos responsivos para:
- Escritorio (1200px+)
- Tablet (768px - 1199px)
- Móvil (< 768px)

---

## 🐛 Troubleshooting

### Los datos no se guardan

Verifica que `localStorage` esté habilitado en el navegador.

```javascript
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}
```

### Datos inconsistentes

Ejecuta validación de integridad:

```javascript
inventory.generateInventoryReport();
// Revisa los datos en el reporte
```

---

## 📞 Soporte

Para reportar problemas o solicitar nuevas características, contacta al equipo de desarrollo.

---

## 📄 Licencia

Todos los derechos reservados © 2024
