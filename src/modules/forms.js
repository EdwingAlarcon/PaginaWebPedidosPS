/**
 * 📝 FORMS MODULE
 * Gestión de formularios y eventos
 * Fase 2: Modularización
 */

class FormManager {
    constructor() {
        this.currentOrderId = null;
        this.isEditMode = false;
        this.isLoading = false;
    }

    /**
     * Inicializar formulario
     */
    initialize() {
        try {
            console.log('[Forms] 🔄 Initializing...');
            
            // Setup event listeners
            this._setupEventListeners();
            
            console.log('[Forms] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[Forms] ❌ Initialization error:', error);
            return false;
        }
    }

    /**
     * Manejar agregar nuevo pedido
     */
    async handleAddOrder(formData) {
        try {
            this.isLoading = true;
            console.log('[Forms] 📝 Adding new order...');

            // Validar datos si está disponible validación
            if (window.ValidationUtils?.validateOrderData) {
                const validation = window.ValidationUtils.validateOrderData(formData);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }

            // Agregar al inventario
            if (!window.InventoryManager) {
                throw new Error('InventoryManager not loaded');
            }

            const order = window.InventoryManager.addOrder(formData);
            
            if (window.ExcelManager?.syncInventory) {
                await window.ExcelManager.syncInventory().catch(e => {
                    console.warn('[Forms] ⚠️ Excel sync failed:', e);
                });
            }

            window.NotificationService?.success('✅ Pedido agregado exitosamente');
            this.clearForm();
            
            console.log('[Forms] ✅ Order added successfully');
            return order;
        } catch (error) {
            console.error('[Forms] ❌ Add order error:', error);
            window.NotificationService?.error(`❌ Error: ${error.message}`);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Manejar editar pedido
     */
    async handleEditOrder(orderId, formData) {
        try {
            this.isLoading = true;
            console.log(`[Forms] ✏️ Editing order ${orderId}...`);

            if (window.ValidationUtils?.validateOrderData) {
                const validation = window.ValidationUtils.validateOrderData(formData);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }

            if (!window.InventoryManager) {
                throw new Error('InventoryManager not loaded');
            }

            const order = window.InventoryManager.updateOrder(orderId, formData);
            
            if (window.ExcelManager?.syncInventory) {
                await window.ExcelManager.syncInventory().catch(e => {
                    console.warn('[Forms] ⚠️ Excel sync failed:', e);
                });
            }

            window.NotificationService?.success('✅ Pedido actualizado exitosamente');
            this.clearForm();
            this.isEditMode = false;
            
            console.log('[Forms] ✅ Order updated successfully');
            return order;
        } catch (error) {
            console.error('[Forms] ❌ Edit order error:', error);
            window.NotificationService?.error(`❌ Error: ${error.message}`);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Manejar eliminar pedido
     */
    async handleDeleteOrder(orderId) {
        try {
            this.isLoading = true;
            console.log(`[Forms] 🗑️ Deleting order ${orderId}...`);

            // Diálogo de confirmación accesible (reemplaza confirm() nativo)
            const confirmed = await this._confirmDialog('¿Está seguro de que desea eliminar este pedido?');
            if (!confirmed) {
                this.isLoading = false;
                return false;
            }

            if (!window.InventoryManager) {
                throw new Error('InventoryManager not loaded');
            }

            window.InventoryManager.deleteOrder(orderId);

            if (window.ExcelManager?.syncInventory) {
                await window.ExcelManager.syncInventory().catch(e => {
                    console.warn('[Forms] ⚠️ Excel sync failed:', e);
                });
            }

            window.NotificationService?.success('✅ Pedido eliminado exitosamente');
            this.clearForm();

            console.log('[Forms] ✅ Order deleted successfully');
            return true;
        } catch (error) {
            console.error('[Forms] ❌ Delete order error:', error);
            window.NotificationService?.error(`❌ Error: ${error.message}`);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Cargar datos en formulario para edición
     */
    loadOrderToForm(orderId) {
        try {
            if (!window.InventoryManager) {
                throw new Error('InventoryManager not loaded');
            }

            const order = window.InventoryManager.getById(orderId);
            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            // Llenar formulario
            const formInputs = {
                clientName: order.clientName,
                phoneNumber: order.phoneNumber,
                email: order.email,
                address: order.address,
                productName: order.productName,
                quantity: order.quantity,
                price: order.price,
                discount: order.discount,
                shippingCost: order.shippingCost,
                notes: order.notes
            };

            // Actualizar inputs del formulario
            Object.entries(formInputs).forEach(([key, value]) => {
                const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                if (element) {
                    element.value = value || '';
                }
            });

            // Marcar modo edición
            this.currentOrderId = orderId;
            this.isEditMode = true;

            console.log('[Forms] ✅ Order loaded for editing:', orderId);
            return order;
        } catch (error) {
            console.error('[Forms] ❌ Load order error:', error);
            return null;
        }
    }

    /**
     * Limpiar formulario
     */
    clearForm() {
        try {
            // Limpiar todos los inputs
            const form = document.querySelector('form');
            if (form) {
                form.reset();
            } else {
                // Limpiar inputs individuales
                const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, select');
                inputs.forEach(input => {
                    input.value = '';
                });
            }

            this.currentOrderId = null;
            this.isEditMode = false;

            console.log('[Forms] ✅ Form cleared');
        } catch (error) {
            console.error('[Forms] ❌ Clear form error:', error);
        }
    }

    /**
     * Validar individual campo del formulario
     */
    validateField(fieldName, value) {
        try {
            if (!window.ValidationUtils?.validateField) {
                return { isValid: true };
            }

            return window.ValidationUtils.validateField(fieldName, value);
        } catch (error) {
            console.error('[Forms] ❌ Validation error:', error);
            return { isValid: false, error: error.message };
        }
    }

    /**
     * PRIVATE: Obtener datos del formulario
     */
    _getFormData() {
        try {
            const form = document.querySelector('form');
            if (!form) {
                throw new Error('Form element not found');
            }

            const formData = new FormData(form);
            const data = {};

            formData.forEach((value, key) => {
                data[key] = value;
            });

            return data;
        } catch (error) {
            console.error('[Forms] ❌ Get form data error:', error);
            return {};
        }
    }

    /**
     * PRIVATE: Setup event listeners
     */
    _setupEventListeners() {
        try {
            // Agregar pedido
            const addBtn = document.getElementById('addOrderBtn');
            if (addBtn) {
                addBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const data = this._getFormData();
                    await this.handleAddOrder(data);
                });
            }

            // Limpiar formulario
            const clearBtn = document.getElementById('clearFormBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.clearForm();
                });
            }

            // Validación en tiempo real
            const inputs = document.querySelectorAll('form input, form textarea, form select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    const result = this.validateField(input.name, input.value);
                    this._showFieldError(input, result);
                });
            });

            console.log('[Forms] ✅ Event listeners setup complete');
        } catch (error) {
            console.error('[Forms] ❌ Setup event listeners error:', error);
        }
    }

    /**
     * PRIVATE: Mostrar error en campo
     */
    _showFieldError(inputElement, validationResult) {
        try {
            const errorSpan = inputElement.nextElementSibling;
            
            if (!validationResult.isValid && errorSpan?.classList.contains('error-message')) {
                errorSpan.textContent = validationResult.error || 'Campo inválido';
                errorSpan.style.display = 'block';
                inputElement.classList.add('error');
            } else if (errorSpan?.classList.contains('error-message')) {
                errorSpan.style.display = 'none';
                inputElement.classList.remove('error');
            }
        } catch (error) {
            console.warn('[Forms] ⚠️ Show field error failed:', error);
        }
    }

    /**
     * PRIVATE: Diálogo de confirmación accesible (reemplaza confirm() nativo).
     * @param {string} message
     * @returns {Promise<boolean>}
     */
    _confirmDialog(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = [
                'position:fixed', 'inset:0',
                'background:rgba(0,0,0,0.55)',
                'z-index:10001',
                'display:flex', 'align-items:center', 'justify-content:center'
            ].join(';');

            const dialog = document.createElement('div');
            dialog.setAttribute('role', 'alertdialog');
            dialog.setAttribute('aria-modal', 'true');
            dialog.setAttribute('aria-labelledby', 'confirm-dlg-msg');
            dialog.style.cssText = [
                'background:white', 'padding:24px 28px', 'border-radius:10px',
                'max-width:420px', 'width:90%',
                'box-shadow:0 8px 32px rgba(0,0,0,0.22)'
            ].join(';');

            const msg = document.createElement('p');
            msg.id = 'confirm-dlg-msg';
            msg.textContent = message;
            msg.style.cssText = 'margin:0 0 20px;font-size:16px;line-height:1.5;';

            const actions = document.createElement('div');
            actions.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.className = 'btn btn-secondary';

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.textContent = 'Confirmar';
            confirmBtn.className = 'btn btn-danger';

            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);
            dialog.appendChild(msg);
            dialog.appendChild(actions);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const cleanup = (result) => { overlay.remove(); resolve(result); };

            confirmBtn.addEventListener('click', () => cleanup(true));
            cancelBtn.addEventListener('click', () => cleanup(false));
            overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') cleanup(false); });

            // Foco inicial en Confirmar para accesibilidad
            confirmBtn.focus();
        });
    }

    /**
     * PRIVATE: Mostrar notificación (delegado a NotificationService).
     * Se mantiene por compatibilidad con llamadas internas existentes.
     */
    _showNotification(message, type = 'info') {
        window.NotificationService?.show(message, type);
    }
}

// Crear instancia global
window.FormManager = new FormManager();

// Log al cargar
console.log('[Forms] ✅ Forms module loaded');
