import { Message } from "eris";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";

export default class ResetDropTimer extends BaseCommand {
  names = ["rdt"];
  description = `Resets someone's drop timer.`;
  developerOnly = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (!msg.mentions[0]) throw new ZephyrError.InvalidMentionError();

    await ProfileService.setDropTimestamp(profile, "1970-01-01 00:00:00");

    const embed = new MessageEmbed()
      .setAuthor(`Reset Drop Timer | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(`Reset **${msg.mentions[0].tag}**'s drop timer.`);

    await msg.channel.createMessage({ embed });
  }
}
