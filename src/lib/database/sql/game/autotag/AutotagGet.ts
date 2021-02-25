import { DB, DBClass } from "../../..";
import { Autotag, GameAutotag } from "../../../../../structures/game/Autotag";
import { GameProfile } from "../../../../../structures/game/Profile";

export abstract class AutotagGet extends DBClass {
  public static async getAutotags(
    profile: GameProfile
  ): Promise<GameAutotag[]> {
    const query = (await DB.query(`SELECT * FROM autotag WHERE discord_id=?;`, [
      profile.discordId,
    ])) as Autotag[];

    return query.map((q) => new GameAutotag(q));
  }
}
