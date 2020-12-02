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

  public static async getDropChannel(guildId: string): Promise<string | null> {
    return await GuildGet.getDropChannel(guildId);
  }
  public static async setDropChannel(
    guildId: string,
    dropChannel: string
  ): Promise<void> {
    return await GuildSet.setDropChannel(guildId, dropChannel);
  }
}
