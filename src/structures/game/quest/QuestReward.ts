import { PrefabItem } from "../../item/PrefabItem";

export type RewardCount = { min: number; max: number };

export type XPReward = { xp: RewardCount };
export type ItemReward = { item: PrefabItem; count: RewardCount };

export type BaseQuestReward = XPReward | ItemReward;
export type RewardChance = { chance: number };

export type QuestReward = BaseQuestReward & RewardChance;
