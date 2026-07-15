/**
 * 📋 ORDER FORM MODULE
 * Interactividad real del formulario "Nuevo Pedido": categorías dinámicas, cálculo
 * de totales, códigos rápidos, búsqueda de cliente y guardado real en InventoryManager.
 *
 * Reemplaza, de forma modular, la lógica equivalente que solo existía en
 * src/core/legacy/app.js (no cargado por index.html) — ver CLAUDE.md.
 */

class OrderFormManager {
    constructor() {
        this.nextProductIndex = 1; // el índice 0 ya existe en el HTML estático
        this.codesStorageKey = 'PaginaWebPedidos_ProductCodes';
        this.recentOrdersStorageKey = 'PaginaWebPedidos_RecentOrders';

        // Campos específicos por categoría (portado de legacy/app.js)
        this.categoryFields = {
            accesorios: [
                { id: 'tipo', label: 'Tipo de Accesorio', type: 'select', required: true,
                    options: ['Anillo', 'Aretes', 'Bolso o Cartera', 'Broche', 'Cadena', 'Collar', 'Dije', 'Gargantilla', 'Llavero', 'Maleta o Morral', 'Piercing', 'Pin', 'Pulsera', 'Reloj', 'Tobillera', 'Otro'] },
                { id: 'talla', label: 'Talla de Anillo', type: 'select', required: false, showWhen: { field: 'tipo', value: 'Anillo' },
                    options: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13'] },
                { id: 'material', label: 'Material', type: 'select', required: true,
                    options: ['Acero inoxidable', 'Bronce', 'Cobre', 'Cristal', 'Cuero', 'Madera', 'Oro', 'Oro rosa', 'Piedras naturales', 'Plata', 'Platino', 'Plástico', 'Resina', 'Tela', 'Titanio', 'Otro'] },
                { id: 'color', label: 'Color', type: 'select', required: true,
                    options: ['Amarillo', 'Azul', 'Blanco', 'Café', 'Dorado', 'Gris', 'Morado', 'Multicolor', 'Naranja', 'Negro', 'Oro rosa', 'Plateado', 'Rojo', 'Rosa', 'Transparente', 'Verde', 'Otro'] }
            ],
            medias: [
                { id: 'talla', label: 'Talla', type: 'select', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'] },
                { id: 'tipo', label: 'Tipo', type: 'select', required: true,
                    options: ['Compresión', 'Con diseño', 'Cortas', 'Deportivas', 'Invisibles', 'Largas', 'Media pierna', 'Pantimedias', 'Térmicas', 'Tobilleras'] },
                { id: 'color', label: 'Color', type: 'select', required: true,
                    options: ['Amarillo', 'Azul', 'Azul marino', 'Beige', 'Blanco', 'Café', 'Estampado', 'Gris', 'Morado', 'Multicolor', 'Naranja', 'Negro', 'Rojo', 'Rosa', 'Verde', 'Otro'] },
                { id: 'material', label: 'Material', type: 'select', required: true,
                    options: ['Algodón', 'Bambú', 'Lana', 'Lycra', 'Mezcla', 'Microfibra', 'Nylon', 'Poliéster', 'Seda', 'Spandex', 'Otro'] }
            ],
            camisetas: [
                { id: 'talla', label: 'Talla', type: 'select', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
                { id: 'color', label: 'Color', type: 'select', required: true,
                    options: ['Amarillo', 'Azul claro', 'Azul marino', 'Beige', 'Blanco', 'Café', 'Gris', 'Morado', 'Multicolor', 'Naranja', 'Negro', 'Rojo', 'Rosa', 'Verde', 'Verde militar', 'Vino tinto', 'Otro'] },
                { id: 'material', label: 'Material', type: 'select', required: true,
                    options: ['Algodón', 'Algodón con elastano', 'Algodón orgánico', 'Bambú', 'Denim', 'Lana', 'Lino', 'Lycra', 'Mezcla de fibras', 'Microfibra', 'Nylon', 'Piel de durazno', 'Poliéster', 'Satén', 'Seda', 'Spandex', 'Terciopelo', 'Otro'] },
                { id: 'tipo', label: 'Tipo/Estilo', type: 'select', required: true,
                    options: ['Crop top', 'Deportiva', 'Manga corta - Cuello V', 'Manga corta - Cuello redondo', 'Manga corta - Polo', 'Manga larga - Cuello V', 'Manga larga - Cuello redondo', 'Oversize', 'Sin mangas', 'Slim fit', 'Térmica'] },
                { id: 'diseno', label: 'Diseño/Estampado', type: 'select', required: true,
                    options: ['Abstracto', 'Bordado', 'Cuadros', 'Deportivo', 'Estampado gráfico', 'Flores', 'Letras/Texto', 'Lisa', 'Logotipo', 'Personajes', 'Rayas', 'Tie-dye', 'Vintage', 'Otro'] }
            ],
            perfumes: [
                { id: 'marca', label: 'Marca', type: 'select', required: true,
                    options: ['Bvlgari', 'Burberry', 'Calvin Klein', 'Carolina Herrera', 'Chanel', 'Cloé', 'Dior', 'Dolce & Gabbana', 'Giorgio Armani', 'Givenchy', 'Gucci', 'Hugo Boss', 'Jean Paul Gaultier', 'Lancôme', 'Marc Jacobs', 'Montblanc', 'Narciso Rodriguez', 'Paco Rabanne', 'Prada', 'Ralph Lauren', 'Tom Ford', 'Versace', "Victoria's Secret", 'Yves Saint Laurent', 'Otra'] },
                { id: 'tipo', label: 'Tipo', type: 'select', required: true,
                    options: ['Body Mist', 'Body Splash', 'Colonia', 'Eau de Cologne', 'Eau de Parfum', 'Eau de Toilette', 'Loción corporal', 'Perfume (Parfum)'] },
                { id: 'volumen', label: 'Volumen (ml)', type: 'select', required: true,
                    options: ['15', '30', '50', '75', '100', '125', '150', '200', '250', 'Otro'] },
                { id: 'genero', label: 'Género', type: 'select', required: true, options: ['Hombre', 'Mujer', 'Niño/Niña', 'Unisex'] },
                { id: 'notas', label: 'Familia Olfativa', type: 'select', required: true,
                    options: ['Acuática', 'Almizclada', 'Amaderada', 'Aromática', 'Cítrica', 'Cuero', 'Dulce', 'Especiada', 'Floral', 'Fresca', 'Frutal', 'Gourmand', 'Oriental', 'Verde', 'Otra'] }
            ]
        };
    }

    initialize() {
        try {
            console.log('[OrderForm] 🔄 Initializing...');
            this._setDefaultOrderDate();
            this._setupProductCalculationListeners();
            this._setupAddProductButton();
            this._setupSaveCodeButtonDelegation();
            this._setupToggleSavedCodesButton();
            this._setupOrderFormSubmit();
            this._setupClientSearchRefresh();
            this._renderSavedCodesList();
            this._refreshClientsDatalist();
            console.log('[OrderForm] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[OrderForm] ❌ Initialization error:', error);
            return false;
        }
    }

    _setDefaultOrderDate() {
        const dateInput = document.getElementById('orderDate');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /* ==================== CAMPOS DINÁMICOS POR CATEGORÍA ==================== */

    updateProductFields(index) {
        const categorySelect = document.getElementById(`category_${index}`);
        const container = document.getElementById(`dynamicFields_${index}`);
        if (!categorySelect || !container) return;

        const category = categorySelect.value;
        container.innerHTML = '';

        const fields = this.categoryFields[category];
        if (!fields) return;

        fields.forEach((field) => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            if (field.showWhen) {
                formGroup.style.display = 'none';
                formGroup.setAttribute('data-show-when-field', field.showWhen.field);
                formGroup.setAttribute('data-show-when-value', field.showWhen.value);
            }

            const label = document.createElement('label');
            label.setAttribute('for', `${field.id}_${index}`);
            label.innerHTML = `${field.label} ${field.required ? '<span class="required" aria-label="requerido">*</span>' : ''}`;

            const select = document.createElement('select');
            select.id = `${field.id}_${index}`;
            select.name = `${field.id}[]`;
            select.required = field.required;
            select.setAttribute('aria-required', String(field.required));
            select.innerHTML = `<option value="">Seleccionar ${field.label.toLowerCase()}</option>`;
            field.options.forEach((option) => {
                select.innerHTML += `<option value="${option}">${option}</option>`;
            });

            if (fields.some(f => f.showWhen && f.showWhen.field === field.id)) {
                select.addEventListener('change', () => this.updateConditionalFields(index, field.id, select.value));
            }

            formGroup.appendChild(label);
            formGroup.appendChild(select);
            container.appendChild(formGroup);
        });
    }

    updateConditionalFields(index, fieldId, value) {
        const container = document.getElementById(`dynamicFields_${index}`);
        if (!container) return;

        container.querySelectorAll(`[data-show-when-field="${fieldId}"]`).forEach((group) => {
            const showWhenValue = group.getAttribute('data-show-when-value');
            if (value === showWhenValue) {
                group.style.display = 'block';
            } else {
                group.style.display = 'none';
                const input = group.querySelector('input, select');
                if (input) input.value = '';
            }
        });
    }

    /* ==================== AGREGAR / QUITAR PRODUCTOS ==================== */

    _setupAddProductButton() {
        document.getElementById('addProductBtn')?.addEventListener('click', () => this.addProductRow());
    }

    addProductRow() {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        const index = this.nextProductIndex++;
        const row = this._buildProductRow(index);
        container.appendChild(row);
        this._updateRemoveButtons();
        row.querySelector('select, input')?.focus();
    }

    _buildProductRow(index) {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.setAttribute('role', 'listitem');
        div.innerHTML = `
            <div class="form-group">
                <label for="category_${index}">Categoría <span class="required" aria-label="requerido">*</span></label>
                <select id="category_${index}" name="category[]" required aria-required="true" class="category-select">
                    <option value="">Seleccionar categoría</option>
                    <option value="accesorios">Accesorios</option>
                    <option value="medias">Medias</option>
                    <option value="camisetas">Camisetas</option>
                    <option value="perfumes">Perfumes o Lociones</option>
                </select>
            </div>
            <div class="form-group">
                <label for="productCode_${index}">
                    Código Rápido
                    <small style="font-weight: normal; color: #666;">⚡ Opcional - Ej: A001</small>
                </label>
                <input type="text" id="productCode_${index}" name="productCode[]" placeholder="Código rápido (Ej: A001)" autocomplete="off">
            </div>
            <div class="form-group">
                <label for="product_${index}">Producto <span class="required" aria-label="requerido">*</span></label>
                <input type="text" id="product_${index}" name="product[]" required aria-required="true" placeholder="Nombre del producto">
            </div>
            <div id="dynamicFields_${index}" class="dynamic-fields"></div>
            <div class="form-group">
                <label for="quantity_${index}">Cantidad <span class="required" aria-label="requerido">*</span></label>
                <input type="number" id="quantity_${index}" name="quantity[]" min="1" value="1" required aria-required="true" inputmode="numeric" class="quantity-input">
            </div>
            <div class="form-group">
                <label for="unitPrice_${index}">Precio Unitario <span class="required" aria-label="requerido">*</span></label>
                <input type="number" id="unitPrice_${index}" name="unitPrice[]" min="0" step="1000" placeholder="Ej: 50000" required aria-required="true" inputmode="numeric" class="unit-price-input">
            </div>
            <div class="form-group">
                <label for="totalPrice_${index}">Precio Total</label>
                <input type="number" id="totalPrice_${index}" name="totalPrice[]" readonly aria-readonly="true" class="total-price-input" tabindex="-1">
            </div>
            <div class="form-group" style="margin-top: 0.5rem">
                <button type="button" class="btn-save-code" title="Guardar este producto con su código para uso futuro" aria-label="Guardar este producto como código rápido" style="display: none;">
                    💾 Guardar Código Rápido
                </button>
            </div>
            <button type="button" class="btn-remove" aria-label="Eliminar producto">✕</button>
        `;

        div.querySelector(`#category_${index}`).addEventListener('change', () => this.updateProductFields(index));
        div.querySelector(`#productCode_${index}`).addEventListener('input', () => this.handleProductCodeInput(index));
        div.querySelector('.btn-remove').addEventListener('click', (e) => this.removeProductRow(e.currentTarget));

        return div;
    }

    removeProductRow(button) {
        const productItem = button.closest('.product-item');
        productItem?.remove();
        this._updateRemoveButtons();
        this.updateGrandTotal();
    }

    _updateRemoveButtons() {
        const products = document.querySelectorAll('.product-item');
        products.forEach((product) => {
            const removeBtn = product.querySelector('.btn-remove');
            if (removeBtn) removeBtn.style.display = products.length > 1 ? 'flex' : 'none';
        });
    }

    /* ==================== CÁLCULOS ==================== */

    _setupProductCalculationListeners() {
        document.addEventListener('input', (e) => {
            if (e.target.classList?.contains('quantity-input') || e.target.classList?.contains('unit-price-input')) {
                const productItem = e.target.closest('.product-item');
                if (productItem) this._updateProductCalculation(productItem);
                this.updateGrandTotal();
            }
        });
    }

    _updateProductCalculation(productItem) {
        const quantity = parseFloat(productItem.querySelector('.quantity-input')?.value) || 0;
        const unitPrice = parseFloat(productItem.querySelector('.unit-price-input')?.value) || 0;
        const totalInput = productItem.querySelector('.total-price-input');
        if (totalInput) totalInput.value = Math.round(quantity * unitPrice);
    }

    updateGrandTotal() {
        let subtotal = 0;
        document.querySelectorAll('.total-price-input').forEach((input) => {
            subtotal += parseFloat(input.value) || 0;
        });

        const discountPercent = parseFloat(document.getElementById('discount')?.value) || 0;
        const shippingCost = parseFloat(document.getElementById('shippingCost')?.value) || 0;
        const discountAmount = (subtotal * discountPercent) / 100;
        const grandTotal = subtotal - discountAmount + shippingCost;

        const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

        setText('subtotal', `$ ${Math.round(subtotal).toLocaleString('es-CO')}`);
        setText('discountPercent', String(discountPercent));
        setText('discountAmount', `- $ ${Math.round(discountAmount).toLocaleString('es-CO')}`);
        setText('shippingAmount', `+ $ ${Math.round(shippingCost).toLocaleString('es-CO')}`);
        setText('grandTotal', `$ ${Math.round(grandTotal).toLocaleString('es-CO')}`);

        const discountRow = document.getElementById('discountRow');
        if (discountRow) discountRow.style.display = discountAmount > 0 ? 'flex' : 'none';
        const shippingRow = document.getElementById('shippingRow');
        if (shippingRow) shippingRow.style.display = shippingCost > 0 ? 'flex' : 'none';
    }

    /* ==================== CÓDIGOS RÁPIDOS ==================== */

    _getProductCodes() {
        try {
            return JSON.parse(localStorage.getItem(this.codesStorageKey) || '{}');
        } catch {
            return {};
        }
    }

    _saveProductCodes(codes) {
        localStorage.setItem(this.codesStorageKey, JSON.stringify(codes));
    }

    getProductByCode(code) {
        return this._getProductCodes()[code.toUpperCase()] || null;
    }

    handleProductCodeInput(index) {
        const codeInput = document.getElementById(`productCode_${index}`);
        if (!codeInput) return;
        const code = codeInput.value.trim().toUpperCase();

        if (code.length < 3) {
            codeInput.style.borderColor = '';
            codeInput.style.backgroundColor = '';
            return;
        }

        const productData = this.getProductByCode(code);
        if (!productData) {
            codeInput.style.borderColor = '#ff9800';
            codeInput.style.backgroundColor = '#fff3e0';
            return;
        }

        const productInput = document.getElementById(`product_${index}`);
        const priceInput = document.getElementById(`unitPrice_${index}`);
        const categorySelect = document.getElementById(`category_${index}`);

        if (productInput) productInput.value = productData.name;
        if (priceInput) {
            priceInput.value = productData.price;
            const productItem = priceInput.closest('.product-item');
            if (productItem) this._updateProductCalculation(productItem);
            this.updateGrandTotal();
        }
        if (categorySelect && productData.category) {
            categorySelect.value = productData.category;
            this.updateProductFields(index);
        }

        codeInput.style.borderColor = '#4CAF50';
        codeInput.style.backgroundColor = '#e8f5e9';
        window.NotificationService?.success(`✅ Producto "${productData.name}" cargado`);
        setTimeout(() => {
            codeInput.style.borderColor = '';
            codeInput.style.backgroundColor = '';
        }, 2000);
    }

    _setupSaveCodeButtonDelegation() {
        document.getElementById('productsContainer')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-save-code');
            if (!btn) return;
            this._saveProductAsCodeFromItem(btn.closest('.product-item'));
        });

        // Mostrar/ocultar el botón según si hay código escrito (delegación, cubre filas nuevas también)
        document.getElementById('productsContainer')?.addEventListener('input', (e) => {
            if (e.target.name !== 'productCode[]') return;
            const productItem = e.target.closest('.product-item');
            const saveBtn = productItem?.querySelector('.btn-save-code');
            if (!saveBtn) return;
            saveBtn.style.display = e.target.value.trim() !== '' ? 'block' : 'none';
        });
    }

    _saveProductAsCodeFromItem(productItem) {
        if (!productItem) return;
        const codeInput = productItem.querySelector('[name="productCode[]"]');
        const productInput = productItem.querySelector('[name="product[]"]');
        const priceInput = productItem.querySelector('[name="unitPrice[]"]');
        const categorySelect = productItem.querySelector('[name="category[]"]');

        const code = codeInput?.value.trim().toUpperCase();
        const name = productInput?.value.trim();
        const price = priceInput?.value;

        if (!code || !name || !price) {
            window.NotificationService?.error('Completa código, nombre y precio antes de guardar');
            return;
        }

        const codes = this._getProductCodes();
        codes[code] = { name, price: parseFloat(price), category: categorySelect?.value || '' };
        this._saveProductCodes(codes);

        window.NotificationService?.success(`💾 Código ${code} guardado para ${name}`);
        this._renderSavedCodesList();
    }

    _setupToggleSavedCodesButton() {
        document.getElementById('toggleSavedCodesBtn')?.addEventListener('click', () => this.toggleSavedCodes());
    }

    toggleSavedCodes() {
        const listContainer = document.getElementById('savedCodesList');
        const toggleBtn = document.getElementById('toggleSavedCodesBtn');
        if (!listContainer) return;
        const count = Object.keys(this._getProductCodes()).length;
        const isHidden = listContainer.style.display === 'none' || !listContainer.style.display;

        listContainer.style.display = isHidden ? 'block' : 'none';
        if (toggleBtn) toggleBtn.innerHTML = `${isHidden ? 'Ocultar' : 'Ver'} <span id="codesCount">${count}</span>`;
    }

    _renderSavedCodesList() {
        const codes = this._getProductCodes();
        const entries = Object.entries(codes);
        const count = entries.length;

        const info = document.getElementById('savedCodesInfo');
        const countSpan = document.getElementById('codesCount');
        if (info) info.style.display = count > 0 ? 'block' : 'none';
        if (countSpan) countSpan.textContent = String(count);

        const listContainer = document.getElementById('savedCodesList');
        if (!listContainer) return;

        if (entries.length === 0) {
            listContainer.innerHTML = '<p class="no-codes">No hay códigos guardados aún</p>';
            return;
        }

        const sanitize = window.SecurityUtils?.sanitizeText || (s => s);
        let html = '<div class="codes-grid">';
        entries.sort((a, b) => a[0].localeCompare(b[0])).forEach(([code, data]) => {
            html += `
                <div class="code-card">
                    <div class="code-header">
                        <strong class="code-value">${sanitize(code)}</strong>
                        <button type="button" class="btn-delete-code" data-code="${sanitize(code)}" title="Eliminar código">×</button>
                    </div>
                    <div class="code-body">
                        <div class="code-name">${sanitize(data.name)}</div>
                        <div class="code-price">$${Math.round(data.price).toLocaleString('es-CO')}</div>
                        ${data.category ? `<div class="code-category">${sanitize(data.category)}</div>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        listContainer.innerHTML = html;

        listContainer.querySelectorAll('.btn-delete-code').forEach((btn) => {
            btn.addEventListener('click', () => this.deleteProductCode(btn.getAttribute('data-code')));
        });
    }

    async deleteProductCode(code) {
        const confirmed = await (window.FormManager?._confirmDialog?.(`¿Eliminar el código ${code}?`) ?? Promise.resolve(true));
        if (!confirmed) return;
        const codes = this._getProductCodes();
        delete codes[code];
        this._saveProductCodes(codes);
        this._renderSavedCodesList();
        window.NotificationService?.success(`Código ${code} eliminado`);
    }

    /* ==================== BÚSQUEDA DE CLIENTE ==================== */

    _setupClientSearchRefresh() {
        document.getElementById('clientSearch')?.addEventListener('focus', () => this._refreshClientsDatalist());
    }

    _refreshClientsDatalist() {
        const datalist = document.getElementById('clientsList');
        if (!datalist) return;

        const orders = window.InventoryManager?.getAll?.() || [];
        const uniqueClients = new Map();
        orders.forEach((order) => {
            if (!order.clientName) return;
            const key = order.clientName.trim().toLowerCase();
            if (!uniqueClients.has(key)) uniqueClients.set(key, order);
        });

        datalist.innerHTML = '';
        uniqueClients.forEach((order) => {
            const option = document.createElement('option');
            option.value = order.clientName;
            option.setAttribute('data-name', order.clientName);
            option.setAttribute('data-phone', order.phoneNumber || '');
            option.setAttribute('data-email', order.email || '');
            option.setAttribute('data-address', order.address || '');
            datalist.appendChild(option);
        });
    }

    selectExistingClient() {
        const searchInput = document.getElementById('clientSearch');
        if (!searchInput) return;
        const selectedName = searchInput.value.trim();

        if (!selectedName) {
            this.clearClientFields();
            return;
        }

        const datalist = document.getElementById('clientsList');
        const options = datalist ? Array.from(datalist.options) : [];
        const match = options.find(o => (o.getAttribute('data-name') || o.value) === selectedName);

        const setVal = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
        setVal('clientName', selectedName);

        if (match) {
            setVal('clientPhone', match.getAttribute('data-phone') || '');
            setVal('clientEmail', match.getAttribute('data-email') || '');
            setVal('clientAddress', match.getAttribute('data-address') || '');
            const suggestion = document.getElementById('newClientSuggestion');
            if (suggestion) suggestion.style.display = 'none';
        }
    }

    checkClientExists() {
        const searchInput = document.getElementById('clientSearch');
        const suggestion = document.getElementById('newClientSuggestion');
        const datalist = document.getElementById('clientsList');
        if (!searchInput || !suggestion) return;

        const value = searchInput.value.trim();
        if (!value) {
            suggestion.style.display = 'none';
            return;
        }

        const options = datalist ? Array.from(datalist.options).map(o => o.value) : [];
        suggestion.style.display = options.includes(value) ? 'none' : 'block';
    }

    clearClientFields() {
        ['clientName', 'clientPhone', 'clientEmail', 'clientAddress'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    /* ==================== ENVÍO DEL FORMULARIO ==================== */

    _setupOrderFormSubmit() {
        const form = document.getElementById('orderForm');
        form?.addEventListener('submit', (e) => this._handleSubmit(e));
    }

    _collectOrderLines() {
        const val = (id) => document.getElementById(id)?.value?.trim() || '';

        const client = {
            clientName: val('clientName'),
            phoneNumber: val('clientPhone'),
            email: val('clientEmail'),
            address: val('clientAddress'),
            orderDate: val('orderDate'),
            notes: val('notes'),
            discount: parseFloat(val('discount')) || 0,
            shippingCost: parseFloat(val('shippingCost')) || 0
        };

        const products = [];
        document.querySelectorAll('.product-item').forEach((item) => {
            const productName = item.querySelector('[name="product[]"]')?.value?.trim();
            if (!productName) return;
            products.push({
                category: item.querySelector('[name="category[]"]')?.value || '',
                productCode: item.querySelector('[name="productCode[]"]')?.value?.trim() || '',
                productName,
                quantity: parseFloat(item.querySelector('[name="quantity[]"]')?.value) || 0,
                unitPrice: parseFloat(item.querySelector('[name="unitPrice[]"]')?.value) || 0,
                totalPrice: parseFloat(item.querySelector('[name="totalPrice[]"]')?.value) || 0
            });
        });

        return { client, products };
    }

    _isRecentDuplicate(clientName, total) {
        const recent = this._getRecentOrders();
        const now = Date.now();
        return recent.some(o =>
            (now - o.timestamp) < 5 * 60 * 1000 &&
            o.clientName.toLowerCase() === clientName.toLowerCase() &&
            Math.abs(o.total - total) <= total * 0.05
        );
    }

    _getRecentOrders() {
        try {
            return JSON.parse(localStorage.getItem(this.recentOrdersStorageKey) || '[]');
        } catch {
            return [];
        }
    }

    _saveRecentOrder(clientName, total) {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const recent = this._getRecentOrders().filter(o => o.timestamp > fiveMinutesAgo);
        recent.push({ clientName, total, timestamp: Date.now() });
        localStorage.setItem(this.recentOrdersStorageKey, JSON.stringify(recent));
    }

    async _handleSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
                submitBtn.textContent = 'Guardando...';
            }

            const { client, products } = this._collectOrderLines();

            if (products.length === 0) {
                throw new Error('Agrega al menos un producto con nombre');
            }

            const grandTotalText = document.getElementById('grandTotal')?.textContent || '';
            const grandTotal = parseFloat(grandTotalText.replace(/[^\d.-]/g, '')) || 0;

            if (client.clientName && this._isRecentDuplicate(client.clientName, grandTotal)) {
                const confirmed = await window.FormManager?._confirmDialog?.(
                    `⚠️ Posible duplicado: ya guardaste un pedido similar para "${client.clientName}" ` +
                    `con un total parecido en los últimos 5 minutos. ¿Seguro que no es duplicado?`
                );
                if (!confirmed) {
                    window.NotificationService?.info('Pedido cancelado');
                    return;
                }
            }

            if (!window.InventoryManager) {
                throw new Error('InventoryManager no está cargado');
            }

            const orderGroupId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `GRP-${Date.now().toString(36)}`;

            const createdOrders = [];
            for (const line of products) {
                const orderData = {
                    orderGroupId,
                    clientName: client.clientName,
                    phoneNumber: client.phoneNumber,
                    email: client.email,
                    address: client.address,
                    orderDate: client.orderDate ? new Date(client.orderDate).toISOString() : undefined,
                    notes: client.notes,
                    discount: client.discount,
                    shippingCost: client.shippingCost,
                    category: line.category,
                    productCode: line.productCode,
                    productName: line.productName,
                    quantity: line.quantity,
                    price: line.unitPrice,
                    totalPrice: line.totalPrice
                };
                createdOrders.push(window.InventoryManager.addOrder(orderData));
            }

            if (client.clientName) this._saveRecentOrder(client.clientName, grandTotal);

            if (window.ExcelManager?.syncInventory) {
                await window.ExcelManager.syncInventory().catch(err => {
                    console.warn('[OrderForm] ⚠️ Excel sync failed:', err);
                });
            }

            window.NotificationService?.success(
                `✅ Pedido guardado (${createdOrders.length} producto${createdOrders.length > 1 ? 's' : ''})`
            );

            this._resetFormAfterSubmit();
            this._refreshClientsDatalist();
            window.EventBus?.emit('order:added', { orderGroupId, orders: createdOrders });
        } catch (error) {
            console.error('[OrderForm] ❌ Submit error:', error);
            window.NotificationService?.error(`❌ Error al guardar: ${error.message}`);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = 'Guardar Pedido';
            }
        }
    }

    _resetFormAfterSubmit() {
        const form = document.getElementById('orderForm');
        form?.reset();

        // Dejar solo la primera fila de producto
        const products = document.querySelectorAll('.product-item');
        products.forEach((item, i) => { if (i > 0) item.remove(); });
        this.nextProductIndex = 1;
        this._updateRemoveButtons();

        // Limpiar campos dinámicos de categoría de la fila que queda
        const dynamicFields = document.getElementById('dynamicFields_0');
        if (dynamicFields) dynamicFields.innerHTML = '';

        const totalInput = document.getElementById('totalPrice_0');
        if (totalInput) totalInput.value = '';

        this._setDefaultOrderDate();
        this.updateGrandTotal();

        const suggestion = document.getElementById('newClientSuggestion');
        if (suggestion) suggestion.style.display = 'none';
    }
}

// Crear instancia global
window.OrderFormManager = new OrderFormManager();

// Wrappers globales — mantienen compatibilidad con los atributos inline
// (onchange/oninput/onclick) ya presentes en index.html para la fila 0.
window.updateProductFields = (index) => window.OrderFormManager.updateProductFields(index);
window.updateConditionalFields = (index, fieldId, value) => window.OrderFormManager.updateConditionalFields(index, fieldId, value);
window.handleProductCodeInput = (index) => window.OrderFormManager.handleProductCodeInput(index);
window.updateGrandTotal = () => window.OrderFormManager.updateGrandTotal();
window.selectExistingClient = () => window.OrderFormManager.selectExistingClient();
window.checkClientExists = () => window.OrderFormManager.checkClientExists();
window.switchTab = (tabName) => document.querySelector(`.tab-btn[data-tab="${tabName}"]`)?.click();

// La fila 0 (estática en el HTML) también necesita su botón "Guardar Código Rápido"
// visible/oculto igual que las filas nuevas — se maneja por delegación en
// _setupSaveCodeButtonDelegation(), no requiere código adicional aquí.

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.OrderFormManager.initialize());
} else {
    window.OrderFormManager.initialize();
}

console.log('[OrderForm] ✅ Order form module loaded');
