import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../structures/client/RichEmbed";

export default class ToggleBlacklist extends BaseCommand {
  names = ["tbl"];
  description = `Toggles someone's blacklisted status.`;
  developerOnly = true;

  async exec(msg: Message): Promise<void> {
    const targetUser = msg.mentions[0];
    if (!targetUser) throw new ZephyrError.InvalidMentionError();

    const target = await ProfileService.getProfile(targetUser.id);
    const newProfile = await ProfileService.toggleBlacklisted(target);

    const embed = new MessageEmbed().setAuthor(
      `Toggle Blacklist | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );
    if (newProfile.blacklisted) {
      embed.setDescription(`Blacklisted **${targetUser.tag}**.`);
    } else
      embed.setDescription(`Removed **${targetUser.tag}** from the blacklist.`);

    await this.send(msg.channel, embed);
    return;
  }
}
