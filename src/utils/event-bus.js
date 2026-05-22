/**
 * EventBus — Patrón Observer para comunicación entre módulos (Fase B1)
 * Elimina el acoplamiento directo entre módulos vía window.*
 */
class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    /**
     * Suscribirse a un evento.
     * @returns {Function} Función para cancelar la suscripción (unsubscribe).
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    /**
     * Suscribirse a un evento una sola vez.
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }

    /**
     * Cancelar suscripción.
     */
    off(event, callback) {
        if (!this._listeners.has(event)) return;
        const list = this._listeners.get(event);
        const idx = list.indexOf(callback);
        if (idx !== -1) list.splice(idx, 1);
    }

    /**
     * Emitir un evento con datos opcionales.
     */
    emit(event, data) {
        if (!this._listeners.has(event)) return;
        this._listeners.get(event).forEach(cb => {
            try {
                cb(data);
            } catch (e) {
                console.error(`[EventBus] Error in handler for "${event}":`, e);
            }
        });
    }

    /**
     * Eliminar todos los listeners de un evento (o todos si no se especifica).
     */
    clear(event) {
        if (event) {
            this._listeners.delete(event);
        } else {
            this._listeners.clear();
        }
    }
}

window.EventBus = new EventBus();
console.log('[EventBus] ✅ Loaded');
