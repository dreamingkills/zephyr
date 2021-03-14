import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BadgeService } from "../../../lib/database/services/game/BadgeService";
import dayjs from "dayjs";
import { dateTimeDisplay } from "../../../lib/utility/time/TimeUtils";

export default class ShowBadges extends BaseCommand {
  id = `drone`;
  names = [`badge`];
  description = `Shows you information about a badge.`;
  usage = [`$CMD$ <name>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (options.length < 1) throw new ZephyrError.InvalidBadgeNameError();

    const badgeName = options.join(` `);

    const targetBadge = await BadgeService.getBadgeByName(badgeName);

    if (!targetBadge) throw new ZephyrError.BadgeNameNotFoundError(badgeName);

    const grantedCount = await BadgeService.getNumberOfBadgeGranted(
      targetBadge
    );
    const authorBadges = await BadgeService.getProfileBadges(profile);

    const userHasBadge = authorBadges.find((b) => b.badgeId === targetBadge.id);

    let description = `${targetBadge.badgeEmoji} **${targetBadge.badgeName}**`;

    if (targetBadge.badgeDescription) {
      description += `\n*"${targetBadge.badgeDescription}"*`;
    }

    description += `\n\n**${grantedCount.toLocaleString()}** ${
      grantedCount === 1 ? `player has` : `players have`
    } this badge.`;

    if (userHasBadge) {
      description += `\nYou received this badge on **${dateTimeDisplay(
        dayjs(userHasBadge.createdAt)
      )}**.`;
    }

    const embed = new MessageEmbed(`Badge`, msg.author).setDescription(
      description
    );

    await this.send(msg.channel, embed);
    return;
  }
}
