import { Message, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BadgeService } from "../../../lib/database/services/game/BadgeService";
import dayjs from "dayjs";
import { dateTimeDisplay } from "../../../lib/utility/time/TimeUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class ShowBadges extends BaseCommand {
  id = `fly`;
  names = [`badges`];
  description = `Shows you a list of a player's badges.`;
  usage = [`$CMD$ [mention/user id]`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let targetUser: User;
    let targetProfile: GameProfile | undefined;

    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
    } else if (
      !isNaN(parseInt(options[0])) &&
      [17, 18].includes(options[0].length)
    ) {
      const fetchUser = await Zephyr.fetchUser(options[0]);

      if (!fetchUser) throw new ZephyrError.UserNotFoundError();

      targetUser = fetchUser;
    } else {
      targetUser = msg.author;
      targetProfile = profile;
    }

    if (!targetProfile)
      targetProfile = await ProfileService.getProfile(targetUser.id);

    const targetBadges = await BadgeService.getProfileBadges(targetProfile);

    const embed = new MessageEmbed(`Badges`, msg.author).setTitle(
      `${targetUser.tag}'s badges`
    );

    if (targetBadges.length === 0) {
      embed.setDescription(`No badges here...`);

      await this.send(msg.channel, embed);
      return;
    }

    const badgeDescriptions = [];

    for (let badge of targetBadges) {
      const awardedDate = dateTimeDisplay(dayjs(badge.createdAt));

      badgeDescriptions.push(
        `${badge.badgeEmoji} **${
          badge.badgeName
        }** — awarded **${awardedDate}**${
          badge.badgeDescription ? `\n*"${badge.badgeDescription}"*` : ``
        }`
      );
    }

    embed.setDescription(`${badgeDescriptions.join(`\n\n`)}`);

    await this.send(msg.channel, embed);
  }
}
