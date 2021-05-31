import dayjs from "dayjs";
import { DB } from "../../..";
import { MessageEmbed } from "../../../../../structures/client/RichEmbed";
import { Zephyr } from "../../../../../structures/client/Zephyr";
import { GameProfile } from "../../../../../structures/game/Profile";
import { BaseQuest } from "../../../../../structures/game/quest/BaseQuest";
import { GameDBQuest } from "../../../../../structures/game/quest/database/DBQuest";
import { QuestProgression } from "../../../../../structures/game/quest/QuestProgression";
import { GameUserCard } from "../../../../../structures/game/UserCard";
import { createMessage } from "../../../../discord/message/createMessage";
import { Logger } from "../../../../logger/Logger";
import { Quests } from "../../../../quest/Quest";
import { formatQuest } from "../../../../utility/text/TextUtils";
import { CardService } from "../../../services/game/CardService";
import { ProfileService } from "../../../services/game/ProfileService";
import { QuestGetter } from "./QuestGetter";

export async function initQuests(
  profile: GameProfile,
  quests: GameDBQuest[]
): Promise<GameDBQuest[]> {
  const dailyQuests = quests
    .filter((q) => q.quest && q.quest.type === `daily`)
    .map((q) => q.quest!);
  const weeklyQuests = quests
    .filter((q) => q.quest && q.quest.type === `weekly`)
    .map((q) => q.quest!);

  const newDailyQuests: BaseQuest[] = [];
  const newWeeklyQuests: BaseQuest[] = [];

  while (
    dailyQuests.length + newDailyQuests.length <
    Zephyr.modifiers.dailyQuestLimit
  ) {
    const eligibleQuests = Quests.getQuests().filter(
      (q) =>
        ![...dailyQuests, ...newDailyQuests].find((_q) => q.id === _q.id) &&
        q.type === `daily`
    );

    newDailyQuests.push(Zephyr.chance.pickone(eligibleQuests));
  }

  while (
    weeklyQuests.length + newWeeklyQuests.length <
    Zephyr.modifiers.weeklyQuestLimit
  ) {
    const eligibleQuests = Quests.getQuests().filter(
      (q) =>
        ![...weeklyQuests, ...newWeeklyQuests].find((_q) => q.id === _q.id) &&
        q.type === `weekly`
    );

    newWeeklyQuests.push(Zephyr.chance.pickone(eligibleQuests));
  }

  return await populateQuests(profile, [...newDailyQuests, ...newWeeklyQuests]);
}

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
      )}, ${DB.connection.escape(
        quest.type === `daily`
          ? dayjs().startOf(`day`).format(`YYYY-MM-DD`)
          : dayjs().startOf(`week`).format(`YYYY-MM-DD`)
      )})`
    );
  }

  await DB.query(
    `
    INSERT INTO
        quest (discord_id, quest_id, quest_type, completion, created_at)
    VALUES ${questValues.join(`, `)};
    `
  );

  return await QuestGetter.getActiveQuests(profile);
}

export async function progressQuests(
  quests: QuestProgression[],
  profile: GameProfile
): Promise<void> {
  for (let quest of quests) {
    await DB.query(
      `
      UPDATE
        quest
      SET
        quest.progress = ?
      WHERE
        quest.id = ?;
      `,
      [
        quest.progress + quest.increment > quest.completion
          ? quest.completion
          : quest.progress + quest.increment,
        quest.id,
      ]
    );

    if (quest.progress + quest.increment >= quest.completion)
      await completeQuest(quest, profile);
  }

  return;
}

export async function completeQuest(
  quest: GameDBQuest | QuestProgression,
  profile: GameProfile
): Promise<void> {
  const baseQuest = quest.quest!;

  const rewards = baseQuest.rewards;
  const rewardStrings = [];

  let xpReward = 0;

  if (baseQuest.xpReward.min > 0 && baseQuest.xpReward.max > 0) {
    xpReward += Zephyr.chance.integer(baseQuest.xpReward);
  }

  if (rewards.length > 0) {
    const selectedReward = Zephyr.chance.weighted(
      rewards,
      rewards.map((r) => r.chance)
    );

    if (Quests.isXpReward(selectedReward)) {
      xpReward += Zephyr.chance.integer(selectedReward.xp);
    } else if (Quests.isItemReward(selectedReward)) {
      const count = Zephyr.chance.integer({
        min: selectedReward.count.min,
        max: selectedReward.count.max,
      });

      await ProfileService.addItems(profile, [
        { item: selectedReward.item, count },
      ]);

      rewardStrings.push(`**${count}x ${selectedReward.item.names[0]}**`);
    } else {
      Logger.error(`[DBQuest ID: ${quest.id}] No valid reward type found!`);
    }
  }

  let activeCard: GameUserCard | undefined;
  let levelUp = {
    leveledUp: false,
    leveledTo: 0,
  };

  if (xpReward > 0 && profile.activeCard) {
    activeCard = await CardService.getUserCardById(profile.activeCard);

    const multiplier = activeCard.unusual ? 2 : 1;

    const previousLevel = CardService.getLevel(activeCard);

    if (profile.discordId === activeCard.discordId) {
      activeCard = await CardService.addExperience(
        activeCard,
        xpReward * multiplier
      );

      const newLevel = CardService.getLevel(activeCard);

      if (newLevel.level > previousLevel.level)
        levelUp = { leveledUp: true, leveledTo: newLevel.level };

      let baseReward = `**${xpReward.toLocaleString()} XP**`;

      if (activeCard.unusual)
        baseReward += ` *(**+${xpReward.toLocaleString()}** unusual bonus XP)*`;

      rewardStrings.push(baseReward);
    }
  }

  const user = await Zephyr.fetchUser(profile.discordId);

  if (!user) {
    Logger.error(`[DBQuest ID: ${quest.id}] User not found!`);
    return;
  }

  const dmChannel = await user.getDMChannel();

  const embed = new MessageEmbed(`Quest Completed`, user).setDescription(
    `:tada: **Quest Complete!**` +
      `\n\n:white_check_mark: ${formatQuest(quest)}` +
      `\n- You received ${rewardStrings.join(` and `) || `**nothing**`}!` +
      (levelUp.leveledUp && activeCard
        ? `\n\n:chart_with_upwards_trend: \`${activeCard.id.toString(
            36
          )}\` leveled up to **Level ${levelUp.leveledTo}**!`
        : ``)
  );

  if (!activeCard) {
    const prefix = Zephyr.getPrefix();
    embed.setFooter(
      `⚠️ Set an active card with ${prefix}setactive <card> to start gaining exp!`
    );
  }

  await createMessage(dmChannel, embed);

  return;
}

export * as QuestSetter from "./QuestSetter";
