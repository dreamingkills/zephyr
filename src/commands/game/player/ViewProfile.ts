import { Message, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export default class ViewProfile extends BaseCommand {
  names = ["profile", "p"];
  usage = ["$CMD$", "$CMD$ <@mention>", "$CMD$ <id>"];
  description = "Displays your profile.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let target: GameProfile;
    let user: User;
    if (this.options[0]) {
      if (!isNaN(parseInt(this.options[0], 10))) {
        const userId = this.options[0];
        if (userId.length < 17) throw new ZephyrError.InvalidSnowflakeError();

        user = await this.zephyr.fetchUser(userId);
        target = await ProfileService.getProfile(user.id);
      } else if (msg.mentions[0]) {
        user = msg.mentions[0];
        target = await ProfileService.getProfile(user.id);
      } else throw new ZephyrError.InvalidUserArgumentError();
    } else {
      user = msg.author;
      target = profile;
    }

    if (target.private && target.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError(user.tag);

    const embed = new MessageEmbed()
      .setAuthor(`Profile | ${user.tag}`, msg.author.avatarURL)
      .setDescription(
        `**Blurb**` +
          `\n${target.blurb || "*No blurb set*"}` +
          `\n\n— ${
            target.discordId === msg.author.id ? `You have` : `${user.tag} has`
          } ${
            this.zephyr.config.discord.emoji.bits
          }**${target.bits.toLocaleString()}**.`
      );
    if (profile.discordId === msg.author.id && profile.private)
      embed.setFooter(`Your profile is currently private.`);

    await msg.channel.createMessage({ embed });
    return;
  }
}
