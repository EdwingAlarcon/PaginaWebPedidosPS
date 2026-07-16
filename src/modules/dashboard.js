/**
 * DashboardManager — landing real del sistema, construida con datos que ya
 * existen en localStorage (InventoryManager para pedidos, ProductInventoryManager
 * — window.inventory — para stock). No fabrica métricas: cuando falta un dato
 * para calcular algo (p. ej. sin pedidos aún), se muestra un estado vacío.
 *
 * Modelo de datos importante: InventoryManager.addOrder() guarda UNA fila por
 * línea de producto, no una por pedido. Los pedidos multi-producto comparten
 * `orderGroupId` (los pedidos guardados antes de esa migración no lo tienen y
 * se tratan como pedidos de una sola línea). Cada línea repite `discount` y
 * `shippingCost` del pedido completo, pero `totalPrice` es solo qty*precio de
 * ESA línea — el total realmente cobrado hay que recalcularlo por grupo
 * (subtotal → descuento % → + envío), igual que hace updateGrandTotal() en
 * order-form.js. Esa agregación vive en window.OrderAggregates (compartida
 * también con Pedidos y Reportes) para no duplicarla en cada módulo.
 */
class DashboardManager {
    constructor() {
        this._boundRender = () => this.render();
    }

    initialize() {
        try {
            window.EventBus?.on('tab:changed', ({ tab }) => {
                if (tab === 'dashboard') this.render();
            });
            window.EventBus?.on('order:added', this._boundRender);
            this.render();
            console.log('[Dashboard] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[Dashboard] ❌ Initialization error:', error);
            return false;
        }
    }

    /* ==================== AGREGACIÓN DE DATOS ==================== */

    _groupOrders() {
        return window.OrderAggregates?.groupOrders() || [];
    }

    _computeKPIs(groups) {
        const totalRevenue = groups.reduce((sum, g) => sum + g.total, 0);
        const pendingOrders = groups.filter((g) => g.status === 'pending').length;
        const uniqueClients = new Set(groups.map((g) => g.clientName.toLowerCase())).size;
        const averageOrder = groups.length ? totalRevenue / groups.length : 0;

        return {
            totalOrders: groups.length,
            totalRevenue,
            pendingOrders,
            uniqueClients,
            averageOrder
        };
    }

