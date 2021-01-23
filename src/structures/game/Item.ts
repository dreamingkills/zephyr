export interface Item {
  id: number;
  discord_id: string;
  item_id: number;
  quantity: number;
}

export class GameItem {
  id: number;
  discordId: string;
  itemId: number;
  quantity: number;
  constructor(data: Item) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.itemId = data.item_id;
    this.quantity = data.quantity;
  }
}
