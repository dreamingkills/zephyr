import { DB, DBClass } from "../..";

export abstract class GuildGet extends DBClass {
  public static async getPrefixes(): Promise<{
    [guildId: string]: string;
  }> {
    const query = (await DB.query(`SELECT * FROM guild;`)) as {
      guild_id: string;
      prefix: string;
    }[];
    const prefixes: { [guildId: string]: string } = {};
    for (let setting of query) {
      prefixes[setting.guild_id] = setting.prefix;
    }
    return prefixes;
  }
}
