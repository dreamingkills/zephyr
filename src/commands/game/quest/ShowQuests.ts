import { Message } from "eris";
import { QuestGetter } from "../../../lib/database/sql/game/quest/QuestGetter";
import { QuestSetter } from "../../../lib/database/sql/game/quest/QuestSetter";
import { Quests } from "../../../lib/quest/Quest";
import { getTimeUntilNextDay } from "../../../lib/utility/time/TimeUtils";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Zephyr } from "../../../structures/client/Zephyr";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { BaseQuest } from "../../../structures/game/quest/BaseQuest";

export default class ShowQuests extends BaseCommand {
  id = `hypnotize`;
  names = [`quests`, `q`];
  description = `Shows you a list of your active quests.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    let quests = await QuestGetter.getActiveQuests(profile);

    if (quests.length === 0) {
      const dailyQuests: BaseQuest[] = [];
      const weeklyQuests: BaseQuest[] = [];

      while (dailyQuests.length < Zephyr.modifiers.dailyQuestLimit) {
        const eligibleQuests = Quests.getQuests().filter(
          (q) => !dailyQuests.find((_q) => _q.id === q.id) && q.type === `daily`
        );

        dailyQuests.push(Zephyr.chance.pickone(eligibleQuests));
      }

      while (weeklyQuests.length < Zephyr.modifiers.weeklyQuestLimit) {
        const eligibleQuests = Quests.getQuests().filter(
          (q) =>
            !dailyQuests.find((_q) => _q.id === q.id) && q.type === `weekly`
        );

        weeklyQuests.push(Zephyr.chance.pickone(eligibleQuests));
      }

      quests = await QuestSetter.populateQuests(profile, [
        ...dailyQuests,
        ...weeklyQuests,
      ]);
    }

    const weeklyQuestStrings: string[] = [];
    const dailyQuestStrings: string[] = [];

    for (let quest of quests) {
      const baseQuest = quest.quest;

      if (!baseQuest) continue;

      const questString = `**[${quest.progress}/${
        quest.completion
      }]** ${baseQuest.description
        .replace(`%n`, `**${quest.completion}**`)
        .replace(`%p`, quest.completion === 1 ? `` : `s`)}`;

      if (baseQuest.type === `daily`) {
        dailyQuestStrings.push(questString);
      } else {
        weeklyQuestStrings.push(questString);
      }
    }

    const embed = new MessageEmbed(`Quests`, msg.author)
      .setDescription(
        `:calendar_spiral: **Weekly Quests**\n\n${weeklyQuestStrings.join(
          `\n`
        )}\n\n:calendar_spiral: **Daily Quests**\n\n${dailyQuestStrings.join(
          `\n`
        )}`
      )
      .setFooter(`Your daily quests will refresh in ${getTimeUntilNextDay()}`);

    await this.send(msg.channel, embed);
    return;
  }
}
