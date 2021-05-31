import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import {
  getClubByName,
  getClubMembers,
} from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { kickUserFromClub } from "../../../lib/database/sql/game/club/ClubSetter";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class LeaveClub extends BaseCommand {
  id = `drive`;
  names = [`leave`];
  description = `Leaves a club.`;
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
    const membership = clubMembers.find(
      (member) => member.discordId === msg.author.id
    );

    if (!membership) throw new ClubError.NotMemberOfClubError();

    if (club.ownerId === msg.author.id) {
      const prefix = Zephyr.getPrefix(msg.guildID);

      throw new ClubError.OwnerCannotLeaveClubError(prefix);
    }

    await kickUserFromClub(membership);

    const embed = new MessageEmbed(`Join Club`, msg.author).setDescription(
      `:wave: You have left **${escapeMarkdown(club.name)}**.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
