import dayjs from "dayjs";
import { Message } from "eris";
import { QuestGetter } from "../../../lib/database/sql/game/quest/QuestGetter";
import { initQuests } from "../../../lib/database/sql/game/quest/QuestSetter";
import {
  getTimeUntil,
  getTimeUntilNextDay,
} from "../../../lib/utility/time/TimeUtils";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";

export default class ShowQuests extends BaseCommand {
  id = `hypnotize`;
  names = [`quests`, `q`];
  description = `Shows you a list of your active quests.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let quests = await QuestGetter.getActiveQuests(profile);

    const dailyQuestLimit = Zephyr.modifiers.dailyQuestLimit;
    const weeklyQuestLimit = Zephyr.modifiers.weeklyQuestLimit;

    if (quests.length < dailyQuestLimit + weeklyQuestLimit) {
      quests = await initQuests(profile, quests);
    }

    const weeklyQuestStrings: string[] = [];
    const dailyQuestStrings: string[] = [];

    for (let quest of quests) {
      const baseQuest = quest.quest;

      if (!baseQuest) continue;

      let questString = baseQuest.description
        .replace(`%n`, `**${quest.completion.toLocaleString()}**`)
        .replace(`%p`, quest.completion === 1 ? `` : `s`);

      if (quest.progress === quest.completion) {
        questString = `:white_check_mark: ${questString}`;
      } else {
        questString = `:white_medium_small_square: ${questString} **[${quest.progress.toLocaleString()}/${quest.completion.toLocaleString()}]**`;
      }

      if (baseQuest.type === `daily`) {
        dailyQuestStrings.push(questString);
      } else {
        weeklyQuestStrings.push(questString);
      }
    }

    const embed = new MessageEmbed(`Quests`, msg.author)
      .setDescription(
        `:alarm_clock: **Daily Quests** — *resets in ${getTimeUntilNextDay()}*\n\n${dailyQuestStrings.join(
          `\n`
        )}\n\n:calendar_spiral: **Weekly Quests** — *resets in ${getTimeUntil(
          dayjs(),
          dayjs().startOf(`week`).add(7, `day`)
        )}*\n\n${weeklyQuestStrings.join(`\n`)}`
      )
      .setFooter(`Your daily quests will refresh in ${getTimeUntilNextDay()}`);

    await this.send(msg.channel, embed);
    return;
  }
}
