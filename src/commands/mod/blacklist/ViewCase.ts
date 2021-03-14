import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BlacklistService } from "../../../lib/database/services/meta/BlacklistService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import dayjs from "dayjs";

export default class ViewCase extends BaseCommand {
  id = `escape`;
  names = [`case`];
  description = `Shows a blacklist case.`;
  usage = ["$CMD$ <case id>"];
  allowDm = true;

  moderatorOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const caseId = parseInt(options[0]);

    if (isNaN(caseId) || caseId < 1)
      throw new ZephyrError.InvalidBlacklistIdError();

    const blacklist = await BlacklistService.getBlacklistById(caseId);

    const blacklistee = await this.zephyr.fetchUser(blacklist.discordId);
    const blacklisteeProfile = await ProfileService.getProfile(
      blacklist.discordId
    );

    const moderator = await this.zephyr.fetchUser(blacklist.moderator);

    // no reason to do this as far as I can tell
    /*const moderatorProfile = await ProfileService.getProfile(
      blacklist.moderator
    ); */

    const timestamp = dayjs(blacklist.createdAt).format(
      `MMMM D, YYYY [at] HH:mm:ss`
    );

    let quasher;

    if (!blacklist.active) {
      const quasherUser = await this.zephyr.fetchUser(blacklist.quasher);

      quasher = quasherUser?.tag || blacklist.quasher;
    }

    const embed = new MessageEmbed(`Case Viewer`, msg.author)
      .setThumbnail(
        blacklistee?.dynamicAvatarURL(`png`) ||
          msg.author.dynamicAvatarURL(`png`)
      )
      .setTitle(`Case #${caseId} - ${blacklistee?.tag || blacklist.discordId}`)
      .setDescription(
        `**Moderator**: ${
          moderator?.tag || blacklist.moderator
        }\n**Quashed?**: ${
          blacklist.active ? `No` : `by **${quasher}** - ${blacklist.quashNote}`
        }\n**User Status**: ${
          blacklisteeProfile.blacklisted ? `Blacklisted` : `Not Blacklisted`
        }\n\n**Reason**:\n${blacklist.reason}`
      )
      .setFooter(`Blacklisted ${timestamp} UTC.`);

    await this.send(msg.channel, embed);

    return;
  }
}
