import { describe, expect, it } from "vitest";
import { calculatePricingTiers, PRICING_CONFIG } from "@/lib/pricing";

describe("calculatePricingTiers", () => {
  it("matches the worked example for a $55.000 supplier price", () => {
    const result = calculatePricingTiers(55000);
    expect(result.tiers[1].salePrice).toBe(85000);
    expect(result.tiers[2].salePrice).toBe(80000);
    expect(result.tiers[3].salePrice).toBe(75000);
  });

  it("never prices below the real unit cost", () => {
    for (const supplierPrice of [10000, 30000, 55000, 100000, 170000]) {
      const result = calculatePricingTiers(supplierPrice);
      for (const tier of Object.values(result.tiers)) {
        expect(tier.salePrice).toBeGreaterThan(tier.unitCost);
      }
    }
  });

  it("keeps the real margin close to the configured markup", () => {
    const result = calculatePricingTiers(75000);
    for (const tier of Object.values(result.tiers)) {
      expect(tier.realMarginPercent).toBeGreaterThan(PRICING_CONFIG.markupPercent * 100 - 10);
      expect(tier.realMarginPercent).toBeLessThan(PRICING_CONFIG.markupPercent * 100 + 10);
    }
  });

  it("splits the provider shipping cost across the quantity tier", () => {
    const result = calculatePricingTiers(55000);
    expect(result.tiers[1].shippingProviderCost).toBe(10000);
    expect(result.tiers[2].shippingProviderCost).toBe(5000);
    expect(result.tiers[3].shippingProviderCost).toBeCloseTo(3333.33, 1);
  });

  it("computes totals and savings for buying more units", () => {
    const result = calculatePricingTiers(55000);
    expect(result.total2Units).toBe(160000);
    expect(result.total3Units).toBe(225000);
    expect(result.savingsVs1For2).toBeGreaterThanOrEqual(0);
    expect(result.savingsVs1For3).toBeGreaterThanOrEqual(0);
  });

  it("rounds sale prices to the nearest configured step", () => {
    const result = calculatePricingTiers(120000);
    for (const tier of Object.values(result.tiers)) {
      expect(tier.salePrice % PRICING_CONFIG.roundTo).toBe(0);
    }
  });
});
