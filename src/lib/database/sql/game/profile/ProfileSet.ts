import { DB, DBClass } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { ProfileService } from "../../../services/game/ProfileService";

export abstract class ProfileSet extends DBClass {
  /*
      Profile
  */
  public static async createNewProfile(
    discordId: string
  ): Promise<GameProfile> {
    await DB.query(`INSERT INTO profile (discord_id) VALUES (?);`, [discordId]);
    return await ProfileService.getProfile(discordId);
  }
  public static async togglePrivateProfile(discordId: string): Promise<void> {
    await DB.query(`UPDATE profile SET private=1-private WHERE discord_id=?;`, [
      discordId,
    ]);
    return;
  }
  public static async setBlurb(
    discordId: string,
    blurb: string
  ): Promise<void> {
    await DB.query(`UPDATE profile SET blurb=? WHERE discord_id=?;`, [
      blurb,
      discordId,
    ]);
    return;
  }
  public static async addToWishlist(
    discordId: string,
    text: string
  ): Promise<void> {
    await DB.query(`INSERT INTO wishlist (discord_id, item) VALUES (?, ?);`, [
      discordId,
      text,
    ]);
    return;
  }
  public static async removeFromWishlist(
    discordId: string,
    num: number
  ): Promise<void> {
    await DB.query(
      `DELETE FROM wishlist WHERE id IN (SELECT id FROM (SELECT id FROM wishlist ORDER BY id ASC LIMIT 1 OFFSET ${
        num - 1
      }) x) AND discord_id=?;`,
      [discordId]
    );
    return;
  }
  public static async clearWishlist(discordId: string): Promise<void> {
    await DB.query(`DELETE FROM wishlist WHERE discord_id=?;`, [discordId]);
    return;
  }

  /*
      Currency
  */
  public static async addBits(
    discordId: string,
    amount: number
  ): Promise<void> {
    await DB.query(`UPDATE profile SET bits=bits+? WHERE discord_id=?;`, [
      amount,
      discordId,
    ]);
    return;
  }
  public static async removeBits(
    discordId: string,
    amount: number
  ): Promise<void> {
    await DB.query(`UPDATE profile SET bits=bits-? WHERE discord_id=?;`, [
      amount,
      discordId,
    ]);
    return;
  }
  public static async addBitsToBank(
    discordId: string,
    amount: number
  ): Promise<void> {
    await DB.query(
      `UPDATE profile SET bits_bank=bits_bank+? WHERE discord_id=?;`,
      [amount, discordId]
    );
    return;
  }
  public static async withdrawBitsFromBank(
    discordId: string,
    amount: number
  ): Promise<void> {
    await DB.query(
      `UPDATE profile SET bits_bank=bits_bank-? WHERE discord_id=?;`,
      [amount, discordId]
    );
    return;
  }

  /*
      Daily
  */
  public static async setDailyTimestamp(
    discordId: string,
    timestamp: string
  ): Promise<void> {
    await DB.query(`UPDATE profile SET daily_last=? WHERE discord_id=?;`, [
      timestamp,
      discordId,
    ]);
    return;
  }
}
