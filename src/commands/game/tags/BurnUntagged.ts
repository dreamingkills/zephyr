import { Message, PartialEmoji, User } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { items } from "../../../assets/Items";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { PrefabItem } from "../../../structures/item/PrefabItem";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { GameUserCard } from "../../../structures/game/UserCard";
import { Zephyr } from "../../../structures/client/Zephyr";
import { QuestGetter } from "../../../lib/database/sql/game/quest/QuestGetter";
import { QuestSetter } from "../../../lib/database/sql/game/quest/QuestSetter";
import { QuestObjective } from "../../../structures/game/quest/QuestObjective";
import { QuestProgression } from "../../../structures/game/quest/QuestProgression";

export default class BurnUntagged extends BaseCommand {
  id = `firefox`;
  names = [`burnuntagged`, `bu`];
  description = `Burns all untagged cards in your inventory.`;
  usage = [`$CMD$`];
  allowDm = true;

  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const cardsRaw = await CardService.getUntaggedCards(profile);

    const cards: GameUserCard[] = [];
    for (let card of cardsRaw) {
      const isInAlbum = await AlbumService.cardIsInAlbum(card);
      if (!isInAlbum) cards.push(card);
    }

    if (cards.length < 1) throw new ZephyrError.NoUntaggedCardsError();

    /*let totalBitValue = 0;

    for (let card of cards) {
      const bitValue = await CardService.calculateBurnValue(card);

      totalBitValue += bitValue;
    }*/

    let totalBitValue = 0;

    for (let card of cards) {
      totalBitValue += await CardService.calculateBurnValue(card);
    }

    const dustRewards: { item: PrefabItem; count: number }[] = [];

    const dustItems = items.filter((i) =>
      i.names.find((n) => n.includes("Dust"))
    ) as PrefabItem[];

    for (let card of cards) {
      if (card.wear === 0) continue;
      const targetDustItem = dustItems[card.wear - 1];

      const dustRewardsQuery = dustRewards.filter(
        (r) => r.item.id === targetDustItem.id
      )[0];
      if (dustRewardsQuery) {
        dustRewards[dustRewards.indexOf(dustRewardsQuery)] = {
          item: targetDustItem,
          count: dustRewardsQuery.count + 1,
        };
      } else {
        dustRewards.push({ item: targetDustItem, count: 1 });
      }
    }

    const descs = await getDescriptions(cards.slice(0, 5), []);

    const excess = Math.max(cards.length - 5, 0);

    let description =
      `Really burn **${cards.length.toLocaleString()} card${
        cards.length === 1 ? `` : `s`
      }** with **no tag**?\n` +
      descs.join("\n") +
      (excess > 0 ? `\n*... and ${excess.toLocaleString()} more ...*` : ``) +
      `\n\nYou will receive:` +
      `\n:white_medium_small_square: ${Zephyr.config.discord.emoji.bits} **${totalBitValue}**\n` +
      dustRewards
        .map(
          (r) =>
            `:white_medium_small_square: **${r.count}x** \`${r.item.names[0]}\``
        )
        .join("\n");

    const embed = new MessageEmbed(`Bulk Burn`, msg.author).setDescription(
      description
    );

    const confirmation = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, user: User) =>
      user.id === msg.author.id &&
      emoji.id === Zephyr.config.discord.emojiId.check;

    const collector = new ReactionCollector(Zephyr, confirmation, filter, {
      time: 30000,
      max: 1,
    });

    collector.on("error", async (e: Error) => {
      await this.handleError(msg, msg.author, e);
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner, or they can dupe bits
      for (let card of cards) {
        const refetchCard = await card.fetch();
        if (refetchCard.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(refetchCard);
      }

      // Give the card to the bot
      await CardService.burnCards(cards, profile);

      // Give the user their dust
      await ProfileService.addItems(profile, dustRewards);

      const newProfile = await ProfileService.addBitsToProfile(
        profile,
        totalBitValue
      );

      const progressableQuests = await QuestGetter.checkAvailableQuestsForProgress(
        profile,
        QuestObjective.BURN_CARD
      );

      if (progressableQuests.length > 0) {
        const progressions = progressableQuests.map((q) => {
          return { ...q, increment: cards.length } as QuestProgression;
        });

        await QuestSetter.progressQuests(progressions, profile);
      }

      await confirmation.edit({
        embed: embed.setFooter(
          `🔥 ${cards.length} card${
            cards.length === 1 ? ` has` : `s have`
          } been destroyed.\nYou now have ${newProfile.bits.toLocaleString()} bits.`
        ),
      });
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This destruction has expired.`),
        });
        await confirmation.removeReaction(
          `check:${Zephyr.config.discord.emojiId.check}`,
          Zephyr.user.id
        );
        return;
      }
    });

    await this.react(
      confirmation,
      `check:${Zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
