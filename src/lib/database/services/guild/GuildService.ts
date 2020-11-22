import { GuildGet } from "../../sql/guild/GuildGet";
import { GuildSet } from "../../sql/guild/GuildSet";

export abstract class GuildService {
  public static async getPrefixes(): Promise<{ [guildId: string]: string }> {
    return await GuildGet.getPrefixes();
  }
  public static async setPrefix(
    guildId: string,
    prefix: string
  ): Promise<void> {
    return await GuildSet.setPrefix(guildId, prefix);
  }
}
