import { DB, DBClass } from "../../..";
import { Profile, GameProfile } from "../../../../../structures/game/Profile";
import { ProfileService } from "../../../services/game/ProfileService";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";

export abstract class ProfileFetch extends DBClass {
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
}
