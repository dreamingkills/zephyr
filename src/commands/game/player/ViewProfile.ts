import { Message, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";

export default class ViewProfile extends BaseCommand {
  names = ["profile", "p"];
  usage = ["$CMD$", "$CMD$ <@mention>", "$CMD$ <id>"];
  description = "Displays your profile.";
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    let target: GameProfile | undefined;
    let targetUser: User | undefined;
    if (options[0]) {
      if (!isNaN(parseInt(options[0], 10))) {
        const userId = options[0];
        if (userId.length < 17) throw new ZephyrError.InvalidSnowflakeError();

        targetUser = await this.zephyr.fetchUser(userId);
      } else if (msg.mentions[0]) {
        targetUser = msg.mentions[0];
      } else throw new ZephyrError.InvalidUserArgumentError();
    } else {
      targetUser = msg.author;
      target = profile;
    }

    if (!targetUser) throw new ZephyrError.UserNotFoundError();

    if (!target) target = await ProfileService.getProfile(targetUser.id);

    if (
      target.private &&
      target.discordId !== msg.author.id &&
      !this.zephyr.config.moderators.includes(msg.author.id) &&
      !this.zephyr.config.developers.includes(msg.author.id)
    )
      throw new ZephyrError.PrivateProfileError(targetUser.tag);

    const cardsAmount = await CardService.getUserInventorySize(target, [], {});

    const targetIsSender = target.discordId === msg.author.id;
    const embed = new MessageEmbed()
      .setAuthor(`Profile | ${targetUser.tag}`, msg.author.avatarURL)
      .setDescription(
        `**Blurb**` +
          `\n${target.blurb || "*No blurb set*"}` +
          `\n\n— ${targetIsSender ? `You have` : `${targetUser.tag} has`} ${
            this.zephyr.config.discord.emoji.bits
          } **${target.bits.toLocaleString()}**.` +
          `\n— ${
            targetIsSender ? `You have` : `${targetUser.tag} has`
          } **${target.cubits.toLocaleString()}** cubit${
            target.cubits === 1 ? `` : `s`
          }.` +
          `\n— ${
            targetIsSender ? `You have` : `${targetUser.tag} has`
          } **${cardsAmount.toLocaleString()}** card${
            cardsAmount === 1 ? `` : `s`
          }.`
      );

    if (target.discordId === msg.author.id && profile.private)
      embed.setFooter(`Your profile is currently private.`);

    await this.send(msg.channel, embed);
    return;
  }
}
