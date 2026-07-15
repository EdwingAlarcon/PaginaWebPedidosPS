(function () {
    const STORAGE_LABELS = 'purpleshop.shippingLabels.labels';
    const STORAGE_SETTINGS = 'purpleshop.shippingLabels.settings';
    const STORAGE_SEQUENCE = 'purpleshop.shippingLabels.sequence';

    const defaultSettings = {
        sender: {
            name: 'PurpleShop',
            phone: '',
            department: '',
            city: '',
            address: ''
        },
        logoUrl: 'assets/images/logo-purple-shop.png',
        qrUrl: 'assets/images/purple-shop-qr.png',
        instagramUser: '@PURPLESHOP.ONLINE',
        brandPhrase: 'Detalles que viajan con amor',
        prefix: 'PS',
        suffix: '',
        sequenceDigits: 6,
        initialSequence: 1,
        pattern: '{PREFIX}-{YEAR}-{SEQUENCE}',
        allowManualEdit: true
    };

    let labels = [];
    let settings = { ...defaultSettings, sender: { ...defaultSettings.sender } };
    let currentId = null;
    let draft = createDraft();

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    function readJson(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function createDraft() {
        return {
            orderNumber: '',
            date: today(),
            carrier: '',
            paymentMethod: 'pagado',
            codAmount: 0,
            packageCount: 1,
            status: 'generado',
            sender: { ...settings.sender },
            recipient: {
                fullName: '',
                phone: '',
                department: '',
                city: '',
                address: '',
                neighborhood: '',
                reference: '',
                notes: ''
            }
        };
    }

    function loadState() {
        labels = readJson(STORAGE_LABELS, []);
        settings = { ...defaultSettings, ...readJson(STORAGE_SETTINGS, {}), sender: { ...defaultSettings.sender, ...(readJson(STORAGE_SETTINGS, {}).sender || {}) } };
        draft = createDraft();
    }

    function saveLabels() {
        writeJson(STORAGE_LABELS, labels);
    }

    function saveSettings() {
        writeJson(STORAGE_SETTINGS, settings);
    }

    function padSequence(value) {
        return String(value).padStart(Number(settings.sequenceDigits) || 6, '0');
    }

    function nextSequenceValue() {
        const current = Number(localStorage.getItem(STORAGE_SEQUENCE) || '0');
        return current > 0 ? current + 1 : Number(settings.initialSequence) || 1;
    }

    function formatOrderNumber(sequence) {
        const date = new Date(`${draft.date || today()}T00:00:00`);
        const replacements = {
            PREFIX: cleanToken(settings.prefix),
            SUFFIX: cleanToken(settings.suffix),
            YEAR: String(date.getFullYear()),
            MONTH: String(date.getMonth() + 1).padStart(2, '0'),
            DAY: String(date.getDate()).padStart(2, '0'),
            DATE: `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`,
            SEQUENCE: padSequence(sequence),
            CITY: cleanToken(draft.recipient.city),
            DEPARTMENT: cleanToken(draft.recipient.department)
        };
        return String(settings.pattern || '{PREFIX}-{YEAR}-{SEQUENCE}').replace(/\{([A-Z]+)\}/g, (_, key) => replacements[key] || '');
    }

    function cleanToken(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '')
            .toUpperCase();
    }

    function getDisplayOrderNumber() {
        return draft.orderNumber.trim() || formatOrderNumber(nextSequenceValue());
    }

    function setStatus(message) {
        const status = document.getElementById('labelsStatus');
        if (status) status.textContent = message || '';
    }

    function field(label, path, options = {}) {
        const value = getPath(draft, path);
        const tag = options.textarea ? 'textarea' : 'input';
        const type = options.type || 'text';
        const attrs = tag === 'input' ? `type="${type}"` : `rows="${options.rows || 2}"`;
        return `<label class="labels-field ${options.full ? 'full' : ''}"><span>${label}</span><${tag} ${attrs} data-label-field="${path}" value="${tag === 'input' ? escapeHtml(value) : ''}">${tag === 'textarea' ? escapeHtml(value) : ''}</${tag}></label>`;
    }

    function getPath(object, path) {
        return path.split('.').reduce((acc, key) => acc?.[key], object) ?? '';
    }

    function setPath(object, path, value) {
        const parts = path.split('.');
        let target = object;
        parts.slice(0, -1).forEach((part) => { target = target[part]; });
        const key = parts[parts.length - 1];
        target[key] = value;
    }

    function render() {
        const app = document.getElementById('shippingLabelsApp');
        if (!app) return;
        const todayCount = labels.filter((label) => label.createdAt?.slice(0, 10) === today()).length;
        app.innerHTML = `
            <div class="labels-toolbar">
                <div>
                    <h2>Rótulos de envío</h2>
                    <p>Genera, guarda, imprime y reutiliza rótulos PurpleShop listos para entrega.</p>
                </div>
                <div class="labels-actions">
                    <button class="labels-btn" type="button" data-label-action="new">Nuevo</button>
                    <button class="labels-btn primary" type="button" data-label-action="save">Guardar rótulo</button>
                    <button class="labels-btn" type="button" data-label-action="print">Imprimir</button>
                    <button class="labels-btn" type="button" data-label-action="pdf">Descargar PDF</button>
                </div>
            </div>
            <div class="labels-metrics">
                <div class="labels-metric"><span>Total de rótulos</span><strong>${labels.length}</strong></div>
                <div class="labels-metric"><span>Generados hoy</span><strong>${todayCount}</strong></div>
                <div class="labels-metric"><span>Próximo pedido</span><strong>${escapeHtml(getDisplayOrderNumber())}</strong></div>
            </div>
            <p id="labelsStatus" class="labels-status" role="status"></p>
            <div class="labels-grid">
                <div class="labels-subgrid">
                    <section class="labels-panel">
                        <h3>Crear rótulo</h3>
                        <div class="labels-form-grid">
                            ${field('Nombre / Empresa remitente', 'sender.name')}
                            ${field('Teléfono remitente', 'sender.phone')}
                            ${field('Departamento remitente', 'sender.department')}
                            ${field('Ciudad remitente', 'sender.city')}
                            ${field('Dirección remitente', 'sender.address', { full: true })}
                            ${field('Nombre y apellidos destinatario', 'recipient.fullName')}
                            ${field('Teléfono destinatario', 'recipient.phone')}
                            ${field('Departamento destinatario', 'recipient.department')}
                            ${field('Ciudad destinatario', 'recipient.city')}
                            ${field('Dirección completa', 'recipient.address', { textarea: true, full: true, rows: 3 })}
                            ${field('Barrio / sector', 'recipient.neighborhood')}
                            ${field('Referencia o indicaciones', 'recipient.reference')}
                            ${field('Observaciones', 'recipient.notes', { textarea: true, full: true })}
                            ${field('Número de pedido', 'orderNumber')}
                            ${field('Fecha', 'date', { type: 'date' })}
                            ${field('Transportadora', 'carrier')}
                            <label class="labels-field"><span>Método de pago</span><select data-label-field="paymentMethod"><option value="pagado" ${draft.paymentMethod === 'pagado' ? 'selected' : ''}>Pagado</option><option value="contraentrega" ${draft.paymentMethod === 'contraentrega' ? 'selected' : ''}>Contraentrega</option></select></label>
                            ${field('Valor contraentrega', 'codAmount', { type: 'number' })}
                            ${field('Cantidad de paquetes', 'packageCount', { type: 'number' })}
                        </div>
                    </section>
                    <section class="labels-panel">
                        <h3>Configuración</h3>
                        <div class="labels-form-grid">
                            ${settingsField('Prefijo', 'prefix')}
                            ${settingsField('Sufijo', 'suffix')}
                            ${settingsField('Formato', 'pattern', true)}
                            ${settingsField('Número inicial', 'initialSequence', false, 'number')}
                            ${settingsField('Dígitos', 'sequenceDigits', false, 'number')}
                            ${settingsField('Instagram', 'instagramUser')}
                            ${settingsField('Frase de marca', 'brandPhrase', true)}
                        </div>
                        <div class="labels-actions" style="margin-top: 1rem"><button class="labels-btn" type="button" data-label-action="settings">Guardar configuración</button></div>
                    </section>
                </div>
                <aside class="labels-preview-shell">
                    ${labelHtml(draft)}
                </aside>
            </div>
            <section class="labels-panel">
                <h3>Historial de rótulos</h3>
                <label class="labels-field"><span>Buscar por pedido, cliente o teléfono</span><input id="labelsSearch" type="search"></label>
                <div id="labelsHistory">${historyHtml(labels)}</div>
            </section>
        `;
        bindEvents(app);
    }

    function settingsField(label, key, full = false, type = 'text') {
        return `<label class="labels-field ${full ? 'full' : ''}"><span>${label}</span><input type="${type}" data-setting-field="${key}" value="${escapeHtml(settings[key])}"></label>`;
    }

    function labelHtml(label) {
        const order = label.orderNumber || getDisplayOrderNumber();
        const payment = label.paymentMethod === 'contraentrega' ? `Contraentrega $${Number(label.codAmount || 0).toLocaleString('es-CO')}` : 'Pagado';
        return `<article class="shipping-label-preview" id="shippingLabelPreview">
            <header class="shipping-label-header">
                <div class="shipping-label-brand"><img src="${settings.logoUrl}" alt="Logo PurpleShop"><div><strong>PurpleShop</strong><span>${escapeHtml(settings.brandPhrase)}</span></div></div>
                <div class="shipping-label-social"><img src="${settings.qrUrl}" alt="QR de Instagram PurpleShop"><span>${escapeHtml(settings.instagramUser)}</span></div>
            </header>
            <div class="shipping-label-meta"><strong>${escapeHtml(order)}</strong><span>${escapeHtml(label.date || today())}</span><span>${escapeHtml(label.carrier || 'Transportadora')}</span><span>${Number(label.packageCount || 1)} paquete(s)</span></div>
            <div class="shipping-label-body">
                <section class="shipping-label-block"><h4>Remitente</h4><p class="person">${escapeHtml(label.sender.name || 'PurpleShop')}</p><p>Tel: ${escapeHtml(label.sender.phone || '300 000 0000')}</p><p>${escapeHtml(label.sender.city || 'Ciudad')}, ${escapeHtml(label.sender.department || 'Departamento')}</p><p>${escapeHtml(label.sender.address || 'Dirección del remitente')}</p></section>
                <section class="shipping-label-block"><h4>Destinatario</h4><p class="person">${escapeHtml(label.recipient.fullName || 'Nombre del cliente')}</p><p>Tel: ${escapeHtml(label.recipient.phone || '310 000 0000')}</p><p>${escapeHtml(label.recipient.city || 'Ciudad')}, ${escapeHtml(label.recipient.department || 'Departamento')}</p><p class="address">${escapeHtml(label.recipient.address || 'Dirección completa del destinatario')}</p><p>Barrio: ${escapeHtml(label.recipient.neighborhood || 'Sector')}</p><p>Ref: ${escapeHtml(label.recipient.reference || 'Indicaciones de entrega')}</p></section>
            </div>
            <footer class="shipping-label-footer"><strong>${escapeHtml(payment)}</strong><span>${escapeHtml(label.recipient.notes || 'Gracias por comprar en PurpleShop')}</span></footer>
        </article>`;
    }

    function historyHtml(items) {
        if (!items.length) return '<p>Aún no hay rótulos guardados.</p>';
        return `<table class="labels-history-table"><thead><tr><th>Cliente</th><th>Teléfono</th><th>Ciudad</th><th>Fecha</th><th>Pedido</th><th>Acciones</th></tr></thead><tbody>${items.map((label) => `<tr><td>${escapeHtml(label.recipient.fullName)}</td><td>${escapeHtml(label.recipient.phone)}</td><td>${escapeHtml(label.recipient.city)}</td><td>${escapeHtml(label.date)}</td><td>${escapeHtml(label.orderNumber)}</td><td><button class="labels-btn" data-history-action="edit" data-id="${label.id}">Editar</button> <button class="labels-btn" data-history-action="duplicate" data-id="${label.id}">Duplicar</button> <button class="labels-btn" data-history-action="print" data-id="${label.id}">Imprimir</button> <button class="labels-btn" data-history-action="delete" data-id="${label.id}">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
    }

    function bindEvents(app) {
        app.querySelectorAll('[data-label-field]').forEach((input) => {
            input.addEventListener('input', () => {
                const path = input.dataset.labelField;
                const value = input.type === 'number' ? Number(input.value) : input.value;
                setPath(draft, path, value);
                const preview = document.getElementById('shippingLabelPreview');
                if (preview) preview.outerHTML = labelHtml(draft);
                const metric = app.querySelector('.labels-metric:nth-child(3) strong');
                if (metric) metric.textContent = getDisplayOrderNumber();
            });
        });
        app.querySelectorAll('[data-setting-field]').forEach((input) => {
            input.addEventListener('input', () => {
                settings[input.dataset.settingField] = input.type === 'number' ? Number(input.value) : input.value;
            });
        });
        app.querySelectorAll('[data-label-action]').forEach((button) => {
            button.addEventListener('click', () => handleAction(button.dataset.labelAction));
        });
        app.querySelectorAll('[data-history-action]').forEach((button) => {
            button.addEventListener('click', () => handleHistory(button.dataset.historyAction, button.dataset.id));
        });
        const search = document.getElementById('labelsSearch');
        if (search) {
            search.addEventListener('input', () => {
                const needle = search.value.trim().toLowerCase();
                const filtered = labels.filter((label) => [label.orderNumber, label.recipient.fullName, label.recipient.phone, label.recipient.city].some((value) => String(value || '').toLowerCase().includes(needle)));
                document.getElementById('labelsHistory').innerHTML = historyHtml(filtered);
                bindEvents(app);
            });
        }
    }

    function validateDraft() {
        const required = [draft.sender.name, draft.sender.phone, draft.sender.department, draft.sender.city, draft.sender.address, draft.recipient.fullName, draft.recipient.phone, draft.recipient.department, draft.recipient.city, draft.recipient.address, draft.carrier];
        return required.every((value) => String(value || '').trim());
    }

    function handleAction(action) {
        if (action === 'new') {
            currentId = null;
            draft = createDraft();
            render();
            setStatus('Nuevo rótulo listo.');
            return;
        }
        if (action === 'settings') {
            saveSettings();
            render();
            setStatus('Configuración guardada.');
            return;
        }
        if ((action === 'save' || action === 'print' || action === 'pdf') && !validateDraft()) {
            setStatus('Completa remitente, destinatario, dirección y transportadora antes de continuar.');
            return;
        }
        if (action === 'save') saveDraft();
        if (action === 'print') printLabel(draft);
        if (action === 'pdf') printLabel(draft, true);
    }

    function saveDraft() {
        const manual = draft.orderNumber.trim();
        const orderNumber = manual || formatOrderNumber(nextSequenceValue());
        if (labels.some((label) => label.orderNumber === orderNumber && label.id !== currentId)) {
            setStatus('Ese número de pedido ya existe.');
            return;
        }
        if (!manual) localStorage.setItem(STORAGE_SEQUENCE, String(nextSequenceValue()));
        const record = JSON.parse(JSON.stringify({ ...draft, orderNumber }));
        record.id = currentId || crypto.randomUUID();
        record.createdAt = currentId ? labels.find((label) => label.id === currentId)?.createdAt || new Date().toISOString() : new Date().toISOString();
        record.updatedAt = new Date().toISOString();
        const index = labels.findIndex((label) => label.id === record.id);
        if (index >= 0) labels[index] = record;
        else labels.unshift(record);
        currentId = record.id;
        draft = JSON.parse(JSON.stringify(record));
        saveLabels();
        render();
        setStatus(`Rótulo ${orderNumber} guardado.`);
    }

    function handleHistory(action, id) {
        const label = labels.find((item) => item.id === id);
        if (!label) return;
        if (action === 'edit') {
            currentId = id;
            draft = JSON.parse(JSON.stringify(label));
            render();
            setStatus(`Editando ${label.orderNumber}.`);
        }
        if (action === 'duplicate') {
            currentId = null;
            draft = JSON.parse(JSON.stringify({ ...label, id: undefined, orderNumber: '' }));
            render();
            setStatus('Rótulo duplicado. Guarda para asignar nuevo pedido.');
        }
        if (action === 'print') printLabel(label);
        if (action === 'delete') {
            labels = labels.filter((item) => item.id !== id);
            saveLabels();
            render();
            setStatus('Rótulo eliminado.');
        }
    }

    function printLabel(label, pdfMode = false) {
        const win = window.open('', '_blank', 'noopener,noreferrer');
        if (!win) {
            setStatus('El navegador bloqueó la ventana de impresión.');
            return;
        }
        win.document.write(`<!doctype html><html lang="es"><head><title>${pdfMode ? 'PDF' : 'Imprimir'} ${escapeHtml(label.orderNumber || getDisplayOrderNumber())}</title><link rel="stylesheet" href="css/labels.css"><style>@page{size:14cm 11cm;margin:0}body{margin:0;background:#fff}.shipping-label-preview{max-width:none}</style></head><body>${labelHtml(label)}<script>window.onload=()=>setTimeout(()=>window.print(),200)<\/script></body></html>`);
        win.document.close();
        setStatus(pdfMode ? 'Se abrió el rótulo. En el diálogo de impresión elige “Guardar como PDF”.' : 'Se abrió el diálogo de impresión.');
    }

    window.PurpleShopLabels = {
        initialize() {
            loadState();
            render();
        }
    };

    document.addEventListener('DOMContentLoaded', () => window.PurpleShopLabels.initialize());
})();
