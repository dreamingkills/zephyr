import { Message } from "eris";
import { BadgeService } from "../../lib/database/services/game/BadgeService";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import * as ZephyrError from "../../structures/error/ZephyrError";
import { GameProfile } from "../../structures/game/Profile";

export default class CreateBadge extends BaseCommand {
  names = ["createbadge"];
  description = `Creates a badge.`;
  usage = [`$CMD$ <emoji> <name>`];
  developerOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const emoji = options[0];

    if (!emoji) throw new ZephyrError.InvalidBadgeEmojiError();

    const badgeName = options.slice(1).join(` `);

    if (!badgeName) throw new ZephyrError.InvalidBadgeNameError();

    const badgeNameExists = await BadgeService.getBadgeByName(badgeName);
    if (badgeNameExists) throw new ZephyrError.DuplicateBadgeNameError();

    const badgeEmojiExists = await BadgeService.getBadgeByEmoji(emoji);
    if (badgeEmojiExists) await BadgeService.getBadgeByEmoji(emoji);

    const newBadge = await BadgeService.createBadge(badgeName, emoji);

    const embed = new MessageEmbed(`Create Badge`, msg.author).setDescription(
      `:white_check_mark: You created a new badge...\n${newBadge.badgeEmoji} **${newBadge.badgeName}**`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
