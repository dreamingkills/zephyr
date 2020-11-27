import { DB, DBClass } from "../../..";
import { Profile, GameProfile } from "../../../../../structures/game/Profile";
import { ProfileService } from "../../../services/game/ProfileService";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";

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
}
