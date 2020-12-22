import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { items } from "../../../assets/items.json";
import { BaseItem } from "../../../structures/game/Item";

export default class DismantleCard extends BaseCommand {
  names = ["dismantle", "d"];
  description = "Dismantles a card, giving you dust and bits in exchange.";
  usage = ["$CMD$ [cards]"];
  async exec(msg: Message, profile: GameProfile): Promise<void> {
    const identifiers = this.options.filter((o) => !o.includes("<@"));
    const cards: GameUserCard[] = [];
    if (identifiers.length === 0) {
      const lastCard = await CardService.getLastCard(profile.discordId);
      cards.push(lastCard);
    }

    for (let ref of identifiers) {
      if (!ref) throw new ZephyrError.InvalidCardReferenceError();
      const card = await CardService.getUserCardByIdentifier(ref);
      if (card.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(card);
      cards.push(card);
    }

    const individualRewards = cards.map((c) => {
      return Math.round(15 * c.luckCoefficient * ((c.wear || 1) * 1.25));
    });
    const bitReward = individualRewards.reduce((acc, bits) => acc + bits);
    const dustRewards: { item: BaseItem; count: number }[] = [];

    const dustItems = items.filter((i) => i.type === "DUST") as BaseItem[];

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

    const tags = await ProfileService.getTags(profile);
    let cardDescriptions = CardService.getCardDescriptions(
      cards.slice(0, 5),
      this.zephyr,
      tags
    );

    let description =
      `Really dismantle **${cards.length}** card${
        cards.length === 1 ? `` : `s`
      }?` +
      `\n${cardDescriptions.join("\n")}` +
      (cards.length > 5
        ? `\n*... and ${(cards.length - 5).toLocaleString()} more ...*`
        : ``) +
      `\n\nYou will receive:` +
      `\n:white_medium_small_square: ${this.zephyr.config.discord.emoji.bits} **${bitReward}**\n` +
      dustRewards
        .map(
          (r) =>
            `:white_medium_small_square: **${r.count}x** \`${r.item.name}\``
        )
        .join("\n");

    const embed = new MessageEmbed()
      .setAuthor(
        `Dismantle | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(description);

    const conf = await msg.channel.createMessage({ embed });

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 15000,
      max: 1,
    });

    collector.on("collect", async () => {
      // We need to check that this user is still the owner, or they can dupe bits
      for (let card of cards) {
        const refetchCard = await CardService.getUserCardById(card.id);
        if (refetchCard.discordId !== msg.author.id) {
          await conf.edit({
            embed: embed.setFooter(
              `⚠️ ${card.id.toString(36)} does not belong to you.`
            ),
          });
          return;
        }
      }

      // Give the card to the bot
      await CardService.dismantleCards(cards, this.zephyr);

      // Give the user their dust
      await ProfileService.addItems(profile, dustRewards);

      const newProfile = await ProfileService.addBitsToProfile(
        profile,
        bitReward
      );

      await conf.edit({
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
        await conf.edit({
          embed: embed.setFooter(`🕒 This destruction has expired.`),
        });
      }
      try {
        await conf.removeReactions();
      } catch {}
    });

    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);
  }
}
