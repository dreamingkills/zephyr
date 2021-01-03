import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import dayjs from "dayjs";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { Chance } from "chance";
import { getTimeUntil } from "../../../lib/ZephyrUtils";
export default class DailyReward extends BaseCommand {
  names = ["daily"];
  description = "Shows you the status of your daily reward.";
  allowDm = true;

  private dayFormat = `YYYY-MM-DD`;
  private bitsReward = { min: 50, max: 100 };
  // private streakMultiplier = 2;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const today = dayjs(Date.now());
    const todayFormat = today.format(this.dayFormat);
    const last = dayjs(profile.dailyLast);

    const streakBroken =
      today.subtract(1, "day").format(this.dayFormat) !==
      last.format(this.dayFormat);

    let _profile = profile;
    let embed = new MessageEmbed().setAuthor(
      `Daily | ${msg.author.tag}`,
      msg.author.dynamicAvatarURL("png")
    );

    if (last.format(`YYYY-MM-DD`) === todayFormat || last.isAfter(today)) {
      embed.setDescription(
        `${this.zephyr.config.discord.emoji.clock} You've already claimed your daily reward today.`
      );
    } else {
      const reward = new Chance().integer(this.bitsReward);
      await ProfileService.addBitsToProfile(profile, reward);

      if (streakBroken) {
        await ProfileService.resetDailyStreak(profile);
      } else await ProfileService.incrementDailyStreak(profile);

      _profile = await ProfileService.setDailyTimestamp(profile, todayFormat);
      embed.setDescription(
        `${this.zephyr.config.discord.emoji.clock} You claimed your daily reward and got...` +
          `\n— ${
            this.zephyr.config.discord.emoji.bits
          }**${reward}** *(new balance: ${_profile.bits.toLocaleString()})*`
      );
    }

    embed.setFooter(
      `Your daily reward is available in ${getTimeUntil(
        today,
        dayjs(today).add(1, "day").startOf(`day`)
      )}.` + `\nYour current streak is ${_profile.dailyStreak.toLocaleString()}`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
