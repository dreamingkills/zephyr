import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import dayjs, { Dayjs } from "dayjs";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class DailyReward extends BaseCommand {
  names = ["daily"];
  description = "Shows you the status of your daily reward.";

  private bitsReward = 5;
  // private streakMultiplier = 2;

  private padIfNotLeading(text: string | number, leading: boolean): string {
    return leading ? text.toString() : text.toString().padStart(2, "0");
  }

  private timeUntilNextDay(timestamp: Dayjs): string {
    const nextDay = timestamp.add(1, "day");

    const days = nextDay.diff(Date.now(), "d");
    const hours = nextDay.diff(Date.now(), "h");
    const minutes = nextDay.diff(Date.now(), "m") - hours * 60;
    const seconds =
      nextDay.diff(Date.now(), "s") - nextDay.diff(Date.now(), "m") * 60;

    const daysText = days > 0 ? `${days}d ` : ``;
    const hoursText =
      hours > 0
        ? `${this.padIfNotLeading(hours - days * 24, days === 0)}h `
        : ``;
    const minutesText =
      minutes > 0 ? `${this.padIfNotLeading(minutes, hours === 0)}m ` : ``;
    const secondsText =
      seconds > 0 ? `${this.padIfNotLeading(seconds, minutes === 0)}s` : ``;

    return (
      `${daysText}` +
      `${hoursText}` +
      `${minutesText}` +
      `${secondsText}`
    ).trim();
  }

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const today = dayjs(Date.now());
    const todayFormat = today.format(`YYYY-MM-DD`);
    const last = dayjs(profile.dailyLast);

    let _profile = profile;
    let timeUntil: string;
    let embed = new MessageEmbed().setAuthor(
      `Daily | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );

    if (last.format(`YYYY-MM-DD`) === todayFormat || last.isAfter(today)) {
      timeUntil = this.timeUntilNextDay(last);
      embed.setDescription(
        `${this.zephyr.config.discord.emoji.clock} You've already claimed your daily reward today.`
      );
    } else {
      await ProfileService.addBitsToProfile(profile, this.bitsReward);
      _profile = await ProfileService.setDailyTimestamp(profile, todayFormat);
      timeUntil = this.timeUntilNextDay(dayjs(_profile.dailyLast));
      embed.setDescription(
        `${this.zephyr.config.discord.emoji.clock} You claimed your daily reward and got...` +
          `\n— ${this.zephyr.config.discord.emoji.bits}**${
            this.bitsReward
          }** *(new balance: ${_profile.bits.toLocaleString()})*`
      );
    }

    embed.setFooter(`Your daily reward is available in ${timeUntil}.`);
    await msg.channel.createMessage({ embed });
    return;
  }
}
