import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class RobPlayer extends BaseCommand {
  names = ["rob"];
  description = "Robs a user, taking their money.";
  usage = ["$CMD$ <user>"];

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const embed = new MessageEmbed()
      .setAuthor(`Rob | ${msg.author.tag}`, msg.author.avatarURL)
      .setDescription(
        `<@${this.zephyr.user.id}> robbed **${msg.author.tag}**, stealing ${
          this.zephyr.config.discord.emoji.bits
        }**${profile.bits.toLocaleString()}**.`
      );
    await msg.channel.createMessage({ embed });
  }
}
