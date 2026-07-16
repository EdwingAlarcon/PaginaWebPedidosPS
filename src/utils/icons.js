/**
 * Icons — pequeña biblioteca de iconos SVG en línea (estilo Lucide), sin
 * dependencia externa. Sustituye los emojis usados como iconos de interfaz.
 *
 * Uso: <span data-icon="home" aria-hidden="true"></span> y luego, en runtime,
 * window.Icons.mount() reemplaza cada [data-icon] por su SVG correspondiente.
 * También expone window.Icons.svg(name, opts) para generar el markup a mano.
 */
class IconRegistry {
    constructor() {
        // Paths tomados/adaptados del set Lucide (ISC License), trazo 2px,
        // viewBox 0 0 24 24 — mismo estilo que los SVG ya usados en el header.
        this.icons = {
            home: '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5Z"/>',
            receipt: '<path d="M4 3h16v18l-2.5-1.5L15 21l-2.5-1.5L10 21l-2.5-1.5L5 21l-1-.5V3Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
            package: '<path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v9l9 5 9-5V8"/><path d="M12 13v9"/>',
            users: '<circle cx="9" cy="8" r="3.25"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16.5 7a3 3 0 0 1 0 5.9"/><path d="M18 14.3c2 .55 3.5 2.2 3.5 5.7"/>',
            archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
            'bar-chart': '<path d="M4 20V10M12 20V4M20 20v-7"/>',
            tag: '<path d="M3 12 12 3h6a2 2 0 0 1 2 2v6l-9 9a1.5 1.5 0 0 1-2 0l-6-6a1.5 1.5 0 0 1 0-2Z"/><circle cx="15.5" cy="7.5" r="1.25"/>',
            save: '<path d="M5 3h11l3 3v15H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M8 3v6h7V3M8 21v-7h8v7"/>',
            plus: '<path d="M12 5v14M5 12h14"/>',
            x: '<path d="M6 6l12 12M18 6 6 18"/>',
            star: '<path d="m12 2 2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7L6 21l1.6-7-5.4-4.7 7.1-.7Z"/>',
            'alert-triangle': '<path d="M10.6 3.5 2.4 18a1.5 1.5 0 0 0 1.3 2.2h16.6a1.5 1.5 0 0 0 1.3-2.2L13.4 3.5a1.5 1.5 0 0 0-2.8 0Z"/><path d="M12 9v4.5M12 17h.01"/>',
            zap: '<path d="M12 2 4 14h6l-1 8 9-13h-6l1-7Z"/>',
            'dollar-sign': '<path d="M12 2v20"/><path d="M17 6.5a4 4 0 0 0-4-1.5h-1a3.5 3.5 0 0 0 0 7h1a3.5 3.5 0 0 1 0 7h-1a4 4 0 0 1-4-1.5"/>',
            'clipboard-list': '<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z"/><path d="M8.5 11h.01M8.5 15h.01M11.5 11h4M11.5 15h4"/>',
            trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5"/><path d="M12 14v3M9 21h6M9.5 21c0-1.7.7-2.5 2.5-2.5s2.5.8 2.5 2.5"/>',
            calendar: '<rect x="3.5" y="5" width="17" height="16" rx="1.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
            'trending-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
            sparkles: '<path d="M11 3v2M11 16v2M3 11h2M16 11h2M5.5 5.5l1.4 1.4M14.6 14.6l1.4 1.4M5.5 16.5l1.4-1.4M14.6 7.4l1.4-1.4"/><path d="M11 8.5 12.3 11 15 12.3 12.3 13.6 11 16.1 9.7 13.6 7 12.3 9.7 11Z"/>',
            search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
            'shopping-cart': '<circle cx="9" cy="20" r="1.25"/><circle cx="18" cy="20" r="1.25"/><path d="M2.5 3h2l2.3 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6"/>',
            filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5Z"/>',
            'chevron-down': '<path d="m6 9 6 6 6-6"/>',
            'chevron-left': '<path d="m15 18-6-6 6-6"/>',
            'chevron-right': '<path d="m9 18 6-6-6-6"/>',
            'more-vertical': '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
            pencil: '<path d="M4 20.5 4.9 16.6 16 5.5a2 2 0 0 1 2.8 0l1.7 1.7a2 2 0 0 1 0 2.8L9.4 21.1 4 20.5Z"/>',
            trash: '<path d="M4 7h16"/><path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
            'wifi-off': '<path d="M2 8.5a17 17 0 0 1 5-3.2M22 8.5a17 17 0 0 0-8-4M7 12a10 10 0 0 1 4-2M17 12a10 10 0 0 0-2.3-1.4M2 2l20 20"/><circle cx="12" cy="18.5" r="1.1"/>',
            'refresh-cw': '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/>',
            'cloud-check': '<path d="M7 17a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10a4 4 0 0 1-1 7.9H7Z"/><path d="m9.5 12.5 1.8 1.8 3.2-3.6"/>',
            'file-text': '<path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M8 12h8M8 16h5"/>',
            'log-out': '<path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4"/><path d="m15 17 4-5-4-5"/><path d="M19 12H8"/>',
            keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="1.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M9.5 13.5h6M16.5 13.5h.01"/>'
        };
    }

    /** Devuelve el markup <svg> de un icono, o cadena vacía si no existe */
    svg(name, { size = 20, className = '' } = {}) {
        const inner = this.icons[name];
        if (!inner) {
            console.warn(`[Icons] ⚠️ Icono no encontrado: ${name}`);
            return '';
        }
        const cls = className ? ` icon-${className}` : '';
        return `<svg class="icon${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
    }

    /** Reemplaza todos los [data-icon] dentro de root por su SVG correspondiente */
    mount(root = document) {
        root.querySelectorAll('[data-icon]').forEach((el) => {
            const name = el.getAttribute('data-icon');
            const size = Number(el.getAttribute('data-icon-size')) || 20;
            if (!this.icons[name]) return;
            el.innerHTML = this.svg(name, { size });
            el.classList.add('icon-wrap');
        });
    }
}

window.Icons = new IconRegistry();

document.addEventListener('DOMContentLoaded', () => window.Icons.mount());
console.log('[Icons] ✅ Loaded');
