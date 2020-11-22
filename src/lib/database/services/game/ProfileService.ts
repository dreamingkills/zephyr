import { GameProfile } from "../../../../structures/game/Profile";
import { ProfileFetch } from "../../sql/game/profile/ProfileFetch";
import { ProfileSet } from "../../sql/game/profile/ProfileSet";

export abstract class ProfileService {
  public static async getProfile(
    discordId: string | number | GameProfile,
    autoGenerate?: boolean
  ): Promise<GameProfile> {
    if (typeof discordId === "string" || typeof discordId === "number") {
      return await ProfileFetch.getProfileByDiscordId(
        discordId as string,
        autoGenerate
      );
    }
    return await ProfileFetch.getProfileByDiscordId(
      (<GameProfile>discordId).discordId
    );
  }
  public static async createProfile(
    discordId: string | number
  ): Promise<GameProfile> {
    return await ProfileSet.createNewProfile(discordId as string);
  }
}
