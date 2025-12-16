# 📐 Diagrama de Estructura del Módulo de Inventarios

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     APLICACIÓN WEB                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  INTERFAZ (UI)   │      │   API EXTERNA    │                │
│  │  inventory-ui.js │      │    (Servidor)    │                │
│  └────────┬─────────┘      └──────────────────┘                │
│           │                                                     │
│           └────────────┬───────────────────┬────────────┐      │
│                        │                   │            │      │
│           ┌────────────▼──────────┐        │            │      │
│           │  InventoryManager     │        │            │      │
│           │  (inventory.js)       │        │            │      │
│           │                       │        │            │      │
│           │ • addProduct()        │        │            │      │
│           │ • decreaseStock()     │        │            │      │
│           │ • increaseStock()     │        │            │      │
│           │ • getReports()        │        │            │      │
│           │ • ...                 │        │            │      │
│           └────────────┬──────────┘        │            │      │
│                        │                   │            │      │
│           ┌────────────▼──────────┐        │            │      │
│           │   LocalStorage API    │◄───────┴────────────┘      │
│           │   (Almacenamiento)    │                             │
│           └──────────────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💾 Estructura de Datos en LocalStorage

```
localStorage
│
├─ inventory_products           [Array de Productos]
│  ├─ PRD-001
│  │  ├─ id: "PRD-001"
│  │  ├─ name: "Laptop Dell XPS"
│  │  ├─ sku: "DELL-XPS13-001"
│  │  ├─ category: "electronica"
│  │  ├─ cost: 800
│  │  ├─ price: 1200
│  │  ├─ quantity: 10
│  │  ├─ minStock: 5
│  │  ├─ maxStock: 50
│  │  ├─ ...
│  │
│  ├─ PRD-002
│  │  └─ [Similar]
│  │
│  └─ ...
│
├─ inventory_movements         [Array de Movimientos]
│  ├─ MOV-001
│  │  ├─ id: "MOV-001"
│  │  ├─ type: "aumento"
│  │  ├─ productId: "PRD-001"
│  │  ├─ quantity: 10
│  │  ├─ reason: "Compra a proveedor"
│  │  ├─ timestamp: "2024-01-15T10:30:00Z"
│  │  └─ user: "Admin"
│  │
│  └─ ...
│
├─ inventory_categories        [Array de Categorías]
│  ├─ electronica
│  ├─ ropa
│  ├─ accesorios
│  └─ ...
│
└─ inventory_settings          [Objeto de Configuración]
   ├─ minStockAlert: 5
   ├─ maxStockLevel: 1000
   ├─ currencySymbol: "$"
   └─ enableNotifications: true
```

---

## 🔄 Flujo de Datos - Venta de Producto

```
Usuario Selecciona Producto
        │
        ▼
┌──────────────────────────┐
│ openInventoryModal()     │
│ (Abre modal de venta)    │
└────────────┬─────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Usuario ingresa:   │
    │ • Producto         │
    │ • Cantidad         │
    │ • Razón            │
    │ • Orden (opcional) │
    └────────┬───────────┘
             │
             ▼
┌──────────────────────────────────┐
│ handleAdjustStockSubmit()         │
│ (Valida datos del formulario)    │
└────────────┬─────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ Validar stock:         │
    │ ¿Hay cantidad sufic.?  │
    └────────┬───────────────┘
             │
      ┌──────┴──────┐
      │             │
   NO ▼             ▼ SI
    Error      ┌─────────────────────────┐
    │          │ inventory.decreaseStock()│
    │          │ • Reduce quantity       │
    │          │ • Actualiza updatedAt  │
    │          │ • Incrementa totalSold │
    │          └──────────┬──────────────┘
    │                     │
    │          ┌──────────▼──────────┐
    │          │ logMovement()        │
    │          │ • Registra en array │
    │          │ • Tipo: "disminucion"│
    │          │ • Crea MOV-xxx      │
    │          └──────────┬──────────┘
    │                     │
    │          ┌──────────▼──────────┐
    │          │ saveToLocalStorage() │
    │          │ • Guarda products  │
    │          │ • Guarda movements │
    │          └──────────┬──────────┘
    │                     │
    │          ┌──────────▼──────────┐
    │          │ emitInventoryChange()│
    │          │ (Dispara evento)     │
    │          └──────────┬──────────┘
    │                     │
    │          ┌──────────▼──────────┐
    │          │ Actualizar UI:       │
    │          │ • Tabla de productos │
    │          │ • Dashboard         │
    │          │ • Historial        │
    │          └──────────┬──────────┘
    │                     │
    └─────────┬───────────┘
              │
              ▼
        Mostrar éxito
        ✅ "Venta registrada"
```

---

## 🔄 Flujo de Datos - Entrada de Compra

