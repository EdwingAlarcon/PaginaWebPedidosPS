/**
 * OrdersViewManager — pestaña "Pedidos", construida sobre datos reales de
 * InventoryManager (agrupados por pedido vía window.OrderAggregates).
 *
 * Antes de este módulo, la pestaña #orders era un cascarón estático
 * (#loadOrdersBtn/#exportPdfBtn/#ordersContainer) sin ningún JS cargado
 * detrás — esa lógica solo existía en src/core/legacy/app.js, que
 * index.html no incluye. Este módulo la reemplaza por completo.
 *
 * Acciones de fila limitadas a lo que InventoryManager ya soporta:
 * updateOrder(id, updates) y deleteOrder(id) operan sobre UNA línea; para
 * un pedido agrupado se aplican a todas las líneas del grupo (misma
 * operación repetida, no lógica nueva de persistencia).
 */
class OrdersViewManager {
    constructor() {
        this.state = {
            search: '',
            statusFilter: '',
            clientFilter: '',
            dateFrom: '',
            dateTo: '',
            sortBy: 'orderDate',
            sortDir: 'desc',
            page: 1,
            pageSize: 10
        };
        this._openMenuId = null;
        this._boundRender = () => this.render();
    }

    initialize() {
        try {
            window.EventBus?.on('tab:changed', ({ tab }) => {
                if (tab === 'orders') this.render();
            });
            window.EventBus?.on('order:added', this._boundRender);
            document.addEventListener('click', (e) => {
                if (!e.target.closest?.('.row-menu')) this._closeMenu();
            });
            this.render();
            console.log('[OrdersView] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[OrdersView] ❌ Initialization error:', error);
            return false;
        }
    }

    /* ==================== DATOS ==================== */

    _allGroups() {
        return window.OrderAggregates?.groupOrders() || [];
    }

    _filteredSorted() {
        const { search, statusFilter, clientFilter, dateFrom, dateTo, sortBy, sortDir } = this.state;
        let groups = this._allGroups();

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            groups = groups.filter((g) =>
                g.clientName.toLowerCase().includes(q) ||
                g.lines.some((l) => (l.productName || '').toLowerCase().includes(q))
            );
        }
        if (statusFilter) groups = groups.filter((g) => g.status === statusFilter);
        if (clientFilter) groups = groups.filter((g) => g.clientName === clientFilter);
        if (dateFrom) groups = groups.filter((g) => new Date(g.orderDate) >= new Date(dateFrom));
        if (dateTo) groups = groups.filter((g) => new Date(g.orderDate) <= new Date(`${dateTo}T23:59:59`));

