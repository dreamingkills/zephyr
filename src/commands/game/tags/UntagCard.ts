import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class UntagCard extends BaseCommand {
  names = ["untag", "ut"];
  description = "Removes the tag of a card.";
  usage = ["$CMD$ [cards]"];
  allowDm = true;

  async exec(
    msg: Message,
    _profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.InvalidCardReferenceError();
    const cardsRaw = [];
    const identifiers = options;
    for (let i of identifiers) {
      const card = await CardService.getUserCardByIdentifier(i);
      if (card.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(card);

      cardsRaw.push(card);
    }

    const cards = cardsRaw.filter((c) => c.tagId);

    if (cards.length === 0)
      throw new ZephyrError.CardsNotTaggedError(cardsRaw.length > 1);

    await CardService.unsetCardsTag(cards);
    const embed = new MessageEmbed()
      .setAuthor(
        `Tagging | ${msg.author.tag}`,
        msg.author.dynamicAvatarURL("png")
      )
      .setDescription(
        `Removed tags from **${cards.length}** card${
          cards.length > 1 ? `s` : ``
        }.`
      );
    await msg.channel.createMessage({ embed });
  }
}
