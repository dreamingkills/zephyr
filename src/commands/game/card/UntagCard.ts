import { Message } from "eris";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";

export default class ResetFrame extends BaseCommand {
  names = ["untagcard", "utc"];
  description = "Removes the tag of a card.";
  usage = ["$CMD$ [cards]"];
  async exec(msg: Message, _profile: GameProfile): Promise<void> {
    if (!this.options[0]) throw new ZephyrError.InvalidCardReferenceError();
    let cards = [];
    const identifiers = this.options;
    for (let i of identifiers) {
      const card = await CardService.getUserCardByIdentifier(i);
      if (card.discordId !== msg.author.id)
        throw new ZephyrError.NotOwnerOfCardError(card);
      cards.push(card);
    }

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
