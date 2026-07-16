(function () {
    const ROTULOS_LOCAL_URL = 'http://localhost:3001';

    function render() {
        const app = document.getElementById('shippingLabelsApp');
        if (!app) return;

        app.innerHTML = `
            <div class="labels-toolbar">
                <div>
                    <h2>Rótulos de envío</h2>
                    <p>La generación completa de rótulos ahora vive en la app dedicada de Purple Shop.</p>
                </div>
                <div class="labels-actions">
                    <a class="labels-btn primary" href="${ROTULOS_LOCAL_URL}" target="_blank" rel="noopener noreferrer">Abrir app de rótulos</a>
                </div>
            </div>
            <section class="labels-panel">
                <h3>App dedicada</h3>
                <p>Usa la app Next para crear rótulos, consultar historial, configurar numeración, imprimir y descargar PDF con el formato validado de 14 x 11 cm.</p>
                <div class="labels-actions" style="margin-top: 1rem">
                    <a class="labels-btn primary" href="${ROTULOS_LOCAL_URL}" target="_blank" rel="noopener noreferrer">Abrir ${ROTULOS_LOCAL_URL}</a>
                </div>
            </section>
        `;
    }

    window.PurpleShopLabels = {
        initialize() {
            render();
        }
    };

    document.addEventListener('DOMContentLoaded', () => window.PurpleShopLabels.initialize());
})();
