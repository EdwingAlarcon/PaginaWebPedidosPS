/**
 * ClientsViewManager — pestaña "Clientes".
 *
 * Contexto importante: el sistema NO tiene una tabla de clientes propia —
 * InventoryManager solo guarda pedidos, y el nombre/teléfono/email/dirección
 * de cada cliente viven repetidos en cada línea de pedido (ver CLAUDE.md:
 * "el client-search datalist se puebla desde los clientes distintos de
 * InventoryManager.getAll(), no desde un Clientes.xlsx separado"). Por eso
 * la lista principal de clientes se DERIVA de los pedidos (agrupando por
 * nombre), sin inventar un modelo de datos nuevo.
 *
 * La única pieza nueva de persistencia es para el caso "registrar un
 * cliente que todavía no tiene ningún pedido" — el formulario "Nuevo
 * Cliente" ya existía en el HTML original (sin ningún JS detrás, como el
 * resto de esta pestaña), así que implementamos el registro mínimo que esa
 * UI prometía: un registro local ligero (localStorage
 * "PaginaWebPedidos_Clients") con nombre/teléfono/email/dirección, que se
 * combina con los clientes derivados de pedidos. No reemplaza ni compite
 * con el modelo de pedidos — un cliente registrado aquí simplemente
 * aparecerá con 0 pedidos hasta que se le registre uno.
 */
class ClientsViewManager {
    constructor() {
        this.storageKey = 'PaginaWebPedidos_Clients';
        this.state = { search: '' };
        this._boundRender = () => this.render();
    }

    initialize() {
        try {
            window.EventBus?.on('tab:changed', ({ tab }) => {
                if (tab === 'clients') this.render();
            });
            window.EventBus?.on('order:added', this._boundRender);
            this.render();
            console.log('[ClientsView] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[ClientsView] ❌ Initialization error:', error);
            return false;
        }
    }

    /* ==================== PERSISTENCIA (solo clientes sin pedidos aún) ==================== */

