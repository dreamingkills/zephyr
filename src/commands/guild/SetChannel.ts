import { Message } from "eris";
import { GuildService } from "../../lib/database/services/guild/GuildService";
import { BaseCommand } from "../../structures/command/Command";

export default class SetChannel extends BaseCommand {
  names = ["setchannel", "sch"];
  description =
    `Sets the dedicated Zephyr channel, for drops and other things.` +
    `\nRequires the **Manage Channels** permission.`;

  async exec(msg: Message): Promise<void> {
    const channelId = this.options[0];
    const guild = this.zephyr.guilds.get(msg.guildID!);
    const author = guild?.members.get(msg.author.id)!;
    if (!channelId) {
      const currentPrefix = await GuildService.getDropChannel(msg.guildID!);
      await msg.channel.createMessage(
        `The current Zephyr channel is <#${currentPrefix}>.`
      );
      return;
    }
    if (!author?.permission.json["manageChannels"]) return;

    let channelClean = msg.channel.id;
    await GuildService.setDropChannel(msg.guildID!, channelClean);
    await msg.channel.createMessage(
      `Set the Zephyr channel to <#${channelClean}>`
    );
    return;
  }
}
