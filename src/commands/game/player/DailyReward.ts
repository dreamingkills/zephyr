import { Message } from "eris";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import dayjs from "dayjs";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { Chance } from "chance";
import { getTimeUntilNextDay } from "../../../lib/ZephyrUtils";
export default class DailyReward extends BaseCommand {
  names = ["daily"];
  description = "Shows you the status of your daily reward.";

  private bitsReward = { min: 50, max: 100 };
  // private streakMultiplier = 2;

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
      timeUntil = getTimeUntilNextDay(last);
      embed.setDescription(
        `${this.zephyr.config.discord.emoji.clock} You've already claimed your daily reward today.`
      );
    } else {
      const reward = new Chance().integer(this.bitsReward);
      await ProfileService.addBitsToProfile(profile, reward);
      _profile = await ProfileService.setDailyTimestamp(profile, todayFormat);
      timeUntil = getTimeUntilNextDay(today.add(1, "day"));
      embed.setDescription(
        `${this.zephyr.config.discord.emoji.clock} You claimed your daily reward and got...` +
          `\n— ${
            this.zephyr.config.discord.emoji.bits
          }**${reward}** *(new balance: ${_profile.bits.toLocaleString()})*`
      );
    }

    embed.setFooter(`Your daily reward is available in ${timeUntil}.`);
    await msg.channel.createMessage({ embed });
    return;
  }
}
