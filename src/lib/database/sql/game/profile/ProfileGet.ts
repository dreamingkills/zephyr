import { DB } from "../../..";
import { Profile, GameProfile } from "../../../../../structures/game/Profile";
import { ProfileService } from "../../../services/game/ProfileService";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { GameItem, Item } from "../../../../../structures/game/Item";
import { GameTag, Tag } from "../../../../../structures/game/Tag";
import {
  GameWishlist,
  Wishlist,
} from "../../../../../structures/game/Wishlist";
import { Dye, GameDye } from "../../../../../structures/game/Dye";

export async function getProfileByDiscordId(
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

export async function getWishlist(discordId: string): Promise<GameWishlist[]> {
  const query = (await DB.query(`SELECT * FROM wishlist WHERE discord_id=?;`, [
    discordId,
  ])) as Wishlist[];
  return query.map((i) => new GameWishlist(i));
}

export async function getItems(
  discordId: string,
  page: number
): Promise<GameItem[]> {
  const query = (await DB.query(
    `SELECT * FROM user_item WHERE discord_id=? AND quantity>0 GROUP BY item_id ORDER BY item_id ASC LIMIT 10 OFFSET ?;`,
    [discordId, page * 10 - 10]
  )) as Item[];
  return query.map((i) => new GameItem(i));
}

export async function getItem(
  discordId: string,
  itemId: number,
  name: string
): Promise<GameItem> {
  const query = (await DB.query(
    `SELECT * FROM user_item WHERE discord_id=? AND item_id=? AND quantity>0 GROUP BY item_id;`,
    [discordId, itemId]
  )) as Item[];

  if (!query[0]) throw new ZephyrError.NoItemInInventoryError(name);
  return new GameItem(query[0]);
}

export async function getNumberOfItems(discordId: string): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(DISTINCT item_id) AS count FROM user_item WHERE discord_id=? AND quantity>0;`,
    [discordId]
  )) as { count: number }[];

  return query[0].count;
}

/*
      Tags
  */
export async function getUserTags(discordId: string): Promise<GameTag[]> {
  const query = (await DB.query(`SELECT * FROM card_tag WHERE discord_id=?;`, [
    discordId,
  ])) as Tag[];
  return query.map((t) => new GameTag(t));
}

export async function getTagById(tagId: number): Promise<GameTag> {
  const query = (await DB.query(`SELECT * FROM card_tag WHERE id=?;`, [
    tagId,
  ])) as Tag[];

  return new GameTag(query[0]);
}

/*
      DM Scheduler
  */
export async function getAvailableReminderRecipients(): Promise<GameProfile[]> {
  const query = (await DB.query(
    `SELECT * FROM profile 
        WHERE (
          (drop_reminder=1 AND drop_reminded=0 AND drop_next < NOW())
        OR 
          (claim_reminder=1 AND claim_reminded=0 AND claim_next < NOW())
        OR
          (vote_reminder=1 AND vote_reminded=0 AND vote_last + INTERVAL 12 HOUR < NOW())
        )
        AND blacklisted=0;`
  )) as Profile[];
  return query.map((p) => new GameProfile(p));
}

/*
      Dyes
  */
export async function getUserDyes(
  discordId: string,
  page: number
): Promise<GameDye[]> {
  const query = (await DB.query(
    `SELECT * FROM dye WHERE discord_id=? LIMIT 10 OFFSET ?;`,
    [discordId, page * 10 - 10]
  )) as Dye[];
  return query.map((d) => new GameDye(d));
}

export async function getUserDyeCount(discordId: string): Promise<number> {
  const query = (await DB.query(
    `SELECT COUNT(*) AS count FROM dye WHERE discord_id=?;`,
    [discordId]
  )) as { count: number }[];
  return query[0].count;
}

export async function getDyeById(id: number): Promise<GameDye> {
  const query = (await DB.query(`SELECT * FROM dye WHERE id=?;`, [
    id,
  ])) as Dye[];

  if (!query[0]) throw new ZephyrError.DyeDoesNotExistError(id);

  return new GameDye(query[0]);
}

export * as ProfileGet from "./ProfileGet";
