import { StickerPack } from "../../../../structures/shop/StickerPack";
import { ShopGet } from "../../sql/game/shop/ShopGet";

export async function getStickerPacks(): Promise<StickerPack[]> {
  return await ShopGet.getStickerPacks();
}

export * as ShopService from "./ShopService";
