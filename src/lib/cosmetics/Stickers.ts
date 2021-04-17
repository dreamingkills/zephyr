import { loadImage } from "canvas";
import { GameSticker } from "../../structures/game/Sticker";
import { GameStickerPack } from "../../structures/shop/StickerPack";
import { ShopGet } from "../database/sql/game/shop/ShopGet";

class StickerService {
  private stickers: GameSticker[] = [];
  private stickerPacks: GameStickerPack[] = [];

  public async loadStickers(): Promise<GameSticker[]> {
    const stickers = await ShopGet.getStickers();

    const builtStickers: GameSticker[] = [];
    for (let sticker of stickers) {
      const intermediate = {
        id: sticker.id,
        name: sticker.name,
        image: await loadImage(sticker.image_url),
        itemId: sticker.item_id,
        packId: sticker.pack_id,
        rarity: sticker.rarity,
      };

      builtStickers.push(new GameSticker(intermediate));
    }

    this.stickers = builtStickers;
    return this.stickers;
  }

  public getStickers(): GameSticker[] {
    return this.stickers;
  }

  public getStickerById(id: number): GameSticker | undefined {
    return this.stickers.find((s) => s.id === id);
  }

  public getStickerByItemId(itemId: number): GameSticker | undefined {
    return this.stickers.find((s) => s.itemId === itemId);
  }

  public async loadStickerPacks(): Promise<GameStickerPack[]> {
    const stickerPacks = await ShopGet.getStickerPacks();

    const builtPacks: GameStickerPack[] = [];
    for (let pack of stickerPacks) {
      const builtPack = new GameStickerPack(
        pack,
        this.stickers.filter((s) => s.packId === pack.id)
      );

      builtPacks.push(builtPack);
    }

    this.stickerPacks = builtPacks;
    return this.stickerPacks;
  }

  public getStickerPacks(): GameStickerPack[] {
    return this.stickerPacks;
  }

  public getStickerPackById(id: number): GameStickerPack | undefined {
    return this.stickerPacks.find((pack) => pack.id === id);
  }

  public getStickerPackByItemId(itemId: number): GameStickerPack | undefined {
    return this.stickerPacks.find((pack) => pack.itemId === itemId);
  }

  public getStickerPackByName(name: string): GameStickerPack | undefined {
    return this.stickerPacks.find(
      (pack) => pack.name.toLowerCase() === name.toLowerCase()
    );
  }
}

export const Stickers = new StickerService();