```
Recibir mercancía del proveedor
        │
        ▼
   Escanear código de barras
        │
        ▼
    inventory.searchProducts(barcode)
        │
        ▼
¿Producto encontrado?
    │
    ├─ NO: Mostrar error
    │
    └─ SI:
        │
        ▼
    inventory.increaseStock()
        │
        ├─ Aumentar quantity
        ├─ Actualizar lastRestockDate
        ├─ Registrar movimiento
        │
        ▼
    Actualizar localStorage
        │
        ▼
    ✅ Confirmación visual
```

---

## 📊 Diagrama de Relaciones de Datos

```
PRODUCTOS
┌─────────────────────────────────────┐
│ PRD-001                             │
│ ├─ name: Laptop                     │
│ ├─ sku: DELL-XPS13                  │
│ ├─ category: electronica       ◄────┼───────┐
│ ├─ quantity: 10                     │       │
│ ├─ minStock: 5                      │       │
│ ├─ maxStock: 50                     │       │
│ ├─ cost: 800                        │       │
│ ├─ price: 1200                      │       │
│ └─ totalSold: 100                   │       │
└─────────────────────────────────────┘       │
           △                                  │
           │ referencia                      │
           │                                 │
     MOVIMIENTOS                        CATEGORÍAS
     ┌────────────┐                    ┌──────────────┐
     │ MOV-001    │                    │ electronica  │
     │ productId: ┼────────────┐       │ name: "..."  │
     │ PRD-001    │            │       │ color: "..." │
     │ quantity:+10            │       └──────────────┘
     │ timestamp: ...          │
     └────────────┘            │
                               │
     ┌────────────┐            │
     │ MOV-002    │            │
     │ productId: ┼────────────┘
     │ PRD-001    │
     │ quantity: -2
     │ timestamp: ...
     └────────────┘
```

---

## 🔐 Ciclo de Vida de un Producto

```
CREACIÓN
   │
   ▼
┌─────────────┐
│ addProduct()│ ──► Genera ID único (PRD-xxx)
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ ACTIVO       │ ◄─ Estado: "activo"
│ En venta     │    Visible en UI
└──────┬───────┘    Disponible para ventas
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
   MOVIMIENTOS            EDICIÓN
   • Entradas    ─────►  • updateProduct()
   • Salidas             • Modificar info
   • Ajustes             • Cambiar precio
   • Transferencias      
       │                 │
       ▼                 ▼
   Historial      En LocalStorage
   Completo       Actualizado
       │           │
       └─────┬─────┘
             │
             ▼
    ┌───────────────────┐
    │ INACTIVO/ARCHIVADO│ ◄─ No visible en venta
    │ status: "inactivo"│    Conserva historial
    └───────────────────┘
             │
             ▼
    ┌───────────────────┐
    │ DESCONTINUADO     │
    │ status: "...uado" │ ◄─ No para nuevas órdenes
    └───────────────────┘
             │
             ▼
    ELIMINACIÓN (opcional)
    • deleteProduct()
    • Marca para archivo
```

---

## 🎯 Flujo de Alertas

```
Sistema monitorea en tiempo real
         │
         ▼
┌─────────────────────────────────────┐
│ Cada modificación de inventario:    │
│ • decreaseStock()                   │
│ • increaseStock()                   │
│ • adjustStock()                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Comparar cantidad actual con:        │
│ • minStock (límite bajo)             │
│ • maxStock (límite alto)             │
└────────────┬────────────────────────┘
             │
      ┌──────┴───────┬──────────┐
      │              │          │
      ▼              ▼          ▼
   BAJO          CRÍTICO    SOBRESTOCAJE
   5 ≤ qty      qty = 0     qty > maxStock
      │              │          │
      ▼              ▼          ▼
  ⚠️ Alerta      🔴 Crítica   📈 Advertencia
      │              │          │
      └──────┬───────┴──────────┘
             │
             ▼
        Actualizar UI
        • Tab de alertas
        • Dashboard
        • Notificación
```

---

## 📈 Flujo de Reportes

```
Usuario solicita reporte
        │
        ▼
showInventoryReport()
        │
        ├─► generateInventoryReport()
        │   │
        │   ├─ getStockStatus()      ◄─ Resumen
        │   │
        │   ├─ getCategoryAnalysis() ◄─ Por categoría
        │   │
        │   ├─ getTopSellingProducts() ◄─ Top 10
        │   │
        │   ├─ getSlowMovingProducts()  ◄─ Sin venta
        │   │
        │   └─ getAllProducts()       ◄─ Detalle
        │
        ├─ Mostrar en modal
        │
        └─ Opciones:
           ├─ Imprimir
           ├─ Descargar PDF
           ├─ Exportar CSV
           └─ Exportar JSON
```

---

## 🔄 Flujo de Sincronización (Opcional)

```
Aplicación Local          ◄──────────────►      Servidor
┌──────────────┐                              ┌──────────────┐
│ LocalStorage │                              │ Base de Datos│
│              │                              │              │
│ • Products  │                              │ • Products  │
│ • Movements │ ──────► Sincronizar ────────► │ • Movements │
│ • Settings  │                              │ • Settings  │
└──────────────┘                              └──────────────┘
       ▲                                             │
       │                                             │
       └─────────────────────────────────────────────┘
         Resolver conflictos
         (última modificación gana)
```