    _topProducts(limit = 5) {
        const lines = window.InventoryManager?.getAll() || [];
        const byProduct = new Map();

        lines.forEach((line) => {
            const name = line.productName || 'Sin nombre';
            const prev = byProduct.get(name) || { name, revenue: 0, quantity: 0 };
            prev.revenue += Number(line.totalPrice) || 0;
            prev.quantity += Number(line.quantity) || 0;
            byProduct.set(name, prev);
        });

        return Array.from(byProduct.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    _topClients(groups, limit = 5) {
        const byClient = new Map();
        groups.forEach((g) => {
            const prev = byClient.get(g.clientName) || { name: g.clientName, orders: 0, revenue: 0 };
            prev.orders += 1;
            prev.revenue += g.total;
            byClient.set(g.clientName, prev);
        });

        return Array.from(byClient.values())
            .sort((a, b) => b.orders - a.orders)
            .slice(0, limit);
    }

    _recentOrders(groups, limit = 5) {
        return [...groups]
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, limit);
    }

    /* ==================== RENDER ==================== */

    render() {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        const groups = this._groupOrders();
        const kpis = this._computeKPIs(groups);
        const stockStatus = window.inventory?.getStockStatus?.() || null;
        const lastSyncAt = window.ConnectionStatus?.getLastSyncAt?.();

        container.innerHTML = `
            ${this._renderKPIs(kpis, stockStatus, lastSyncAt)}
            <div class="dashboard-grid">
                ${this._renderRecentOrders(this._recentOrders(groups))}
                ${this._renderInventoryAlerts()}
                ${this._renderTopList('Productos más vendidos', 'productos-vendidos', this._topProducts(), (p) => ({
                    label: p.name,
                    value: window.Format?.currency(p.revenue) || p.revenue,
                    sub: `${p.quantity} unidades`,
                    metric: p.revenue
                }))}
                ${this._renderTopList('Clientes frecuentes', 'clientes-frecuentes', this._topClients(groups), (c) => ({
                    label: c.name,
                    value: `${c.orders} pedido${c.orders === 1 ? '' : 's'}`,
                    sub: window.Format?.currency(c.revenue) || '',
                    metric: c.orders
                }))}
            </div>
        `;

        window.Icons?.mount(container);
    }

    _renderKPIs(kpis, stockStatus, lastSyncAt) {
        const cards = [
            {
                icon: 'dollar-sign',
                label: 'Ventas registradas',
                value: window.Format?.currency(kpis.totalRevenue) || kpis.totalRevenue,
                tab: 'reports'
            },
            {
                icon: 'receipt',
                label: 'Pedidos registrados',
                value: String(kpis.totalOrders),
                tab: 'orders'
            },
            {
                icon: 'alert-triangle',
                label: 'Pedidos pendientes',
                value: String(kpis.pendingOrders),
                tab: 'orders'
            },
            {
                icon: 'users',
                label: 'Clientes únicos',
                value: String(kpis.uniqueClients),
                tab: 'clients'
            },
            {
                icon: 'trending-up',
                label: 'Ticket promedio',
                value: kpis.totalOrders ? (window.Format?.currency(kpis.averageOrder) || kpis.averageOrder) : '—',
                tab: 'reports'
            },
            {
                icon: 'archive',
                label: 'Stock bajo',
                value: stockStatus ? String(stockStatus.lowStock + stockStatus.criticalStock) : '—',
                tab: 'inventory'
            },
            {
                icon: 'cloud-check',
                label: 'Última sincronización',
                value: lastSyncAt ? (window.Format?.relative(lastSyncAt) || '—') : 'Sin sincronizar',
                tab: null
            }
        ];

        return `
            <div class="kpi-grid">
                ${cards.map((c) => `
                    <button type="button" class="kpi-card${c.tab ? '' : ' kpi-card-static'}" ${c.tab ? `data-goto-tab="${c.tab}"` : 'disabled'}>
                        <span class="kpi-icon" data-icon="${c.icon}" aria-hidden="true"></span>
                        <span class="kpi-value">${c.value}</span>
                        <span class="kpi-label">${c.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    _renderRecentOrders(recent) {
        if (recent.length === 0) {
            return this._section('Pedidos recientes', this._emptyState('No hay pedidos todavía', 'Los pedidos que registres en "Nuevo Pedido" aparecerán aquí.'));
        }

        const rows = recent.map((g) => `
            <tr>
                <td>${this._escape(g.clientName)}</td>
                <td>${window.Format?.date(g.orderDate) || '—'}</td>
                <td>${g.productCount}</td>
                <td>${window.Format?.currency(g.total) || g.total}</td>
                <td><span class="badge badge-${g.status}">${this._statusLabel(g.status)}</span></td>
            </tr>
        `).join('');

        return this._section('Pedidos recientes', `
            <div class="table-responsive">
                <table class="data-table">
                    <thead><tr><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `);
    }

    _renderInventoryAlerts() {
        const products = window.inventory?.getLowStockProducts?.() || [];
        const critical = window.inventory?.getCriticalStockProducts?.() || [];
        const all = [...critical, ...products.filter((p) => !critical.some((c) => c.id === p.id))].slice(0, 5);

        if (!window.inventory) {
            return this._section('Alertas de inventario', this._emptyState('Módulo de inventario no disponible', ''));
        }

        if (all.length === 0) {
            return this._section('Alertas de inventario', this._emptyState('Sin alertas de stock', 'Todos los productos tienen inventario suficiente.'));
        }

        const rows = all.map((p) => {
            const isCritical = critical.some((c) => c.id === p.id);
            return `
                <tr>
                    <td>${this._escape(p.name)}</td>
                    <td>${p.quantity}</td>
                    <td><span class="badge badge-${isCritical ? 'error' : 'warning'}">${isCritical ? 'Agotado' : 'Stock bajo'}</span></td>
                </tr>
            `;
        }).join('');

        return this._section('Alertas de inventario', `
            <div class="table-responsive">
                <table class="data-table">
                    <thead><tr><th>Producto</th><th>Stock</th><th>Estado</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `);
    }

    _renderTopList(title, testId, items, mapFn) {
        if (items.length === 0) {
            return this._section(title, this._emptyState('Sin datos todavía', 'Aparecerá aquí en cuanto tengas pedidos registrados.'));
        }

        const mapped = items.map(mapFn);
        const max = Math.max(...mapped.map((m) => m.metric), 1);

        const rows = mapped.map((m) => `
            <li class="ranked-item">
                <div class="ranked-item-bar-track">
                    <div class="ranked-item-bar" style="width:${Math.max(4, (m.metric / max) * 100)}%"></div>
                </div>
                <div class="ranked-item-text">
                    <span class="ranked-item-label">${this._escape(m.label)}</span>
                    <span class="ranked-item-value">${m.value}${m.sub ? ` · ${m.sub}` : ''}</span>
                </div>
            </li>
        `).join('');

        return this._section(title, `<ul class="ranked-list" data-testid="${testId}">${rows}</ul>`);
    }

    _section(title, bodyHtml) {
        return `
            <section class="dashboard-panel">
                <h3 class="dashboard-panel-title">${title}</h3>
                ${bodyHtml}
            </section>
        `;
    }

    _emptyState(title, hint) {
        return `
            <div class="empty-state">
                <p class="empty-state-title">${title}</p>
                ${hint ? `<p class="empty-state-hint">${hint}</p>` : ''}
            </div>
        `;
    }

    _statusLabel(status) {
        const labels = { pending: 'Pendiente', completed: 'Completado', cancelled: 'Cancelado', processing: 'Procesando' };
        return labels[status] || status;
    }

    _escape(text) {
        if (window.SecurityUtils?.sanitizeText) return window.SecurityUtils.sanitizeText(text);
        const div = document.createElement('div');
        div.textContent = text ?? '';
        return div.innerHTML;
    }
}

window.DashboardManager = new DashboardManager();

// Delega la navegación de las tarjetas KPI al mismo mecanismo de tabs existente
document.addEventListener('click', (e) => {
    const card = e.target.closest?.('[data-goto-tab]');
    if (card && !card.disabled) window.switchTab?.(card.getAttribute('data-goto-tab'));
});

console.log('[Dashboard] ✅ Loaded');
