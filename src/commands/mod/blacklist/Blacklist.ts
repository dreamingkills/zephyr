import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BlacklistService } from "../../../lib/database/services/meta/BlacklistService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class BlacklistUser extends BaseCommand {
  id = `forgotten`;
  names = ["blacklist"];
  description =
    "Blacklists a user. Be **extremely careful** when using this command!";
  usage = ["$CMD$ <@user> <reason>"];
  allowDm = true;

  moderatorOnly = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const mention = options[0]?.replace(/[\\<>@#&!]/g, "");

    if (isNaN(parseInt(mention)) || mention.length < 16 || mention.length > 18)
      throw new ZephyrError.InvalidMentionError();

    const target = await Zephyr.fetchUser(mention);

    if (!target) throw new ZephyrError.UserNotFoundError();

    const targetProfile = await ProfileService.getProfile(target.id);

    if (targetProfile.blacklisted)
      throw new ZephyrError.UserAlreadyBlacklistedError(target);

    const reason = options.slice(1).join(` `);

    if (reason.length < 1 || reason.length > 1500)
      throw new ZephyrError.InvalidBlacklistReasonError();

    const blacklists = await BlacklistService.getProfileBlacklists(
      targetProfile
    );

    await ProfileService.blacklistUser(targetProfile);
    const blacklist = await BlacklistService.blacklist(
      targetProfile,
      profile,
      reason
    );

    const embed = new MessageEmbed(`Blacklist`, msg.author).setDescription(
      `:lock: Blacklisted **${target.tag}** (${target.id}). Case ID: \`${
        blacklist.id
      }\`\n**${target.tag}** has ${
        blacklists.length === 0
          ? `never been blacklisted.`
          : `been blacklisted **${blacklists.length}** time${
              blacklists.length === 1 ? `` : `s`
            }.`
      }`
    );

    await this.send(msg.channel, embed);

    if (Zephyr.logChannel) {
      await this.send(
        Zephyr.logChannel,
        `:lock: **${target.tag}** was blacklisted by **${msg.author.tag}**. Case ID: \`${blacklist.id}\``
      );
    }

    return;
  }
}
