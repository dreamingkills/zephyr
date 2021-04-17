import { Image } from "canvas";

export interface Sticker {
  readonly id: number;
  readonly name: string;
  readonly image_url: string;
  readonly item_id: number;
  readonly pack_id: number;
  readonly rarity: number;
}

export interface CardSticker {
  readonly id: number;
  readonly card_id: number;
  readonly sticker_id: number;
  readonly position: number;
}

export interface IntermediateSticker {
  readonly id: number;
  readonly name: string;
  readonly image: Image;
  readonly itemId: number;
  readonly packId: number;
  readonly rarity: number;
}

export class GameSticker {
  readonly id: number;
  readonly name: string;
  readonly image: Image;
  readonly itemId: number;
  readonly packId: number;
  readonly rarity: number;

  constructor(data: IntermediateSticker) {
    this.id = data.id;
    this.name = data.name;
    this.image = data.image;
    this.itemId = data.itemId;
    this.packId = data.packId;
    this.rarity = data.rarity;
  }
}

export class GameCardSticker {
  readonly id: number;
  readonly cardId: number;
  readonly stickerId: number;
  readonly position: number;

  constructor(data: CardSticker) {
    this.id = data.id;
    this.cardId = data.card_id;
    this.stickerId = data.sticker_id;
    this.position = data.position;
  }
}

export interface BuiltSticker {
  readonly id: number;
  readonly name: string;
  readonly image: Image;
  readonly itemId: number;
}
