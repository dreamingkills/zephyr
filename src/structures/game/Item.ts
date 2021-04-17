export interface Item {
  readonly id: number;
  readonly discord_id: string;
  readonly item_id: number;
  readonly quantity: number;
}

export class GameItem {
  readonly id: number;
  readonly discordId: string;
  readonly itemId: number;
  readonly quantity: number;
  constructor(data: Item) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.itemId = data.item_id;
    this.quantity = data.quantity;
  }
}
