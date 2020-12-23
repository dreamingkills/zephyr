import { DB, DBClass } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { GamePatron, Patron } from "../../../../../structures/meta/Patron";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";

export abstract class PatronGet extends DBClass {
  public static async getPatronInformation(
    profile: GameProfile
  ): Promise<GamePatron> {
    const query = (await DB.query(`SELECT * FROM patron WHERE discord_id=?;`, [
      profile.discordId,
    ])) as Patron[];
    if (!query[0]) throw new ZephyrError.NotAPatronError();

    return new GamePatron(query[0]);
  }
}
