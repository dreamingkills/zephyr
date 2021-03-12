import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { AnticheatService } from "../../../lib/database/services/meta/AnticheatService";
import { getDescriptions } from "../../../lib/utility/text/TextUtils";
import { AlbumService } from "../../../lib/database/services/game/AlbumService";
import { checkPermission } from "../../../lib/ZephyrUtils";

export default class GiftCard extends BaseCommand {
  names = ["gift", "give"];
  description = "Gives your card(s) to someone else.";
  usage = ["$CMD$ <card> <mention>"];
  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!this.zephyr.flags.trades)
      throw new ZephyrError.TradeFlagDisabledError();

    const identifiers = options.filter((o) => !o.includes("<@"));
    const cards: GameUserCard[] = [];
    if (identifiers.length === 0) {
      const lastCard = await CardService.getLastCard(profile);
      cards.push(lastCard);
    }

    for (let ref of identifiers) {
      if (!ref) throw new ZephyrError.InvalidCardReferenceError();

      const card = await CardService.getUserCardByIdentifier(ref);
      if (cards.find((c) => c.id === card.id)) continue;

      if (card.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(card);

      const isInAlbum = await AlbumService.cardIsInAlbum(card);
      if (isInAlbum) throw new ZephyrError.CardInAlbumError(card);

      cards.push(card);
    }

    const giftee = msg.mentions[0];
    if (!giftee) throw new ZephyrError.InvalidMentionError();

    if (giftee.id === msg.author.id)
      throw new ZephyrError.CannotGiftAuthorError();

    const gifteeProfile = await ProfileService.getProfile(giftee.id);

    if (gifteeProfile.blacklisted)
      throw new ZephyrError.AccountBlacklistedOtherError();

    const tags = await ProfileService.getTags(profile);

    const cardDescriptions = getDescriptions(
      cards.slice(0, 5),
      this.zephyr,
      tags
    );

    const embed = new MessageEmbed(`Gift`, msg.author)
      .setTitle(
        `Really gift ${cards.length} card${cards.length === 1 ? `` : `s`} to ${
          giftee.tag
        }?`
      )
      .setDescription(
        cardDescriptions.join("\n") +
          (cards.length > 5 ? `\n*... and ${cards.length - 5} more...*` : ``)
      );

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
      for (let card of cards) {
        const refetchCard = await card.fetch();
        if (refetchCard.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(refetchCard);
      }

      await CardService.transferCardsToUser(cards, gifteeProfile);
      await AnticheatService.logGift(
        profile,
        gifteeProfile,
        cards,
        msg.guildID!
      );

      await confirmation.edit({
        embed: embed.setFooter(
          `🎁 ${cards.length} card${
            cards.length === 1 ? ` has` : `s have`
          } been gifted.`
        ),
      });
      return;
    });

    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await confirmation.edit({
          embed: embed.setFooter(`🕒 This gift offer has expired.`),
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
