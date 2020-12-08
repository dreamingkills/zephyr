import { DB, DBClass } from "../../..";
import { Profile, GameProfile } from "../../../../../structures/game/Profile";
import { ProfileService } from "../../../services/game/ProfileService";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { GameItem, Item } from "../../../../../structures/game/Item";
import { GameTag, Tag } from "../../../../../structures/game/Tag";

export abstract class ProfileGet extends DBClass {
  public static async getProfileByDiscordId(
    discordId: string,
    autoGenerate: boolean = false
  ): Promise<GameProfile> {
    const query = (await DB.query(`SELECT * FROM profile WHERE discord_id=?;`, [
      discordId,
    ])) as Profile[];
    if (query[0]) return new GameProfile({ ...query[0] });

    if (autoGenerate) {
      return await ProfileService.createProfile(discordId);
    } else throw new ZephyrError.NoProfileError(`<@${discordId}>`);
  }
  public static async getWishlist(discordId: string): Promise<string[]> {
    const query = (await DB.query(
      `SELECT * FROM wishlist WHERE discord_id=?;`,
      [discordId]
    )) as { id: number; discord_id: string; item: string }[];
    return query.map((i) => i.item);
  }
  public static async getNumberOfClaims(discordId: string): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(*) AS count FROM user_card WHERE original_owner=?;`,
      [discordId]
    )) as { count: number }[];
    return query[0].count;
  }

  public static async getItems(
    discordId: string,
    page: number
  ): Promise<GameItem[]> {
    const query = (await DB.query(
      `SELECT *, COUNT(*) AS count FROM user_item WHERE discord_id=? GROUP BY item_id ORDER BY item_id ASC LIMIT 10 OFFSET ?;`,
      [discordId, page * 10 - 10]
    )) as Item[];
    return query.map((i) => new GameItem(i));
  }
  public static async getItem(
    discordId: string,
    itemId: number,
    name: string
  ): Promise<GameItem> {
    const query = (await DB.query(
      `SELECT *, COUNT(*) AS count FROM user_item WHERE discord_id=? AND item_id=? GROUP BY item_id;`,
      [discordId, itemId]
    )) as Item[];
    if (!query[0]) throw new ZephyrError.NoItemInInventoryError(name);
    return new GameItem(query[0]);
  }
  public static async getNumberOfItems(discordId: string): Promise<number> {
    const query = (await DB.query(
      `SELECT COUNT(DISTINCT item_id) AS count FROM user_item WHERE discord_id=?;`,
      [discordId]
    )) as { count: number }[];
    return query[0].count;
  }

  /*
      Tags
  */
  public static async getUserTags(discordId: string): Promise<GameTag[]> {
    const query = (await DB.query(
      `SELECT * FROM card_tag WHERE discord_id=?;`,
      [discordId]
    )) as Tag[];
    return query.map((t) => new GameTag(t));
  }
  public static async getTagById(tagId: number): Promise<GameTag> {
    const query = (await DB.query(`SELECT * FROM card_tag WHERE id=?;`, [
      tagId,
    ])) as Tag[];
    if (!query[0]) throw new ZephyrError.InvalidTagError();

    return new GameTag(query[0]);
  }
}
