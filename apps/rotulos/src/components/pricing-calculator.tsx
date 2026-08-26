"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { calculatePricingTiers } from "@/lib/pricing";
import { formatCop } from "@/lib/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FormField } from "@/components/ui/form-field";

export function PricingCalculator() {
  const [supplierPrice, setSupplierPrice] = useState(55000);
  const breakdown = useMemo(
    () => (supplierPrice > 0 ? calculatePricingTiers(supplierPrice) : null),
    [supplierPrice],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="size-4 text-primary" aria-hidden="true" />
          Calculadora de precios
        </CardTitle>
      </CardHeader>

      <FormField label="Precio del proveedor (1 unidad)" htmlFor="supplier-price" className="max-w-xs">
        <CurrencyInput id="supplier-price" value={supplierPrice} onValueChange={setSupplierPrice} />
      </FormField>

      {breakdown ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {([1, 2, 3] as const).map((quantity) => {
            const tier = breakdown.tiers[quantity];
            return (
              <div key={quantity} className="rounded-md border border-border bg-surface-muted p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {quantity === 1 ? "1 unidad" : `${quantity} unidades`}
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">{formatCop(tier.salePrice)}</p>
                <p className="text-xs text-foreground-muted">c/u &middot; ganancia {formatCop(tier.profit)}</p>
                <p className="text-xs text-foreground-muted">margen real {tier.realMarginPercent.toFixed(1)}%</p>
                {quantity > 1 ? (
                  <p className="mt-2 text-xs font-medium text-primary">
                    Total {quantity}: {formatCop(tier.salePrice * quantity)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {breakdown ? (
        <p className="mt-4 text-xs text-foreground-muted">
          Ahorro comprando 2: {formatCop(breakdown.savingsVs1For2)} &middot; ahorro comprando 3:{" "}
          {formatCop(breakdown.savingsVs1For3)}
        </p>
      ) : null}
    </Card>
  );
}
