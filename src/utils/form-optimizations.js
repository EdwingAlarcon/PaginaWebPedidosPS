/**
 * 🚀 FORM OPTIMIZATIONS
 * Optimizaciones del formulario de nuevo pedido
 * - Campos colapsables
 * - Atajos de teclado
 * - Botón de código rápido inteligente
 */

class FormOptimizations {
    constructor() {
        this.initialized = false;
        this.shortcuts = new Map();
    }

    /**
     * Inicializar optimizaciones
     */
    initialize() {
        try {
            console.log('[FormOpt] 🔄 Initializing optimizations...');
            
            this._setupCollapsibleFields();
            this._setupKeyboardShortcuts();
            this._setupSmartCodeButton();
            this._setupNotesCollapsible();
            
            this.initialized = true;
            console.log('[FormOpt] ✅ Optimizations initialized');
            return true;
        } catch (error) {
            console.error('[FormOpt] ❌ Initialization error:', error);
            return false;
        }
    }

    /**
     * Configurar campos opcionales colapsables
     */
    _setupCollapsibleFields() {
        const toggleBtn = document.getElementById('toggleOptionalFieldsBtn');
        const optionalFields = document.getElementById('optionalClientFields');

        if (!toggleBtn || !optionalFields) {
            console.warn('[FormOpt] ⚠️ Optional fields elements not found');
            return;
        }

        toggleBtn.addEventListener('click', () => {
            const isHidden = optionalFields.style.display === 'none';
            
            if (isHidden) {
                optionalFields.style.display = 'block';
                toggleBtn.textContent = '➖ Ocultar Email';
                toggleBtn.classList.add('active');
            } else {
                optionalFields.style.display = 'none';
                toggleBtn.textContent = '➕ Agregar Email (opcional)';
                toggleBtn.classList.remove('active');
            }
        });

        console.log('[FormOpt] ✅ Collapsible fields setup complete');
    }

