import { writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { newId, products } from "../store.js";

export const importRoutes = Router();

const IMAGE_DIR = "public/images";

/**
 * Imports a product from a supplier's feed: fetches the feed URL, adds the
 * product, and saves its image under public/images with the supplier's file name.
 */
importRoutes.post("/products", async (req, res) => {
  const { feedUrl } = req.body ?? {};
  if (typeof feedUrl !== "string") return res.status(400).json({ error: "feed_url_required" });

  const feed = await (await fetch(feedUrl)).json();
  const id = newId("prod");
  products.set(id, {
    id,
    name: feed.name,
    priceCents: Math.round(feed.price * 100),
    stock: feed.stock ?? 0,
    category: feed.category ?? "imported",
  });

  if (feed.imageUrl) {
    const image = Buffer.from(await (await fetch(feed.imageUrl)).arrayBuffer());
    await writeFile(path.join(IMAGE_DIR, feed.imageName), image);
  }
  res.status(201).json(products.get(id));
});
