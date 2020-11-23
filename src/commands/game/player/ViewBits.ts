import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class ViewBits extends BaseCommand {
  names = ["bits", "$", "bal"];
  description = "Shows you your bit balance.";

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const embed = new MessageEmbed()
      .setAuthor(`Bits | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(
        `You have ${
          this.zephyr.config.discord.emoji.bits
        }**${profile.bits.toLocaleString()}**.`
      );
    await msg.channel.createMessage({ embed });
  }
}
