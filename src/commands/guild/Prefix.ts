import { Message } from "eris";
import { GuildService } from "../../lib/database/services/guild/GuildService";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { Zephyr } from "../../structures/client/Zephyr";

export default class Prefix extends BaseCommand {
  id = `echo`;
  names = ["prefix"];
  description =
    `Changes the prefix of the bot.` +
    `\nRequires the **Manage Channels** permission.`;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const prefix = options[0]?.toLowerCase();
    if (prefix?.length > 8) throw new ZephyrError.PrefixTooLongError();

    const guild = Zephyr.guilds.get(msg.guildID!);
    const author = guild?.members.get(msg.author.id)!;
    if (!prefix) {
      const currentPrefix = Zephyr.getPrefix(guild!.id);
      await this.send(
        msg.channel,
        `The prefix ${
          guild ? `for **${guild.name}** ` : ``
        }is \`${currentPrefix}\`.`
      );
      return;
    }
    if (!author?.permission.json["manageChannels"]) return;

    await GuildService.setPrefix(guild!.id!, prefix);
    Zephyr.setPrefix(guild!.id!, prefix);
    await this.send(msg.channel, `Set the prefix to \`${prefix}\`.`);
    return;
  }
}
