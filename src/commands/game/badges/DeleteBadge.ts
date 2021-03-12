import { Message } from "eris";
import { BadgeService } from "../../../lib/database/services/game/BadgeService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { GameProfile } from "../../../structures/game/Profile";

export default class DeleteBadge extends BaseCommand {
  names = ["deletebadge"];
  description = `Deletes a badge.`;
  usage = [`$CMD$ <badge name>`];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidBadgeNameError();

    const badgeName = options.join(` `);

    const targetBadge = await BadgeService.getBadgeByName(badgeName);
    if (!targetBadge) throw new ZephyrError.BadgeNameNotFoundError(badgeName);

    await BadgeService.deleteBadge(targetBadge);

    const embed = new MessageEmbed(`Delete Badge`, msg.author).setDescription(
      `:white_check_mark: ${targetBadge.badgeEmoji} **${targetBadge.badgeName}** was deleted.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