    _getRegisteredClients() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (error) {
            console.warn('[ClientsView] ⚠️ Could not read registered clients:', error);
            return [];
        }
    }

    _saveRegisteredClients(list) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(list));
        } catch (error) {
            console.warn('[ClientsView] ⚠️ Could not persist registered clients:', error);
        }
    }

    /* ==================== AGREGACIÓN ==================== */

    _allClients() {
        const groups = window.OrderAggregates?.groupOrders() || [];
        const byName = new Map();

        groups.forEach((g) => {
            const key = g.clientName.trim().toLowerCase();
            const existing = byName.get(key);
            const orderTime = new Date(g.orderDate).getTime() || 0;

            if (!existing || orderTime > existing._lastOrderTime) {
                byName.set(key, {
                    name: g.clientName,
                    phone: g.phoneNumber,
                    email: g.email,
                    address: g.address,
                    totalOrders: (existing?.totalOrders || 0) + 1,
                    totalRevenue: (existing?.totalRevenue || 0) + g.total,
                    lastOrderDate: g.orderDate,
                    _lastOrderTime: orderTime
                });
            } else {
                existing.totalOrders += 1;
                existing.totalRevenue += g.total;
            }
        });

        this._getRegisteredClients().forEach((c) => {
            const key = c.name.trim().toLowerCase();
            if (!byName.has(key)) {
                byName.set(key, {
                    name: c.name,
                    phone: c.phone,
                    email: c.email,
                    address: c.address,
                    totalOrders: 0,
                    totalRevenue: 0,
                    lastOrderDate: null,
                    _lastOrderTime: 0,
                    registeredOnly: true
                });
            }
        });

        return Array.from(byName.values()).sort((a, b) => b.totalOrders - a.totalOrders);
    }

    /* ==================== RENDER ==================== */

    render() {
        const container = document.getElementById('clientsViewContent');
        if (!container) return;

        const all = this._allClients();
        const q = this.state.search.trim().toLowerCase();
        const filtered = q
            ? all.filter((c) => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q))
            : all;

        const frequent = [...all].filter((c) => c.totalOrders > 0).sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 3);

        container.innerHTML = `
            <div class="view-toolbar">
                <div class="view-toolbar-row">
                    <div class="view-search">
                        <span data-icon="search" data-icon-size="16" aria-hidden="true"></span>
                        <input type="search" id="clientsSearchInput" placeholder="Buscar por nombre o teléfono…" value="${this._escape(this.state.search)}" aria-label="Buscar clientes" />
                    </div>
                    <button type="button" class="btn-primary btn-small" id="clientsNewBtn">
                        <span data-icon="plus" data-icon-size="16" aria-hidden="true"></span>
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            <div class="kpi-grid clients-kpi-grid">
                <div class="kpi-card kpi-card-static" aria-disabled="true">
                    <span class="kpi-icon" data-icon="users" aria-hidden="true"></span>
                    <span class="kpi-value">${all.length}</span>
                    <span class="kpi-label">Clientes totales</span>
                </div>
            </div>

            ${frequent.length > 0 ? this._renderFrequent(frequent) : ''}

            ${filtered.length === 0 ? this._renderEmpty(all.length) : this._renderTable(filtered)}
        `;

        this._wireEvents();
        window.Icons?.mount(container);
    }

    _renderFrequent(frequent) {
        const items = frequent.map((c) => `
            <div class="frequent-client-chip">
                <span class="frequent-client-name">${this._escape(c.name)}</span>
                <span class="frequent-client-count">${c.totalOrders} pedido${c.totalOrders === 1 ? '' : 's'}</span>
            </div>
        `).join('');
        return `
            <section class="dashboard-panel">
                <h3 class="dashboard-panel-title">Clientes frecuentes</h3>
                <div class="frequent-clients-row">${items}</div>
            </section>
        `;
    }

    _renderEmpty(totalUnfiltered) {
        if (totalUnfiltered === 0) {
            return `
                <div class="empty-state empty-state-panel">
                    <span class="empty-state-icon" data-icon="users" data-icon-size="32" aria-hidden="true"></span>
                    <p class="empty-state-title">No hay clientes todavía</p>
                    <p class="empty-state-hint">Registra un cliente nuevo o crea tu primer pedido.</p>
                </div>
            `;
        }
        return `
            <div class="empty-state empty-state-panel">
                <span class="empty-state-icon" data-icon="search" data-icon-size="32" aria-hidden="true"></span>
                <p class="empty-state-title">No encontramos clientes con esta búsqueda</p>
                <p class="empty-state-hint">Intenta con otro nombre o teléfono.</p>
            </div>
        `;
    }

    _renderTable(clients) {
        const rows = clients.map((c) => `
            <tr>
                <td data-label="Nombre">${this._escape(c.name)}</td>
                <td data-label="Teléfono">${this._escape(c.phone) || '—'}</td>
                <td data-label="Correo">${this._escape(c.email) || '—'}</td>
                <td data-label="Dirección">${this._escape(c.address) || '—'}</td>
                <td data-label="Pedidos">${c.totalOrders}</td>
                <td data-label="Último pedido">${c.lastOrderDate ? (window.Format?.date(c.lastOrderDate) || '—') : '—'}</td>
                <td data-label="Acciones" class="col-actions">
                    <button type="button" class="btn-secondary btn-small" data-action="new-order" data-client="${this._escape(c.name)}">
                        Nuevo pedido
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="table-responsive">
                <table class="data-table stack-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Dirección</th>
                            <th>Pedidos</th>
                            <th>Último pedido</th>
                            <th class="col-actions">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    /* ==================== EVENTOS ==================== */

    _wireEvents() {
        document.getElementById('clientsSearchInput')?.addEventListener('input', (e) => {
            this.state.search = e.target.value;
            this.render();
            const el = document.getElementById('clientsSearchInput');
            el?.focus();
            el?.setSelectionRange(el.value.length, el.value.length);
        });

        document.getElementById('clientsNewBtn')?.addEventListener('click', () => this._showNewClientDialog());

        document.querySelectorAll('#clientsViewContent [data-action="new-order"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const clientName = btn.getAttribute('data-client');
                window.switchTab?.('newOrder');
                setTimeout(() => {
                    const input = document.getElementById('clientSearch');
                    if (input) {
                        input.value = clientName;
                        window.OrderFormManager?.selectExistingClient?.();
                    }
                }, 50);
            });
        });
    }

    _showNewClientDialog() {
        const dialog = this._ensureDialog();
        const form = dialog.querySelector('form');
        form.reset();
        dialog.showModal();
    }

    _ensureDialog() {
        let dialog = document.getElementById('newClientDialog');
        if (dialog) return dialog;

        dialog = document.createElement('dialog');
        dialog.id = 'newClientDialog';
        dialog.className = 'confirm-modal new-client-dialog';
        dialog.innerHTML = `
            <form class="confirm-modal-body" id="newClientForm2">
                <h2 class="confirm-modal-title">Nuevo cliente</h2>
                <div class="form-group">
                    <label for="newClientName2">Nombre completo <span class="required" aria-label="requerido">*</span></label>
                    <input type="text" id="newClientName2" required minlength="3" />
                </div>
                <div class="form-group">
                    <label for="newClientPhone2">Teléfono <span class="required" aria-label="requerido">*</span></label>
                    <input type="tel" id="newClientPhone2" required minlength="7" placeholder="Ej: 3001234567" />
                </div>
                <div class="form-group">
                    <label for="newClientEmail2">Correo electrónico (opcional)</label>
                    <input type="email" id="newClientEmail2" />
                </div>
                <div class="form-group">
                    <label for="newClientAddress2">Dirección</label>
                    <textarea id="newClientAddress2" rows="2"></textarea>
                </div>
                <div class="confirm-modal-actions">
                    <button type="button" class="btn-secondary" id="newClientCancelBtn2">Cancelar</button>
                    <button type="submit" class="btn-primary">Guardar cliente</button>
                </div>
            </form>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#newClientCancelBtn2').addEventListener('click', () => dialog.close());
        dialog.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this._saveNewClient(dialog);
        });

        return dialog;
    }

    _saveNewClient(dialog) {
        const name = dialog.querySelector('#newClientName2').value.trim();
        const phone = dialog.querySelector('#newClientPhone2').value.trim();
        const email = dialog.querySelector('#newClientEmail2').value.trim();
        const address = dialog.querySelector('#newClientAddress2').value.trim();

        if (!name || !phone) return;

        const existing = this._allClients().some((c) => c.name.trim().toLowerCase() === name.toLowerCase());
        if (existing) {
            window.NotificationService?.warning('Ya existe un cliente con ese nombre');
            return;
        }

        const list = this._getRegisteredClients();
        list.push({ name, phone, email, address, createdAt: new Date().toISOString() });
        this._saveRegisteredClients(list);

        window.NotificationService?.success('Cliente guardado correctamente');
        dialog.close();
        this.render();
    }

    _escape(text) {
        if (window.SecurityUtils?.sanitizeText) return window.SecurityUtils.sanitizeText(text);
        const div = document.createElement('div');
        div.textContent = text ?? '';
        return div.innerHTML;
    }
}

window.ClientsViewManager = new ClientsViewManager();
console.log('[ClientsView] ✅ Loaded');