---

## 🎨 Estructura de Componentes UI

```
MÓDULO DE INVENTARIOS
│
├─ HEADER
│  ├─ Título
│  └─ Botones principales
│
├─ TABS
│  ├─ Dashboard       ┐
│  ├─ Productos       ├─ switchInventoryTab()
│  ├─ Movimientos     │
│  ├─ Alertas         │
│  └─ Configuración   ┘
│
├─ TAB CONTENT
│  ├─ dashboard-grid
│  ├─ products-table-container
│  ├─ movements-table-container
│  ├─ alerts-container
│  └─ settings-form
│
├─ MODALES
│  ├─ addProductModal
│  │  └─ productForm
│  ├─ adjustStockModal
│  │  └─ adjustStockForm
│  └─ reportModal
│     └─ reportContent
│
└─ NOTIFICACIONES
   └─ notification (dinámica)
```

---

## 📋 Tabla de Métodos Principales

```
╔════════════════════════════════════════════════════════════╗
║               MÉTODOS DE INVENTORYMANAGER                 ║
╠════════════════════════════════════════════════════════════╣
║ PRODUCTOS                                                  ║
║ • addProduct(data) → Agregar producto                     ║
║ • updateProduct(id, data) → Modificar                     ║
║ • deleteProduct(id) → Eliminar                            ║
║ • getProductById(id) → Obtener producto                   ║
║ • getAllProducts() → Todos los productos                  ║
║ • getProductsByCategory(cat) → Por categoría              ║
║ • searchProducts(query) → Buscar                          ║
╠════════════════════════════════════════════════════════════╣
║ STOCK                                                      ║
║ • increaseStock(id, qty, reason) → Entrada                ║
║ • decreaseStock(id, qty, reason) → Salida                 ║
║ • adjustStock(id, qty, reason) → Ajuste                   ║
║ • transferStock(from, to, qty) → Transferir               ║
╠════════════════════════════════════════════════════════════╣
║ ALERTAS                                                    ║
║ • getLowStockProducts() → Stock bajo                       ║
║ • getCriticalStockProducts() → Stock crítico               ║
║ • getOverstockedProducts() → Sobrestocaje                  ║
║ • getStockStatus() → Resumen estado                        ║
╠════════════════════════════════════════════════════════════╣
║ MOVIMIENTOS                                                ║
║ • logMovement(...) → Registrar movimiento                  ║
║ • getMovementHistory(id) → Historial                       ║
║ • getMovementsByDateRange(start, end) → Rango             ║
╠════════════════════════════════════════════════════════════╣
║ REPORTES                                                   ║
║ • generateInventoryReport() → Reporte completo             ║
║ • getTopSellingProducts(limit) → Top vendidos              ║
║ • getSlowMovingProducts() → Sin venta                      ║
║ • getCategoryAnalysis() → Por categoría                    ║
║ • calculateInventoryRotation(id) → Rotación                ║
╠════════════════════════════════════════════════════════════╣
║ EXPORTACIÓN                                                ║
║ • convertToCSV(products) → Formato CSV                     ║
║ • exportToJSON() → Formato JSON                            ║
║ • createBackup() → Copia de seguridad                      ║
║ • restoreFromBackup(backup) → Restaurar                    ║
╠════════════════════════════════════════════════════════════╣
║ CONFIGURACIÓN                                              ║
║ • updateSettings(data) → Actualizar ajustes                ║
║ • getSettings() → Obtener ajustes                          ║
║ • addCategory(name, color) → Nueva categoría               ║
║ • getCategories() → Listar categorías                      ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🔌 Eventos Personalizados

```
window
│
└─ inventoryChanged
   │
   ├─ Disparado por:
   │  ├─ decreaseStock()
   │  ├─ increaseStock()
   │  ├─ adjustStock()
   │  ├─ transferStock()
   │  └─ deleteProduct()
   │
   └─ Escuchado por:
      ├─ loadInventoryDashboard()
      ├─ loadProductsTable()
      ├─ loadAlertsUI()
      └─ Custom listeners
```

---

## 📦 Tamaño Típico de Datos

```
Estructura          Tamaño (bytes)  Notas
────────────────────────────────────────────
Producto            ~500 bytes      Con todos los campos
Movimiento          ~200 bytes      Registro simple
Categoría           ~100 bytes      Con nombre y color
Configuración       ~300 bytes      Ajustes del sistema

Almacenamiento en LocalStorage (límite típico: 5-10 MB)
────────────────────────────────────────────
1,000 productos     500 KB
10,000 movimientos  2 MB
────────────────────────────────────────────
Total típico        ~3 MB
```

---

Esta documentación te ayuda a entender cómo funciona el módulo internamente y cómo se organizan los datos.
