import { Image } from "canvas";

export interface Sticker {
  id: number;
  name: string;
  image_url: string;
  item_id: number;
}

export interface CardSticker {
  id: number;
  card_id: number;
  sticker_id: number;
  position: number;
}

export class GameSticker {
  id: number;
  name: string;
  imageUrl: string;
  itemId: number;

  constructor(data: Sticker) {
    this.id = data.id;
    this.name = data.name;
    this.imageUrl = data.image_url;
    this.itemId = data.item_id;
  }
}

export class GameCardSticker {
  id: number;
  cardId: number;
  stickerId: number;
  position: number;

  constructor(data: CardSticker) {
    this.id = data.id;
    this.cardId = data.card_id;
    this.stickerId = data.sticker_id;
    this.position = data.position;
  }
}

export interface BuiltSticker {
  id: number;
  name: string;
  image: Image;
  itemId: number;
}
