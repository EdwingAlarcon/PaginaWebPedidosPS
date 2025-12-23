/**
 * Módulo de Sanitización y Prevención de XSS
 * Proporciona funciones para sanitizar entrada de usuarios
 */

/**
 * Sanitiza texto plano para prevenir inyección de HTML/JavaScript
 * @param {string} input - Texto a sanitizar
 * @returns {string} Texto seguro para mostrar
 */
function sanitizeText(input) {
    if (!input || typeof input !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Sanitiza HTML (permite algunas etiquetas seguras)
 * @param {string} html - HTML a sanitizar
 * @returns {string} HTML sanitizado
 */
function sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';
    
    const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'span'];
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remover scripts y event handlers
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remover atributos peligrosos
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
        // Solo mantener etiquetas permitidas
        if (!allowedTags.includes(element.tagName.toLowerCase())) {
            const parent = element.parentNode;
            while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
        }
        
        // Remover atributos event listeners
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                element.removeAttribute(attr.name);
            }
        });
    });
    
    return temp.innerHTML;
}

/**
 * Escapa caracteres especiales para uso en atributos HTML
 * @param {string} input - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHTML(input) {
    if (!input || typeof input !== 'string') return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return input.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Valida si un string es un email válido
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Valida si un string es una URL válida
 * @param {string} url - URL a validar
 * @returns {boolean} True si es válida
 */
function isValidURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Elimina espacios en blanco múltiples y caracteres de control
 * @param {string} input - Texto a limpiar
 * @returns {string} Texto limpio
 */
function cleanWhitespace(input) {
    if (!input || typeof input !== 'string') return '';
    
    return input
        .replace(/[\s]+/g, ' ') // Reemplazar múltiples espacios
        .replace(/[\n\r\t]/g, ' ') // Reemplazar saltos de línea y tabs
        .trim();
}

/**
 * Valida que el input no contenga código malicioso
 * @param {string} input - Texto a validar
 * @returns {object} {valid: boolean, message: string}
 */
function validateSecurity(input) {
    if (!input || typeof input !== 'string') {
        return { valid: true, message: '' };
    }
    
    const lower = input.toLowerCase();
    
    // Detectar patrones peligrosos
    const dangerousPatterns = [
        /<script/,
        /javascript:/,
        /on\w+=/,
        /<iframe/,
        /<embed/,
        /<object/,
        /eval\(/,
        /expression\(/
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(lower)) {
            return {
                valid: false,
                message: 'Input contiene código potencialmente malicioso'
            };
        }
    }
    
    return { valid: true, message: '' };
}

// Exportar funciones
window.SecurityUtils = {
    sanitizeText,
    sanitizeHTML,
    escapeHTML,
    isValidEmail,
    isValidURL,
    cleanWhitespace,
    validateSecurity
};

// También exportar para módulos ES6 si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeText,
        sanitizeHTML,
        escapeHTML,
        isValidEmail,
        isValidURL,
        cleanWhitespace,
        validateSecurity
    };
}
