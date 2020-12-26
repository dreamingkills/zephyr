import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";
import { GameProfile } from "../../structures/game/Profile";

export default class Stats extends BaseCommand {
  names = ["stats"];
  description = "Shows the bot's memory usage.";
  allowDm = true;

  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const usedMb = process.memoryUsage().heapUsed / 1000 / 1000;
    const usedPct = (usedMb / 7983) * 100;
    let ramStatusEmoji: string;
    if (usedPct < 25) {
      ramStatusEmoji = ":smile:";
    } else if (usedPct < 50) {
      ramStatusEmoji = ":slight_smile:";
    } else if (usedPct < 75) {
      ramStatusEmoji = ":worried:";
    } else {
      ramStatusEmoji = ":hot_face:";
    }

    const rtfl = await this.zephyr.fetchUser(`197186779843919877`);
    const embed = new MessageEmbed()
      .setAuthor(
        `Stats | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png"),
        `https://github.com/olivia-hye/zephyr`
      )
      .addField({
        name: `Memory Usage`,
        value: `— ${usedPct.toFixed(2)}% ${ramStatusEmoji}`,
        inline: true,
      })
      .setFooter(
        `Made with ❤️ by RTFL#8058`,
        rtfl ? rtfl.dynamicAvatarURL("png") : ""
      );

    await msg.channel.createMessage({ embed });
  }
}
