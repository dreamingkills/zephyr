import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { items } from "../../../assets/items";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { PrefabItem } from "../../../structures/item/PrefabItem";

export default class BurnTag extends BaseCommand {
  names = ["burntag", "bt"];
  description = "Burns all the cards in a tag.";
  usage = ["$CMD$ <tag>"];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.UnspecifiedBurnTagsError();

    const tags = await ProfileService.getTags(profile);
    const query = tags.filter(
      (t) => t.name.toLowerCase() === options.join(" ").toLowerCase()
    )[0];

    if (!query) throw new ZephyrError.InvalidTagError(options[0]);

    const cards = await CardService.getCardsByTag(query, profile);
    if (cards.length < 1) throw new ZephyrError.NoCardsTaggedError(query);

    const individualRewards = cards.map((c) => {
      return Math.round(15 * c.luckCoefficient * ((c.wear || 1) * 1.25));
    });
    const bitReward = individualRewards.reduce((acc, bits) => acc + bits);
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

    const descs = getDescriptions(cards.slice(0, 5), this.zephyr, tags);
    const excess = Math.max(cards.length - 5, 0);

    let description =
      `Really burn **${cards.length.toLocaleString()} card${
        cards.length === 1 ? `` : `s`
      }** tagged ${query.emoji} \`${query.name}\`?\n` +
      descs.join("\n") +
      (excess > 0 ? `\n*... and ${excess.toLocaleString()} more ...*` : ``) +
      `\n\nYou will receive:` +
      `\n:white_medium_small_square: ${this.zephyr.config.discord.emoji.bits} **${bitReward}**\n` +
      dustRewards
        .map(
          (r) =>
            `:white_medium_small_square: **${r.count}x** \`${r.item.names[0]}\``
        )
        .join("\n");

    const embed = new MessageEmbed()
      .setAuthor(
        `Bulk Burn | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(description);

    const confirmation = await this.send(msg.channel, embed);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, confirmation, filter, {
      time: 30000,
      max: 1,
    });
    collector.on("error", async (e: Error) => {
      await this.handleError(msg, e);
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner, or they can dupe bits
      for (let card of cards) {
        const refetchCard = await card.fetch();
        if (refetchCard.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(card);
      }

      // Give the card to the bot
      await CardService.burnCards(cards, this.zephyr);

      // Give the user their dust
      await ProfileService.addItems(profile, dustRewards);

      const newProfile = await ProfileService.addBitsToProfile(
        profile,
        bitReward
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
          `check:${this.zephyr.config.discord.emojiId.check}`,
          this.zephyr.user.id
        );
        return;
      }
    });

    await this.react(
      confirmation,
      `check:${this.zephyr.config.discord.emojiId.check}`
    );
    return;
  }
}
