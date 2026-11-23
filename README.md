# shopflow-api

Order and catalogue API for a small online store: products, orders, coupons and stock.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test
npm run coverage   # writes coverage/lcov.info
```

## Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/products?category=` | List products, optionally by category |
| GET | `/products/:id` | One product |
| POST | `/orders` | Create an order: checks stock, applies a coupon |
| GET | `/orders/:id` | One order |
| POST | `/orders/:id/cancel` | Cancel a pending order and put the stock back |

Prices are stored in cents.
