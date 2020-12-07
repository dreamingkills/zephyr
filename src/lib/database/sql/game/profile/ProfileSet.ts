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
      `DELETE FROM wishlist WHERE id IN (SELECT id FROM (SELECT id FROM wishlist WHERE discord_id=? ORDER BY id ASC LIMIT 1 OFFSET ${
        num - 1
      }) x);`,
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
  public static async addDust(
    tier: 1 | 2 | 3 | 4 | 5,
    amount: number,
    discordId: string
  ): Promise<void> {
    await DB.query(
      `UPDATE profile SET dust_${tier}=dust_${tier}+? WHERE discord_id=?;`,
      [amount, discordId]
    );
    return;
  }

  /*
      Timers
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
  public static async incrementDailyTimestamp(
    discordId: string
  ): Promise<void> {
    await DB.query(
      `UPDATE profile SEt daily_streak=daily_streak+1 WHERE discord_id=?;`,
      [discordId]
    );
    return;
  }
  public static async setDropTimestamp(
    discordId: string,
    timestamp: string
  ): Promise<void> {
    await DB.query(`UPDATE profile SET drop_next=? WHERE discord_id=?;`, [
      timestamp,
      discordId,
    ]);
  }
  public static async setClaimTimestamp(
    discordId: string,
    timestamp: string
  ): Promise<void> {
    await DB.query(`UPDATE profile SET claim_next=? WHERE discord_id=?;`, [
      timestamp,
      discordId,
    ]);
  }

  /*
      Items
  */
  public static async addItem(
    discordId: string,
    itemId: number
  ): Promise<void> {
    await DB.query(
      `INSERT INTO user_item (discord_id, item_id) VALUES (?, ?);`,
      [discordId, itemId]
    );
    return;
  }
  public static async removeItem(
    discordId: string,
    itemId: number
  ): Promise<void> {
    await DB.query(
      `DELETE FROM user_item WHERE discord_id=? AND item_id=? LIMIT 1;`,
      [discordId, itemId]
    );
    return;
  }

  /*
      Tags
  */
  public static async createTag(
    discordId: string,
    name: string,
    emoji: string
  ): Promise<void> {
    await DB.query(
      `INSERT INTO card_tag (discord_id, tag_name, emoji) VALUES (?, ?, ?);`,
      [discordId, name, emoji]
    );
    return;
  }
  public static async deleteTag(tagId: number): Promise<void> {
    await DB.query(`DELETE FROM card_tag WHERE id=?;`, [tagId]);
    await DB.query(`UPDATE user_card SET tag_id=NULL WHERE tag_id=?;`, [tagId]);
    return;
  }
}
