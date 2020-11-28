import { GameFrame } from "../../../../structures/game/BaseCard";
import { ShopFrame } from "../../../../structures/game/Shop";
import { ShopGet } from "../../sql/game/shop/ShopGet";
import { ShopSet } from "../../sql/game/shop/ShopSet";

export abstract class ShopService {
  public static async getFrameShop(): Promise<ShopFrame[]> {
    return await ShopGet.getFrameShop();
  }
  public static async resetFrameShop(): Promise<void> {
    return await ShopSet.resetFrameShop();
  }
  public static async getFrameByName(name: string): Promise<GameFrame> {
    return await ShopGet.getFrameByName(name);
  }
}
