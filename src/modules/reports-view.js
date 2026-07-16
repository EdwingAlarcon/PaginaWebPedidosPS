/**
 * ReportsViewManager — pestaña "Reportes": igual que Dashboard usa datos
 * reales vía window.OrderAggregates, pero explorables por rango de fechas
 * y cliente (Dashboard es una foto fija de todo el historial).
 *
 * No incluye "ventas por categoría": las líneas de pedido no guardan un
 * campo `category` a nivel de pedido (solo existe como campo dinámico del
 * formulario), así que esa métrica no es calculable con los datos
 * actuales — se omite en vez de inventarla.
 */
class ReportsViewManager {
    constructor() {
        this.state = { dateFrom: '', dateTo: '', clientFilter: '' };
        this._boundRender = () => this.render();
    }

    initialize() {
        try {
            window.EventBus?.on('tab:changed', ({ tab }) => {
                if (tab === 'reports') this.render();
            });
            window.EventBus?.on('order:added', this._boundRender);
            this.render();
            console.log('[ReportsView] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[ReportsView] ❌ Initialization error:', error);
            return false;
        }
    }

    /* ==================== DATOS ==================== */

    _filteredGroups() {
        const { dateFrom, dateTo, clientFilter } = this.state;
        let groups = window.OrderAggregates?.groupOrders() || [];

        if (dateFrom) groups = groups.filter((g) => new Date(g.orderDate) >= new Date(dateFrom));
        if (dateTo) groups = groups.filter((g) => new Date(g.orderDate) <= new Date(`${dateTo}T23:59:59`));
        if (clientFilter) groups = groups.filter((g) => g.clientName === clientFilter);

        return groups;
    }

    _linesForGroups(groups) {
        const ids = new Set(groups.map((g) => g.id));
        const allLines = window.InventoryManager?.getAll() || [];
        return allLines.filter((l) => ids.has(l.orderGroupId || l.id));
    }

    /* ==================== RENDER ==================== */

    render() {
        const container = document.getElementById('reportsViewContent');
        if (!container) return;

        const allGroups = window.OrderAggregates?.groupOrders() || [];
        const clients = [...new Set(allGroups.map((g) => g.clientName))].sort();
        const groups = this._filteredGroups();
        const lines = this._linesForGroups(groups);

        const totalRevenue = groups.reduce((sum, g) => sum + g.total, 0);
        const totalOrders = groups.length;
        const uniqueClients = new Set(groups.map((g) => g.clientName.toLowerCase())).size;
        const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;

        container.innerHTML = `
            ${this._renderFilters(clients)}
            ${groups.length === 0
                ? this._emptyState(allGroups.length)
                : `
                    ${this._renderKpis({ totalRevenue, totalOrders, uniqueClients, avgOrder })}
                    <div class="dashboard-grid">
                        ${this._renderTrend(groups)}
                        ${this._renderTopProducts(lines)}
                        ${this._renderTopClients(groups)}
                    </div>
                    ${this._renderDetailTable(groups)}
                `
            }
        `;

        this._wireEvents();
        window.Icons?.mount(container);
    }

    _renderFilters(clients) {
        const { dateFrom, dateTo, clientFilter } = this.state;
        return `
            <div class="view-toolbar">
                <div class="view-toolbar-row view-filters">
                    <label class="view-filter-date">
                        Desde
                        <input type="date" id="reportsDateFrom" value="${dateFrom}" />
                    </label>
                    <label class="view-filter-date">
                        Hasta
                        <input type="date" id="reportsDateTo" value="${dateTo}" />
                    </label>
                    <select id="reportsClientFilter" aria-label="Filtrar por cliente">
                        <option value="">Todos los clientes</option>
                        ${clients.map((c) => `<option value="${this._escape(c)}" ${clientFilter === c ? 'selected' : ''}>${this._escape(c)}</option>`).join('')}
                    </select>
                    ${(dateFrom || dateTo || clientFilter) ? '<button type="button" class="btn-link" id="reportsClearBtn">Limpiar filtros</button>' : ''}
                    <button type="button" class="btn-secondary btn-small" id="reportsExportPdfBtn" style="margin-left:auto">
                        <span data-icon="file-text" data-icon-size="16" aria-hidden="true"></span>
                        Exportar PDF
                    </button>
                </div>
            </div>
        `;
    }

