import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import {
  getClubByName,
  getClubMembers,
  getUserClubMembership,
} from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { addUserToClub } from "../../../lib/database/sql/game/club/ClubSetter";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class JoinClub extends BaseCommand {
  id = `jumpsuit`;
  names = [`join`];
  description = `Joins a club, if it's open and below the member limit.`;
  usage = [`$CMD$ <club name>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const clubName = options.join(` `);

    if (!clubName) throw new ClubError.InvalidClubNameInViewerError();

    const club = await getClubByName(clubName);

    if (!club) throw new ClubError.NoClubByNameError();

    const clubMembers = await getClubMembers(club);

    if (clubMembers.find((m) => m.discordId === msg.author.id))
      throw new ClubError.AlreadyInClubError();

    if (!club.open) throw new ClubError.ClubClosedError();
    if (clubMembers.length >= club.memberLimit)
      throw new ClubError.ClubAtCapacityError();

    const userMembership = await getUserClubMembership(profile);

    if (userMembership.length > Zephyr.modifiers.userClubMembershipLimit)
      throw new ClubError.ClubLimitError();

    await addUserToClub(club, profile);

    const embed = new MessageEmbed(`Join Club`, msg.author).setDescription(
      `:tada: You have joined **${escapeMarkdown(club.name)}**.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