        groups.sort((a, b) => {
            let av;
            let bv;
            if (sortBy === 'total') { av = a.total; bv = b.total; }
            else if (sortBy === 'clientName') { av = a.clientName.toLowerCase(); bv = b.clientName.toLowerCase(); }
            else { av = new Date(a.orderDate).getTime() || 0; bv = new Date(b.orderDate).getTime() || 0; }

            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return groups;
    }

    /* ==================== RENDER ==================== */

    render() {
        const container = document.getElementById('ordersViewContent');
        if (!container) return;

        const allGroups = this._allGroups();
        const filtered = this._filteredSorted();
        const totalPages = Math.max(1, Math.ceil(filtered.length / this.state.pageSize));
        if (this.state.page > totalPages) this.state.page = totalPages;
        const start = (this.state.page - 1) * this.state.pageSize;
        const pageItems = filtered.slice(start, start + this.state.pageSize);

        container.innerHTML = `
            ${this._renderToolbar(allGroups, filtered.length)}
            ${pageItems.length === 0 ? this._renderEmptyState(allGroups.length) : this._renderTable(pageItems)}
            ${filtered.length > 0 ? this._renderPagination(totalPages, filtered.length) : ''}
        `;

        this._wireToolbar();
        this._wireTableActions();
        window.Icons?.mount(container);
    }

    _renderToolbar(allGroups, resultCount) {
        const clients = [...new Set(allGroups.map((g) => g.clientName))].sort();
        const { search, statusFilter, clientFilter, dateFrom, dateTo } = this.state;

        return `
            <div class="view-toolbar">
                <div class="view-toolbar-row">
                    <div class="view-search">
                        <span data-icon="search" data-icon-size="16" aria-hidden="true"></span>
                        <input type="search" id="ordersSearchInput" placeholder="Buscar por cliente o producto…" value="${this._escape(search)}" aria-label="Buscar pedidos" />
                    </div>
                    <button type="button" class="btn-secondary btn-small" id="ordersExportPdfBtn">
                        <span data-icon="file-text" data-icon-size="16" aria-hidden="true"></span>
                        Exportar PDF
                    </button>
                </div>
                <div class="view-toolbar-row view-filters">
                    <select id="ordersStatusFilter" aria-label="Filtrar por estado">
                        <option value="">Todos los estados</option>
                        <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="completed" ${statusFilter === 'completed' ? 'selected' : ''}>Completado</option>
                        <option value="cancelled" ${statusFilter === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                    </select>
                    <select id="ordersClientFilter" aria-label="Filtrar por cliente">
                        <option value="">Todos los clientes</option>
                        ${clients.map((c) => `<option value="${this._escape(c)}" ${clientFilter === c ? 'selected' : ''}>${this._escape(c)}</option>`).join('')}
                    </select>
                    <label class="view-filter-date">
                        Desde
                        <input type="date" id="ordersDateFrom" value="${dateFrom}" />
                    </label>
                    <label class="view-filter-date">
                        Hasta
                        <input type="date" id="ordersDateTo" value="${dateTo}" />
                    </label>
                    ${(search || statusFilter || clientFilter || dateFrom || dateTo) ? '<button type="button" class="btn-link" id="ordersClearFiltersBtn">Limpiar filtros</button>' : ''}
                </div>
                <p class="view-result-count">${resultCount} pedido${resultCount === 1 ? '' : 's'} encontrado${resultCount === 1 ? '' : 's'}</p>
            </div>
        `;
    }

    _renderEmptyState(totalUnfiltered) {
        if (totalUnfiltered === 0) {
            return `
                <div class="empty-state empty-state-panel">
                    <span class="empty-state-icon" data-icon="receipt" data-icon-size="32" aria-hidden="true"></span>
                    <p class="empty-state-title">No hay pedidos todavía</p>
                    <p class="empty-state-hint">Registra tu primer pedido desde "Nuevo Pedido".</p>
                </div>
            `;
        }
        return `
            <div class="empty-state empty-state-panel">
                <span class="empty-state-icon" data-icon="search" data-icon-size="32" aria-hidden="true"></span>
                <p class="empty-state-title">No encontramos pedidos con estos filtros</p>
                <p class="empty-state-hint">Ajusta la búsqueda o limpia los filtros para ver más resultados.</p>
            </div>
        `;
    }

    _renderTable(groups) {
        const { sortBy, sortDir } = this.state;
        const sortIcon = (col) => (sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '');

        const rows = groups.map((g) => `
            <tr data-order-id="${g.id}">
                <td data-label="Cliente">${this._escape(g.clientName)}</td>
                <td data-label="Fecha">${window.Format?.date(g.orderDate) || '—'}</td>
                <td data-label="Productos">${g.productCount}</td>
                <td data-label="Total">${window.Format?.currency(g.total) || g.total}</td>
                <td data-label="Estado"><span class="badge badge-${g.status}">${this._statusLabel(g.status)}</span></td>
                <td data-label="Acciones" class="col-actions">
                    <div class="row-menu">
                        <button type="button" class="btn-icon-only btn-row-menu" aria-label="Acciones del pedido" aria-haspopup="true" aria-expanded="${this._openMenuId === g.id}">
                            <span data-icon="more-vertical" data-icon-size="18" aria-hidden="true"></span>
                        </button>
                        ${this._openMenuId === g.id ? this._renderRowMenu(g) : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        return `
            <div class="table-responsive">
                <table class="data-table stack-table">
                    <thead>
                        <tr>
                            <th data-sort="clientName" class="sortable">Cliente ${sortIcon('clientName')}</th>
                            <th data-sort="orderDate" class="sortable">Fecha ${sortIcon('orderDate')}</th>
                            <th>Productos</th>
                            <th data-sort="total" class="sortable">Total ${sortIcon('total')}</th>
                            <th>Estado</th>
                            <th class="col-actions">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    _renderRowMenu(group) {
        const toggleLabel = group.status === 'completed' ? 'Marcar como pendiente' : 'Marcar como completado';
        return `
            <div class="row-menu-dropdown" role="menu">
                <button type="button" class="row-menu-item" data-action="detail" role="menuitem">
                    <span data-icon="file-text" data-icon-size="15" aria-hidden="true"></span> Ver detalle
                </button>
                <button type="button" class="row-menu-item" data-action="toggle-status" role="menuitem">
                    <span data-icon="cloud-check" data-icon-size="15" aria-hidden="true"></span> ${toggleLabel}
                </button>
                <button type="button" class="row-menu-item row-menu-item-danger" data-action="delete" role="menuitem">
                    <span data-icon="trash" data-icon-size="15" aria-hidden="true"></span> Eliminar pedido
                </button>
            </div>
        `;
    }

    _renderPagination(totalPages, totalItems) {
        const { page, pageSize } = this.state;
        return `
            <div class="view-pagination">
                <span class="view-pagination-info">Página ${page} de ${totalPages} · ${totalItems} en total</span>
                <div class="view-pagination-actions">
                    <button type="button" class="btn-icon-only" id="ordersPrevPageBtn" ${page <= 1 ? 'disabled' : ''} aria-label="Página anterior">
                        <span data-icon="chevron-left" data-icon-size="16" aria-hidden="true"></span>
                    </button>
                    <button type="button" class="btn-icon-only" id="ordersNextPageBtn" ${page >= totalPages ? 'disabled' : ''} aria-label="Página siguiente">
                        <span data-icon="chevron-right" data-icon-size="16" aria-hidden="true"></span>
                    </button>
                </div>
            </div>
        `;
    }

    /* ==================== EVENTOS ==================== */

    _wireToolbar() {
        const searchInput = document.getElementById('ordersSearchInput');
        searchInput?.addEventListener('input', (e) => {
            this.state.search = e.target.value;
            this.state.page = 1;
            this.render();
            document.getElementById('ordersSearchInput')?.focus();
            const val = document.getElementById('ordersSearchInput');
            if (val) val.setSelectionRange(val.value.length, val.value.length);
        });

        document.getElementById('ordersStatusFilter')?.addEventListener('change', (e) => {
            this.state.statusFilter = e.target.value;
            this.state.page = 1;
            this.render();
        });
        document.getElementById('ordersClientFilter')?.addEventListener('change', (e) => {
            this.state.clientFilter = e.target.value;
            this.state.page = 1;
            this.render();
        });
        document.getElementById('ordersDateFrom')?.addEventListener('change', (e) => {
            this.state.dateFrom = e.target.value;
            this.state.page = 1;
            this.render();
        });
        document.getElementById('ordersDateTo')?.addEventListener('change', (e) => {
            this.state.dateTo = e.target.value;
            this.state.page = 1;
            this.render();
        });
        document.getElementById('ordersClearFiltersBtn')?.addEventListener('click', () => {
            this.state.search = '';
            this.state.statusFilter = '';
            this.state.clientFilter = '';
            this.state.dateFrom = '';
            this.state.dateTo = '';
            this.state.page = 1;
            this.render();
        });
        document.getElementById('ordersExportPdfBtn')?.addEventListener('click', () => this._exportPdf());

        document.querySelectorAll('#ordersViewContent th.sortable').forEach((th) => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-sort');
                if (this.state.sortBy === col) {
                    this.state.sortDir = this.state.sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.state.sortBy = col;
                    this.state.sortDir = 'desc';
                }
                this.render();
            });
        });

        document.getElementById('ordersPrevPageBtn')?.addEventListener('click', () => {
            this.state.page = Math.max(1, this.state.page - 1);
            this.render();
        });
        document.getElementById('ordersNextPageBtn')?.addEventListener('click', () => {
            this.state.page += 1;
            this.render();
        });
    }