    _renderKpis({ totalRevenue, totalOrders, uniqueClients, avgOrder }) {
        const cards = [
            { icon: 'dollar-sign', label: 'Ventas del periodo', value: window.Format?.currency(totalRevenue) },
            { icon: 'receipt', label: 'Pedidos', value: String(totalOrders) },
            { icon: 'users', label: 'Clientes únicos', value: String(uniqueClients) },
            { icon: 'trending-up', label: 'Ticket promedio', value: window.Format?.currency(avgOrder) }
        ];
        return `
            <div class="kpi-grid">
                ${cards.map((c) => `
                    <div class="kpi-card kpi-card-static" aria-disabled="true">
                        <span class="kpi-icon" data-icon="${c.icon}" aria-hidden="true"></span>
                        <span class="kpi-value">${c.value}</span>
                        <span class="kpi-label">${c.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    _renderTrend(groups) {
        const byDay = new Map();
        groups.forEach((g) => {
            const day = (g.orderDate || '').slice(0, 10);
            byDay.set(day, (byDay.get(day) || 0) + g.total);
        });
        const days = Array.from(byDay.keys()).sort().slice(-14);

        if (days.length === 0) {
            return this._panel('Tendencia de ventas', this._innerEmpty());
        }

        const max = Math.max(...days.map((d) => byDay.get(d)), 1);
        const rows = days.map((d) => `
            <tr>
                <td>${window.Format?.date(d) || d}</td>
                <td>
                    <div class="ranked-item-bar-track"><div class="ranked-item-bar" style="width:${Math.max(4, (byDay.get(d) / max) * 100)}%"></div></div>
                </td>
                <td class="trend-value">${window.Format?.currency(byDay.get(d)) || byDay.get(d)}</td>
            </tr>
        `).join('');

        return this._panel('Tendencia de ventas (últimos días con actividad)', `
            <div class="table-responsive">
                <table class="data-table trend-table">
                    <thead><tr><th>Fecha</th><th>Ventas</th><th></th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `);
    }

    _renderTopProducts(lines) {
        const byProduct = new Map();
        lines.forEach((l) => {
            const name = l.productName || 'Sin nombre';
            const prev = byProduct.get(name) || { name, revenue: 0, quantity: 0 };
            prev.revenue += Number(l.totalPrice) || 0;
            prev.quantity += Number(l.quantity) || 0;
            byProduct.set(name, prev);
        });
        const items = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        if (items.length === 0) return this._panel('Productos más vendidos', this._innerEmpty());

        const max = Math.max(...items.map((i) => i.revenue), 1);
        const rows = items.map((i) => `
            <li class="ranked-item">
                <div class="ranked-item-bar-track"><div class="ranked-item-bar" style="width:${Math.max(4, (i.revenue / max) * 100)}%"></div></div>
                <div class="ranked-item-text">
                    <span class="ranked-item-label">${this._escape(i.name)}</span>
                    <span class="ranked-item-value">${window.Format?.currency(i.revenue)} · ${i.quantity} u.</span>
                </div>
            </li>
        `).join('');
        return this._panel('Productos más vendidos', `<ul class="ranked-list">${rows}</ul>`);
    }

    _renderTopClients(groups) {
        const byClient = new Map();
        groups.forEach((g) => {
            const prev = byClient.get(g.clientName) || { name: g.clientName, orders: 0, revenue: 0 };
            prev.orders += 1;
            prev.revenue += g.total;
            byClient.set(g.clientName, prev);
        });
        const items = Array.from(byClient.values()).sort((a, b) => b.orders - a.orders).slice(0, 5);

        if (items.length === 0) return this._panel('Clientes frecuentes', this._innerEmpty());

        const max = Math.max(...items.map((i) => i.orders), 1);
        const rows = items.map((i) => `
            <li class="ranked-item">
                <div class="ranked-item-bar-track"><div class="ranked-item-bar" style="width:${Math.max(4, (i.orders / max) * 100)}%"></div></div>
                <div class="ranked-item-text">
                    <span class="ranked-item-label">${this._escape(i.name)}</span>
                    <span class="ranked-item-value">${i.orders} pedido${i.orders === 1 ? '' : 's'} · ${window.Format?.currency(i.revenue)}</span>
                </div>
            </li>
        `).join('');
        return this._panel('Clientes frecuentes', `<ul class="ranked-list">${rows}</ul>`);
    }

    _renderDetailTable(groups) {
        const sorted = [...groups].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        const rows = sorted.map((g) => `
            <tr>
                <td data-label="Cliente">${this._escape(g.clientName)}</td>
                <td data-label="Fecha">${window.Format?.date(g.orderDate) || '—'}</td>
                <td data-label="Productos">${g.productCount}</td>
                <td data-label="Total">${window.Format?.currency(g.total)}</td>
                <td data-label="Estado"><span class="badge badge-${g.status}">${this._statusLabel(g.status)}</span></td>
            </tr>
        `).join('');

        return this._panel('Detalle de pedidos', `
            <div class="table-responsive">
                <table class="data-table stack-table">
                    <thead><tr><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `);
    }

    _panel(title, body) {
        return `<section class="dashboard-panel"><h3 class="dashboard-panel-title">${title}</h3>${body}</section>`;
    }

    _innerEmpty() {
        return '<p class="empty-state-hint">Sin datos para este periodo.</p>';
    }

    _emptyState(totalUnfiltered) {
        if (totalUnfiltered === 0) {
            return `
                <div class="empty-state empty-state-panel">
                    <span class="empty-state-icon" data-icon="bar-chart" data-icon-size="32" aria-hidden="true"></span>
                    <p class="empty-state-title">Todavía no hay datos para reportar</p>
                    <p class="empty-state-hint">Los reportes aparecerán en cuanto registres pedidos.</p>
                </div>
            `;
        }
        return `
            <div class="empty-state empty-state-panel">
                <span class="empty-state-icon" data-icon="search" data-icon-size="32" aria-hidden="true"></span>
                <p class="empty-state-title">No hay pedidos en este periodo</p>
                <p class="empty-state-hint">Ajusta el rango de fechas o el cliente para ver resultados.</p>
            </div>
        `;
    }

    /* ==================== EVENTOS ==================== */

    _wireEvents() {
        document.getElementById('reportsDateFrom')?.addEventListener('change', (e) => {
            this.state.dateFrom = e.target.value;
            this.render();
        });
        document.getElementById('reportsDateTo')?.addEventListener('change', (e) => {
            this.state.dateTo = e.target.value;
            this.render();
        });
        document.getElementById('reportsClientFilter')?.addEventListener('change', (e) => {
            this.state.clientFilter = e.target.value;
            this.render();
        });
        document.getElementById('reportsClearBtn')?.addEventListener('click', () => {
            this.state = { dateFrom: '', dateTo: '', clientFilter: '' };
            this.render();
        });
        document.getElementById('reportsExportPdfBtn')?.addEventListener('click', () => this._exportPdf());
    }

    _exportPdf() {
        const groups = this._filteredGroups();
        if (groups.length === 0) {
            window.NotificationService?.info('No hay datos para exportar con estos filtros');
            return;
        }
        const totalRevenue = groups.reduce((sum, g) => sum + g.total, 0);
        const rows = [...groups].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).map((g) => `
            <tr>
                <td>${this._escape(g.clientName)}</td>
                <td>${window.Format?.date(g.orderDate) || '—'}</td>
                <td>${g.productCount}</td>
                <td>${window.Format?.currency(g.total)}</td>
                <td>${this._statusLabel(g.status)}</td>
            </tr>
        `).join('');

        const win = window.open('', '_blank');
        if (!win) {
            window.NotificationService?.error('El navegador bloqueó la ventana de impresión');
            return;
        }
        win.document.write(`
            <!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte de ventas — Purple Shop</title>
            <style>
                body{font-family:Arial,sans-serif;padding:24px;color:#16121f}
                h1{color:#7c3aed}
                .summary{margin:16px 0;font-size:14px}
                table{width:100%;border-collapse:collapse;margin-top:12px}
                th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
                th{background:#7c3aed;color:#fff}
            </style></head><body>
            <h1>Reporte de ventas — Purple Shop</h1>
            <p>Generado: ${window.Format?.dateTime(new Date().toISOString()) || new Date().toLocaleString()}</p>
            <div class="summary">
                <strong>Total del periodo:</strong> ${window.Format?.currency(totalRevenue)} ·
                <strong>Pedidos:</strong> ${groups.length}
            </div>
            <table><thead><tr><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>${rows}</tbody></table>
            </body></html>
        `);
        win.document.close();
        win.focus();
        win.print();
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

window.ReportsViewManager = new ReportsViewManager();
console.log('[ReportsView] ✅ Loaded');
