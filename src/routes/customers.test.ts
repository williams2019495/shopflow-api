import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { customers, orders, resetStore, type Order } from "../store.js";

const app = createApp();
const maya = { id: "cus_maya", email: "maya@example.com", name: "Maya Rao" };
const eli = { id: "cus_eli", email: "eli@example.com", name: "Eli Chen" };
const historyPath = `/customers/${maya.id}/orders`;
const profilePath = `/customers/${maya.id}`;

beforeEach(() => {
  resetStore();
  customers.set(maya.id, { ...maya });
  customers.set(eli.id, { ...eli });
});

function addOrder(day: number, customerId = maya.id): Order {
  const date = String(day).padStart(2, "0");
  const order: Order = {
    id: `${customerId}_order_${date}`,
    customerId,
    lines: [{ productId: "prod_mug", quantity: 1, unitPriceCents: 1400 }],
    subtotalCents: 1400,
    discountCents: 0,
    totalCents: 1400,
    status: "paid",
    createdAt: `2025-01-${date}T10:00:00.000Z`,
  };
  orders.set(order.id, order);
  return order;
}

describe("GET /customers/me", () => {
  it("returns the customer identified by the gateway header", async () => {
    await request(app).get("/customers/me").set("x-customer-id", eli.id).expect(200, eli);
  });

  it("rejects a missing customer header", async () => {
    await request(app).get("/customers/me").expect(401, { error: "not_signed_in" });
  });

  it("rejects an unknown customer", async () => {
    await request(app)
      .get("/customers/me")
      .set("x-customer-id", "cus_missing")
      .expect(401, { error: "not_signed_in" });
  });
});

describe("GET /customers/:customerId/orders", () => {
  it("rejects a request without the gateway header", async () => {
    addOrder(1);
    await request(app).get(historyPath).expect(401, { error: "not_signed_in" });
  });

  it("returns an empty history when only another customer has orders", async () => {
    addOrder(1, eli.id);
    await request(app)
      .get(historyPath)
      .set("x-customer-id", maya.id)
      .expect(200, { page: 1, total: 0, orders: [] });
  });

  describe("pagination", () => {
    let newestFirst: Order[];

    beforeEach(() => {
      // Insert the oldest and newest orders first so insertion order cannot pass as date order.
      const oldest = addOrder(1);
      const newest = addOrder(21);
      const middle = Array.from({ length: 19 }, (_, index) => addOrder(index + 2));
      addOrder(22, eli.id);
      newestFirst = [newest, ...middle.reverse(), oldest];
    });

    it.each([
      { label: "omitted (defaults to 1)", query: "", page: 1, from: 0, to: 10 },
      { label: "explicitly 1", query: "?page=1", page: 1, from: 0, to: 10 },
      { label: "2", query: "?page=2", page: 2, from: 10, to: 20 },
      { label: "3 (partial last page)", query: "?page=3", page: 3, from: 20, to: 21 },
      { label: "4 (past the end)", query: "?page=4", page: 4, from: 21, to: 21 },
    ])("returns the expected orders when page is $label", async ({ query, page, from, to }) => {
      const res = await request(app).get(historyPath + query).set("x-customer-id", maya.id).expect(200);

      expect(res.body).toEqual({ page, total: 21, orders: newestFirst.slice(from, to) });
    });
  });
});

describe("PATCH /customers/:customerId", () => {
  it.each([
    { fields: { name: "Maya Singh" }, updated: { ...maya, name: "Maya Singh" } },
    { fields: { email: "maya.singh@example.com" }, updated: { ...maya, email: "maya.singh@example.com" } },
    {
      fields: { name: "Maya Singh", email: "maya.singh@example.com" },
      updated: { ...maya, name: "Maya Singh", email: "maya.singh@example.com" },
    },
  ])("persists the supplied profile fields: $fields", async ({ fields, updated }) => {
    await request(app).patch(profilePath).set("x-customer-id", maya.id).send(fields).expect(200, updated);
    await request(app).get("/customers/me").set("x-customer-id", maya.id).expect(200, updated);
    expect(customers.get(eli.id)).toEqual(eli);
  });

  it("ignores non-string profile fields and fields outside the profile update", async () => {
    await request(app)
      .patch(profilePath)
      .set("x-customer-id", maya.id)
      .send({ name: null, email: 42, id: eli.id, role: "admin" })
      .expect(200, maya);
    expect(customers.get(maya.id)).toEqual(maya);
  });

  it("returns 404 without creating a profile for an unknown customer", async () => {
    const missingId = "cus_missing";
    await request(app)
      .patch(`/customers/${missingId}`)
      .set("x-customer-id", maya.id)
      .send({ name: "Missing customer" })
      .expect(404, { error: "not_found" });
    expect(customers.has(missingId)).toBe(false);
  });
});
