import { Message } from "eris";
import { CardService } from "../../../lib/database/services/game/CardService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";

export default class GiftCard extends BaseCommand {
  names = ["gift", "give"];
  description = "Gives your card(s) to someone else.";
  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    const refs = this.options.filter((o) => o.includes("#"));
    if (refs.length === 0) {
    }
    const references = refs.map((r) => {
      return {
        identifier: r.split("#")[0]?.toUpperCase(),
        serialNumber: parseInt(r.split("#")[1], 10),
      };
    });
    const cards = [];
    for (let ref of references) {
      if (!ref.identifier || isNaN(ref.serialNumber))
        throw new ZephyrError.InvalidCardReferenceError();
      const card = await CardService.getUserCardByReference(ref);
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

    await CardService.transferCardsToUser(cards, gifteeProfile);

    /*const conf = await msg.channel.createMessage(
      `${this.zephyr.config.discord.emoji.warn} Really gift **${cards.length}** cards to **${giftee.tag}**?`
    );
    console.log(this.zephyr.config.discord.emojiId.check);
    const emoji = await this.zephyr.getRESTGuildEmoji(
      "762137263730720768",
      "782328785450041344"
    );
    await conf.addReaction(emoji.id);

    const userCard = await CardService.getUserCardByReference(reference);
    const baseCard = this.zephyr.getCard(userCard.baseCardId);
    if (userCard.discordId !== msg.author.id)
      throw new ZephyrError.NotOwnerOfCardError(userCard);
    const image = await CardService.checkCacheForCard(userCard);

    const embed = new MessageEmbed()
      .setAuthor(
        `Card View | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `\n—${baseCard.group ? ` **${baseCard.group}**` : ""} **${
          baseCard.name
        }** ${baseCard.subgroup ? ` (${baseCard.subgroup})` : ``} #${
          userCard.serialNumber
        }` +
          `\n— Tier **${userCard.tier}**` +
          `\n${baseCard.flavor ? `*${baseCard.flavor}*` : ``}`
      );
    await msg.channel.createMessage(
      { embed },
      {
        file: image,
        name: "card.png",
      }
    );*/
  }
}
