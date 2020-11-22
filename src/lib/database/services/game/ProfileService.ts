import { GameProfile } from "../../../../structures/game/Profile";
import { ProfileFetch } from "../../sql/game/profile/ProfileFetch";
import { ProfileSet } from "../../sql/game/profile/ProfileSet";

export abstract class ProfileService {
  public static async getProfile(
    discordId: string | number,
    autoGenerate?: boolean
  ): Promise<GameProfile> {
    return await ProfileFetch.getProfileByDiscordId(
      discordId as string,
      autoGenerate
    );
  }
  public static async createProfile(
    discordId: string | number
  ): Promise<GameProfile> {
    return await ProfileSet.createNewProfile(discordId as string);
  }
}
