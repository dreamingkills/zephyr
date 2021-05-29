import { GameDBQuest } from "./database/DBQuest";

export type QuestProgression = GameDBQuest & { increment: number };
