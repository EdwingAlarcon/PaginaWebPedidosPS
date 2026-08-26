export const PRICING_CONFIG = {
  shippingProviderCost: 10000,
  markupPercent: 0.3,
  roundTo: 5000,
} as const;

export type QuantityTier = 1 | 2 | 3;

export interface PricingTier {
  quantityTier: QuantityTier;
  supplierPrice: number;
  shippingProviderCost: number;
  unitCost: number;
  markupPercent: number;
  rawSalePrice: number;
  salePrice: number;
  profit: number;
  realMarginPercent: number;
}

export interface PricingBreakdown {
  supplierPrice: number;
  tiers: Record<QuantityTier, PricingTier>;
  total2Units: number;
  total3Units: number;
  savingsVs1For2: number;
  savingsVs1For3: number;
}

function shippingPerUnit(quantityTier: QuantityTier): number {
  return PRICING_CONFIG.shippingProviderCost / quantityTier;
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function computeTier(supplierPrice: number, quantityTier: QuantityTier): PricingTier {
  const unitCost = supplierPrice + shippingPerUnit(quantityTier);
  const rawSalePrice = unitCost * (1 + PRICING_CONFIG.markupPercent);
  let salePrice = roundToNearest(rawSalePrice, PRICING_CONFIG.roundTo);
  if (salePrice <= unitCost) {
    salePrice += PRICING_CONFIG.roundTo;
  }
  const profit = salePrice - unitCost;
  const realMarginPercent = (profit / unitCost) * 100;

  return {
    quantityTier,
    supplierPrice,
    shippingProviderCost: shippingPerUnit(quantityTier),
    unitCost,
    markupPercent: PRICING_CONFIG.markupPercent * 100,
    rawSalePrice,
    salePrice,
    profit,
    realMarginPercent,
  };
}

export function calculatePricingTiers(supplierPrice: number): PricingBreakdown {
  const tier1 = computeTier(supplierPrice, 1);
  const tier2 = computeTier(supplierPrice, 2);
  const tier3 = computeTier(supplierPrice, 3);

  return {
    supplierPrice,
    tiers: { 1: tier1, 2: tier2, 3: tier3 },
    total2Units: tier2.salePrice * 2,
    total3Units: tier3.salePrice * 3,
    savingsVs1For2: tier1.salePrice * 2 - tier2.salePrice * 2,
    savingsVs1For3: tier1.salePrice * 3 - tier3.salePrice * 3,
  };
}
