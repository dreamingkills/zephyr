import { DB, DBClass } from "../../..";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import {
  Blacklist,
  GameBlacklist,
} from "../../../../../structures/game/blacklist/Blacklist";
import { GameProfile } from "../../../../../structures/game/Profile";

export abstract class BlacklistGet extends DBClass {
  public static async getBlacklistById(id: number): Promise<GameBlacklist> {
    const query = (await DB.query(`SELECT * FROM blacklist WHERE id=?;`, [
      id,
    ])) as Blacklist[];

    if (!query[0]) throw new ZephyrError.BlacklistDoesNotExistError();

    return new GameBlacklist(query[0]);
  }

  public static async findBlacklist(
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

  public static async getProfileBlacklists(
    profile: GameProfile
  ): Promise<GameBlacklist[]> {
    const query = (await DB.query(
      `SELECT * FROM blacklist WHERE discord_id=?;`,
      [profile.discordId]
    )) as Blacklist[];

    return query.map((b) => new GameBlacklist(b));
  }
}