    /**
     * Configurar notas colapsables
     */
    _setupNotesCollapsible() {
        const legendToggles = document.querySelectorAll('.legend-toggle');

        legendToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                
                const fieldset = toggle.closest('fieldset');
                const content = fieldset.querySelector('.collapsible-content');
                const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

                if (isExpanded) {
                    content.style.display = 'none';
                    toggle.setAttribute('aria-expanded', 'false');
                    fieldset.classList.add('collapsed');
                } else {
                    content.style.display = 'block';
                    toggle.setAttribute('aria-expanded', 'true');
                    fieldset.classList.remove('collapsed');
                }
            });
        });

        console.log('[FormOpt] ✅ Collapsible notes setup complete');
    }

    /**
     * Configurar botón inteligente de código rápido
     */
    _setupSmartCodeButton() {
        // Observar cambios en los campos de código
        const productsContainer = document.getElementById('productsContainer');
        
        if (!productsContainer) {
            console.warn('[FormOpt] ⚠️ Products container not found');
            return;
        }

        // Usar delegación de eventos para inputs dinámicos
        productsContainer.addEventListener('input', (e) => {
            if (e.target.name === 'productCode[]') {
                const productItem = e.target.closest('.product-item');
                const saveBtn = productItem.querySelector('.btn-save-code');
                
                if (e.target.value.trim() !== '') {
                    productItem.classList.add('has-code');
                    if (saveBtn) saveBtn.style.display = 'block';
                } else {
                    productItem.classList.remove('has-code');
                    if (saveBtn) saveBtn.style.display = 'none';
                }
            }
        });

        console.log('[FormOpt] ✅ Smart code button setup complete');
    }

    /**
     * Configurar atajos de teclado
     */
    _setupKeyboardShortcuts() {
        // Definir atajos
        this.shortcuts.set('ctrl+enter', {
            description: 'Guardar pedido',
            action: () => this._submitForm()
        });

        this.shortcuts.set('ctrl+n', {
            description: 'Agregar producto',
            action: () => this._addProduct()
        });

        this.shortcuts.set('ctrl+k', {
            description: 'Buscar cliente',
            action: () => this._focusClientSearch()
        });

        this.shortcuts.set('escape', {
            description: 'Limpiar formulario',
            action: () => this._clearForm()
        });

        this.shortcuts.set('ctrl+shift+o', {
            description: 'Mostrar/ocultar campos opcionales',
            action: () => this._toggleOptionalFields()
        });

        // Escuchar eventos de teclado
        document.addEventListener('keydown', (e) => {
            const key = this._getKeyCombo(e);
            const shortcut = this.shortcuts.get(key);

            if (shortcut) {
                e.preventDefault();
                shortcut.action();
                this._showShortcutFeedback(shortcut.description);
            }
        });

        // Mostrar ayuda de atajos
        this._addShortcutsHelp();

        console.log('[FormOpt] ✅ Keyboard shortcuts setup complete');
        console.log('[FormOpt] 📋 Available shortcuts:', Array.from(this.shortcuts.keys()));
    }

    /**
     * Obtener combinación de teclas
     */
    _getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        parts.push(e.key.toLowerCase());
        return parts.join('+');
    }

    /**
     * Mostrar feedback de atajo usado
     */
    _showShortcutFeedback(description) {
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.textContent = `⌨️ ${description}`;
        feedback.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
            z-index: 9999;
            font-size: 14px;
            font-weight: 600;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }

    /**
     * Agregar ayuda de atajos
     */
    _addShortcutsHelp() {
        // Agregar botón de ayuda
        const helpBtn = document.createElement('button');
        helpBtn.type = 'button';
        helpBtn.className = 'shortcuts-help-btn';
        helpBtn.innerHTML = '⌨️';
        helpBtn.title = 'Ver atajos de teclado';
        helpBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: white;
            border: none;
            cursor: pointer;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
            z-index: 999;
            transition: all 0.3s ease;
        `;

        helpBtn.addEventListener('mouseenter', () => {
            helpBtn.style.transform = 'scale(1.1)';
            helpBtn.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.5)';
        });

        helpBtn.addEventListener('mouseleave', () => {
            helpBtn.style.transform = 'scale(1)';
            helpBtn.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
        });

        helpBtn.addEventListener('click', () => this._showShortcutsModal());

        document.body.appendChild(helpBtn);
    }

    /**
     * Mostrar modal con atajos
     */
    _showShortcutsModal() {
        const modal = document.createElement('div');
        modal.className = 'shortcuts-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-out;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        let shortcutsHTML = `
            <h2 style="margin-top: 0; color: #7c3aed;">⌨️ Atajos de Teclado</h2>
            <p style="color: #666; margin-bottom: 20px;">Usa estos atajos para trabajar más rápido:</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Atajo</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Acción</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.shortcuts.forEach((shortcut, key) => {
            const displayKey = key.replace('ctrl', 'Ctrl')
                                  .replace('shift', 'Shift')
                                  .replace('alt', 'Alt')
                                  .replace('escape', 'Esc')
                                  .replace('+', ' + ')
                                  .toUpperCase();
            
            shortcutsHTML += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-family: monospace; font-weight: 600; color: #7c3aed;">${displayKey}</td>
                    <td style="padding: 12px; color: #374151;">${shortcut.description}</td>
                </tr>
            `;
        });

        shortcutsHTML += `
                </tbody>
            </table>
            <button onclick="this.closest('.shortcuts-modal').remove()" 
                    style="margin-top: 20px; padding: 10px 20px; background: #7c3aed; color: white; 
                           border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Cerrar
            </button>
        `;

        content.innerHTML = shortcutsHTML;
        modal.appendChild(content);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    /**
     * Acciones de atajos
     */
    _submitForm() {
        const submitBtn = document.querySelector('#submitBtn');
        if (submitBtn) {
            submitBtn.click();
        }
    }

    _addProduct() {
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) {
            addBtn.click();
        }
    }

    _focusClientSearch() {
        const searchInput = document.getElementById('clientSearch');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    _clearForm() {
        if (confirm('¿Limpiar formulario?')) {
            const form = document.getElementById('orderForm');
            if (form) {
                form.reset();
            }
        }
    }

    _toggleOptionalFields() {
        const toggleBtn = document.getElementById('toggleOptionalFieldsBtn');
        if (toggleBtn) {
            toggleBtn.click();
        }
    }
}

// Crear instancia global
window.FormOptimizations = new FormOptimizations();

// Inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.FormOptimizations.initialize();
    });
} else {
    window.FormOptimizations.initialize();
}

// Agregar animaciones CSS necesarias
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

console.log('[FormOpt] ✅ Form optimizations module loaded');
