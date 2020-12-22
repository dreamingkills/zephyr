import { DB, DBClass } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import { ProfileService } from "../../../services/game/ProfileService";
import * as ZephyrError from "../../../../../structures/error/ZephyrError";
import { GameDye } from "../../../../../structures/game/Dye";
import { getNearestColor, rgbToHex } from "../../../../ZephyrUtils";
import { BaseItem, GameItem } from "../../../../../structures/game/Item";

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
    name: string,
    group?: string
  ): Promise<void> {
    if (!group) {
      await DB.query(`INSERT INTO wishlist (discord_id, name) VALUES (?, ?);`, [
        discordId,
        name,
      ]);
    } else {
      await DB.query(
        `INSERT INTO wishlist (discord_id, name, group_name) VALUES (?, ?, ?);`,
        [discordId, name, group]
      );
    }
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
    if ([1, 2, 3, 4, 5].indexOf(tier) < 0)
      throw new ZephyrError.InvalidDustTypeError();
    await DB.query(
      `UPDATE profile SET dust_${tier}=dust_${tier}+? WHERE discord_id=?;`,
      [amount, discordId]
    );
    return;
  }
  public static async removeDust(
    tier: 1 | 2 | 3 | 4 | 5,
    amount: number,
    discordId: string
  ): Promise<void> {
    if ([1, 2, 3, 4, 5].indexOf(tier) < 0)
      throw new ZephyrError.InvalidDustTypeError();
    await DB.query(
      `UPDATE profile SET dust_${tier}=dust_${tier}-? WHERE discord_id=?;`,
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

  public static async incrementDailyStreak(discordId: string): Promise<void> {
    await DB.query(
      `UPDATE profile SET daily_streak=daily_streak+1 WHERE discord_id=?;`,
      [discordId]
    );
    return;
  }

  public static async resetDailyStreak(discordId: string): Promise<void> {
    await DB.query(`UPDATE profile SET daily_streak=1 WHERE discord_id=?;`, [
      discordId,
    ]);
    return;
  }
  public static async setDropTimestamp(
    discordId: string,
    timestamp: string
  ): Promise<void> {
    await DB.query(
      `UPDATE profile SET drop_next=?,drop_reminded=0 WHERE discord_id=?;`,
      [timestamp, discordId]
    );
  }
  public static async setClaimTimestamp(
    discordId: string,
    timestamp: string
  ): Promise<void> {
    await DB.query(
      `UPDATE profile SET claim_next=?,claim_reminded=0 WHERE discord_id=?;`,
      [timestamp, discordId]
    );
  }

  /*
      Items
  */
  public static async addItems(
    discordId: string,
    items: { item: BaseItem; count: number }[]
  ): Promise<void> {
    let values = [];
    for (let item of items) {
      for (let i = 0; i < item.count; i++) {
        values.push(
          `(${DB.connection.escape(discordId)}, ${DB.connection.escape(
            item.item.id
          )})`
        );
      }
    }

    await DB.query(
      `INSERT INTO user_item (discord_id, item_id) VALUES ` +
        values.join(", ") +
        `;`
    );
    return;
  }

  public static async removeItems(
    discordId: string,
    items: { item: BaseItem; count: number }[]
  ): Promise<void> {
    for (let item of items) {
      await DB.query(
        `DELETE FROM user_item WHERE discord_id=? AND item_id=? LIMIT ?;`,
        [discordId, item.item.id, item.count]
      );
    }
    return;
  }

  public static async transferItems(
    to: string,
    from: string,
    items: GameItem[]
  ): Promise<void> {
    await DB.query(
      `UPDATE user_item SET discord_id=? WHERE discord_id=? AND id IN (?);`,
      [to, from, items.map((i) => i.id)]
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
  public static async editTag(
    tagId: number,
    name?: string,
    emoji?: string
  ): Promise<void> {
    if (!name && emoji) {
      await DB.query(`UPDATE card_tag SET emoji=? WHERE id=?;`, [emoji, tagId]);
    } else if (!emoji && name) {
      await DB.query(`UPDATE card_tag SET tag_name=? WHERE id=?;`, [
        name,
        tagId,
      ]);
    } else if (emoji && name) {
      await DB.query(`UPDATE card_tag SET tag_name=?, emoji=? WHERE id=?;`, [
        name,
        emoji,
        tagId,
      ]);
    } else throw new ZephyrError.NoParametersInTagEditError();
    return;
  }

  public static async toggleDropReminders(discordId: string[]): Promise<void> {
    await DB.query(
      `UPDATE profile SET drop_reminder=1-drop_reminder WHERE discord_id IN (?);`,
      [discordId]
    );
    return;
  }

  public static async toggleClaimReminders(discordId: string[]): Promise<void> {
    await DB.query(
      `UPDATE profile SET claim_reminder=1-claim_reminder WHERE discord_id IN (?);`,
      [discordId]
    );
    return;
  }

  public static async disableReminders(discordId: string[]): Promise<void> {
    await DB.query(
      `UPDATE profile SET claim_reminder=0,drop_reminder=0 WHERE discord_id IN (?);`,
      [discordId]
    );
    return;
  }

  public static async setUserReminded(
    users: { id: string; type: 1 | 2 | 3 }[]
  ): Promise<void> {
    const onlyClaims = users.filter((u) => u.type === 2).map((o) => o.id);
    const onlyDrops = users.filter((u) => u.type === 3).map((o) => o.id);
    const onlyBoth = users.filter((u) => u.type === 1).map((o) => o.id);

    Promise.all([
      onlyClaims.length > 0
        ? DB.query(
            `UPDATE profile SET claim_reminded=1 WHERE discord_id IN (?);`,
            [onlyClaims]
          )
        : false,
      onlyDrops.length > 0
        ? DB.query(
            `UPDATE profile SET drop_reminded=1 WHERE discord_id IN (?);`,
            [onlyDrops]
          )
        : false,
      onlyBoth.length > 0
        ? DB.query(
            `UPDATE profile SET claim_reminded=1, drop_reminded=1 WHERE discord_id IN (?);`,
            [onlyBoth]
          )
        : false,
    ]);
  }

  public static async addDye(
    discordId: string,
    color: { r: number; g: number; b: number }
  ): Promise<GameDye> {
    const dyeName = getNearestColor(rgbToHex(color.r, color.g, color.b)).name;
    const query = (await DB.query(
      `INSERT INTO dye (discord_id, name, dye_r, dye_g, dye_b, charges) VALUES (?, ?, ?, ?, ?, 1);`,
      [discordId, dyeName, color.r, color.g, color.b]
    )) as { insertId: number };

    return await ProfileService.getDyeById(query.insertId);
  }

  public static async addChargesToDye(
    id: number,
    amount: number
  ): Promise<void> {
    await DB.query(`UPDATE dye SET charges=charges+? WHERE id=?;`, [
      amount,
      id,
    ]);
    return;
  }

  public static async removeChargesFromDye(
    id: number,
    amount: number
  ): Promise<void> {
    await DB.query(`UPDATE dye SET charges=charges-? WHERE id=?;`, [
      amount,
      id,
    ]);
    return;
  }
}