    _wireTableActions() {
        document.querySelectorAll('#ordersViewContent .btn-row-menu').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('tr')?.getAttribute('data-order-id');
                this._openMenuId = this._openMenuId === id ? null : id;
                this.render();
            });
        });

        document.querySelectorAll('#ordersViewContent .row-menu-item').forEach((item) => {
            item.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = item.getAttribute('data-action');
                const id = item.closest('tr')?.getAttribute('data-order-id');
                const group = this._allGroups().find((g) => g.id === id);
                this._openMenuId = null;
                this.render(); // cierra el dropdown de inmediato, incluso para "Ver detalle"
                if (!group) return;

                if (action === 'detail') this._showDetail(group);
                else if (action === 'toggle-status') await this._toggleStatus(group);
                else if (action === 'delete') await this._deleteGroup(group);
            });
        });
    }

    _closeMenu() {
        if (this._openMenuId !== null) {
            this._openMenuId = null;
            this.render();
        }
    }

    /* ==================== ACCIONES ==================== */

    async _toggleStatus(group) {
        const newStatus = group.status === 'completed' ? 'pending' : 'completed';
        try {
            group.lines.forEach((line) => window.InventoryManager.updateOrder(line.id, { status: newStatus }));
            window.NotificationService?.success(
                newStatus === 'completed' ? 'Pedido marcado como completado' : 'Pedido marcado como pendiente'
            );
            this.render();
        } catch (error) {
            window.NotificationService?.error(`No se pudo actualizar el pedido: ${error.message}`);
        }
    }

    async _deleteGroup(group) {
        const confirmed = await window.ConfirmModal?.show({
            title: '¿Eliminar este pedido?',
            message: `Se eliminará el pedido de ${group.clientName} (${group.productCount} producto${group.productCount === 1 ? '' : 's'}). Esta acción no se puede deshacer.`,
            confirmLabel: 'Sí, eliminar',
            cancelLabel: 'Cancelar',
            danger: true
        });
        if (!confirmed) return;

        try {
            group.lines.forEach((line) => window.InventoryManager.deleteOrder(line.id));
            window.NotificationService?.success('Pedido eliminado correctamente');
            this.render();
        } catch (error) {
            window.NotificationService?.error(`No se pudo eliminar el pedido: ${error.message}`);
        }
    }

    _showDetail(group) {
        const dialog = this._ensureDetailDialog();
        const rows = group.lines.map((l) => `
            <tr>
                <td>${this._escape(l.productName)}</td>
                <td>${l.quantity}</td>
                <td>${window.Format?.currency(l.price) || l.price}</td>
                <td>${window.Format?.currency(l.totalPrice) || l.totalPrice}</td>
            </tr>
        `).join('');

        dialog.querySelector('.order-detail-body').innerHTML = `
            <h2 class="confirm-modal-title">Pedido de ${this._escape(group.clientName)}</h2>
            <dl class="order-detail-meta">
                <div><dt>Fecha</dt><dd>${window.Format?.date(group.orderDate) || '—'}</dd></div>
                <div><dt>Teléfono</dt><dd>${this._escape(group.phoneNumber) || '—'}</dd></div>
                <div><dt>Dirección</dt><dd>${this._escape(group.address) || '—'}</dd></div>
                <div><dt>Estado</dt><dd><span class="badge badge-${group.status}">${this._statusLabel(group.status)}</span></dd></div>
            </dl>
            <div class="table-responsive">
                <table class="data-table">
                    <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <dl class="order-detail-totals">
                <div><dt>Subtotal</dt><dd>${window.Format?.currency(group.subtotal) || group.subtotal}</dd></div>
                ${group.discount ? `<div><dt>Descuento (${group.discount}%)</dt><dd>-${window.Format?.currency(group.subtotal * group.discount / 100) || ''}</dd></div>` : ''}
                ${group.shippingCost ? `<div><dt>Envío</dt><dd>+${window.Format?.currency(group.shippingCost) || ''}</dd></div>` : ''}
                <div class="order-detail-grand-total"><dt>Total</dt><dd>${window.Format?.currency(group.total) || group.total}</dd></div>
            </dl>
            ${group.notes ? `<p class="order-detail-notes"><strong>Notas:</strong> ${this._escape(group.notes)}</p>` : ''}
        `;
        window.Icons?.mount(dialog);
        dialog.showModal();
    }

    _ensureDetailDialog() {
        let dialog = document.getElementById('orderDetailDialog');
        if (dialog) return dialog;

        dialog = document.createElement('dialog');
        dialog.id = 'orderDetailDialog';
        dialog.className = 'confirm-modal order-detail-dialog';
        dialog.innerHTML = `
            <div class="order-detail-body confirm-modal-body"></div>
            <form method="dialog" class="order-detail-close-row">
                <button type="submit" class="btn-secondary">Cerrar</button>
            </form>
        `;
        document.body.appendChild(dialog);
        return dialog;
    }

    _exportPdf() {
        const groups = this._filteredSorted();
        if (groups.length === 0) {
            window.NotificationService?.info('No hay pedidos para exportar con los filtros actuales');
            return;
        }

        const rows = groups.map((g) => `
            <tr>
                <td>${this._escape(g.clientName)}</td>
                <td>${window.Format?.date(g.orderDate) || '—'}</td>
                <td>${g.productCount}</td>
                <td>${window.Format?.currency(g.total) || g.total}</td>
                <td>${this._statusLabel(g.status)}</td>
            </tr>
        `).join('');

        const win = window.open('', '_blank');
        if (!win) {
            window.NotificationService?.error('El navegador bloqueó la ventana de impresión');
            return;
        }
        win.document.write(`
            <!doctype html><html lang="es"><head><meta charset="utf-8"><title>Pedidos — Purple Shop</title>
            <style>
                body{font-family:Arial,sans-serif;padding:24px;color:#16121f}
                h1{color:#7c3aed}
                table{width:100%;border-collapse:collapse;margin-top:16px}
                th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
                th{background:#7c3aed;color:#fff}
            </style></head><body>
            <h1>Pedidos — Purple Shop</h1>
            <p>Generado: ${window.Format?.dateTime(new Date().toISOString()) || new Date().toLocaleString()}</p>
            <table><thead><tr><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>${rows}</tbody></table>
            </body></html>
        `);
        win.document.close();
        win.focus();
        win.print();
    }

    /* ==================== UTIL ==================== */

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

window.OrdersViewManager = new OrdersViewManager();
console.log('[OrdersView] ✅ Loaded');
