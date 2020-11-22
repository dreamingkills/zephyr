import { DB, DBClass } from "../..";

export abstract class GuildSet extends DBClass {
  public static async setPrefix(
    guildId: string,
    prefix: string
  ): Promise<void> {
    await DB.query(
      `INSERT INTO guild (guild_id, prefix) VALUES (?, ?) ON DUPLICATE KEY UPDATE prefix=?;`,
      [guildId, prefix, prefix, guildId]
    );
    return;
  }
}
