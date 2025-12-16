/**
 * 🎨 UI MODULE
 * Actualización de interfaz y componentes visuales
 * Fase 2: Modularización
 */

class UIManager {
    constructor() {
        this.isLoading = false;
        this.currentView = 'list';
    }

    /**
     * Inicializar UI
     */
    initialize() {
        try {
            console.log('[UI] 🎨 Initializing...');
            this._setupTheme();
            this._setupResponsive();
            console.log('[UI] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[UI] ❌ Initialization error:', error);
            return false;
        }
    }

    /**
     * Actualizar tabla de inventario
     */
    updateInventoryTable(inventory) {
        try {
            const tableBody = document.querySelector('tbody');
            if (!tableBody) {
                console.warn('[UI] ⚠️ Table element not found');
                return false;
            }

            console.log('[UI] 📊 Updating table...');

            // Limpiar tabla
            tableBody.innerHTML = '';

            if (!inventory || inventory.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="14" class="text-center">No hay pedidos registrados</td></tr>';
                return true;
            }

            // Agregar filas
            inventory.forEach(order => {
                const row = document.createElement('tr');
                row.dataset.orderId = order.id;
                
                row.innerHTML = `
                    <td>${order.id.substring(0, 8)}</td>
                    <td>${this._sanitize(order.clientName)}</td>
                    <td>${this._sanitize(order.phoneNumber)}</td>
                    <td>${this._sanitize(order.email)}</td>
                    <td>${this._sanitize(order.productName)}</td>
                    <td>${order.quantity}</td>
                    <td>$${parseFloat(order.price).toFixed(2)}</td>
                    <td>${order.discount}%</td>
                    <td>$${parseFloat(order.shippingCost).toFixed(2)}</td>
                    <td>$${parseFloat(order.totalPrice || 0).toFixed(2)}</td>
                    <td>
                        <span class="badge badge-${order.status}">
                            ${this._translateStatus(order.status)}
                        </span>
                    </td>
                    <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="window.FormManager.loadOrderToForm('${order.id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.FormManager.handleDeleteOrder('${order.id}')">
                            🗑️ Eliminar
                        </button>
                    </td>
                `;

                tableBody.appendChild(row);
            });

            console.log('[UI] ✅ Table updated');
            return true;
        } catch (error) {
            console.error('[UI] ❌ Update table error:', error);
            return false;
        }
    }

