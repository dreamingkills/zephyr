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

  public static async togglePrivateProfile(
    profile: GameProfile
  ): Promise<GameProfile> {
    return await ProfileSet.togglePrivateProfile(profile.discordId);
  }

  /*
      Currency
  */
  public static async addBitsToProfile(
    profile: GameProfile,
    amount: number
  ): Promise<GameProfile> {
    return await ProfileSet.addBits(profile.discordId, amount);
  }
  public static async removeBitsToProfile(
    profile: GameProfile,
    amount: number
  ): Promise<GameProfile> {
    return await ProfileSet.removeBits(profile.discordId, amount);
  }
}
