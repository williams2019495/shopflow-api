import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { products, resetStore, seed } from "../store.js";

const app = createApp();

beforeEach(() => {
  resetStore();
  seed();
});

describe("orders", () => {
  it("creates an order and takes the stock", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ customerId: "cus_00006", lines: [{ productId: "prod_00001", quantity: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body.totalCents).toBe(2800);
    expect(products.get("prod_00001")!.stock).toBe(38);
  });

  it("refuses an order for more than is in stock", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ customerId: "cus_00006", lines: [{ productId: "prod_00004", quantity: 9 }] });
    expect(res.status).toBe(409);
    expect(products.get("prod_00004")!.stock).toBe(8);
  });

  it("puts the stock back when an order is cancelled", async () => {
    const created = await request(app)
      .post("/orders")
      .send({ customerId: "cus_00006", lines: [{ productId: "prod_00002", quantity: 3 }] });
    await request(app).post(`/orders/${created.body.id}/cancel`).expect(200);
    expect(products.get("prod_00002")!.stock).toBe(12);
  });

  it("rejects a malformed order", async () => {
    await request(app).post("/orders").send({ customerId: "cus_00006", lines: [] }).expect(400);
  });
});
