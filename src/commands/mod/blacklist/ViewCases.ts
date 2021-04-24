import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BlacklistService } from "../../../lib/database/services/meta/BlacklistService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class ViewCase extends BaseCommand {
  id = `fantasy`;
  names = [`cases`, `blacklists`];
  description = `Shows a user's blacklist history.`;
  usage = ["$CMD$ <user id>"];
  allowDm = true;

  moderatorOnly = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const mention = options[0]?.replace(/[\\<>@#&!]/g, "");

    if (isNaN(parseInt(mention)) || mention.length < 16 || mention.length > 18)
      throw new ZephyrError.InvalidMentionError();

    const target = await Zephyr.fetchUser(mention);

    if (!target) throw new ZephyrError.UserNotFoundError();

    const targetProfile = await ProfileService.getProfile(target.id);

    const blacklists = await BlacklistService.getProfileBlacklists(
      targetProfile
    );

    const embed = new MessageEmbed(`Blacklists`, msg.author).setTitle(
      `${target.tag}'s blacklists (${target.id})`
    );

    if (blacklists.length === 0) {
      embed.setDescription(`**${target.tag}** has never been blacklisted.`);
    } else {
      embed.setDescription(
        blacklists
          .map(
            (b) =>
              `:lock: Case \`#${b.id}\` (${b.quasher ? `quashed` : `active`})`
          )
          .join(`\n`)
      );
    }

    await this.send(msg.channel, embed);
    return;
  }
}
