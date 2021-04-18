import { DB } from "../../..";
import { DBShop } from "../../../../../structures/shop/Shop";

export async function getShopItems(): Promise<DBShop[]> {
  const query = (await DB.query(
    `
        SELECT
            item_shop.id,
            item_shop.item_id,
            item_shop.price,
            item_shop.currency,
            item_shop.featured
        FROM
            item_shop;
        `
  )) as DBShop[];

  return query;
}

export * as ShopGetter from "./ShopGetter";
