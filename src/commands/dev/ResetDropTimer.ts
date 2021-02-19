import { Message } from "eris";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import * as ZephyrError from "../../structures/error/ZephyrError";

export default class ResetDropTimer extends BaseCommand {
  names = ["rdt"];
  description = `Resets someone's drop timer.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    if (!msg.mentions[0]) throw new ZephyrError.InvalidMentionError();

    const target = await ProfileService.getProfile(msg.mentions[0].id);
    await ProfileService.setDropTimestamp(target, "1970-01-01 00:00:00");

    const embed = new MessageEmbed(
      `Reset Drop Timer`,
      msg.author
    ).setDescription(`Reset **${msg.mentions[0].tag}**'s drop timer.`);

    await this.send(msg.channel, embed);
    return;
  }
}
