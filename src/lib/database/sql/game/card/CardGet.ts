import { DB, DBClass } from "../../..";
import {
  BaseCard,
  GameBaseCard,
} from "../../../../../structures/game/BaseCard";
import {
  GameUserCard,
  UserCard,
} from "../../../../../structures/game/UserCard";
import { CardReference } from "../../../services/game/CardService";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";

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

  /*
      UserCard
  */
  public static async getUserCardById(id: number): Promise<GameUserCard> {
    const query = (await DB.query(`SELECT * FROM user_card WHERE id=?;`, [
      id,
    ])) as UserCard[];
    if (!query[0]) throw new ZephyrError.UnknownUserCardIdError();
    return new GameUserCard(query[0]);
  }
  public static async getUserCardByReference(
    ref: CardReference
  ): Promise<GameUserCard> {
    const query = (await DB.query(
      `SELECT user_card.* FROM user_card LEFT JOIN card_base ON card_base.identifier=? WHERE serial_number=?;`,
      [ref.identifier, ref.serialNumber]
    )) as UserCard[];
    if (!query[0]) throw new ZephyrError.UnknownUserCardError(ref);
    return new GameUserCard(query[0]);
  }
}
