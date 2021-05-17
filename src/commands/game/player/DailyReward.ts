import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import dayjs from "dayjs";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { getTimeUntilNextDay } from "../../../lib/utility/time/TimeUtils";
import { Zephyr } from "../../../structures/client/Zephyr";
import { getItemById } from "../../../assets/Items";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { isDeveloper } from "../../../lib/ZephyrUtils";

export default class DailyReward extends BaseCommand {
  id = `uta`;
  names = [`daily`];
  description = `Shows you the status of your daily reward.`;
  allowDm = true;

  private dayFormat = `YYYY-MM-DD`;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    if (!Zephyr.flags.daily && !isDeveloper(msg.author))
      throw new ZephyrError.DailyFlagDisabledError();

    const today = dayjs(Date.now());
    const todayFormat = today.format(this.dayFormat);
    const last = dayjs(profile.dailyLast);

    const streakBroken =
      today.subtract(1, "day").format(this.dayFormat) !==
      last.format(this.dayFormat);

    let _profile = profile;

    let embed = new MessageEmbed(`Daily Reward`, msg.author);

    if (last.format(`YYYY-MM-DD`) === todayFormat || last.isAfter(today)) {
      embed.setDescription(
        `${Zephyr.config.discord.emoji.clock} You've already claimed your daily reward today.`
      );
    } else {
      const keyPrefab = getItemById(47);

      if (!keyPrefab) throw new ZephyrError.KeyItemNotFoundError();

      if (streakBroken) {
        await ProfileService.resetDailyStreak(profile);
      } else await ProfileService.incrementDailyStreak(profile);

      const count = profile.dailyStreak + (1 % 7) === 0 ? 3 : 1;

      await ProfileService.addItems(profile, [
        { item: keyPrefab, count: count },
      ]);
      // TESTING ONLY
      await ProfileService.addBitsToProfile(profile, 10000);

      _profile = await ProfileService.setDailyTimestamp(profile, todayFormat);
      const keyItem = await ProfileService.getItem(profile, 47, `Key`);

      const prefix = Zephyr.getPrefix(msg.guildID);
      embed.setDescription(
        `${Zephyr.config.discord.emoji.clock} You claimed your daily reward and got...` +
          `\n— **${count}x Key** 🔑 *(${keyItem.quantity} total)*\n\n**TIP**: Keys can be used to open the \`${prefix}mysterybox\`!`
      );
    }

    embed.setFooter(
      `Your daily reward is available in ${getTimeUntilNextDay()}.` +
        `\nYour current daily streak is ${_profile.dailyStreak.toLocaleString()}.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
