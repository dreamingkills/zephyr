import { Message, PartialEmoji } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";

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
    const dustReward = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const tags = await ProfileService.getTags(profile);
    let cardDescriptions = CardService.getCardDescriptions(
      cards,
      this.zephyr,
      tags
    );

    let description =
      `Really dismantle **${cards.length}** card${
        cards.length === 1 ? `` : `s`
      }?` +
      `\n${cardDescriptions.join("\n")}\n` +
      `\nYou will receive:` +
      `\n:white_medium_small_square: ${this.zephyr.config.discord.emoji.bits} **${bitReward}**`;

    for (let [dust, count] of Object.entries(dustReward)) {
      if (count === 0) continue;
      description += `\n:white_medium_small_square: **${count}x** Dust [\`${"★"
        .repeat(parseInt(dust))
        .padEnd(5, "☆")}\`]`;
    }

    const embed = new MessageEmbed()
      .setAuthor(
        `Dismantle | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(description);

    const conf = await msg.channel.createMessage({ embed });
    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);

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
        if (refetchCard.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(refetchCard);
      }

      // Give the card to the bot
      await CardService.dismantleCards(cards, this.zephyr);

      for (let [dust, count] of Object.entries(dustReward)) {
        if (count === 0) continue;
        await ProfileService.addDustToProfile(
          parseInt(dust, 10) as 1 | 2 | 3 | 4 | 5,
          count,
          profile
        );
      }

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
  }
}
