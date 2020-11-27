import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Patreon extends BaseCommand {
  names = ["patreon", "donate", "kofi", "ko-fi"];
  description = "Sends a link to Zephyr's Patreon page.";
  usage = ["$CMD$"];
  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const embed = new MessageEmbed()
      .setAuthor(
        `Patreon | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `If you'd like to help fund the development of Zephyr and receive some cool perks, head over to the following link to become a patron!` +
          `\n— https://patreon.com/rtfl`
      );
    await msg.channel.createMessage({ embed });
  }
}
