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
 * Sanitiza HTML (permite algunas etiquetas seguras).
 * Usa DOMParser para evitar la ventana de vulnerabilidad de innerHTML.
 * Reconstruye el árbol DOM desde cero sin copiar atributos.
 * @param {string} html - HTML a sanitizar
 * @returns {string} HTML sanitizado
 */
function sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';

    const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'p', 'br', 'span']);

    // DOMParser no ejecuta scripts ni dispara event handlers — seguro
    const doc = new DOMParser().parseFromString(html, 'text/html');

    function buildSafe(sourceNode) {
        const frag = document.createDocumentFragment();
        for (const child of Array.from(sourceNode.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                frag.appendChild(document.createTextNode(child.textContent));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toLowerCase();
                if (ALLOWED_TAGS.has(tag)) {
                    const el = document.createElement(tag);
                    // No se copian atributos — se elimina cualquier onclick, href, etc.
                    el.appendChild(buildSafe(child));
                    frag.appendChild(el);
                } else {
                    // Etiqueta no permitida: conservar contenido de texto, descartar elemento
                    frag.appendChild(buildSafe(child));
                }
            }
            // Nodos de comentario, PI, etc. se descartan silenciosamente
        }
        return frag;
    }

    const container = document.createElement('div');
    container.appendChild(buildSafe(doc.body));
    return container.innerHTML;
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
