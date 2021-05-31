import { DB } from "../../..";
import { AlbumBackground } from "../../../../../structures/game/Album";
import { Frame } from "../../../../../structures/game/Frame";
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
        sticker_pack.shoppable,
        sticker_pack.selection,
        sticker_pack.pulls
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

export async function getFrames(): Promise<Frame[]> {
  const query = (await DB.query(`
    SELECT
      id,
      frame_name,
      frame_url,
      dye_mask_url,
      text_color_hex,
      overlay
    FROM card_frame;`)) as Frame[];

  return query;
}

export async function getBackgrounds(): Promise<AlbumBackground[]> {
  const query = (await DB.query(
    `
      SELECT
        album_background.id,
        album_background.background_name,
        album_background.image_url
      FROM
        album_background;
      `
  )) as AlbumBackground[];

  return query;
}

export * as CosmeticGetter from "./CosmeticGetter";
