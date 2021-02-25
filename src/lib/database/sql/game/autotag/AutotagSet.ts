import { DB, DBClass } from "../../..";
import { GameAutotag } from "../../../../../structures/game/Autotag";
import { GameProfile } from "../../../../../structures/game/Profile";
import { AutotagService } from "../../../services/game/AutotagService";

export abstract class AutotagSet extends DBClass {
  public static async createAutotag(
    profile: GameProfile,
    key: AutotagKey,
    value: number,
    priority: number
  ): Promise<GameAutotag> {
    const query = (await DB.query(
      `INSERT INTO autotag (discord_id, autotag_key, autotag_value, priority) VALUES (?, ?, ?, ?);`,
      [profile.discordId, key, value, priority]
    )) as { insertId: number };

    return await AutotagService.getAutotagById(query.insertId);
  }

  public static async deleteAutotag(autotag: GameAutotag): Promise<void> {
    await DB.query(`DELETE FROM autotag WHERE id=?;`, [autotag.id]);

    return;
  }

  public static async setAutotagKey(
    autotag: GameAutotag,
    key: AutotagKey
  ): Promise<GameAutotag> {
    await DB.query(`UPDATE autotag SET autotag_key=? WHERE id=?;`, [
      key,
      autotag.id,
    ]);

    return await autotag.fetch();
  }

  public static async setAutotagValue(
    autotag: GameAutotag,
    value: number
  ): Promise<GameAutotag> {
    await DB.query(`UPDATE autotag SET autotag_value=? WHERE id=?;`, [
      value,
      autotag.id,
    ]);

    return await autotag.fetch();
  }

  public static async setAutotagPriority(
    autotag: GameAutotag,
    priority: number
  ): Promise<GameAutotag> {
    await DB.query(`UPDATE autotag SET priority=? WHERE id=?;`, [
      priority,
      autotag.id,
    ]);

    return await autotag.fetch();
  }
}
