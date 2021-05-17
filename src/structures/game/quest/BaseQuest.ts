import { QuestObjective } from "./QuestObjective";
import { QuestReward } from "./QuestReward";

export interface BaseQuest {
  id: number;
  type: QuestType;
  description: string;
  objective: QuestObjective;
  completion: number[];
  rewards: QuestReward[];
}

export type QuestType = `daily` | `weekly`;
