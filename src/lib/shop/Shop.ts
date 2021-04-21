import { items } from "../../assets/Items";
import { GameShop, IntermediateShop } from "../../structures/shop/Shop";
import { ShopGetter } from "../database/sql/game/shop/ShopGetter";
import { Logger } from "../logger/Logger";

class ShopService {
  private shop: GameShop[] = [];

  public async loadShop(): Promise<GameShop[]> {
    const shop = await ShopGetter.getShopItems();

    const finalShop = [];
    for (let item of shop) {
      const prefabItem = items.find((i) => i.id === item.item_id);

      if (!prefabItem) {
        Logger.error(`Item not found for shop entry ${item.id}.`);
        continue;
      }

      const intermediate: IntermediateShop = {
        id: item.id,
        item: prefabItem,
        price: item.price,
        currency: item.currency,
        featured: item.featured,
      };

      finalShop.push(new GameShop(intermediate));
    }

    this.shop = finalShop;
    return this.shop;
  }

  public getShop(): GameShop[] {
    return this.shop;
  }

  public getShopItemByName(name: string): GameShop | undefined {
    return this.shop.find((s) =>
      s.item.names.map((n) => n.toLowerCase()).includes(name.toLowerCase())
    );
  }

  public async init(): Promise<void> {
    await this.loadShop();
    return;
  }
}

export const Shop = new ShopService();
