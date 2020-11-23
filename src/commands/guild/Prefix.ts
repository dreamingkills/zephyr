import { Message } from "eris";
import { GuildService } from "../../lib/database/services/guild/GuildService";
import { BaseCommand } from "../../structures/command/Command";

export default class Prefix extends BaseCommand {
  names = ["prefix"];
  description =
    `Changes the prefix of the bot.` +
    `\nRequires the **Manage Channels** permission.`;

  async exec(msg: Message): Promise<void> {
    const prefix = this.options[0];
    const guild = this.zephyr.guilds.get(msg.guildID!);
    const author = guild?.members.get(msg.author.id)!;
    if (!prefix) {
      const currentPrefix = this.zephyr.getPrefix(guild!.id);
      await msg.channel.createMessage(`The current prefix is ${currentPrefix}`);
      return;
    }
    if (!author?.permission.json["manageChannels"]) return;

    await GuildService.setPrefix(guild!.id!, prefix);
    this.zephyr.setPrefix(guild!.id!, prefix);
    await msg.channel.createMessage(`Set the prefix to ${prefix}`);
    return;
  }
}
