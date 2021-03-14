import { Message } from "eris";
import { ProfileService } from "../../../lib/database/services/game/ProfileService";
import { BaseCommand } from "../../../structures/command/Command";
import { GameProfile } from "../../../structures/game/Profile";
import * as ZephyrError from "../../../structures/error/ZephyrError";
import { CardService } from "../../../lib/database/services/game/CardService";
import { MessageEmbed } from "../../../structures/client/RichEmbed";
import { GameUserCard } from "../../../structures/game/UserCard";

export default class TagCard extends BaseCommand {
  names = [`tag`, `tc`];
  description = `Adds a tag to a card. If a card is already tagged, it will be replaced with the tag you specify.`;
  usage = [`$CMD$ <tag> [cards]`];
  allowDm = true;

  async exec(
    msg: Message,
    profile: GameProfile,
    options: string[]
  ): Promise<void> {
    if (!options[0]) throw new ZephyrError.UnspecifiedTagError();

    const tags = await ProfileService.getTags(profile);

    if (tags.length === 0) {
      const prefix = this.zephyr.getPrefix(msg.guildID);
      throw new ZephyrError.NoTagsError(prefix);
    }

    const tagName = options[0].toLowerCase();

    const tag = tags.find((t) => t.name === tagName);

    if (!tag) throw new ZephyrError.TagNotFoundError(tagName);

    let cards: GameUserCard[] = [];
    if (!options[1]) {
      const card = await CardService.getLastCard(profile);

      if (card.tagId === tag.id)
        throw new ZephyrError.CardAlreadyTaggedError(tag, card);

      cards.push(card);
    } else {
      const identifiers = options.slice(1);
      for (let i of identifiers) {
        const card = await CardService.getUserCardByIdentifier(i);

        if (cards.find((c) => c.id === card.id)) continue; // No duplicates

        if (card.discordId !== msg.author.id)
          throw new ZephyrError.NotOwnerOfCardError(card);

        if (card.tagId === tag.id) continue; // Don't bother tagging it if it's already tagged

        cards.push(card);
      }
    }

    if (cards.length === 0) {
      // If the user specified cards that are all already tagged with the specified tag, throw this error
      if (options[1]) throw new ZephyrError.CardsAlreadyTaggedError(tag);

      // Otherwise, none of their card references were valid and they don't have a last card, so throw this error
      throw new ZephyrError.InvalidCardReferenceError();
    }

    await CardService.setCardsTag(cards, tag.id);

    const embed = new MessageEmbed(`Tag`, msg.author).setDescription(
      `Tagged ${
        cards.length === 1
          ? `\`${cards[0].id.toString(36)}\``
          : `**${cards.length}** card${cards.length > 1 ? `s` : ``}`
      } as ${tag.emoji} **${tag.name}**.`
    );

    await this.send(msg.channel, embed);
    return;
  }
}
