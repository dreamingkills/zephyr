import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ClubError } from "../../../structures/error/ClubError";
import {
  getClubByName,
  getClubMembers,
} from "../../../lib/database/sql/game/club/ClubGetter";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";
import {
  escapeMarkdown,
  isValidSnowflake,
} from "../../../lib/utility/text/TextUtils";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { kickUserFromClub } from "../../../lib/database/sql/game/club/ClubSetter";
import { ReactionCollector } from "eris-collector";

export default class KickFromClub extends BaseCommand {
  id = `chilled`;
  names = [`kick`];
  description = `Kicks someone from a club. Only usable by club moderators.`;
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

    const members = await getClubMembers(club);

    const clubMembership = members.find((m) => m.discordId === msg.author.id);
    if (!clubMembership) throw new ClubError.NotMemberOfClubError();

    const isMod = clubMembership.isMod;

    if (!isOwner && !isMod) throw new ClubError.NotClubModeratorError();

    const targetId = options[0]
      .replace(`<@`, ``)
      .replace(`!`, ``)
      .replace(`>`, ``);

    if (!isValidSnowflake(targetId))
      throw new ZephyrError.InvalidSnowflakeError();

    const target = await Zephyr.fetchUser(targetId);
    if (!target) throw new ZephyrError.InvalidSnowflakeError();

    const targetMembership = members.find((m) => m.discordId === target.id);
    if (!targetMembership) throw new ClubError.UserNotInClubError();

    const targetIsOwner = club.ownerId === target.id;
    if (targetIsOwner) throw new ClubError.CannotKickOwnerError();

    const targetIsMod = targetMembership.isMod;
    if (targetIsMod && !isOwner) throw new ClubError.PermissionsConflictError();

    const confirmationEmbed = new MessageEmbed(
      `Kick Member`,
      msg.author
    ).setDescription(
      `Really kick **${escapeMarkdown(target.tag)}** from **${escapeMarkdown(
        club.name
      )}**?\nThis action is irreversible.`
    );

    const confirmation = await this.send(msg.channel, confirmationEmbed);

    const confirmed: boolean = await new Promise(async (res) => {
      const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
        user.id === msg.author.id && emoji.name === "☑";

      const collector = new ReactionCollector(Zephyr, confirmation, filter, {
        time: 15000,
        max: 1,
      });

      collector.on("error", async (e: Error) => {
        res(false);
        return await this.handleError(msg, msg.author, e);
      });

      collector.on("collect", () => {
        res(true);
      });

      collector.on("end", async (_collected: any, reason: string) => {
        if (reason === "time") res(false);
      });

      await this.react(confirmation, "☑");
    });

    if (!confirmed) {
      await this.edit(
        confirmation,
        confirmationEmbed.setFooter(`🕒 This confirmation has expired.`)
      );

      return;
    }

    await kickUserFromClub(targetMembership);

    await this.edit(
      confirmation,
      confirmationEmbed.setFooter(`✅ Kick successful.`)
    );
  }
}
