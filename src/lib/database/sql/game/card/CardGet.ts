import { DB, DBClass } from "../../..";
import {
  BaseCard,
  GameBaseCard,
} from "../../../../../structures/game/BaseCard";

export abstract class CardGet extends DBClass {
  public static async getAllCards(): Promise<GameBaseCard[]> {
    const query = (await DB.query(`SELECT
                                    id,
                                    identifier,
                                    flavor_text,
                                    group_name,
                                    subgroup_name,
                                    individual_name,
                                    rarity,
                                    serial_total,
                                    serial_limit,
                                    card_image.tier_one,
                                    card_image.tier_two,
                                    card_image.tier_three,
                                    card_image.tier_four,
                                    card_image.tier_five,
                                    card_image.tier_six
                                   FROM card_base LEFT JOIN card_image ON card_id=id;`)) as BaseCard[];
    return query.map((c) => new GameBaseCard(c));
  }
}
