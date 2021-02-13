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
import {
  CardSticker,
  GameCardSticker,
  GameSticker,
  Sticker,
} from "../../../../../structures/game/Sticker";
import { ProfileService } from "../../../services/game/ProfileService";

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
                                    card_base.id,
                                    card_base.idol_id, 
                                    card_base.subgroup_id,
                                    card_base.activated,
                                    base_group.group_name,
                                    idol.idol_name,
                                    idol.birthday,
                                    subgroup.group_id,
                                    subgroup.subgroup_name,
                                    subgroup.archived,
                                    rarity,
                                    image_url,
                                    serial_total,
                                    serial_limit,
                                    num_generated,
                                    emoji
                                   FROM card_base LEFT JOIN idol ON idol.id=card_base.idol_id LEFT JOIN subgroup ON subgroup.id=card_base.subgroup_id LEFT JOIN base_group ON base_group.id=subgroup.group_id WHERE idol_id > 0;`)) as BaseCard[];

    return query.map((c) => new GameBaseCard(c));
  }

  public static async getCardById(id: number): Promise<GameBaseCard> {
    const query = (await DB.query(
      `SELECT
      card_base.id,
      card_base.idol_id, 
      card_base.subgroup_id,
      card_base.activated,
      base_group.group_name,
      idol.idol_name,
      idol.birthday,
      subgroup.group_id,
      subgroup.subgroup_name,
      subgroup.archived,
      rarity,
      image_url,
      serial_total,
      serial_limit,
      num_generated,
      emoji
   FROM card_base LEFT JOIN idol ON idol.id=card_base.idol_id LEFT JOIN subgroup ON subgroup.id=card_base.subgroup_id LEFT JOIN base_group ON base_group.id=subgroup.group_id WHERE card_base.id=? AND idol_id > 0;`,
      [id]
    )) as BaseCard[];

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
    let query = `SELECT user_card.* FROM user_card USE INDEX (CardOwner)
                  LEFT JOIN card_base ON user_card.card_id=card_base.id LEFT JOIN idol ON idol.id=card_base.idol_id LEFT JOIN subgroup ON subgroup.id=card_base.subgroup_id LEFT JOIN base_group ON base_group.id=subgroup.group_id WHERE discord_id=${DB.connection.escape(
                    profile.discordId
                  )}`;
    const queryOptions = FilterService.parseOptions(options, tags);
    const page = <number>options["page"];
    query +=
      (queryOptions.length > 0 ? ` AND` : ``) + queryOptions.join(` AND`);

    let order =
      <string>options["order"] ||
      <string>options["sort"] ||
      <string>options["o"];
    const reverse = order?.startsWith("!");
    if (reverse) order = order.slice(1);

    if (["issue", "i", "serial"].includes(order)) {
      query += ` ORDER BY serial_number ${reverse ? `DESC` : `ASC`}`;
    } else if (["wear", "w"].includes(order)) {
      query += ` ORDER BY wear ${reverse ? `ASC` : `DESC`}`;
    } else if (["luck", "lc"].includes(order)) {
      query += ` ORDER BY luck_coeff ${reverse ? `ASC` : `DESC`}`;
    } else if (["group", "g"].includes(order)) {
      query += ` ORDER BY base_group.group_name ${reverse ? `DESC` : `ASC`}`;
    } else if (["name", "n"].includes(order)) {
      query += ` ORDER BY idol.idol_name ${reverse ? `DESC` : `ASC`}`;
    } else if (["subgroup", "sg"].includes(order)) {
      query += ` ORDER BY subgroup.subgroup_name ${reverse ? `DESC` : `ASC`}`;
    } else if (["claim", "c"].includes(order)) {
      query += ` ORDER BY user_card.id ${reverse ? `DESC` : `ASC`}`;
    } else
      query += ` ORDER BY user_card.updated_at ${reverse ? `ASC` : `DESC`}`;

    query += `, user_card.id DESC LIMIT 10 OFFSET ${DB.connection.escape(
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
    let query = `SELECT COUNT(*) AS count FROM user_card USE INDEX (CardOwner) LEFT JOIN card_base ON user_card.card_id=card_base.id LEFT JOIN idol ON idol.id=card_base.idol_id LEFT JOIN subgroup ON subgroup.id=card_base.subgroup_id LEFT JOIN base_group ON base_group.id=subgroup.group_id WHERE discord_id=${DB.connection.escape(
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
      `SELECT user_card.*, card_frame.id AS frame_id, card_frame.frame_name, card_frame.frame_url, card_frame.dye_mask_url FROM user_card USE INDEX (PRIMARY) LEFT JOIN card_frame ON user_card.frame=card_frame.id WHERE user_card.id=?;`,
      [id]
    )) as UserCard[];
    if (!query[0]) throw new ZephyrError.UnknownUserCardError(id.toString(36));
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
      `SELECT COUNT(*) as count FROM (SELECT COUNT(*) as count FROM wishlist GROUP BY idol_id HAVING COUNT(*) ORDER BY count DESC) g;`
    )) as { count: number }[];
    return query[0].count;
  }

  public static async getTopWishlisted(
    page: number
  ): Promise<{ idol_id: number; count: number }[]> {
    const query = (await DB.query(
      `SELECT COUNT(*) as count, idol_id FROM wishlist GROUP BY idol_id ORDER BY count DESC LIMIT 10 OFFSET ?;`,
      [page * 10 - 10]
    )) as { count: number; idol_id: number }[];
    return query.map((q) => {
      return { idol_id: q.idol_id, count: q.count };
    });
  }

  public static async getCardsByTagId(
    id: number,
    profile: GameProfile
  ): Promise<GameUserCard[]> {
    const query = (await DB.query(
      `SELECT user_card.*, card_frame.id AS frame_id, card_frame.frame_name, card_frame.frame_url, card_frame.dye_mask_url FROM user_card LEFT JOIN card_frame ON user_card.frame=card_frame.id WHERE user_card.tag_id=? AND user_card.discord_id=?;`,
      [id, profile.discordId]
    )) as UserCard[];
    return query.map((c) => new GameUserCard(c));
  }

  public static async getUntaggedCards(
    discordId: string
  ): Promise<GameUserCard[]> {
    const query = (await DB.query(
      `SELECT user_card.*, card_frame.id AS frame_id, card_frame.frame_name, card_frame.frame_url, card_frame.dye_mask_url FROM user_card LEFT JOIN card_frame ON user_card.frame=card_frame.id WHERE user_card.tag_id IS NULL AND discord_id=?;`,
      [discordId]
    )) as UserCard[];
    return query.map((c) => new GameUserCard(c));
  }

  public static async getTimesCardDestroyed(
    id: number,
    zephyrId: string
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM user_card USE INDEX(PRIMARY) WHERE card_id=? AND discord_id=?;`,
      [id, zephyrId]
    )) as { count: number }[];
    return query[0].count;
  }

  public static async getTimesCardWishlisted(
    baseCard: GameBaseCard
  ): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM wishlist WHERE idol_id=?;`,
      [baseCard.idolId]
    )) as { count: number }[];

    return query[0].count;
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

  /*
      Stickers
  */
  public static async getAllStickers(): Promise<GameSticker[]> {
    const query = (await DB.query(`SELECT * FROM sticker;`)) as Sticker[];
    return query.map((s) => new GameSticker(s));
  }

  public static async getCardStickers(
    card: GameUserCard
  ): Promise<GameCardSticker[]> {
    const query = (await DB.query(
      `SELECT * FROM card_sticker WHERE card_id=?;`,
      [card.id]
    )) as CardSticker[];
    return query.map((s) => new GameCardSticker(s));
  }

  public static async getLastCard(profile: GameProfile): Promise<GameUserCard> {
    const tags = await ProfileService.getTags(profile);
    const inventory = await this.getUserInventory(profile, { page: 1 }, tags);

    if (!inventory[0]) throw new ZephyrError.InvalidCardReferenceError();
    return inventory[0];
  }
}
