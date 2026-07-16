export type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  department: string;
  city: string;
  address: string;
  neighborhood: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItemDraft = {
  productCode: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
};

export type OrderItem = OrderItemDraft & {
  id: string;
  total: number;
};

export type OrderDraft = {
  customer: Omit<Customer, "id" | "createdAt" | "updatedAt">;
  orderDate: string;
  status: "pending" | "completed" | "cancelled";
  notes: string;
  discount: number;
  shippingCost: number;
  items: OrderItemDraft[];
};

export type OrderRecord = {
  id: string;
  customerId: string | null;
  customer: OrderDraft["customer"];
  orderDate: string;
  status: OrderDraft["status"];
  notes: string;
  discount: number;
  shippingCost: number;
  subtotal: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type ProductCode = {
  id: string;
  code: string;
  productName: string;
  category: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
};
