import { DB } from "../../..";
import { Sticker } from "../../../../../structures/game/Sticker";
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

export async function getStickers(): Promise<Sticker[]> {
  const query = (await DB.query(`
    SELECT
      sticker.id,
      sticker.name,
      sticker.image_url,
      sticker.item_id,
      sticker.pack_id,
      sticker.rarity
    FROM sticker;
    `)) as Sticker[];

  return query;
}

export * as ShopGet from "./ShopGet";
