import { Message, User } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class ViewProfile extends BaseCommand {
  names = ["profile", "p"];
  description = "Displays your profile.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let target: GameProfile;
    let user: User;
    if (msg.mentions[0]) {
      user = msg.mentions[0];
      target = await ProfileService.getProfile(msg.mentions[0].id);
    } else {
      user = msg.author;
      target = profile;
    }
    const embed = new MessageEmbed()
      .setAuthor(`Profile | ${user.tag}`, msg.author.avatarURL)
      .setDescription(
        `${
          this.zephyr.config.discord.emoji.bits
        }**${target.bits.toLocaleString()}**.` +
          `\n— *${target.bitsBank.toLocaleString()} in the bank*`
      );
    await msg.channel.createMessage({ embed });
  }
}
