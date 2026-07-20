"use client";

import type { FormEvent } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createBlankOrderDraft, getBusinessStore } from "@/lib/business-store";
import type { Customer, OrderDraft, ProductCode } from "@/lib/business-types";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button, IconButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LocationFields } from "@/components/location-fields";
import { isBogotaLocation, isValidBogotaLocality, isValidBogotaNeighborhoodForLocality, validateDepartmentCity } from "@/lib/location";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function customerCompleteness(customer: Customer): number {
  return [
    customer.phone,
    customer.email,
    customer.department,
    customer.city,
    customer.locality,
    customer.address,
    customer.neighborhood,
  ].filter((value) => String(value ?? "").trim()).length;
}

function betterCustomerOption(current: Customer, candidate: Customer): Customer {
  const currentScore = customerCompleteness(current);
  const candidateScore = customerCompleteness(candidate);
  if (candidateScore !== currentScore) return candidateScore > currentScore ? candidate : current;
  return candidate.updatedAt.localeCompare(current.updatedAt) > 0 ? candidate : current;
}

function uniqueCustomerOptions(customers: Customer[]): Customer[] {
  const byName = new Map<string, Customer>();
  for (const customer of customers) {
    const key = normalizeName(customer.fullName);
    if (!key) continue;
    const existing = byName.get(key);
    byName.set(key, existing ? betterCustomerOption(existing, customer) : customer);
  }
  return [...byName.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export function OrderForm() {
  const [draft, setDraft] = useState<OrderDraft>(() => createBlankOrderDraft());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productCodes, setProductCodes] = useState<ProductCode[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const customerListId = useId();
  const productListId = useId();

  useEffect(() => {
    getBusinessStore().listCustomers().then(setCustomers).catch(() => setCustomers([]));
    getBusinessStore().listProductCodes().then(setProductCodes).catch(() => setProductCodes([]));
  }, []);

  const subtotal = useMemo(
    () => draft.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [draft.items],
  );
  const total = Math.max(0, subtotal - draft.discount + draft.shippingCost);
  const customerOptions = useMemo(() => uniqueCustomerOptions(customers), [customers]);

  function setCustomerField(field: keyof OrderDraft["customer"], value: string) {
    setDraft((current) => ({ ...current, customer: { ...current.customer, [field]: value } }));
  }

  function handleCustomerNameChange(value: string) {
    setCustomerField("fullName", value);
    const match = customerOptions.find((customer) => normalizeName(customer.fullName) === normalizeName(value));
    if (match) {
      setDraft((current) => ({
        ...current,
        customer: {
          fullName: match.fullName,
          phone: match.phone,
          email: match.email,
          department: match.department,
          city: match.city,
          locality: match.locality ?? "",
          address: match.address,
          neighborhood: match.neighborhood,
        },
      }));
    }
  }

  function setItem(index: number, field: keyof OrderDraft["items"][number], value: string | number) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function handleProductCodeChange(index: number, code: string) {
    setItem(index, "productCode", code.toUpperCase());
    const match = productCodes.find((entry) => entry.code.toUpperCase() === code.toUpperCase());
    if (match) {
      setDraft((current) => ({
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, productName: match.productName, category: match.category, unitPrice: match.unitPrice }
            : item,
        ),
      }));
    }
  }

  function addItem() {
    setDraft((current) => ({
      ...current,
      items: [...current.items, { productCode: "", productName: "", category: "", quantity: 1, unitPrice: 0 }],
    }));
  }

  function removeItem(index: number) {
    setDraft((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setStatus(null);

    const nextErrors: Record<string, string> = {};
    if (!draft.customer.fullName.trim()) nextErrors.customer = "El nombre del cliente es obligatorio.";
    if (!draft.items.some((item) => item.productName.trim())) nextErrors.items = "Agrega al menos un producto.";
    const locationError = validateDepartmentCity(draft.customer);
    if (locationError === "department") nextErrors["customer.department"] = "Selecciona un departamento valido.";
    if (locationError === "city") nextErrors["customer.city"] = "Selecciona una ciudad que pertenezca al departamento.";
    if (isBogotaLocation(draft.customer) && !draft.customer.locality?.trim()) {
      nextErrors["customer.locality"] = "Selecciona la localidad.";
    }
    if (isBogotaLocation(draft.customer) && draft.customer.locality && !isValidBogotaLocality(draft.customer.locality)) {
      nextErrors["customer.locality"] = "Selecciona una localidad valida de Bogota.";
    }
    if (isBogotaLocation(draft.customer) && draft.customer.locality && draft.customer.neighborhood && !isValidBogotaNeighborhoodForLocality(draft.customer.locality, draft.customer.neighborhood)) {
      nextErrors["customer.neighborhood"] = "Selecciona un barrio que pertenezca a la localidad.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const saved = await getBusinessStore().saveOrder({
        ...draft,
        items: draft.items.filter((item) => item.productName.trim()),
      });
      setDraft(createBlankOrderDraft());
      setStatus({
        tone: "success",
        message: `Pedido guardado para ${saved.customer.fullName}. Total $${Math.round(saved.total).toLocaleString("es-CO")}.`,
      });
    } catch {
      setStatus({ tone: "danger", message: "No se pudo guardar el pedido. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveOrder} className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="flex flex-col gap-5">
        {status ? <Alert variant={status.tone}>{status.message}</Alert> : null}

        <Card>
          <CardTitle>Cliente</CardTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre" required error={errors.customer} className="sm:col-span-2">
              <Input
                list={customerListId}
                value={draft.customer.fullName}
                onChange={(event) => handleCustomerNameChange(event.target.value)}
                placeholder="Busca o escribe un cliente nuevo"
              />
              <datalist id={customerListId}>
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.fullName} />
                ))}
              </datalist>
            </FormField>
            <FormField label="Telefono">
              <Input value={draft.customer.phone} onChange={(event) => setCustomerField("phone", event.target.value)} />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={draft.customer.email}
                onChange={(event) => setCustomerField("email", event.target.value)}
              />
            </FormField>
            <LocationFields
              value={draft.customer}
              onChange={(customer) =>
                setDraft((current) => ({
                  ...current,
                  customer: typeof customer === "function" ? customer(current.customer) : customer,
                }))
              }
              errors={errors}
              prefix="customer"
              addressLabel="Direccion"
              addressAsTextarea
              addressRows={2}
              includeNeighborhood
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Productos</CardTitle>
          </div>
          {errors.items ? (
            <p className="mt-2 text-xs font-medium text-danger" role="alert">
              {errors.items}
            </p>
          ) : null}

          <datalist id={productListId}>
            {productCodes.map((entry) => (
              <option key={entry.id} value={entry.code} />
            ))}
          </datalist>

          <div className="mt-4 flex flex-col gap-3">
            {draft.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-3 rounded-md border border-border p-3 sm:grid-cols-6 sm:items-end"
              >
                <FormField label="Codigo" className="sm:col-span-1">
                  <Input
                    list={productListId}
                    value={item.productCode}
                    onChange={(event) => handleProductCodeChange(index, event.target.value)}
                  />
                </FormField>
                <FormField label="Producto" className="col-span-2 sm:col-span-2">
                  <Input value={item.productName} onChange={(event) => setItem(index, "productName", event.target.value)} />
                </FormField>
                <FormField label="Cantidad" className="sm:col-span-1">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => setItem(index, "quantity", Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Precio" className="sm:col-span-1">
                  <CurrencyInput
                    value={item.unitPrice}
                    onValueChange={(value) => setItem(index, "unitPrice", value)}
                  />
                </FormField>
                <div className="flex items-end justify-end sm:col-span-1">
                  <IconButton
                    type="button"
                    label="Quitar producto"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    disabled={draft.items.length === 1}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={addItem}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar producto
          </Button>
        </Card>

        <Card>
          <CardTitle>Notas y envio</CardTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Fecha del pedido">
              <DatePicker
                value={draft.orderDate}
                onChange={(event) => setDraft((current) => ({ ...current, orderDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Notas" className="sm:row-span-2">
              <Textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
              />
            </FormField>
            <FormField label="Descuento">
              <CurrencyInput
                value={draft.discount}
                onValueChange={(value) => setDraft((current) => ({ ...current, discount: value }))}
              />
            </FormField>
            <FormField label="Envio">
              <CurrencyInput
                value={draft.shippingCost}
                onValueChange={(value) => setDraft((current) => ({ ...current, shippingCost: value }))}
              />
            </FormField>
          </div>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-6">
        <Card>
          <CardTitle>Resumen</CardTitle>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Subtotal</dt>
              <dd className="text-foreground">${Math.round(subtotal).toLocaleString("es-CO")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Descuento</dt>
              <dd className="text-foreground">-${Math.round(draft.discount).toLocaleString("es-CO")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Envio</dt>
              <dd className="text-foreground">${Math.round(draft.shippingCost).toLocaleString("es-CO")}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>${Math.round(total).toLocaleString("es-CO")}</dd>
            </div>
          </dl>
          <Button type="submit" className="mt-5 w-full" loading={saving}>
            Guardar pedido
          </Button>
        </Card>
      </aside>
    </form>
  );
}
