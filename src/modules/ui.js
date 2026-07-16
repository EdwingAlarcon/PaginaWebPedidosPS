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
            this._setupThemeToggle();
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

                // Construir celdas sin interpolación de datos en atributos HTML (previene XSS)
                row.innerHTML = `
                    <td>${order.id.substring(0, 8)}</td>
                    <td>${this._sanitize(order.clientName)}</td>
                    <td>${this._sanitize(order.phoneNumber)}</td>
                    <td>${this._sanitize(order.email)}</td>
                    <td>${this._sanitize(order.productName)}</td>
                    <td>${this._sanitize(String(order.quantity))}</td>
                    <td>$${parseFloat(order.price).toFixed(2)}</td>
                    <td>${parseFloat(order.discount || 0).toFixed(1)}%</td>
                    <td>$${parseFloat(order.shippingCost || 0).toFixed(2)}</td>
                    <td>$${parseFloat(order.totalPrice || 0).toFixed(2)}</td>
                    <td>
                        <span class="badge badge-${this._sanitize(order.status)}">
                            ${this._translateStatus(order.status)}
                        </span>
                    </td>
                    <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" type="button">✏️ Editar</button>
                        <button class="btn btn-sm btn-danger" type="button">🗑️ Eliminar</button>
                    </td>
                `;

                // Vincular eventos con addEventListener — nunca interpolación en onclick
                const editBtn = row.querySelector('.btn-edit');
                const deleteBtn = row.querySelector('.btn-danger');
                const orderId = order.id; // Capturar en closure, no en HTML

                editBtn.addEventListener('click', () => {
                    window.FormManager?.loadOrderToForm(orderId);
                });
                deleteBtn.addEventListener('click', () => {
                    window.FormManager?.handleDeleteOrder(orderId);
                });

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
     * Mostrar notificación — delega al NotificationService centralizado.
     */
    showNotification(message, type = 'info', duration = null) {
        if (window.NotificationService) {
            window.NotificationService.show(message, type, duration);
        } else {
            // Fallback si NotificationService aún no está cargado
            console.log(`[UI] [${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Mostrar/ocultar loading.
     * @param {boolean} show
     * @param {string|null} scopeSelector Selector CSS del contenedor cuyos botones se deshabilitan.
     *   Si es null se usan solo los botones de tipo submit/primary para no bloquear zonas no relacionadas.
     */
    toggleLoading(show = true, scopeSelector = null) {
        try {
            const loadingDiv = document.getElementById('loading');
            if (loadingDiv) {
                loadingDiv.style.display = show ? 'flex' : 'none';
            }

            this.isLoading = show;

            // Solo deshabilitar botones dentro del scope provisto,
            // o los de tipo submit si no hay scope — nunca todos los botones del DOM.
            const container = scopeSelector ? document.querySelector(scopeSelector) : null;
            const buttons = container
                ? container.querySelectorAll('button')
                : document.querySelectorAll('button[type="submit"], .btn-primary, .btn-submit');

            buttons.forEach(btn => { btn.disabled = show; });

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
     * PRIVATE: Configurar tema (claro/oscuro) con persistencia real.
     * Prioridad: preferencia guardada > prefers-color-scheme del SO > Config.uiConfig.theme.
     */
    _setupTheme() {
        try {
            const stored = localStorage.getItem(this._themeStorageKey);
            let theme = stored;

            if (theme !== 'light' && theme !== 'dark') {
                const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
                theme = prefersDark ? 'dark' : (window.Config?.uiConfig?.theme || 'light');
            }

            this._applyTheme(theme);
            console.log(`[UI] 🎨 Theme set to: ${theme}`);
        } catch (error) {
            console.warn('[UI] ⚠️ Theme setup failed:', error);
        }
    }

    /** Clave de localStorage para la preferencia de tema del usuario */
    get _themeStorageKey() {
        return 'purpleshop.theme';
    }

    /**
     * PRIVATE: Aplica un tema al documento y actualiza el botón toggle si existe.
     */
    _applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            const isDark = theme === 'dark';
            btn.setAttribute('aria-pressed', String(isDark));
            btn.setAttribute(
                'aria-label',
                isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
            );
            btn.dataset.theme = theme;
        }
    }

    /**
     * Alterna entre tema claro y oscuro, y persiste la preferencia.
     */
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem(this._themeStorageKey, next);
        } catch (error) {
            console.warn('[UI] ⚠️ Could not persist theme preference:', error);
        }
        this._applyTheme(next);
        console.log(`[UI] 🎨 Theme toggled to: ${next}`);
        return next;
    }

    /**
     * PRIVATE: Conecta el botón de alternar tema (creado en index.html) si existe.
     */
    _setupThemeToggle() {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        btn.addEventListener('click', () => this.toggleTheme());
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
