import dayjs from "dayjs";
import { Message } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { getTimeUntil } from "../../../lib/utility/time/TimeUtils";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
export default class Cooldowns extends BaseCommand {
  names = ["cooldowns", "cd", "timer", "timers", "t"];
  description = "Shows the status of various timers.";
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const prefix = this.zephyr.getPrefix(msg.guildID);

    const today = dayjs(Date.now());
    const todayFormat = today.format(`YYYY-MM-DD`);
    const dailyLast = dayjs(profile.dailyLast).format(`YYYY-MM-DD`);

    const now = dayjs(Date.now());

    let timerString = `\`${prefix}daily\` **Daily Reward**: __${
      todayFormat === dailyLast
        ? getTimeUntil(
            now,
            dayjs(Date.now()).add(1, "day").startOf("day") || "Now"
          )
        : `Now`
    }__\n\` ${prefix}vote\` **Vote**: __${
      getTimeUntil(now, dayjs(profile.voteLast || 0).add(12, "hour")) || "Now"
    }__\n\` ${prefix}drop\` **Drop**: __${
      getTimeUntil(now, dayjs(profile.dropNext)) || "Now"
    }__\n\`<none>\` **Claim**: __${
      getTimeUntil(now, dayjs(profile.claimNext)) || "Now"
    }__
    `;

    if (profile.boosterGroup && profile.boosterExpiry) {
      const expiry = dayjs(profile.boosterExpiry);

      if (expiry < now) {
        await ProfileService.clearBooster(profile);
      } else {
        const timeUntilExpiration = getTimeUntil(now, expiry);
        const group = this.zephyr.getGroupById(profile.boosterGroup);

        timerString += `\nYou have __${timeUntilExpiration}__ remaining on your boost for **${group}**.`;
      }
    }

    const embed = new MessageEmbed(`Cooldowns`, msg.author)
      .setTitle(`${msg.author.tag}'s Cooldowns`)
      .setDescription(timerString);

    await this.send(msg.channel, embed);
    return;
  }
}
