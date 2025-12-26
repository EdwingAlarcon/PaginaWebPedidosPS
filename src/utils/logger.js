/**
 * 📝 LOGGER UTILITY
 * Sistema de logging configurable para desarrollo y producción
 * Permite controlar el nivel de logging según el entorno
 */

class Logger {
    constructor() {
        // Niveles de log: 0 = OFF, 1 = ERROR, 2 = WARN, 3 = INFO, 4 = DEBUG
        this.level = this._getLogLevel();
        this.isDevelopment = this._isDevelopment();
    }

    /**
     * Determinar si estamos en desarrollo
     */
    _isDevelopment() {
        // Verificar si estamos en localhost o archivo local
        return (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:'
        );
    }

    /**
     * Obtener nivel de log desde configuración
     */
    _getLogLevel() {
        // Intentar desde localStorage (configuración de usuario)
        const storedLevel = localStorage.getItem('log_level');
        if (storedLevel !== null) {
            return parseInt(storedLevel, 10);
        }

        // Intentar desde configuración global
        if (window.Config?.logLevel !== undefined) {
            return window.Config.logLevel;
        }

        // Default: En desarrollo mostrar todo, en producción solo errores
        return this._isDevelopment() ? 4 : 1;
    }

    /**
     * Configurar nivel de log
     * @param {number} level - 0=OFF, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
     */
    setLevel(level) {
        this.level = level;
        localStorage.setItem('log_level', level.toString());
    }

    /**
     * Log de error (siempre se muestra excepto si level=0)
     */
    error(module, message, ...args) {
        if (this.level >= 1) {
            console.error(`❌ [${module}]`, message, ...args);
        }
    }

    /**
     * Log de advertencia
     */
    warn(module, message, ...args) {
        if (this.level >= 2) {
            console.warn(`⚠️ [${module}]`, message, ...args);
        }
    }

    /**
     * Log de información
     */
    info(module, message, ...args) {
        if (this.level >= 3) {
            console.log(`ℹ️ [${module}]`, message, ...args);
        }
    }

    /**
     * Log de depuración (solo desarrollo)
     */
    debug(module, message, ...args) {
        if (this.level >= 4) {
            console.log(`🔍 [${module}]`, message, ...args);
        }
    }

    /**
     * Log de éxito
     */
    success(module, message, ...args) {
        if (this.level >= 3) {
            console.log(`✅ [${module}]`, message, ...args);
        }
    }

    /**
     * Grupo de logs
     */
    group(module, title) {
        if (this.level >= 3) {
            console.group(`📁 [${module}] ${title}`);
        }
    }

    groupEnd() {
        if (this.level >= 3) {
            console.groupEnd();
        }
    }

    /**
     * Tabla de datos
     */
    table(module, data) {
        if (this.level >= 4) {
            console.log(`📊 [${module}]`);
            console.table(data);
        }
    }

    /**
     * Timer para medir rendimiento
     */
    time(label) {
        if (this.level >= 4) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.level >= 4) {
            console.timeEnd(label);
        }
    }

    /**
     * Información del sistema
     */
    logSystemInfo() {
        if (this.level >= 3) {
            this.group('System', 'Environment Info');
            console.log('Development Mode:', this.isDevelopment);
            console.log('Log Level:', this.level);
            console.log('User Agent:', navigator.userAgent);
            console.log('Online Status:', navigator.onLine);
            console.log('Language:', navigator.language);
            this.groupEnd();
        }
    }
}

// Crear instancia global
window.Logger = new Logger();

// Exponer métodos de utilidad
window.log = {
    error: (module, msg, ...args) => window.Logger.error(module, msg, ...args),
    warn: (module, msg, ...args) => window.Logger.warn(module, msg, ...args),
    info: (module, msg, ...args) => window.Logger.info(module, msg, ...args),
    debug: (module, msg, ...args) => window.Logger.debug(module, msg, ...args),
    success: (module, msg, ...args) => window.Logger.success(module, msg, ...args),
    group: (module, title) => window.Logger.group(module, title),
    groupEnd: () => window.Logger.groupEnd(),
    table: (module, data) => window.Logger.table(module, data),
    time: (label) => window.Logger.time(label),
    timeEnd: (label) => window.Logger.timeEnd(label)
};

console.log('%c🚀 Logger System Initialized', 'color: #0078d4; font-weight: bold');
console.log(`%cLog Level: ${window.Logger.level} (${['OFF', 'ERROR', 'WARN', 'INFO', 'DEBUG'][window.Logger.level]})`, 'color: #107c10');
console.log('%cUse Logger.setLevel(0-4) to change log level', 'color: #666; font-style: italic');
