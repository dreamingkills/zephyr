import { Message } from "eris";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { ProfileService } from "../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../structures/client/RichEmbed";

export default class SetCreationDate extends BaseCommand {
  names = ["scd"];
  description = `Sets a user's account creation date.`;
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const targetUser = msg.mentions[0];

    if (!targetUser) throw new ZephyrError.InvalidMentionError();

    const targetProfile = await ProfileService.getProfile(targetUser.id);

    const date = options[1];

    await ProfileService.setProfileCreationDate(targetProfile, date);

    const embed = new MessageEmbed(
      `Set Creation Date`,
      msg.author
    ).setDescription(
      `**${targetUser.tag}**'s account creation date has been set to **${date}**.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
