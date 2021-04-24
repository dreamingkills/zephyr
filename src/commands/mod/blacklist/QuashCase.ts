import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BlacklistService } from "../../../lib/database/services/meta/BlacklistService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class QuashCase extends BaseCommand {
  id = `one`;
  names = ["quash"];
  description =
    "Quashes a blacklist case. In other words, it gets nullified and the user is unblacklisted.";
  usage = ["$CMD$ <case id> <note>"];
  allowDm = true;

  moderatorOnly = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const caseId = parseInt(options[0]);

    if (isNaN(caseId) || caseId < 1)
      throw new ZephyrError.InvalidBlacklistIdError();

    const blacklist = await BlacklistService.getBlacklistById(caseId);

    if (!blacklist.active)
      throw new ZephyrError.CaseAlreadyQuashedError(blacklist);

    const blacklistee = await Zephyr.fetchUser(blacklist.discordId);
    const blacklisteeProfile = await ProfileService.getProfile(
      blacklist.discordId
    );

    const quashNote = options.slice(1).join(` `);
    if (quashNote.length < 1) throw new ZephyrError.InvalidQuashNoteError();

    await ProfileService.unblacklistUser(blacklisteeProfile);
    await BlacklistService.quashBlacklist(blacklist, profile, quashNote);

    const embed = new MessageEmbed(`Quash`, msg.author)
      .setTitle(`Case #${caseId} - ${blacklistee?.tag || blacklist.discordId}`)
      .setDescription(
        `:unlock: Quashed \`Case #${blacklist.id}\` and unblacklisted **${
          blacklistee?.tag || blacklist.discordId
        }**.`
      );

    await this.send(msg.channel, embed);

    if (Zephyr.logChannel) {
      await this.send(
        Zephyr.logChannel,
        `:unlock: \`Case #${blacklist.id}\` was quashed by **${
          msg.author.tag
        }**, unblacklisted **${blacklistee?.tag || blacklist.discordId}**.`
      );
    }

    return;
  }
}
