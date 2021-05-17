import { DB } from "../../..";
import { Zephyr } from "../../../../../structures/client/Zephyr";
import { GameProfile } from "../../../../../structures/game/Profile";
import { BaseQuest } from "../../../../../structures/game/quest/BaseQuest";
import { GameDBQuest } from "../../../../../structures/game/quest/database/DBQuest";
import { QuestGetter } from "./QuestGetter";

export async function populateQuests(
  profile: GameProfile,
  quests: BaseQuest[]
): Promise<GameDBQuest[]> {
  const questValues = [];

  for (let quest of quests) {
    const completion = Zephyr.chance.pickone(quest.completion);

    questValues.push(
      `(${DB.connection.escape(profile.discordId)}, ${DB.connection.escape(
        quest.id
      )}, ${DB.connection.escape(quest.type)}, ${DB.connection.escape(
        completion
      )})`
    );
  }

  await DB.query(
    `
    INSERT INTO
        quest (discord_id, quest_id, quest_type, completion)
    VALUES ${questValues.join(`, `)};
    `
  );

  return await QuestGetter.getActiveQuests(profile);
}

export * as QuestSetter from "./QuestSetter";
