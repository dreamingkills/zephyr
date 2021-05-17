import { Quests } from "../../../../lib/quest/Quest";
import { BaseQuest, QuestType } from "../BaseQuest";

export interface DBQuest {
  id: number;
  discord_id: string;
  created_at: string;

  quest_id: number;
  quest_type: QuestType;
  progress: number;
  completion: number;
}

export class GameDBQuest {
  id: number;
  discordId: string;
  createdAt: string;

  quest: BaseQuest | undefined; // ?? weird typing
  progress: number;
  completion: number;

  constructor(quest: DBQuest) {
    this.id = quest.id;
    this.discordId = quest.discord_id;
    this.createdAt = quest.created_at;

    this.quest = Quests.getQuestById(quest.quest_id);
    this.progress = quest.progress;
    this.completion = quest.completion;
  }
}
