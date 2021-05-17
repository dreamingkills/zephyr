import { PrefabItem } from "../../item/PrefabItem";

type RewardCount = { min: number; max: number };

export type BaseQuestReward =
  | { xp: RewardCount }
  | { item: PrefabItem; count: RewardCount };

export type QuestReward = BaseQuestReward & { chance: number };
