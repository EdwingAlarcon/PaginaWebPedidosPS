/**
 * 📊 INVENTORY MODULE
 * Gestión de inventario y datos de pedidos
 * Fase 2: Modularización
 */

class InventoryManager {
    constructor() {
        this.inventory = [];
        this.filteredInventory = [];
        this.currentPage = 1;
        this.pageSize = window.Config?.uiConfig?.pageSize || 10;
        this.sortColumn = 'orderDate';
        this.sortDirection = 'desc';
        this.storageKey = 'PaginaWebPedidos_Inventory';
        this.isInitialized = false;
    }

    /**
     * Inicializar inventario desde localStorage o vacío
     */
    initialize() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.inventory = JSON.parse(stored);
                console.log(`[Inventory] ✅ Loaded ${this.inventory.length} items from storage`);
            } else {
                this.inventory = [];
                console.log('[Inventory] ℹ️ Starting with empty inventory');
            }
            this.filteredInventory = [...this.inventory];
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('[Inventory] ❌ Initialization error:', error);
            this.inventory = [];
            return false;
        }
    }

    /**
     * Agregar nuevo pedido al inventario
     */
    addOrder(orderData) {
        try {
            // Validar datos si está disponible el módulo de validación
            if (window.ValidationUtils?.validateOrderData) {
                const validation = window.ValidationUtils.validateOrderData(orderData);
                if (!validation.isValid) {
                    throw new Error(`Validation error: ${validation.errors.join(', ')}`);
                }
            }

            // Sanitizar datos si está disponible el módulo de seguridad
            const sanitizedData = this._sanitizeOrderData(orderData);

            // Crear objeto de pedido.
            // orderDate respeta la fecha elegida en el formulario si viene informada
            // (antes se sobrescribía siempre con "ahora", ignorando la selección del usuario).
            const order = {
                id: this._generateId(),
                ...sanitizedData,
                orderDate: sanitizedData.orderDate || new Date().toISOString(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.inventory.push(order);
            this._saveToStorage();
            
            console.log('[Inventory] ✅ Order added:', order.id);
            return order;
        } catch (error) {
            console.error('[Inventory] ❌ Error adding order:', error);
            throw error;
        }
    }

    /**
     * Actualizar pedido existente
     */
    updateOrder(id, updates) {
        try {
            const order = this.inventory.find(o => o.id === id);
            if (!order) {
                throw new Error(`Order not found: ${id}`);
            }

            // Sanitizar datos actualizados
            const sanitizedUpdates = this._sanitizeOrderData(updates);

            // Actualizar
            Object.assign(order, sanitizedUpdates, {
                updatedAt: new Date().toISOString()
            });

            this._saveToStorage();
            console.log('[Inventory] ✅ Order updated:', id);
            return order;
        } catch (error) {
            console.error('[Inventory] ❌ Error updating order:', error);
            throw error;
        }
    }

    /**
     * Eliminar pedido
     */
    deleteOrder(id) {
        try {
            const index = this.inventory.findIndex(o => o.id === id);
            if (index === -1) {
                throw new Error(`Order not found: ${id}`);
            }

            const deleted = this.inventory.splice(index, 1);
            this._saveToStorage();
            
            console.log('[Inventory] ✅ Order deleted:', id);
            return deleted[0];
        } catch (error) {
            console.error('[Inventory] ❌ Error deleting order:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los pedidos
     */
    getAll() {
        return [...this.inventory];
    }

    /**
     * Obtener pedido por ID
     */
    getById(id) {
        return this.inventory.find(o => o.id === id);
    }

    /**
     * Filtrar pedidos
     */
    filter(criteria) {
        try {
            this.filteredInventory = this.inventory.filter(order => {
                for (const [key, value] of Object.entries(criteria)) {
                    if (value && order[key] !== value) {
                        return false;
                    }
                }
                return true;
            });
            this.currentPage = 1;
            console.log(`[Inventory] ℹ️ Filtered to ${this.filteredInventory.length} items`);
            return this.filteredInventory;
        } catch (error) {
            console.error('[Inventory] ❌ Filter error:', error);
            return [];
        }
    }

    /**
     * Buscar en inventario
     */
    search(query) {
        try {
            const lowerQuery = query.toLowerCase();
            this.filteredInventory = this.inventory.filter(order => {
                return (
                    order.clientName?.toLowerCase().includes(lowerQuery) ||
                    order.email?.toLowerCase().includes(lowerQuery) ||
                    order.phoneNumber?.includes(query) ||
                    order.productName?.toLowerCase().includes(lowerQuery)
                );
            });
            this.currentPage = 1;
            console.log(`[Inventory] ℹ️ Search found ${this.filteredInventory.length} items`);
            return this.filteredInventory;
        } catch (error) {
            console.error('[Inventory] ❌ Search error:', error);
            return [];
        }
    }

    /**
     * Ordenar inventario
     */
    sort(column, direction = 'asc') {
        try {
            this.sortColumn = column;
            this.sortDirection = direction;

            this.filteredInventory.sort((a, b) => {
                const valueA = a[column];
                const valueB = b[column];

                if (typeof valueA === 'string') {
                    return direction === 'asc' 
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                }

                if (direction === 'asc') {
                    return valueA - valueB;
                } else {
                    return valueB - valueA;
                }
            });

            this.currentPage = 1;
            console.log(`[Inventory] ℹ️ Sorted by ${column} (${direction})`);
            return this.filteredInventory;
        } catch (error) {
            console.error('[Inventory] ❌ Sort error:', error);
            return [];
        }
    }

    /**
     * Obtener página de resultados
     */
    getPage(pageNumber) {
        const start = (pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.currentPage = pageNumber;
        return this.filteredInventory.slice(start, end);
    }

    /**
     * Obtener información de paginación
     */
    getPaginationInfo() {
        const totalItems = this.filteredInventory.length;
        const totalPages = Math.ceil(totalItems / this.pageSize);
        
        return {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            totalItems,
            totalPages,
            hasNextPage: this.currentPage < totalPages,
            hasPreviousPage: this.currentPage > 1
        };
    }

    /**
     * Obtener estadísticas
     */
    getStatistics() {
        const stats = {
            totalOrders: this.inventory.length,
            pendingOrders: this.inventory.filter(o => o.status === 'pending').length,
            completedOrders: this.inventory.filter(o => o.status === 'completed').length,
            totalRevenue: 0,
            averageOrderValue: 0
        };

        if (this.inventory.length > 0) {
            stats.totalRevenue = this.inventory.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            stats.averageOrderValue = stats.totalRevenue / this.inventory.length;
        }

        return stats;
    }

    /**
     * Resetear filtros y mostrar todos los items (sin reinicializar desde storage).
     * Llamar cuando se limpia la búsqueda — preserva paginación/ordenamiento.
     */
    resetFilter() {
        this.filteredInventory = [...this.inventory];
        this.currentPage = 1;
        console.log('[Inventory] ℹ️ Filter reset');
        return this.filteredInventory;
    }

    /**
     * Exportar a JSON
     */
    exportToJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalOrders: this.inventory.length,
            orders: this.inventory
        };
        
        const json = JSON.stringify(data, null, 2);
        console.log('[Inventory] ✅ Exported to JSON');
        return json;
    }

    /**
     * Importar desde JSON
     */
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!Array.isArray(data.orders)) {
                throw new Error('Invalid JSON format');
            }

            this.inventory = data.orders;
            this.filteredInventory = [...this.inventory];
            this._saveToStorage();
            
            console.log(`[Inventory] ✅ Imported ${data.orders.length} orders`);
            return true;
        } catch (error) {
            console.error('[Inventory] ❌ Import error:', error);
            return false;
        }
    }

    /**
     * PRIVATE: Sanitizar datos de pedido.
     *
     * Solo sanitiza los campos de texto que efectivamente vienen en `data` —
     * antes forzaba clientName/email/address/productName/notes a '' cuando
     * faltaban, lo que estaba bien para addOrder() (siempre manda el objeto
     * completo) pero corrompía updateOrder() con actualizaciones parciales:
     * updateOrder(id, {status}) borraba el nombre del cliente y del producto
     * del pedido, porque _sanitizeOrderData({status}) devolvía esos campos
     * vacíos y Object.assign los pisaba.
     */
    _sanitizeOrderData(data) {
        if (!window.SecurityUtils?.sanitizeText) {
            return data;
        }

        const sanitized = { ...data };
        ['clientName', 'email', 'address', 'productName', 'notes'].forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                sanitized[field] = window.SecurityUtils.sanitizeText(data[field] || '');
            }
        });
        return sanitized;
    }

    /**
     * PRIVATE: Generar ID único usando crypto.randomUUID() (C3)
     */
    _generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return `ORD-${crypto.randomUUID()}`;
        }
        // Fallback seguro para entornos sin crypto.randomUUID
        return `ORD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
    }

    /**
     * PRIVATE: Guardar en localStorage con manejo de cuota (D)
     */
    _saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.inventory));
        } catch (error) {
            if (error instanceof DOMException && (
                error.code === 22 || // QuotaExceededError legacy
                error.name === 'QuotaExceededError' ||
                error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
            )) {
                console.error('[Inventory] ❌ localStorage lleno. No se pudo guardar el pedido.');
                window.NotificationService?.error(
                    '⚠️ Almacenamiento lleno. Exporta y limpia datos antes de agregar más pedidos.',
                    8000
                );
            } else {
                console.error('[Inventory] ❌ Storage error:', error);
            }
        }
    }
}

// Crear instancia global
window.InventoryManager = new InventoryManager();

// Log al cargar
console.log('[Inventory] ✅ Inventory module loaded');
