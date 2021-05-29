import { quests } from "../../assets/quests";
import { BaseQuest } from "../../structures/game/quest/BaseQuest";
import {
  ItemReward,
  QuestReward,
  RewardChance,
  XPReward,
} from "../../structures/game/quest/QuestReward";
import { Logger, loggerSettings } from "../logger/Logger";

class QuestService {
  private quests: BaseQuest[] = [];

  public loadQuests(): BaseQuest[] {
    const questIds: Set<number> = new Set();
    for (let quest of quests) {
      if (questIds.has(quest.id)) {
        Logger.error(`[Quest ID: ${quest.id}] Duplicate Quest ID! Skipping...`);
        continue;
      }

      if (quest.completion.length === 0) {
        Logger.error(
          `[Quest ID: ${quest.id}] No completion criteria set! Skipping...`
        );
        continue;
      }

      this.quests.push(quest);

      if (loggerSettings.verbose) {
        Logger.verbose(`[Quest ID: ${quest.id}] Loaded successfully.`);
      }
    }

    return this.quests;
  }

  public getQuestById(id: number): BaseQuest | undefined {
    const quest = this.quests.find((q) => q.id === id);

    if (!quest) {
      Logger.error(`[Quest ID: ${id}] Quest not found!`);
      return;
    }

    return quest;
  }

  public getQuests(): BaseQuest[] {
    return this.quests;
  }

  public isXpReward(reward: QuestReward): reward is XPReward & RewardChance {
    return (reward as XPReward).xp !== undefined;
  }

  public isItemReward(
    reward: QuestReward
  ): reward is ItemReward & RewardChance {
    return (reward as ItemReward).item !== undefined;
  }
}

export const Quests = new QuestService();
