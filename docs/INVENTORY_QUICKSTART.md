# 📦 Módulo de Inventarios - Guía Rápida de Integración

## 🚀 Inicio Rápido en 5 Minutos

### Paso 1: Copiar los archivos

Asegúrate de que tienes estos archivos en tu proyecto:

```
proyecto/
├── js/
│   ├── inventory.js          ← Lógica principal
│   └── inventory-ui.js       ← Interfaz de usuario
├── css/
│   └── inventory.css         ← Estilos
└── html/
    └── inventory.html        ← Componentes
```

### Paso 2: Incluir en tu HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tu Aplicación</title>
    
    <!-- Estilos -->
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/inventory.css">
</head>
<body>
    <!-- Aquí irá el módulo -->
    <div id="inventoryContainer"></div>
    
    <!-- Scripts -->
    <script src="js/app.js"></script>
    <script src="js/inventory.js"></script>
    <script src="js/inventory-ui.js"></script>
    
    <script>
        // Cargar el HTML del módulo
        fetch('html/inventory.html')
            .then(r => r.text())
            .then(html => {
                document.getElementById('inventoryContainer').innerHTML = html;
                initInventoryUI();
            });
    </script>
</body>
</html>
```

### Paso 3: ¡Listo! 🎉

Accede a `initInventoryUI()` para inicializar el módulo.

---

## 📊 Casos de Uso Más Comunes

### 1️⃣ Agregar un Producto

```javascript
const product = inventory.addProduct({
    name: 'Laptop Dell XPS 13',
    sku: 'DELL-XPS13-001',
    category: 'electronica',
    cost: 800,
    price: 1200,
    quantity: 10,
    minStock: 5,
    maxStock: 50,
    supplier: 'Dell Inc.'
});
```

### 2️⃣ Registrar una Venta

```javascript
// Disminuir stock
inventory.decreaseStock(
    'PRD-xxx',      // ID del producto
    2,              // Cantidad vendida
    'Venta',        // Razón
    'ORD-12345'     // Número de orden
);
```

### 3️⃣ Registrar una Compra

```javascript
// Aumentar stock
inventory.increaseStock(
    'PRD-xxx',              // ID del producto
    20,                     // Cantidad comprada
    'Compra a proveedor',   // Razón
    'OC-67890'              // Número de compra
);
```

### 4️⃣ Ver Productos con Stock Bajo

```javascript
const lowStock = inventory.getLowStockProducts();
lowStock.forEach(product => {
    console.log(`${product.name}: ${product.quantity}/${product.minStock}`);
});
```

### 5️⃣ Obtener Dashboard

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

### 6️⃣ Generar Reporte

```javascript
const report = inventory.generateInventoryReport();
console.log(JSON.stringify(report, null, 2));
```

### 7️⃣ Buscar Productos

```javascript
const results = inventory.searchProducts('Dell');
// Busca en nombre, SKU y código de barras
```

### 8️⃣ Ver Historial de Movimientos

```javascript
const movements = inventory.getMovementHistory('PRD-xxx');
movements.forEach(m => {
    console.log(`${m.timestamp}: ${m.type} (${m.quantity})`);
});
```

### 9️⃣ Ajuste Manual

```javascript
inventory.adjustStock(
    'PRD-xxx',
    25,
    'Corrección por conteo físico'
);
```

### 🔟 Exportar Datos

```javascript
// A CSV
const csv = inventory.convertToCSV(inventory.getAllProducts());
downloadFile(csv, 'inventario.csv', 'text/csv');

// A JSON
const json = inventory.exportToJSON();
downloadFile(json, 'inventario.json', 'application/json');
```

---

## 🎛️ Controles de la Interfaz

### Modales que Puedes Abrir

```javascript
// Agregar/Editar producto
openInventoryModal('addProduct');

// Ajustar stock
openInventoryModal('adjustStock');

// Ver reporte
showInventoryReport();
```

### Cambiar de Tab

```javascript
switchInventoryTab('dashboard');   // Panel de control
switchInventoryTab('products');    // Tabla de productos
switchInventoryTab('movements');   // Historial
switchInventoryTab('alerts');      // Alertas
switchInventoryTab('settings');    // Configuración
```

---

## 💾 Guardar y Restaurar

### Crear Copia de Seguridad

```javascript
const backup = inventory.createBackup();
const json = JSON.stringify(backup);
// Guardar en localStorage, servidor, o descargar
localStorage.setItem('mi-backup', json);
```

### Restaurar desde Copia

```javascript
const backup = JSON.parse(localStorage.getItem('mi-backup'));
inventory.restoreFromBackup(backup);
```

---

## ⚙️ Configuración

### Cambiar Ajustes

```javascript
inventory.updateSettings({
    minStockAlert: 10,           // Cantidad mínima para alerta
    maxStockLevel: 1000,         // Máximo permitido
    currencySymbol: '$',         // Símbolo de moneda
    enableNotifications: true    // Mostrar notificaciones
});
```

### Obtener Configuración

```javascript
const settings = inventory.getSettings();
console.log(settings);
```

---

## 📊 Análisis y Reportes

### Top 10 Productos Más Vendidos

```javascript
const topProducts = inventory.getTopSellingProducts(10);
topProducts.forEach(p => {
    console.log(`${p.name}: ${p.totalSold} vendidos`);
});
```

### Productos Sin Movimiento

```javascript
const slowMoving = inventory.getSlowMovingProducts();
```

### Análisis por Categoría

```javascript
const analysis = inventory.getCategoryAnalysis();
Object.entries(analysis).forEach(([key, cat]) => {
    console.log(`${cat.name}: $${cat.totalValue.toFixed(2)}`);
});
```

### Valor Total del Inventario

```javascript
const totalValue = inventory.calculateTotalInventoryValue();
console.log(`Valor total: $${totalValue.toFixed(2)}`);
```

---

## 🔔 Eventos

### Escuchar Cambios

```javascript
window.addEventListener('inventoryChanged', (event) => {
    console.log('Inventario cambió:', event.detail);
    // Actualizar UI, enviar notificación, etc.
});
```

---

## 🚨 Manejo de Errores

### Validar Antes de Operar

```javascript
const product = inventory.getProductById('PRD-xxx');

