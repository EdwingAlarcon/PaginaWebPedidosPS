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
            
            // Sincronizar con Excel si está disponible
            if (window.ExcelManager?.syncInventory) {
                await window.ExcelManager.syncInventory().catch(e => {
                    console.warn('[Forms] ⚠️ Excel sync failed:', e);
                });
            }

            // Mostrar notificación
            this._showNotification('✅ Pedido agregado exitosamente', 'success');
            
            // Limpiar formulario
            this.clearForm();
            
            console.log('[Forms] ✅ Order added successfully');
            return order;
        } catch (error) {
            console.error('[Forms] ❌ Add order error:', error);
            this._showNotification(`❌ Error: ${error.message}`, 'error');
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

            // Validar datos
            if (window.ValidationUtils?.validateOrderData) {
                const validation = window.ValidationUtils.validateOrderData(formData);
                if (!validation.isValid) {
                    throw new Error(validation.errors.join(', '));
                }
            }

            // Actualizar en inventario
            if (!window.InventoryManager) {
                throw new Error('InventoryManager not loaded');
            }

            const order = window.InventoryManager.updateOrder(orderId, formData);
            
            // Sincronizar con Excel
            if (window.ExcelManager?.syncInventory) {
                await window.ExcelManager.syncInventory().catch(e => {
                    console.warn('[Forms] ⚠️ Excel sync failed:', e);
                });
            }

            this._showNotification('✅ Pedido actualizado exitosamente', 'success');
            this.clearForm();
            this.isEditMode = false;
            
            console.log('[Forms] ✅ Order updated successfully');
            return order;
        } catch (error) {
            console.error('[Forms] ❌ Edit order error:', error);
            this._showNotification(`❌ Error: ${error.message}`, 'error');
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

            // Confirmar eliminación
            if (!confirm('¿Está seguro de que desea eliminar este pedido?')) {
                return false;
            }

            // Eliminar del inventario
            if (!window.InventoryManager) {
                throw new Error('InventoryManager not loaded');
            }

            window.InventoryManager.deleteOrder(orderId);
            
            // Sincronizar con Excel
            if (window.ExcelManager?.syncInventory) {
                await window.ExcelManager.syncInventory().catch(e => {
                    console.warn('[Forms] ⚠️ Excel sync failed:', e);
                });
            }

            this._showNotification('✅ Pedido eliminado exitosamente', 'success');
            this.clearForm();
            
            console.log('[Forms] ✅ Order deleted successfully');
            return true;
        } catch (error) {
            console.error('[Forms] ❌ Delete order error:', error);
            this._showNotification(`❌ Error: ${error.message}`, 'error');
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
     * PRIVATE: Mostrar notificación
     */
    _showNotification(message, type = 'info') {
        try {
            const notificationDiv = document.getElementById('notification');
            if (notificationDiv) {
                notificationDiv.textContent = message;
                notificationDiv.className = `notification notification-${type}`;
                notificationDiv.style.display = 'block';

                const duration = window.Config?.uiConfig?.notificationDuration || 3000;
                setTimeout(() => {
                    notificationDiv.style.display = 'none';
                }, duration);
            } else {
                console.log(`[Forms] [${type.toUpperCase()}] ${message}`);
            }
        } catch (error) {
            console.warn('[Forms] ⚠️ Show notification failed:', error);
        }
    }
}

// Crear instancia global
window.FormManager = new FormManager();

// Log al cargar
console.log('[Forms] ✅ Forms module loaded');
