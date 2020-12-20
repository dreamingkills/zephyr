export interface BaseItem {
  id: number;
  name: string;
  type: string;
}

export interface Item {
  id: number;
  discord_id: string;
  item_id: number;
  count: number;
}

export class GameItem {
  id: number;
  discordId: string;
  itemId: number;
  count: number;
  constructor(data: Item) {
    this.id = data.id;
    this.discordId = data.discord_id;
    this.itemId = data.item_id;
    this.count = data.count;
  }
}
