import { Message, PartialEmoji } from "eris";
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

export default class UpgradeCard extends BaseCommand {
  names = ["upgrade", "u"];
  description = "Use dust to have a chance to increase your card's condition.";
  usage = ["$CMD$ <card>"];
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
    const dustCost = 5;
    const successChance = [80, 70, 60, 50, 40][card.wear];
    const bitCost = [75, 150, 250, 400, 600][card.wear];

    if (bitCost > profile.bits)
      throw new ZephyrError.NotEnoughBitsToUpgradeError(bitCost);

    const dustItem = items.filter((i) => i.names[0].includes("Dust"))[
      card.wear
    ];
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

    const tags = await ProfileService.getTags(profile);
    const embed = new MessageEmbed(`Upgrade`, msg.author)
      .setDescription(
        `Are you sure you want to upgrade this card?` +
          `\n${getDescriptions([card], this.zephyr, tags)}` +
          `\n\nThis will cost...` +
          `\n— **${dustCost.toLocaleString()}x** \`${dustItem.names[0]}\`` +
          `\n— **${
            this.zephyr.config.discord.emoji.bits
          } ${bitCost.toLocaleString()}**`
      )
      .setFooter(`🎲 Chance of success: ${successChance}%`);

    const confirmation = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, confirmation, filter, {
      time: 15000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner, or they can do some nasty stuff
      const refetchCard = await card.fetch();
      if (refetchCard.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(refetchCard);

      await ProfileService.removeItems(profile, [
        { item: dustItem, count: dustCost },
      ]);
      await ProfileService.removeBitsFromProfile(profile, bitCost);

      const chance = new Chance();
      const success = chance.bool({ likelihood: successChance });

      if (success) {
        await CardService.increaseCardWear(card);
        await confirmation.edit({
          embed: embed.setFooter(`🎉 The upgrade succeeded!`),
        });
      } else {
        await confirmation.edit({
          embed: embed.setFooter(`😕 The upgrade failed.`),
        });
      }
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This confirmation has expired.`),
        });
      }

      if (checkPermission(`manageMessages`, msg.channel, this.zephyr))
        await confirmation.removeReactions();
    });

    await this.react(
      confirmation,
      `check:${this.zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
