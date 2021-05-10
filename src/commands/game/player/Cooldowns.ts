import dayjs from "dayjs";
import { Message } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { getTimeUntil } from "../../../lib/utility/time/TimeUtils";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
export default class Cooldowns extends BaseCommand {
  id = `absolution`;
  names = ["cooldowns", "cd", "timer", "timers", "t"];
  description = "Shows the status of various timers.";
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const prefix = Zephyr.getPrefix(msg.guildID);

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

    if (profile.boosterGroup && profile.boosterUses) {
      if (profile.boosterUses === 0) {
        await ProfileService.clearBooster(profile);
      } else {
        const group = Zephyr.getGroupById(profile.boosterGroup);

        timerString += `\nYou have __${profile.boosterUses} uses__ remaining on your boost for **${group}**.`;
      }
    }

    const embed = new MessageEmbed(`Cooldowns`, msg.author)
      .setTitle(`${msg.author.tag}'s Cooldowns`)
      .setDescription(timerString);

    await this.send(msg.channel, embed);
    return;
  }
}
