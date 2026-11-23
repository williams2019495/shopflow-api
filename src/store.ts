// In-memory data store. Swapped for Postgres in production; the shape is the same.

export interface Product {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
  category: string;
}

export interface OrderLine {
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  lines: OrderLine[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
}

export const products = new Map<string, Product>();
export const orders = new Map<string, Order>();
export const customers = new Map<string, Customer>();

let nextId = 1;
export function newId(prefix: string): string {
  return `${prefix}_${String(nextId++).padStart(5, "0")}`;
}

export function resetStore(): void {
  products.clear();
  orders.clear();
  customers.clear();
  nextId = 1;
}

export function seed(): void {
  const items: Omit<Product, "id">[] = [
    { name: "Ceramic mug", priceCents: 1400, stock: 40, category: "kitchen" },
    { name: "Linen apron", priceCents: 3200, stock: 12, category: "kitchen" },
    { name: "Notebook, dotted", priceCents: 900, stock: 100, category: "stationery" },
    { name: "Fountain pen", priceCents: 5600, stock: 8, category: "stationery" },
    { name: "Canvas tote", priceCents: 2200, stock: 30, category: "bags" },
  ];
  for (const item of items) {
    const id = newId("prod");
    products.set(id, { id, ...item });
  }
  const id = newId("cus");
  customers.set(id, { id, email: "maya@example.com", name: "Maya Rao" });
}
