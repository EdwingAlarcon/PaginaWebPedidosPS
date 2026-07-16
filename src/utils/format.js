/**
 * Format — helpers de formato local (Colombia) reutilizados por
 * Dashboard, Pedidos, Clientes y Reportes.
 */
class FormatHelper {
    currency(value) {
        const n = Number(value) || 0;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(n);
    }

    /** Fecha corta: "16 jul 2026" */
    date(value) {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(d);
    }

    /** Fecha + hora: "16 jul 2026, 10:32 a. m." */
    dateTime(value) {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(d);
    }

    /** "hace 5 minutos", "hace 2 horas", "hace 3 días" */
    relative(value) {
        if (!value) return 'Nunca';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'Nunca';

        const diffMs = Date.now() - d.getTime();
        const diffMin = Math.round(diffMs / 60000);

        if (diffMin < 1) return 'Hace un momento';
        if (diffMin < 60) return `Hace ${diffMin} min`;
        const diffH = Math.round(diffMin / 60);
        if (diffH < 24) return `Hace ${diffH} h`;
        const diffD = Math.round(diffH / 24);
        if (diffD < 30) return `Hace ${diffD} d`;
        return this.date(value);
    }
}

window.Format = new FormatHelper();
console.log('[Format] ✅ Loaded');
