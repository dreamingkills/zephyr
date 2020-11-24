import { Message, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";

export default class ViewProfile extends BaseCommand {
  names = ["profile", "p"];
  usage = ["$CMD$", "$CMD$ <@mention>", "$CMD$ id=USER_ID"];
  description = "Displays your profile.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let target: GameProfile | string;
    let user: User;
    if (msg.mentions[0]) {
      user = msg.mentions[0];
      target = msg.mentions[0].id;
    } else if (this.options[0]?.startsWith("id=")) {
      const userId = this.options[0].slice(3);
      if (isNaN(parseInt(userId)))
        throw new ZephyrError.InvalidSnowflakeError();

      const guild = this.zephyr.guilds.get(msg.guildID!);
      const member = await guild?.fetchMembers({ userIDs: [userId] });

      if (!member || !member[0]) throw new ZephyrError.UserNotFoundError();

      user = member[0].user;
      target = user.id;
    } else {
      user = msg.author;
      target = profile;
    }

    if (typeof target === "string") {
      target = await ProfileService.getProfile(target);
    }

    if (target.private && target.discordId !== msg.author.id)
      throw new ZephyrError.PrivateProfileError(user.tag);

    const embed = new MessageEmbed()
      .setAuthor(`Profile | ${user.tag}`, msg.author.avatarURL)
      .setDescription(
        (target.blurb ? `**Blurb**` : ``) +
          `\n${target.blurb}\n` +
          `\n${
            this.zephyr.config.discord.emoji.bits
          }**${target.bits.toLocaleString()}**.` +
          `\n— *${target.bitsBank.toLocaleString()} in the bank*`
      )
      .setFooter(`Profile is ${target.private ? `PRIVATE` : `PUBLIC`}`);
    await msg.channel.createMessage({ embed });
  }
}
