/**
 * OrderAggregates — agrupa las líneas planas de InventoryManager en
 * "pedidos" reales (uno por orderGroupId), recalculando el total con
 * descuento/envío igual que updateGrandTotal() en order-form.js.
 *
 * Compartido por Dashboard, Pedidos y Reportes para no duplicar esta
 * lógica (y su documentación) en cada módulo.
 */
class OrderAggregatesHelper {
    /**
     * @returns {Array} pedidos agrupados, cada uno con sus `lines` originales
     */
    groupOrders() {
        const lines = window.InventoryManager?.getAll() || [];
        const groups = new Map();

        lines.forEach((line) => {
            const key = line.orderGroupId || line.id;
            if (!groups.has(key)) {
                groups.set(key, {
                    id: key,
                    clientName: line.clientName || 'Sin nombre',
                    phoneNumber: line.phoneNumber || '',
                    email: line.email || '',
                    address: line.address || '',
                    notes: line.notes || '',
                    orderDate: line.orderDate,
                    status: line.status || 'pending',
                    discount: Number(line.discount) || 0,
                    shippingCost: Number(line.shippingCost) || 0,
                    subtotal: 0,
                    productCount: 0,
                    lines: []
                });
            }
            const group = groups.get(key);
            group.subtotal += Number(line.totalPrice) || 0;
            group.productCount += 1;
            group.lines.push(line);
        });

        return Array.from(groups.values()).map((g) => ({
            ...g,
            total: Math.max(0, g.subtotal * (1 - g.discount / 100) + g.shippingCost)
        }));
    }
}

window.OrderAggregates = new OrderAggregatesHelper();
console.log('[OrderAggregates] ✅ Loaded');
