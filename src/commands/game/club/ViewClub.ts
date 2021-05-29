import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import {
  getClubByName,
  getClubMembers,
} from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";
import { escapeMarkdown } from "../../../lib/utility/text/TextUtils";

export default class ViewClub extends BaseCommand {
  id = `lithium`;
  names = [`club`, `c`];
  description = `Shows you information about a club.`;
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

    const owner = await Zephyr.fetchUser(club.ownerId);
    const clubMembers = await getClubMembers(club);

    const embed = new MessageEmbed(`Club`, msg.author)
      .setTitle(club.name)
      .setDescription(
        `${club.blurb || `This club has no blurb...`}\n` +
          `\n**Owner**: ${escapeMarkdown(owner?.tag || `Unknown User`)}` +
          `\n**Membership**: ${clubMembers.length}/${club.memberLimit}` +
          `\n**Open?**: ${club.open ? `Yes` : `No`}`
      );

    await this.send(msg.channel, embed);
    return;
  }
}
