import { QuestObjective } from "./QuestObjective";
import { QuestReward, RewardCount } from "./QuestReward";

export interface BaseQuest {
  id: number;
  type: QuestType;
  description: string;
  objective: QuestObjective;
  completion: number[];
  xpReward: RewardCount;
  rewards: QuestReward[];
}

export type QuestType = `daily` | `weekly`;
