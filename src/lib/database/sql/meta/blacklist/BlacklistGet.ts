import { DB } from "../../..";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import {
  Blacklist,
  GameBlacklist,
} from "../../../../../structures/game/blacklist/Blacklist";
import { GameProfile } from "../../../../../structures/game/Profile";

export async function getBlacklistById(id: number): Promise<GameBlacklist> {
  const query = (await DB.query(`SELECT * FROM blacklist WHERE id=?;`, [
    id,
  ])) as Blacklist[];

  if (!query[0]) throw new ZephyrError.BlacklistDoesNotExistError();

  return new GameBlacklist(query[0]);
}

export async function findBlacklist(
  profile: GameProfile
): Promise<GameBlacklist | undefined> {
  const query = (await DB.query(
    `SELECT * FROM blacklist WHERE active=1 AND discord_id=?;`,
    [profile.discordId]
  )) as Blacklist[];

  if (query[0]) {
    return new GameBlacklist(query[0]);
  } else return;
}

export async function getProfileBlacklists(
  profile: GameProfile
): Promise<GameBlacklist[]> {
  const query = (await DB.query(`SELECT * FROM blacklist WHERE discord_id=?;`, [
    profile.discordId,
  ])) as Blacklist[];

  return query.map((b) => new GameBlacklist(b));
}

export * as BlacklistGet from "./BlacklistGet";
