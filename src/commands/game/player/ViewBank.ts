import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class ViewBank extends BaseCommand {
  names = ["bank", "b"];
  description = "Shows you the contents of your bit bank.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const embed = new MessageEmbed()
      .setAuthor(`Bank | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(
        `${this.zephyr.config.discord.emoji.bank} Your bank contains...` +
          `\n— ${
            this.zephyr.config.discord.emoji.bits
          }**${profile.bitsBank.toLocaleString()}**`
      );
    await msg.channel.createMessage({ embed });
  }
}
