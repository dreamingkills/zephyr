import { Message, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class ViewTags extends BaseCommand {
  id = `campfire`;
  names = [`viewtags`, `tags`, `vt`];
  description = `Shows you a list of a user's tags.`;
  usage = [`$CMD$ [@mention/user id]`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let target: GameProfile | undefined;
    let targetUser: User | undefined;

    if (msg.mentions[0]) {
      targetUser = msg.mentions[0];
    } else if (!isNaN(parseInt(options[0]))) {
      if (options[0].length < 17 || options[0].length > 18)
        throw new ZephyrError.InvalidSnowflakeError();

      const fetchUser = await Zephyr.fetchUser(options[0]);
      if (!fetchUser) throw new ZephyrError.UserNotFoundError();

      targetUser = fetchUser;
    } else {
      targetUser = msg.author;
      target = profile;
    }

    if (!target) target = await ProfileService.getProfile(targetUser.id);

    if (target.private && target.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError(targetUser.tag);

    const userTags = await ProfileService.getTags(target);
    userTags.sort((a, b) => (a.name > b.name ? 1 : -1));

    const embed = new MessageEmbed(`Tags`, msg.author).setTitle(
      `${targetUser.tag}'s tags`
    );

    if (userTags.length === 0) {
      if (targetUser.id === msg.author.id) {
        const prefix = Zephyr.getPrefix(msg.guildID);
        embed.setDescription(
          `You have no tags!\nUse \`${prefix}createtag <tag name> <emoji>\` to make one.`
        );
      } else {
        embed.setDescription(`**${targetUser.tag}** has no tags.`);
      }
    } else {
      embed.setDescription(
        userTags.map((t) => `${t.emoji} — \`${t.name}\``).join(`\n`)
      );
    }

    await this.send(msg.channel, embed);
    return;
  }
}
