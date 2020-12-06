import { Message, PartialEmoji } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { ReactionCollector } from "eris-collector";
import { GameUserCard } from "../../../structures/game/UserCard";
import { parseIdentifier } from "../../../lib/ZephyrUtils";

export default class GiftCard extends BaseCommand {
  names = ["gift", "give"];
  description = "Gives your card(s) to someone else.";
  usage = ["$CMD$ <card> <mention>"];
  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const identifiers = this.options.filter((o) => !o.includes("<@"));
    if (identifiers.length === 0)
      throw new ZephyrError.InvalidCardReferenceError();

    const cards: GameUserCard[] = [];
    for (let ref of identifiers) {
      if (!ref) throw new ZephyrError.InvalidCardReferenceError();
      const id = parseIdentifier(ref);
      if (isNaN(id)) throw new ZephyrError.InvalidCardReferenceError();
      const card = await CardService.getUserCardById(id);
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

    const conf = await msg.channel.createMessage(
      `${this.zephyr.config.discord.emoji.warn} Really gift **${cards.length}** cards to **${giftee.tag}**?`
    );
    await conf.addReaction(`check:${this.zephyr.config.discord.emojiId.check}`);

    const filter = (_m: Message, emoji: PartialEmoji, userId: string) =>
      userId === msg.author.id &&
      emoji.id === this.zephyr.config.discord.emojiId.check;
    const collector = new ReactionCollector(this.zephyr, conf, filter, {
      time: 30000,
      max: 1,
    });
    collector.on("collect", async () => {
      await CardService.transferCardsToUser(cards, gifteeProfile);
      await conf.edit(
        `${this.zephyr.config.discord.emoji.check} Gifted **${cards.length}** cards to **${giftee.tag}**.`
      );
      collector.en;
      return;
    });
    collector.on("end", async (_collected: unknown, reason: string) => {
      if (reason === "time") {
        await conf.edit(
          `${this.zephyr.config.discord.emoji.warn} Did not gift any cards.`
        );
        await conf.removeReaction(
          `check:${this.zephyr.config.discord.emojiId.check}`,
          this.zephyr.user.id
        );
        return;
      }
    });
  }
}
