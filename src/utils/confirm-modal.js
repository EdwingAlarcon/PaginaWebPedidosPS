/**
 * ConfirmModal — modal de confirmación reutilizable, basado en <dialog>.
 * Se usa antes de limpiar datos ingresados o de acciones destructivas
 * (eliminar cliente, eliminar pedido, etc.).
 *
 * Uso:
 *   const ok = await window.ConfirmModal.show({
 *       title: '¿Limpiar formulario?',
 *       message: 'Se perderán los datos que no hayas guardado.',
 *       confirmLabel: 'Sí, limpiar',
 *       cancelLabel: 'Cancelar',
 *       danger: true
 *   });
 *   if (ok) { ... }
 */
class ConfirmModalController {
    constructor() {
        this._dialog = null;
    }

    _ensureDialog() {
        if (this._dialog && document.body.contains(this._dialog)) {
            return this._dialog;
        }

        const dialog = document.createElement('dialog');
        dialog.className = 'confirm-modal';
        dialog.innerHTML = `
            <form method="dialog" class="confirm-modal-body">
                <h2 class="confirm-modal-title"></h2>
                <p class="confirm-modal-message"></p>
                <div class="confirm-modal-actions">
                    <button type="button" class="btn-secondary confirm-modal-cancel"></button>
                    <button type="button" class="btn-primary confirm-modal-confirm"></button>
                </div>
            </form>
        `;
        document.body.appendChild(dialog);
        this._dialog = dialog;
        return dialog;
    }

    /**
     * Muestra el modal y devuelve una Promise<boolean> (true = confirmó).
     */
    show({
        title = '¿Confirmar acción?',
        message = '',
        confirmLabel = 'Confirmar',
        cancelLabel = 'Cancelar',
        danger = false
    } = {}) {
        const dialog = this._ensureDialog();
        dialog.querySelector('.confirm-modal-title').textContent = title;
        dialog.querySelector('.confirm-modal-message').textContent = message;

        const confirmBtn = dialog.querySelector('.confirm-modal-confirm');
        const cancelBtn = dialog.querySelector('.confirm-modal-cancel');
        confirmBtn.textContent = confirmLabel;
        cancelBtn.textContent = cancelLabel;
        confirmBtn.classList.toggle('btn-danger', danger);
        confirmBtn.classList.toggle('btn-primary', !danger);

        return new Promise((resolve) => {
            const cleanup = (result) => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                dialog.removeEventListener('cancel', onCancel);
                dialog.close();
                resolve(result);
            };
            const onConfirm = () => cleanup(true);
            const onCancel = (e) => {
                e?.preventDefault?.();
                cleanup(false);
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            dialog.addEventListener('cancel', onCancel); // tecla Esc

            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                // Fallback muy antiguo: sin <dialog> nativo, confirma directo.
                console.warn('[ConfirmModal] ⚠️ <dialog> no soportado, usando window.confirm');
                cleanup(window.confirm(`${title}\n\n${message}`));
            }
            confirmBtn.focus();
        });
    }
}

window.ConfirmModal = new ConfirmModalController();
console.log('[ConfirmModal] ✅ Loaded');
