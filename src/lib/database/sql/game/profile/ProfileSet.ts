import { DB, DBClass } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { ProfileService } from "../../../services/game/ProfileService";

export abstract class ProfileSet extends DBClass {
  public static async createNewProfile(
    discordId: string
  ): Promise<GameProfile> {
    await DB.query(`INSERT INTO profile (discord_id) VALUES (?);`, [discordId]);
    return await ProfileService.getProfile(discordId);
  }
  public static async togglePrivateProfile(
    discordId: string
  ): Promise<GameProfile> {
    await DB.query(`UPDATE profile SET private=1-private WHERE discord_id=?;`, [
      discordId,
    ]);
    return await ProfileService.getProfile(discordId);
  }

  /*
      Currency
  */
  public static async addBits(
    discordId: string,
    amount: number
  ): Promise<GameProfile> {
    await DB.query(`UPDATE profile SET bits=bits+? WHERE discord_id=?;`, [
      amount,
      discordId,
    ]);
    return await ProfileService.getProfile(discordId);
  }
  public static async removeBits(
    discordId: string,
    amount: number
  ): Promise<GameProfile> {
    await DB.query(`UPDATE profile SET bits=bits-? WHERE discord_id=?;`, [
      amount,
      discordId,
    ]);
    return await ProfileService.getProfile(discordId);
  }
}
