import { DB, DBClass } from "../..";

export abstract class GuildSet extends DBClass {
  public static async setPrefix(
    guildId: string,
    prefix: string
  ): Promise<void> {
    await DB.query(
      `INSERT INTO guild (guild_id, prefix) VALUES (?, ?) ON DUPLICATE KEY UPDATE prefix=?;`,
      [guildId, prefix, prefix]
    );
    return;
  }
  public static async setDropChannel(
    guildId: string,
    dropChannel: string
  ): Promise<void> {
    await DB.query(
      `INSERT INTO guild (guild_id, drop_channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE drop_channel_id=?;`,
      [guildId, dropChannel, dropChannel]
    );
    return;
  }
}
