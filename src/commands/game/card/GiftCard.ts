import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class GiftCard extends BaseCommand {
  names = ["gift", "give"];
  description = "Gives your card(s) to someone else.";
  usage = ["$CMD$ <card> <mention>"];
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

    const giftee = msg.mentions[0];
    if (!giftee)
      throw new ZephyrError.InvalidMentionGiftError(cards.length > 1);
    if (giftee.id === msg.author.id)
      throw new ZephyrError.CannotGiftAuthorError();

    const gifteeProfile = await ProfileService.getProfile(giftee.id);

    const tags = await ProfileService.getTags(profile);
    const cardDescriptions = CardService.getCardDescriptions(
      cards,
      this.zephyr,
      tags
    );

    const embed = new MessageEmbed()
      .setAuthor(`Gift | ${msg.author.tag}`, msg.author.dynamicAvatarURL("png"))
      .setTitle(
        `Really gift ${cards.length} card${cards.length === 1 ? `` : `s`} to ${
          giftee.tag
        }?`
      )
      .setDescription(cardDescriptions.join("\n"));
    const conf = await msg.channel.createMessage({ embed });
    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 30000,
      max: 1,
    });
    collector.on("collect", async () => {
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

      await CardService.transferCardsToUser(cards, gifteeProfile);
      await conf.edit({
        embed: embed.setFooter(
          `🎁 ${cards.length} card${
            cards.length === 1 ? ` has` : `s have`
          } been gifted.`
        ),
      });
      collector.en;
      return;
    });
    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit({
          embed: embed.setFooter(`🕒 This gift offer has expired.`),
        });
        await conf.removeReaction(
          `check:${this.zephyr.config.discord.emojiId.check}`,
          this.zephyr.user.id
        );
        return;
      }
    });
  }
}
