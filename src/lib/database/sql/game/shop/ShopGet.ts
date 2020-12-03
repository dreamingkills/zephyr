import { DB, DBClass } from "../../..";
import { Frame, GameFrame } from "../../../../../structures/game/BaseCard";
import { ShopFrame } from "../../../../../structures/game/Shop";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";

export abstract class ShopGet extends DBClass {
  public static async getFrameShop(): Promise<ShopFrame[]> {
    const query = (await DB.query(
      `SELECT card_frame.*, frame_shop.price FROM frame_shop LEFT JOIN card_frame ON frame_shop.frame_id=card_frame.id;`
    )) as ShopFrame[];
    return query;
  }
  public static async getFrameByName(name: string): Promise<GameFrame> {
    const query = (await DB.query(
      `SELECT * FROM card_frame WHERE alphanum(frame_name) LIKE CONCAT("%",alphanum(?),"%");`,
      [name.toLowerCase().replace("frame", "").trim()]
    )) as Frame[];
    if (!query[0]) throw new ZephyrError.InvalidFrameError();
    return new GameFrame(query[0]);
  }
}
