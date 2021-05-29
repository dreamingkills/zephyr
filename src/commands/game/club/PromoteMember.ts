import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import {
  getClubByName,
  getClubMembers,
} from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import {
  escapeMarkdown,
  isValidSnowflake,
} from "../../../lib/utility/text/TextUtils";
import { Zephyr } from "../../../structures/client/Zephyr";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { setClubModerator } from "../../../lib/database/sql/game/club/ClubSetter";

export default class PromoteMember extends BaseCommand {
  id = `nasty`;
  names = [`promote`];
  description = `Promotes someone in a club to moderator - you must be the owner to run this command.`;
  usage = [`$CMD$ <@mention / user id> <club name>`];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const clubName = options.slice(1).join(` `);
    if (!clubName) throw new ClubError.InvalidClubNameInViewerError();

    const club = await getClubByName(clubName);
    if (!club) throw new ClubError.NoClubByNameError();

    const isOwner = club.ownerId === msg.author.id;

    if (!isOwner) throw new ClubError.NotOwnerOfClubError();

    const targetId = options[0]
      .replace(`<@`, ``)
      .replace(`!`, ``)
      .replace(`>`, ``);

    if (!isValidSnowflake(targetId))
      throw new ZephyrError.InvalidSnowflakeError();

    const target = await Zephyr.fetchUser(targetId);
    if (!target) throw new ZephyrError.InvalidSnowflakeError();

    if (target.id === msg.author.id)
      throw new ClubError.CannotPromoteYourselfError();

    const members = await getClubMembers(club);

    const targetMembership = members.find((m) => m.discordId === target.id);
    if (!targetMembership) throw new ClubError.UserNotInClubError();

    if (targetMembership.isMod) throw new ClubError.AlreadyModeratorError();

    await setClubModerator(targetMembership, club);

    const embed = new MessageEmbed(`Promote`, msg.author).setDescription(
      `:white_check_mark: You promoted **${escapeMarkdown(
        target.tag
      )}** to moderator in **${escapeMarkdown(club.name)}**.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
