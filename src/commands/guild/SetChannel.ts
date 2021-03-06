import { Message } from "eris";
import { GuildService } from "../../lib/database/services/guild/GuildService";
import { Zephyr } from "../../structures/client/Zephyr";
import { BaseCommand } from "../../structures/command/Command";

export default class SetChannel extends BaseCommand {
  id = `ashley`;
  names = ["setchannel", "sch"];
  description =
    `Sets the dedicated Zephyr channel, for drops and other things.` +
    `\nRequires the **Manage Channels** permission.`;

  async exec(msg: Message): Promise<void> {
    const guild = Zephyr.guilds.get(msg.guildID!);
    const author = guild?.members.get(msg.author.id)!;

    if (!author?.permission.json["manageChannels"]) return;

    let channelClean = msg.channel.id;
    await GuildService.setDropChannel(msg.guildID!, channelClean);

    await this.send(
      msg.channel,
      `Set the Zephyr channel to <#${channelClean}>`
    );
    return;
  }
}
