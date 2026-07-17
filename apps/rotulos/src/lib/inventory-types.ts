export type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  lastRestockDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductDraft = {
  name: string;
  category: string;
  sku: string;
  unitPrice: number;
  minStock: number;
  maxStock: number | null;
};

export type StockMovementType = "entrada" | "salida" | "ajuste" | "transferencia";

export type StockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  supplier: string;
  createdAt: string;
};

export type StockMovementDraft = {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  supplier: string;
};

export type StockAlerts = {
  lowStock: Product[];
  critical: Product[];
  overstocked: Product[];
};
