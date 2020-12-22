import { Message } from "eris";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";

export default class ResetClaimTimer extends BaseCommand {
  names = ["rct"];
  description = `Resets someone's claim timer.`;
  developerOnly = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    if (!msg.mentions[0]) throw new ZephyrError.InvalidMentionError();

    const target = await ProfileService.getProfile(msg.mentions[0].id);
    await ProfileService.setClaimTimestamp(target, "1970-01-01 00:00:00");

    const embed = new MessageEmbed()
      .setAuthor(`Reset Claim Timer | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(`Reset **${msg.mentions[0].tag}**'s claim timer.`);

    await msg.channel.createMessage({ embed });
  }
}
