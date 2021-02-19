import dayjs from "dayjs";
import { Message } from "eris";
import { MessageEmbed } from "../../structures/client/RichEmbed";
import { BaseCommand } from "../../structures/command/Command";

export default class Stats extends BaseCommand {
  names = ["stats"];
  description = "Shows the bot's memory usage.";
  allowDm = true;

  async exec(msg: Message): Promise<void> {
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

    const shard = this.zephyr.guildShardMap[msg.guildID!] || 0;

    const rtfl = await this.zephyr.fetchUser(`197186779843919877`);

    const startup = dayjs().subtract(this.zephyr.uptime, `millisecond`);
    const now = dayjs();

    const days = now.diff(startup, `day`);
    const hoursRaw = now.diff(startup, `hour`);
    const hours = hoursRaw - days * 24;
    const minutesRaw = now.diff(startup, `minute`);
    const minutes = minutesRaw - hoursRaw * 60;
    const seconds = now.diff(startup, `second`) - minutesRaw * 60;

    const embed = new MessageEmbed(`Stats`, msg.author)
      .setDescription(
        `Shard - **${this.zephyr.config.discord.shardNames[shard]}** (${
          this.zephyr.shards.size
        } total)\nUptime - **${days > 0 ? `${days}d ` : ``}${
          hours > 0 ? `${hours}h ` : ``
        }${minutes > 0 ? `${minutes}m ` : ``}${
          seconds > 0 ? `${seconds}s` : ``
        }**\nCache Size - **${this.zephyr.users.size}** users / **${
          this.zephyr.guilds.size
        }** guilds\nGame - **${this.zephyr.getCards().length}** cards`
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

    await this.send(msg.channel, embed);
    return;
  }
}
