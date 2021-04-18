import { PrefabItem } from "../item/PrefabItem";

export interface DBShop {
  id: number;
  item_id: number;
  price: number;
  currency: `bits` | `cubits`;
  featured: boolean;
}

export interface IntermediateShop {
  id: number;
  item: PrefabItem;
  price: number;
  currency: `bits` | `cubits`;
  featured: boolean;
}

export class GameShop {
  id: number;
  item: PrefabItem;
  price: number;
  currency: `bits` | `cubits`;
  featured: boolean;

  constructor(data: IntermediateShop) {
    this.id = data.id;
    this.item = data.item;
    this.price = data.price;
    this.currency = data.currency;
    this.featured = data.featured;
  }
}
