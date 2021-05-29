import { Message, PartialEmoji, User } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { Chance } from "chance";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { Dust } from "../../../structures/game/Dust";
import { items } from "../../../assets/Items";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { checkPermission } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";
import { QuestGetter } from "../../../lib/database/sql/game/quest/QuestGetter";
import { QuestSetter } from "../../../lib/database/sql/game/quest/QuestSetter";
import { QuestObjective } from "../../../structures/game/quest/QuestObjective";
import { QuestProgression } from "../../../structures/game/quest/QuestProgression";

export default class UpgradeCard extends BaseCommand {
  id = `sunshine`;
  names = [`upgrade`, `u`];
  description = `Use dust to have a chance to increase your card's condition.`;
  usage = [`$CMD$ <card>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    const reference = options[0];
    let card: GameUserCard;
    if (!reference) {
      const lastCard = await CardService.getLastCard(profile);
      card = lastCard;
    } else {
      const getCard = await CardService.getUserCardByIdentifier(reference);
      card = getCard;
    }

    if (card.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(card);

    if (card.wear === 5) throw new ZephyrError.CardBestConditionError(card);

    const dustTier = (card.wear + 1) as Dust;
    const dustCost = Zephyr.config.testing ? 0 : 5;
    const successChance = [80, 70, 60, 50, 40][card.wear];
    const bitCost = Zephyr.config.testing
      ? 0
      : [75, 150, 250, 400, 600][card.wear];

    if (bitCost > profile.bits)
      throw new ZephyrError.NotEnoughBitsError(bitCost);

    const dustItem = items.filter((i) => i.names[0].includes("Dust"))[
      card.wear
    ];

    if (dustCost > 0) {
      const dustUserItem = await ProfileService.getItem(
        profile,
        dustItem.id,
        dustItem.names[0]
      );

      if (dustCost > dustUserItem.quantity)
        throw new ZephyrError.NotEnoughDustError(
          dustUserItem.quantity,
          dustCost,
          dustTier
        );
    }

    let cost = `This upgrade will cost...\n`;

    if (dustCost === 0 && bitCost === 0) {
      cost = `This upgrade is free.`;
    } else {
      if (dustCost > 0) {
        cost += `\n— **${dustCost.toLocaleString()}x** \`${
          dustItem.names[0]
        }\``;
      }
      if (bitCost > 0) {
        cost += `\n— **${
          Zephyr.config.discord.emoji.bits
        } ${bitCost.toLocaleString()}**`;
      }
    }

    const tags = await ProfileService.getTags(profile);
    const embed = new MessageEmbed(`Upgrade`, msg.author)
      .setDescription(
        `Are you sure you want to upgrade this card?` +
          `\n${await getDescriptions([card], tags)}` +
          `\n\n${cost}`
      )
      .setFooter(`🎲 Chance of success: ${successChance}%`);

    const confirmation = await this.send(msg.channel, embed);

    const confirmed: boolean = await new Promise(async (res) => {
      const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
        user.id === msg.author.id && emoji.name === `☑️`;

      const collector = new ReactionCollector(Zephyr, confirmation, filter, {
        time: 15000,
        max: 1,
      });

      collector.on("error", async (e: Error) => {
        await this.handleError(msg, msg.author, e);
        res(false);
      });

      collector.on("collect", async () => {
        res(true);
      });

      collector.on("end", async (_collected: unknown) => {
        res(false);
      });

      await this.react(confirmation, `☑️`);
    });

    if (!confirmed) {
      await this.edit(
        confirmation,
        embed.setFooter(`🕒 This upgrade confirmation has expired.`)
      );

      if (checkPermission(`manageMessages`, msg.channel))
        await confirmation.removeReactions();
      return;
    }

    // We need to check that this user is still the owner, or they can do some nasty stuff
    const refetchCard = await card.fetch();

    if (refetchCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(refetchCard);

    if (refetchCard.wear !== card.wear)
      throw new ZephyrError.UpgradeFailedError();

    if (dustCost > 0) {
      await ProfileService.removeItems(profile, [
        { item: dustItem, count: dustCost },
      ]);
    }
    if (bitCost > 0) {
      await ProfileService.removeBitsFromProfile(profile, bitCost);
    }

    const chance = new Chance();
    const success = chance.bool({ likelihood: successChance });

    if (success) {
      await CardService.increaseCardWear(card);
      await confirmation.edit({
        embed: embed.setFooter(`🎉 The upgrade succeeded!`),
      });

      if (refetchCard.wear + 1 === 5) {
        const progressableQuests = await QuestGetter.checkAvailableQuestsForProgress(
          profile,
          QuestObjective.UPGRADE_TO_MINT
        );

        if (progressableQuests.length > 0) {
          const progressions = progressableQuests.map((q) => {
            return { ...q, increment: 1 } as QuestProgression;
          });

          await QuestSetter.progressQuests(progressions, profile);
        }
      }
    } else {
      await confirmation.edit({
        embed: embed.setFooter(`😕 The upgrade failed.`),
      });
    }

    if (checkPermission(`manageMessages`, msg.channel))
      await confirmation.removeReactions();

    return;
  }
}
