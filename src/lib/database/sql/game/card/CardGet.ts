import { DB, DBClass } from "../../..";
import {
  BaseCard,
  Frame,
  GameBaseCard,
  GameFrame,
} from "../../../../../structures/game/BaseCard";
import {
  GameUserCard,
  UserCard,
} from "../../../../../structures/game/UserCard";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { Filter, FilterService } from "../../Filters";
import { GameProfile } from "../../../../../structures/game/Profile";

export abstract class CardGet extends DBClass {
  public static async getAllCards(): Promise<GameBaseCard[]> {
    const query = (await DB.query(`SELECT
                                    id,
                                    flavor_text,
                                    group_name,
                                    subgroup_name,
                                    individual_name,
                                    rarity,
                                    image_url,
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
  public static async getRandomFrame(
    includeUnshoppable: boolean
  ): Promise<GameFrame> {
    const query = (await DB.query(
      `SELECT * FROM card_frame WHERE (shoppable=1 OR shoppable=1-?) AND NOT id=1 ORDER BY RAND() LIMIT 1;`,
      [includeUnshoppable]
    )) as Frame[];
    return new GameFrame(query[0]);
  }
  public static async getFrameById(id: number): Promise<GameFrame> {
    const query = (await DB.query(`SELECT * FROM card_frame WHERE id=?;`, [
      id,
    ])) as Frame[];
    return new GameFrame(query[0]);
  }

  /*
      UserCard
  */
  public static async getUserInventory(
    profile: GameProfile,
    options: Filter
  ): Promise<GameUserCard[]> {
    let query = `SELECT user_card.* FROM user_card 
                  LEFT JOIN card_base ON user_card.card_id=card_base.id WHERE discord_id=${DB.connection.escape(
                    profile.discordId
                  )}`;
    const queryOptions = await FilterService.parseOptions(options, profile);
    const page = <number>options["page"];
    query +=
      (queryOptions.length > 0 ? ` AND` : ``) + queryOptions.join(` AND`);

    if (["issue", "i", "serial"].indexOf(<string>options["order"]) > -1) {
      query += ` ORDER BY serial_number ASC`;
    } else if (["wear", "w"].indexOf(<string>options["order"]) > -1) {
      query += ` ORDER BY wear DESC`;
    } else if (["luck", "lc"].indexOf(<string>options["order"]) > -1) {
      query += ` ORDER BY luck_coeff DESC`;
    } else query += ` ORDER BY user_card.id DESC`;

    query += ` LIMIT 10 OFFSET ${DB.connection.escape(
      (isNaN(page) ? 1 : page) * 10 - 10
    )};`;

    const cards = (await DB.query(query)) as UserCard[];
    return cards.map((c) => new GameUserCard(c));
  }
  public static async getUserInventorySize(
    profile: GameProfile,
    options: Filter
  ): Promise<number> {
    let query = `SELECT COUNT(*) AS count FROM user_card LEFT JOIN card_base ON user_card.card_id=card_base.id WHERE discord_id=${DB.connection.escape(
      profile.discordId
    )}`;
    const queryOptions = await FilterService.parseOptions(options, profile);
    query +=
      (queryOptions.length > 0 ? ` AND` : ``) + queryOptions.join(` AND`);

    const result = (await DB.query(query + `;`)) as { count: number }[];
    return result[0].count;
  }
  public static async getUserCardById(id: number): Promise<GameUserCard> {
    const query = (await DB.query(
      `SELECT user_card.*, card_frame.id AS frame_id, card_frame.frame_name, card_frame.frame_url FROM user_card LEFT JOIN card_frame ON user_card.frame=card_frame.id WHERE user_card.id=?;`,
      [id]
    )) as UserCard[];
    if (!query[0]) throw new ZephyrError.UnknownUserCardIdError();
    return new GameUserCard(query[0]);
  }
  public static async getLastCard(discordId: string): Promise<GameUserCard> {
    const query = (await DB.query(
      `SELECT user_card.*, card_frame.id AS frame_id, card_frame.frame_name, card_frame.frame_url FROM user_card LEFT JOIN card_frame ON user_card.frame=card_frame.id WHERE discord_id=? ORDER BY id DESC;`,
      [discordId]
    )) as UserCard[];
    if (!query[0]) throw new ZephyrError.InvalidCardReferenceError();
    return new GameUserCard(query[0]);
  }

  public static async getNumberOfTopCollectors(
    ids: number[],
    zephyrId: string
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) as count FROM (SELECT COUNT(*) as count FROM user_card WHERE user_card.card_id IN (?) AND NOT user_card.discord_id=? GROUP BY user_card.discord_id HAVING COUNT(*)>0) AS total;`,
      [ids, zephyrId]
    )) as { count: number }[];
    return query[0].count;
  }
  public static async getTopCollectorsByBaseIds(
    ids: number[],
    zephyrId: string,
    page: number
  ): Promise<{ discordId: string; amount: number }[]> {
    const query = (await DB.query(
      `SELECT user_card.discord_id, COUNT(*) as count FROM user_card WHERE user_card.card_id IN (?) AND NOT user_card.discord_id=? GROUP BY user_card.discord_id HAVING COUNT(*)>0 ORDER BY count DESC LIMIT 10 OFFSET ?;`,
      [ids, zephyrId, page * 10 - 10]
    )) as {
      discord_id: string;
      count: number;
    }[];
    return query.map((q) => {
      return { discordId: q.discord_id, amount: q.count };
    });
  }

  public static async getNumberOfTopWishlisted(): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) as count FROM (SELECT COUNT(*) as count FROM wishlist GROUP BY name, group_name HAVING COUNT(*) ORDER BY count DESC) g;`
    )) as { count: number }[];
    return query[0].count;
  }
  public static async getTopWishlisted(
    page: number
  ): Promise<{ group: string; name: string; count: number }[]> {
    const query = (await DB.query(
      `SELECT COUNT(*) as count, name, group_name FROM wishlist GROUP BY name, group_name ORDER BY count DESC LIMIT 10 OFFSET ?;`,
      [page * 10 - 10]
    )) as { count: number; name: string; group_name: string }[];
    return query.map((q) => {
      return { name: q.name, group: q.group_name, count: q.count };
    });
  }
}
