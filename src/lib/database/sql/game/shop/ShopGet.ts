import { DB } from "../../..";
import { StickerPack } from "../../../../../structures/shop/StickerPack";

export async function getStickerPacks(): Promise<StickerPack[]> {
  const query = (await DB.query(
    `
    SELECT
        sticker_pack.id,
        sticker_pack.pack_name,
        sticker_pack.price,
        sticker_pack.currency,
        sticker_pack.item_id,
        sticker_pack.featured,
        sticker_pack.shoppable
    FROM
        sticker_pack;
      `
  )) as StickerPack[];

  return query;
}

export * as ShopGet from "./ShopGet";