    /**
     * Actualizar estadísticas
     */
    updateStatistics(stats) {
        try {
            console.log('[UI] 📈 Updating statistics...');

            // Total de pedidos
            const totalOrdersEl = document.getElementById('totalOrders');
            if (totalOrdersEl) {
                totalOrdersEl.textContent = stats.totalOrders || 0;
            }

            // Pedidos pendientes
            const pendingOrdersEl = document.getElementById('pendingOrders');
            if (pendingOrdersEl) {
                pendingOrdersEl.textContent = stats.pendingOrders || 0;
            }

            // Pedidos completados
            const completedOrdersEl = document.getElementById('completedOrders');
            if (completedOrdersEl) {
                completedOrdersEl.textContent = stats.completedOrders || 0;
            }

            // Ingresos totales
            const totalRevenueEl = document.getElementById('totalRevenue');
            if (totalRevenueEl) {
                totalRevenueEl.textContent = `$${parseFloat(stats.totalRevenue || 0).toFixed(2)}`;
            }

            // Valor promedio de pedidos
            const avgOrderEl = document.getElementById('averageOrder');
            if (avgOrderEl) {
                avgOrderEl.textContent = `$${parseFloat(stats.averageOrderValue || 0).toFixed(2)}`;
            }

            console.log('[UI] ✅ Statistics updated');
            return true;
        } catch (error) {
            console.error('[UI] ❌ Update statistics error:', error);
            return false;
        }
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info', duration = null) {
        try {
            const div = document.createElement('div');
            div.className = `notification notification-${type}`;
            div.textContent = message;
            div.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                padding: 15px 20px;
                border-radius: 4px;
                animation: slideIn 0.3s ease-in-out;
            `;

            document.body.appendChild(div);

            const timeout = duration || (window.Config?.uiConfig?.notificationDuration || 3000);
            setTimeout(() => {
                div.remove();
            }, timeout);

            console.log(`[UI] [${type.toUpperCase()}] ${message}`);
        } catch (error) {
            console.warn('[UI] ⚠️ Show notification failed:', error);
        }
    }

    /**
     * Mostrar/ocultar loading
     */
    toggleLoading(show = true) {
        try {
            const loadingDiv = document.getElementById('loading');
            if (loadingDiv) {
                loadingDiv.style.display = show ? 'flex' : 'none';
            }
            
            this.isLoading = show;
            
            // También actualizar visualmente botones
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.disabled = show;
            });

            console.log(`[UI] ${show ? '⏳ Loading' : '✅ Loading complete'}`);
        } catch (error) {
            console.warn('[UI] ⚠️ Toggle loading failed:', error);
        }
    }

    /**
     * Cambiar vista
     */
    changeView(viewName) {
        try {
            console.log(`[UI] 🔄 Changing to view: ${viewName}`);

            // Ocultar todas las vistas
            const views = document.querySelectorAll('[data-view]');
            views.forEach(view => {
                view.style.display = 'none';
            });

            // Mostrar vista seleccionada
            const targetView = document.querySelector(`[data-view="${viewName}"]`);
            if (targetView) {
                targetView.style.display = 'block';
                this.currentView = viewName;
                console.log(`[UI] ✅ View changed to: ${viewName}`);
                return true;
            }

            console.warn(`[UI] ⚠️ View not found: ${viewName}`);
            return false;
        } catch (error) {
            console.error('[UI] ❌ Change view error:', error);
            return false;
        }
    }

    /**
     * Actualizar paginación
     */
    updatePagination(paginationInfo) {
        try {
            const pageInfo = document.getElementById('pageInfo');
            if (pageInfo) {
                pageInfo.textContent = `Página ${paginationInfo.currentPage} de ${paginationInfo.totalPages} (Total: ${paginationInfo.totalItems})`;
            }

            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');

            if (prevBtn) {
                prevBtn.disabled = !paginationInfo.hasPreviousPage;
            }
            if (nextBtn) {
                nextBtn.disabled = !paginationInfo.hasNextPage;
            }

            console.log('[UI] ✅ Pagination updated');
        } catch (error) {
            console.warn('[UI] ⚠️ Update pagination failed:', error);
        }
    }

    /**
     * Actualizar estatus badge
     */
    updateStatusBadge(orderId, newStatus) {
        try {
            const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
            if (!row) return false;

            const badge = row.querySelector('.badge');
            if (badge) {
                badge.className = `badge badge-${newStatus}`;
                badge.textContent = this._translateStatus(newStatus);
            }

            console.log(`[UI] ✅ Status updated for ${orderId}`);
            return true;
        } catch (error) {
            console.warn('[UI] ⚠️ Update status badge failed:', error);
            return false;
        }
    }

    /**
     * PRIVATE: Configurar tema
     */
    _setupTheme() {
        try {
            const theme = window.Config?.uiConfig?.theme || 'light';
            document.documentElement.setAttribute('data-theme', theme);
            console.log(`[UI] 🎨 Theme set to: ${theme}`);
        } catch (error) {
            console.warn('[UI] ⚠️ Theme setup failed:', error);
        }
    }

    /**
     * PRIVATE: Configurar responsive
     */
    _setupResponsive() {
        try {
            // Agregar listener para cambios en tamaño de pantalla
            window.addEventListener('resize', () => {
                const isMobile = window.innerWidth < 768;
                document.documentElement.setAttribute('data-mobile', isMobile ? 'true' : 'false');
            });

            // Trigger inicial
            window.dispatchEvent(new Event('resize'));
            console.log('[UI] 📱 Responsive setup complete');
        } catch (error) {
            console.warn('[UI] ⚠️ Responsive setup failed:', error);
        }
    }

    /**
     * PRIVATE: Sanitizar texto para mostrar
     */
    _sanitize(text) {
        if (!text) return '';
        
        if (window.SecurityUtils?.sanitizeHTML) {
            return window.SecurityUtils.sanitizeHTML(text);
        }
        
        // Fallback: escape HTML
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * PRIVATE: Traducir estatus
     */
    _translateStatus(status) {
        const translations = {
            'pending': '⏳ Pendiente',
            'completed': '✅ Completado',
            'cancelled': '❌ Cancelado',
            'processing': '🔄 Procesando'
        };
        return translations[status] || status;
    }
}

// Crear instancia global
window.UIManager = new UIManager();

// Log al cargar
console.log('[UI] ✅ UI module loaded');
