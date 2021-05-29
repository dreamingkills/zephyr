import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import {
  getClubByName,
  getClubMembers,
} from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class ClubMembers extends BaseCommand {
  id = `killer`;
  names = [`members`];
  description = `Shows you a list of a club's members. You must be in the club to run this command.`;
  usage = [`$CMD$ <club name>`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const clubName = options.join(` `);

    if (!clubName) throw new ClubError.InvalidClubNameInViewerError();

    const club = await getClubByName(clubName);

    if (!club) throw new ClubError.NoClubByNameError();

    const clubMembers = await getClubMembers(club);

    if (!clubMembers.find((m) => m.discordId === msg.author.id))
      throw new ClubError.NotMemberOfClubError();

    const memberStrings = [];

    for (let member of clubMembers.sort((a) => {
      if (a.discordId === club.ownerId) return 0;
      if (a.isMod) return 1;
      return 2;
    })) {
      const user = await Zephyr.fetchUser(member.discordId);

      let type = `Member`;
      let emoji = `bust_in_silhouette`;
      if (member.discordId === club.ownerId) {
        type = `Owner`;
        emoji = `crown`;
      } else if (member.isMod) {
        type = `Moderator`;
        emoji = `shield`;
      }

      memberStrings.push(
        `:${emoji}: **${escapeMarkdown(
          user?.tag || `Unknown User`
        )}** - ${type}`
      );
    }

    const embed = new MessageEmbed(`Club Members`, msg.author)
      .setTitle(`Members of ${club.name}`)
      .setDescription(memberStrings.join(`\n`));

    await this.send(msg.channel, embed);

    return;
  }
}
