import { GameSticker } from "../game/Sticker";

export interface StickerPack {
  readonly id: number;
  readonly pack_name: string;
  readonly price: number;
  readonly currency: `bits` | `cubits`;
  readonly item_id: number;
  readonly featured: boolean;
  readonly shoppable: boolean;
  readonly selection: boolean;
  readonly pulls: number;
}

export class GameStickerPack {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly currency: `bits` | `cubits`;
  readonly itemId: number;
  readonly featured: boolean;
  readonly shoppable: boolean;
  readonly selection: boolean;
  readonly pulls: number;

  readonly stickers: GameSticker[];

  constructor(data: StickerPack, stickers: GameSticker[]) {
    this.id = data.id;
    this.name = data.pack_name;
    this.price =
      data.price - (data.featured ? Math.floor(data.price * 0.25) : 0);
    this.currency = data.currency;
    this.featured = data.featured;
    this.shoppable = data.shoppable;
    this.itemId = data.item_id;
    this.selection = data.selection;
    this.pulls = data.pulls;

    this.stickers = stickers;
  }
}
