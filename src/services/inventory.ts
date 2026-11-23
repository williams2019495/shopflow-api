import { products } from "../store.js";

export class OutOfStockError extends Error {
  constructor(public productId: string, public available: number) {
    super(`Only ${available} left of ${productId}`);
  }
}

export class UnknownProductError extends Error {
  constructor(public productId: string) {
    super(`No product ${productId}`);
  }
}

/** Checks every line first, then takes the stock, so a failed order takes nothing. */
export function reserve(lines: { productId: string; quantity: number }[]): void {
  for (const line of lines) {
    const product = products.get(line.productId);
    if (!product) throw new UnknownProductError(line.productId);
    if (product.stock < line.quantity) throw new OutOfStockError(line.productId, product.stock);
  }
  for (const line of lines) {
    products.get(line.productId)!.stock -= line.quantity;
  }
}

export function release(lines: { productId: string; quantity: number }[]): void {
  for (const line of lines) {
    const product = products.get(line.productId);
    if (product) product.stock += line.quantity;
  }
}
