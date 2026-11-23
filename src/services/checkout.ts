import { orders, products } from "../store.js";

export interface PaymentGateway {
  /** Places a hold on the card; resolves with the hold id. */
  hold(customerId: string, amountCents: number): Promise<string>;
  capture(holdId: string): Promise<void>;
}

/**
 * Express checkout: holds the payment first, then takes the stock, so a
 * declined card never takes stock away from other customers.
 */
export async function expressCheckout(gateway: PaymentGateway, orderId: string): Promise<{ holdId: string }> {
  const order = orders.get(orderId);
  if (!order) throw new Error(`No order ${orderId}`);

  for (const line of order.lines) {
    const product = products.get(line.productId)!;
    if (product.stock < line.quantity) throw new Error(`Only ${product.stock} left of ${product.name}`);
  }

  const holdId = await gateway.hold(order.customerId, order.totalCents);

  for (const line of order.lines) {
    products.get(line.productId)!.stock -= line.quantity;
  }
  await gateway.capture(holdId);
  order.status = "paid";
  return { holdId };
}
