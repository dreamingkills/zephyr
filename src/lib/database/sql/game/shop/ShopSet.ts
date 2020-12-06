import { DB, DBClass } from "../../..";
import { Chance } from "chance";

export abstract class ShopSet extends DBClass {
  public static async resetFrameShop(): Promise<void> {
    await DB.query(`DELETE FROM frame_shop;`);
    const rand = (await DB.query(
      `SELECT * FROM card_frame WHERE shoppable=TRUE ORDER BY RAND() LIMIT 5;`
    )) as { id: number; frame_name: string; frame_url: string }[];
    let query = `INSERT INTO frame_shop (frame_id, price) VALUES `;
    const values = [];
    const chance = new Chance();
    for (let frame of rand) {
      const price = chance.integer({ min: 500, max: 1200 });
      values.push(`(${frame.id}, ${price})`);
    }
    await DB.query(`${query}${values.join(", ")};`);
    return;
  }
}
