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
import { GameTag } from "../../../../../structures/game/Tag";

export type WearSpread = {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

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
                                    num_generated
                                   FROM card_base;`)) as BaseCard[];
    return query.map((c) => new GameBaseCard(c));
  }

  public static async getCardById(id: number): Promise<GameBaseCard> {
    const query = (await DB.query(`SELECT * FROM card_base WHERE id=?;`, [
      id,
    ])) as BaseCard[];
    return new GameBaseCard(query[0]);
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
    options: Filter,
    tags: GameTag[]
  ): Promise<GameUserCard[]> {
    let query = `SELECT user_card.* FROM user_card 
                  LEFT JOIN card_base ON user_card.card_id=card_base.id WHERE discord_id=${DB.connection.escape(
                    profile.discordId
                  )}`;
    const queryOptions = FilterService.parseOptions(options, tags);
    const page = <number>options["page"];
    query +=
      (queryOptions.length > 0 ? ` AND` : ``) + queryOptions.join(` AND`);

    let order = <string>options["order"];
    const reverse = order?.startsWith("!");
    if (reverse) order = order.slice(1);

    if (["issue", "i", "serial"].indexOf(order) > -1) {
      query += ` ORDER BY serial_number ${reverse ? `DESC` : `ASC`}`;
    } else if (["wear", "w"].indexOf(order) > -1) {
      query += ` ORDER BY wear ${reverse ? `ASC` : `DESC`}`;
    } else if (["luck", "lc"].indexOf(order) > -1) {
      query += ` ORDER BY luck_coeff ${reverse ? `ASC` : `DESC`}`;
    } else query += ` ORDER BY user_card.id ${reverse ? `ASC` : `DESC`}`;

    query += ` LIMIT 10 OFFSET ${DB.connection.escape(
      (isNaN(page) ? 1 : page) * 10 - 10
    )};`;

    const cards = (await DB.query(query)) as UserCard[];
    return cards.map((c) => new GameUserCard(c));
  }
  public static async getUserInventorySize(
    profile: GameProfile,
    options: Filter,
    tags: GameTag[]
  ): Promise<number> {
    let query = `SELECT COUNT(*) AS count FROM user_card LEFT JOIN card_base ON user_card.card_id=card_base.id WHERE discord_id=${DB.connection.escape(
      profile.discordId
    )}`;
    const queryOptions = FilterService.parseOptions(options, tags);
    query +=
      (queryOptions.length > 0 ? ` AND` : ``) + queryOptions.join(` AND`);

    const result = (await DB.query(query + `;`)) as { count: number }[];
    return result[0].count;
  }
  public static async getUserCardById(id: number): Promise<GameUserCard> {
    const query = (await DB.query(
      `SELECT user_card.*, card_frame.id AS frame_id, card_frame.frame_name, card_frame.frame_url, card_frame.dye_mask_url FROM user_card LEFT JOIN card_frame ON user_card.frame=card_frame.id WHERE user_card.id=?;`,
      [id]
    )) as UserCard[];
    if (!query[0]) throw new ZephyrError.UnknownUserCardIdError();
    return new GameUserCard(query[0]);
  }
  public static async getLastCard(discordId: string): Promise<GameUserCard> {
    const query = (await DB.query(
      `SELECT user_card.*, card_frame.id AS frame_id, card_frame.frame_name, card_frame.frame_url, card_frame.dye_mask_url FROM user_card LEFT JOIN card_frame ON user_card.frame=card_frame.id WHERE discord_id=? ORDER BY id DESC;`,
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

  public static async getCardsByTagId(id: number): Promise<GameUserCard[]> {
    const query = (await DB.query(
      `SELECT user_card.*, card_frame.id AS frame_id, card_frame.frame_name, card_frame.frame_url, card_frame.dye_mask_url FROM user_card LEFT JOIN card_frame ON user_card.frame=card_frame.id WHERE user_card.tag_id=?;`,
      [id]
    )) as UserCard[];
    return query.map((c) => new GameUserCard(c));
  }

  public static async getTimesCardDestroyed(
    id: number,
    zephyrId: string
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM user_card WHERE card_id=? AND discord_id=?;`,
      [id, zephyrId]
    )) as { count: number }[];
    return query[0].count;
  }

  public static async getTimesCardWishlisted(
    baseCard: GameBaseCard
  ): Promise<number> {
    let count: number;
    if (baseCard.group) {
      const query = (await DB.query(
        `SELECT COUNT(*) AS count FROM wishlist WHERE group_name=? AND name=?;`,
        [baseCard.group, baseCard.name]
      )) as { count: number }[];
      count = query[0].count;
    } else {
      const query = (await DB.query(
        `SELECT COUNT(*) AS count FROM wishlist WHERE name=?;`,
        [baseCard.name]
      )) as { count: number }[];
      count = query[0].count;
    }
    return count;
  }

  public static async getAverageClaimTime(cardId: number): Promise<number> {
    const query = (await DB.query(
      `SELECT AVG(claim_time) AS average FROM user_card WHERE claim_time>0 AND card_id=?;`,
      [cardId]
    )) as { average: number }[];
    return query[0].average;
  }

  public static async getCardWearSpread(
    cardId: number,
    zephyrId: string
  ): Promise<WearSpread> {
    const query = (await DB.query(
      `SELECT wear, COUNT(*) AS count FROM user_card WHERE card_id=? AND discord_id!=? GROUP BY wear;`,
      [cardId, zephyrId]
    )) as { wear: number; count: number }[];

    return {
      0: query.filter((w) => w.wear === 0)[0]?.count || 0,
      1: query.filter((w) => w.wear === 1)[0]?.count || 0,
      2: query.filter((w) => w.wear === 2)[0]?.count || 0,
      3: query.filter((w) => w.wear === 3)[0]?.count || 0,
      4: query.filter((w) => w.wear === 4)[0]?.count || 0,
      5: query.filter((w) => w.wear === 5)[0]?.count || 0,
    };
  }
}