if (!product) {
    console.error('Producto no encontrado');
    return;
}

if (product.quantity < 5) {
    console.warn('Stock insuficiente');
    return;
}

inventory.decreaseStock('PRD-xxx', 5);
```

### Capturar Errores de Stock

```javascript
const result = inventory.decreaseStock('PRD-xxx', 100);

if (result.error) {
    console.error(`Error: ${result.error}`);
    console.log(`Stock disponible: ${result.available}`);
} else {
    console.log(`Nuevo stock: ${result.newQuantity}`);
}
```

---

## 📱 Responsive Design

El módulo se adapta automáticamente a:

- **Escritorio**: 1200px+ (vista completa)
- **Tablet**: 768px - 1199px (tabla comprimida)
- **Móvil**: < 768px (vista optimizada)

---

## 🎨 Personalización

### Cambiar Colores

Edita las variables CSS en `inventory.css`:

```css
:root {
    --inventory-primary: #800b96;    /* Color principal */
    --inventory-success: #28a745;    /* Verde */
    --inventory-warning: #ffc107;    /* Amarillo */
    --inventory-danger: #dc3545;     /* Rojo */
    --inventory-info: #17a2b8;       /* Azul */
}
```

### Agregar Categorías

```javascript
inventory.addCategory('Mi Categoría', '#FF5733');
```

---

## 📝 Tips y Trucos

### 1. Auto-refresh del Dashboard

```javascript
setInterval(() => {
    loadInventoryDashboard();
}, 5000); // Cada 5 segundos
```

### 2. Búsqueda en Tiempo Real

```javascript
const input = document.getElementById('productSearch');
input.addEventListener('input', (e) => {
    const results = inventory.searchProducts(e.target.value);
    console.log('Resultados:', results);
});
```

### 3. Generar Órdenes Automáticas

```javascript
function autoGenerateOrders() {
    const lowStock = inventory.getLowStockProducts();
    
    lowStock.forEach(product => {
        const needed = product.maxStock - product.quantity;
        console.log(`Crear orden: ${product.name} x ${needed}`);
        // aquí integrar con tu sistema de órdenes
    });
}

// Ejecutar cada mañana a las 6am
const now = new Date();
const target = new Date();
target.setHours(6, 0, 0, 0);
if (target <= now) target.setDate(target.getDate() + 1);

const timeout = target - now;
setTimeout(() => {
    autoGenerateOrders();
    setInterval(autoGenerateOrders, 24 * 60 * 60 * 1000);
}, timeout);
```

### 4. Sincronizar con Servidor

```javascript
async function syncWithServer() {
    const data = {
        products: inventory.getAllProducts(),
        movements: inventory.getMovementHistory(),
        timestamp: new Date().toISOString()
    };
    
    try {
        await fetch('/api/inventory/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log('✅ Sincronizado');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Sincronizar cada 30 minutos
setInterval(syncWithServer, 30 * 60 * 1000);
```

---

## 🐛 Troubleshooting

### Los datos no se guardan

```javascript
// Verificar si localStorage está disponible
if (typeof(Storage) !== 'undefined') {
    console.log('✅ localStorage disponible');
} else {
    console.error('❌ localStorage no disponible');
}
```

### La interfaz no carga

```javascript
// Verificar que los archivos CSS y JS se hayan cargado
console.log('inventory' in window ? '✅ inventory.js cargado' : '❌ Falta inventory.js');
console.log('InventoryManager' in window ? '✅ Clase disponible' : '❌ Clase no disponible');
```

### Datos inconsistentes

```javascript
// Generar reporte para diagnosticar
const report = inventory.generateInventoryReport();
console.table(report.summary);
```

---

## 📚 Documentación Completa

Para una documentación más detallada, consulta:
- `docs/INVENTORY_GUIDE.md` - Guía completa de API
- `docs/INVENTORY_EXAMPLES.js` - Ejemplos prácticos

---

## 🆘 Soporte

Si tienes preguntas o problemas:
1. Revisa los ejemplos en `INVENTORY_EXAMPLES.js`
2. Consulta la documentación completa
3. Abre un issue en el repositorio

---

## ✅ Checklist de Implementación

- [ ] Archivos copiados al proyecto
- [ ] CSS incluido en el HTML
- [ ] Scripts cargados en orden correcto
- [ ] `initInventoryUI()` ejecutado
- [ ] Datos de prueba agregados
- [ ] Interfaz funciona correctamente
- [ ] Dashboard carga sin errores
- [ ] Modales se abren/cierran
- [ ] Búsqueda funciona
- [ ] Reportes generan correctamente

---

¡Listo para comenzar! 🚀
