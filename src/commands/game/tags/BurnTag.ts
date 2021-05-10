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
import { isDeveloper } from "../../../lib/ZephyrUtils";
import { Zephyr } from "../../../structures/client/Zephyr";

export default class BurnTag extends BaseCommand {
  id = `refuse`;
  names = [`burntag`, `bt`];
  description = `Burns all the cards in a specific tag.`;
  usage = [`$CMD$ <tag>`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!Zephyr.flags.burns && !isDeveloper(msg.author))
      throw new ZephyrError.BurnFlagDisabledError();

    if (!options[0]) throw new ZephyrError.UnspecifiedBurnTagsError();

    const tags = await ProfileService.getTags(profile);
    const query = tags.filter(
      (t) => t.name.toLowerCase() === options.join(" ").toLowerCase()
    )[0];

    if (!query) throw new ZephyrError.TagNotFoundError(options[0]);

    const cardsRaw = await CardService.getCardsByTag(query, profile);

    const cards: GameUserCard[] = [];
    const inAlbum: GameUserCard[] = [];
    for (let card of cardsRaw) {
      const isInAlbum = await AlbumService.cardIsInAlbum(card);

      if (isInAlbum) {
        inAlbum.push(card);
      } else cards.push(card);
    }

    if (cards.length < 1 && inAlbum.length === 0) {
      throw new ZephyrError.NoCardsTaggedError(query);
    } else if (cards.length < 1 && inAlbum.length > 0) {
      throw new ZephyrError.NoAvailableCardsTaggedError(query, inAlbum.length);
    }

    /*let totalBitValue = 0;

    for (let card of cards) {
      const bitValue = await CardService.calculateBurnValue(card);

      totalBitValue += bitValue;
    }*/

    const individualRewards = [
      0,
      ...cards.map((c) => {
        return Math.round(15 * c.luckCoefficient * ((c.wear || 1) * 1.25));
      }),
    ];
    const totalBitValue = individualRewards.reduce((acc, bits) => acc + bits);

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

    const descs = await getDescriptions(cards.slice(0, 5), tags);
    const excess = Math.max(cards.length - 5, 0);

    let description =
      `Really burn **${cards.length.toLocaleString()} card${
        cards.length === 1 ? `` : `s`
      }** tagged ${query.emoji} \`${query.name}\`?\n` +
      descs.join("\n") +
      (excess > 0 ? `\n*... and ${excess.toLocaleString()} more ...*` : ``) +
      `\n\nYou will receive:` +
      `\n:white_medium_small_square: ${Zephyr.config.discord.emoji.bits} **${totalBitValue}**\n` +
      dustRewards
        .map(
          (r) =>
            `:white_medium_small_square: **${r.count}x** \`${r.item.names[0]}\``
        )
        .join("\n") +
      (inAlbum.length > 0
        ? `\n\n*${inAlbum.length} card${
            inAlbum.length === 1 ? ` is in an album` : `s are in albums`
          } and cannot be burned.*`
        : ``);

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
          throw new ZephyrError.NotOwnerOfCardError(card);
      }

      // Give the card to the bot
      await CardService.burnCards(profile, cards);

      // Give the user their dust
      await ProfileService.addItems(profile, dustRewards);

      const newProfile = await ProfileService.addBitsToProfile(
        profile,
        totalBitValue
      );

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
