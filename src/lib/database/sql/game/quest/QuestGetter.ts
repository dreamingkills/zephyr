import { DB } from "../../..";
import { GameProfile } from "../../../../../structures/game/Profile";
import {
  DBQuest,
  GameDBQuest,
} from "../../../../../structures/game/quest/database/DBQuest";
import { QuestObjective } from "../../../../../structures/game/quest/QuestObjective";

export async function getDBQuestById(id: number): Promise<GameDBQuest> {
  const quests = (await DB.query(
    `
    SELECT
        quest.id,
        quest.discord_id,
        quest.created_at,
        quest.quest_id,
        quest.quest_type,
        quest.progress,
        quest.completion
    FROM
        quest
    WHERE
        quest.id = ?;
    `,
    [id]
  )) as DBQuest[];

  return quests.map((q) => new GameDBQuest(q))[0];
}

export async function getQuests(profile: GameProfile): Promise<GameDBQuest[]> {
  const quests = (await DB.query(
    `
    SELECT
        quest.id,
        quest.discord_id,
        quest.created_at,
        quest.quest_id,
        quest.quest_type,
        quest.progress,
        quest.completion
    FROM
        quest
    WHERE
        discord_id = ?;
    `,
    [profile.discordId]
  )) as DBQuest[];

  return quests.map((q) => new GameDBQuest(q));
}

export async function getActiveQuests(
  profile: GameProfile
): Promise<GameDBQuest[]> {
  const quests = (await DB.query(
    `
    SELECT
        quest.id,
        quest.discord_id,
        quest.created_at,
        quest.quest_id,
        quest.quest_type,
        quest.progress,
        quest.completion
    FROM
        quest
    WHERE
        discord_id = ?
    AND
    (
        (
            quest.quest_type = "daily"
            AND
            quest.created_at > (DATE(CURRENT_TIMESTAMP) - INTERVAL 1 DAY)
        )
        OR
        (
            quest.quest_type = "weekly"
            AND
            quest.created_at > (DATE(CURRENT_TIMESTAMP) - INTERVAL 7 DAY)
        )
    );
    `,
    [profile.discordId]
  )) as DBQuest[];

  return quests.map((q) => new GameDBQuest(q));
}

export async function checkAvailableQuestsForProgress(
  profile: GameProfile,
  action: QuestObjective
): Promise<GameDBQuest[]> {
  const activeQuests = await getActiveQuests(profile);

  if (activeQuests.length < 1) return [];

  const eligibleQuests = activeQuests.filter(
    (q) => q.progress < q.completion && q.quest?.objective === action
  );

  return eligibleQuests;
}

export * as QuestGetter from "./QuestGetter";
