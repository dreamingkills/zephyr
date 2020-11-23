import { Message, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class ViewProfile extends BaseCommand {
  names = ["profile", "p"];
  usage = ["$CMD$", "$CMD$ <@mention>", "$CMD$ id=USER_ID"];
  description = "Displays your profile.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let target: GameProfile;
    let user: User;
    if (msg.mentions[0]) {
      user = msg.mentions[0];
      target = await ProfileService.getProfile(msg.mentions[0].id);
    } else if (this.options[0]?.startsWith("id=")) {
      const userId = this.options[0].slice(3);
      if (isNaN(parseInt(userId))) {
        await msg.channel.createMessage("INVALID SNOWFLAKE!");
        return;
      }
      const guild = this.zephyr.guilds.get(msg.guildID!);
      const member = await guild?.fetchMembers({ userIDs: [userId] });

      if (!member || !member[0]) {
        await msg.channel.createMessage("NOT FOUND!");
        return;
      }

      user = member[0].user;
      target = await ProfileService.getProfile(user.id);
    } else {
      user = msg.author;
      target = profile;
    }

    if (target.private && target.discordId !== msg.author.id) {
      await msg.channel.createMessage("PRIVATE PROFILE");
      return;
    }

    const embed = new MessageEmbed()
      .setAuthor(`Profile | ${user.tag}`, msg.author.avatarURL)
      .setDescription(
        `${
          this.zephyr.config.discord.emoji.bits
        }**${target.bits.toLocaleString()}**.` +
          `\n— *${target.bitsBank.toLocaleString()} in the bank*`
      )
      .setFooter(`Profile is ${target.private ? `PRIVATE` : `PUBLIC`}`);
    await msg.channel.createMessage({ embed });
  }
}
